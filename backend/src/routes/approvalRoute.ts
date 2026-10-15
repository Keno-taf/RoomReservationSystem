
import { Router } from 'express'
import pool from '../config/database.js'
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'
import { sendReservationApprovedSms } from '../services/smsService.js'

const router = Router()

// =====================================================
// GET PENDING APPROVALS ASSIGNED TO THE CURRENT USER
// =====================================================
router.get(
  '/my',
  requirePermission('reservation.approve'),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Get the logged-in approver from the authentication token.
      const approverId = req.user!.userId

      if (!approverId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid approver ID'
        })
      }

      // Return only pending approval steps assigned to this user.
      const result = await pool.query(
        `
        SELECT
          ra.id AS approval_id,
          ra.reservation_id,
          ra.step_order,
          ra.status AS approval_status,
          ra.comments,
          ra.acted_at,
          r.requester_id,
          r.reservation_date,
          r.start_time,
          r.end_time,
          r.purpose,
          r.participants,
          r.status AS reservation_status,
          u.full_name AS requester_name,
          f.id AS facility_id,
          f.name AS facility_name,
          f.location AS facility_location,
          ar.name AS approval_route
        FROM reservation_approvals ra
        INNER JOIN reservations r
          ON ra.reservation_id = r.id
        INNER JOIN users u
          ON r.requester_id = u.id
        INNER JOIN facilities f
          ON r.facility_id = f.id
        INNER JOIN approval_routes ar
          ON r.approval_route_id = ar.id
        WHERE ra.approver_id = $1
          AND ra.status = 'Pending'
        ORDER BY r.reservation_date ASC, r.start_time ASC
        `,
        [approverId]
      )

      return res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error('Error fetching pending approvals:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending approvals'
      })
    }
  }
)

// =====================================================
// APPROVE AN APPROVAL STEP
// =====================================================
router.patch(
  '/:approvalId/approve',
  requirePermission('reservation.approve'),
  async (req: AuthenticatedRequest, res) => {
    const approvalId = Number(req.params.approvalId)
    const approverId = req.user!.userId
    const { comments } = req.body

    if (!Number.isInteger(approvalId) || approvalId <= 0 || !approverId) {
      return res.status(400).json({
        success: false,
        message: 'A valid approval ID is required'
      })
    }

    const client = await pool.connect()
    let transactionStarted = false

    // Store SMS details and send the SMS only after the DB transaction commits.
    let smsNotification: {
      phoneNumber: string
      reservationId: number
      facilityName: string
      reservationDate: string
      startTime: string
      endTime: string
    } | null = null

    try {
      await client.query('BEGIN')
      transactionStarted = true

      // 1. Lock and retrieve the approval record.
      const approvalResult = await client.query(
        `
        SELECT
          id,
          reservation_id,
          step_order,
          approver_id,
          status
        FROM reservation_approvals
        WHERE id = $1
        FOR UPDATE
        `,
        [approvalId]
      )

      if (approvalResult.rows.length === 0) {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(404).json({
          success: false,
          message: 'Approval record not found'
        })
      }

      const approval = approvalResult.rows[0]
      const reservationId = Number(approval.reservation_id)

      // 2. Ensure the logged-in user owns this approval step.
      if (Number(approval.approver_id) !== Number(approverId)) {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(403).json({
          success: false,
          message: 'You are not authorized to approve this request'
        })
      }

      // 3. Prevent approval of a step that is not pending.
      if (approval.status !== 'Pending') {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(400).json({
          success: false,
          message: `This approval is already ${approval.status}`
        })
      }

      // 4. Mark the current approval step as approved.
      await client.query(
        `
        UPDATE reservation_approvals
        SET
          status = 'Approved',
          comments = $1,
          acted_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [comments || null, approvalId]
      )

      // 5. Find the next approval step in the workflow.
      const nextStepResult = await client.query(
        `
        SELECT
          id,
          reservation_id,
          step_order,
          approver_id,
          status
        FROM reservation_approvals
        WHERE reservation_id = $1
          AND step_order = $2
        FOR UPDATE
        `,
        [
          reservationId,
          Number(approval.step_order) + 1
        ]
      )

      const isFinalApproval = nextStepResult.rows.length === 0

      if (!isFinalApproval) {
        // -------------------------------------------------
        // 6. Activate the next approval step.
        // Example: Department Head -> Facility Manager.
        // -------------------------------------------------
        const nextApproval = nextStepResult.rows[0]
        const nextApproverId = Number(nextApproval.approver_id)

        // Only activate a step that is currently waiting.
        const activationResult = await client.query(
          `
          UPDATE reservation_approvals
          SET status = 'Pending'
          WHERE id = $1
            AND status = 'Waiting'
          RETURNING id, approver_id, reservation_id
          `,
          [nextApproval.id]
        )

        // If the next step could not be activated, fail the
        // transaction rather than silently skipping the approver.
        if (activationResult.rows.length === 0) {
          throw new Error(
            'The next approval step could not be activated.'
          )
        }

        // -------------------------------------------------
        // 7. Notify the next approver.
        // THIS FIX NOTIFIES THE FACILITY MANAGER WHEN THE
        // DEPARTMENT HEAD APPROVES A ROUTE 2 RESERVATION.
        // -------------------------------------------------
        await client.query(
          `
          INSERT INTO notifications (
            user_id,
            reservation_id,
            title,
            message,
            notification_type
          )
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            nextApproverId,
            reservationId,
            'Reservation awaiting your approval',
            `Reservation request #${reservationId} has been forwarded to you for approval.`,
            'info'
          ]
        )

      } else {
        // -------------------------------------------------
        // 8. No remaining approval steps: approve the
        // reservation completely.
        // -------------------------------------------------
        await client.query(
          `
          UPDATE reservations
          SET status = 'Approved'
          WHERE id = $1
          `,
          [reservationId]
        )

        // Check whether the final approver has Facility
        // Manager role ID 3 before preparing the SMS.
        const roleResult = await client.query(
          `
          SELECT 1
          FROM user_roles
          WHERE user_id = $1
            AND role_id = 3
          LIMIT 1
          `,
          [approverId]
        )

        if (roleResult.rows.length > 0) {
          const reservationResult = await client.query(
            `
            SELECT
              r.id,
              r.phone_number,
              r.reservation_date,
              r.start_time,
              r.end_time,
              f.name AS facility_name
            FROM reservations r
            INNER JOIN facilities f
              ON f.id = r.facility_id
            WHERE r.id = $1
            `,
            [reservationId]
          )

          if (reservationResult.rows.length > 0) {
            const reservation = reservationResult.rows[0]

            if (reservation.phone_number) {
              smsNotification = {
                phoneNumber: reservation.phone_number,
                reservationId: Number(reservation.id),
                facilityName: reservation.facility_name,
                reservationDate: String(
                  reservation.reservation_date
                ).slice(0, 10),
                startTime: String(
                  reservation.start_time
                ).slice(0, 5),
                endTime: String(
                  reservation.end_time
                ).slice(0, 5)
              }
            }
          }
        }
      }

      // -------------------------------------------------
      // 9. Notify the employee about the approval progress.
      // -------------------------------------------------
      const requesterResult = await client.query(
        `
        SELECT requester_id
        FROM reservations
        WHERE id = $1
        `,
        [reservationId]
      )

      if (requesterResult.rows.length > 0) {
        const requesterId = requesterResult.rows[0].requester_id

        const title = isFinalApproval
          ? 'Reservation fully approved'
          : 'Reservation approval update'

        const message = isFinalApproval
          ? `Your reservation request #${reservationId} has been fully approved.`
          : `Your reservation request #${reservationId} was approved at this step and is waiting for the next approver.`

        await client.query(
          `
          INSERT INTO notifications (
            user_id,
            reservation_id,
            title,
            message,
            notification_type
          )
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            requesterId,
            reservationId,
            title,
            message,
            'approved'
          ]
        )
      }

      // 10. Commit all approval changes and notifications together.
      await client.query('COMMIT')
      transactionStarted = false

    } catch (error) {
      // Roll back all database changes if any operation fails.
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK')
        } catch (rollbackError) {
          console.error('Approval rollback failed:', rollbackError)
        }
      }

      console.error('Error approving reservation:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to approve reservation',
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      client.release()
    }

    // -------------------------------------------------
    // 11. Attempt SMS after the transaction commits.
    // An SMS failure must not undo the database approval.
    // -------------------------------------------------
    if (smsNotification) {
      try {
        const smsResult = await sendReservationApprovedSms(
          smsNotification
        )

        if (!smsResult.sent) {
          console.info(
            `Reservation ${smsNotification.reservationId} was approved, but SMS was not sent: ${smsResult.reason ?? 'Unknown reason'}`
          )
        }
      } catch (smsError) {
        console.error(
          `Reservation ${smsNotification.reservationId} was approved, but SMS notification failed:`,
          smsError
        )
      }
    }

    return res.json({
      success: true,
      message: 'Approval completed successfully'
    })
  }
)

// =====================================================
// REJECT AN APPROVAL STEP
// =====================================================
router.patch(
  '/:approvalId/reject',
  requirePermission('reservation.reject'),
  async (req: AuthenticatedRequest, res) => {
    const approvalId = Number(req.params.approvalId)
    const approverId = req.user!.userId
    const { comments } = req.body

    if (!Number.isInteger(approvalId) || approvalId <= 0 || !approverId) {
      return res.status(400).json({
        success: false,
        message: 'A valid approval ID is required'
      })
    }

    // Require a reason so the employee can understand the rejection.
    if (typeof comments !== 'string' || !comments.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required'
      })
    }

    const client = await pool.connect()
    let transactionStarted = false

    try {
      await client.query('BEGIN')
      transactionStarted = true

      // 1. Lock and retrieve the approval record.
      const approvalResult = await client.query(
        `
        SELECT
          id,
          reservation_id,
          step_order,
          approver_id,
          status
        FROM reservation_approvals
        WHERE id = $1
        FOR UPDATE
        `,
        [approvalId]
      )

      if (approvalResult.rows.length === 0) {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(404).json({
          success: false,
          message: 'Approval record not found'
        })
      }

      const approval = approvalResult.rows[0]
      const reservationId = Number(approval.reservation_id)

      // 2. Verify that the current user owns this approval step.
      if (Number(approval.approver_id) !== Number(approverId)) {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(403).json({
          success: false,
          message: 'You are not authorized to reject this request'
        })
      }

      // 3. Only pending approval steps can be rejected.
      if (approval.status !== 'Pending') {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(400).json({
          success: false,
          message: `This approval is already ${approval.status}`
        })
      }

      // 4. Mark the approval step as rejected and save the reason.
      await client.query(
        `
        UPDATE reservation_approvals
        SET
          status = 'Rejected',
          comments = $1,
          acted_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [comments.trim(), approvalId]
      )

      // 5. Mark the entire reservation as rejected.
      await client.query(
        `
        UPDATE reservations
        SET status = 'Rejected'
        WHERE id = $1
        `,
        [reservationId]
      )

      // 6. Retrieve the employee who submitted the reservation.
      const requesterResult = await client.query(
        `
        SELECT requester_id
        FROM reservations
        WHERE id = $1
        `,
        [reservationId]
      )

      // 7. Notify the employee with the actual rejection reason.
      if (requesterResult.rows.length > 0) {
        const requesterId = requesterResult.rows[0].requester_id
        const rejectionReason = comments.trim()

        await client.query(
          `
          INSERT INTO notifications (
            user_id,
            reservation_id,
            title,
            message,
            notification_type
          )
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            requesterId,
            reservationId,
            'Reservation rejected',
            `Your reservation request #${reservationId} was rejected. Reason: ${rejectionReason}`,
            'rejected'
          ]
        )
      }

      // 8. Commit the rejection and employee notification together.
      await client.query('COMMIT')
      transactionStarted = false

      return res.json({
        success: true,
        message: 'Reservation rejected successfully'
      })

    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK')
        } catch (rollbackError) {
          console.error('Rejection rollback failed:', rollbackError)
        }
      }

      console.error('Error rejecting reservation:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to reject reservation',
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      client.release()
    }
  }
)

export default router
