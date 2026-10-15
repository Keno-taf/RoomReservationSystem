
import { Router } from 'express'
import pool from '../config/database.js'
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

// =====================================================
// PHONE NUMBER HELPERS
// =====================================================

// Ethiopian mobile number format.
const phonePattern = /^(\+251|0)?[79]\d{8}$/

// Convert Ethiopian mobile numbers to the +251 format.
const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/^\+/, '')

  if (digits.startsWith('251')) {
    return `+${digits}`
  }

  if (digits.startsWith('0')) {
    return `+251${digits.slice(1)}`
  }

  return `+251${digits}`
}

// =====================================================
// CREATE RESERVATION
// =====================================================

router.post(
  '/',
  requirePermission('reservation.create'),
  async (req: AuthenticatedRequest, res) => {
    const client = await pool.connect()
    let transactionStarted = false

    try {
      const {
        facilityId,
        approvalRouteId,
        reservationDate,
        startTime,
        endTime,
        purpose,
        participants,
        additionalRequirements,
        notes,
        phoneNumber,
        additionalPhoneNumber
      } = req.body

      // Use the authenticated employee's ID.
      const requesterId = req.user!.userId

      // 1. Validate required reservation fields.
      if (
        !facilityId ||
        !approvalRouteId ||
        !reservationDate ||
        !startTime ||
        !endTime ||
        !purpose ||
        participants === undefined ||
        participants === null
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required reservation fields'
        })
      }

      // 2. Validate the participant count.
      const participantCount = Number(participants)

      if (!Number.isInteger(participantCount) || participantCount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Participants must be a positive whole number'
        })
      }

      // 3. Validate the time range.
      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be later than start time'
        })
      }

      // 4. Validate the required primary phone number.
      const primaryPhone = String(phoneNumber ?? '').trim()
      const secondaryPhone = String(additionalPhoneNumber ?? '').trim()

      if (!phonePattern.test(primaryPhone)) {
        return res.status(400).json({
          success: false,
          message:
            'Enter a valid Ethiopian mobile number, such as 0912345678 or +251912345678.'
        })
      }

      // 5. Validate the optional additional phone number.
      if (secondaryPhone && !phonePattern.test(secondaryPhone)) {
        return res.status(400).json({
          success: false,
          message:
            'Enter a valid additional mobile number or leave it blank.'
        })
      }

      const normalizedPhone = normalizePhone(primaryPhone)

      const normalizedAdditionalPhone = secondaryPhone
        ? normalizePhone(secondaryPhone)
        : null

      // Start a transaction so reservation, approval assignments,
      // and the initial notification are saved together.
      await client.query('BEGIN')
      transactionStarted = true

      // 6. Get the requester and their department.
      const requesterResult = await client.query(
        `
        SELECT id, department_id
        FROM users
        WHERE id = $1
          AND is_active = true
        `,
        [requesterId]
      )

      if (requesterResult.rows.length === 0) {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(400).json({
          success: false,
          message: 'The requesting user was not found or is inactive'
        })
      }

      const requesterDepartmentId =
        requesterResult.rows[0].department_id

      // 7. Check for an overlapping reservation.
      const conflictCheck = await client.query(
        `
        SELECT id
        FROM reservations
        WHERE facility_id = $1
          AND reservation_date = $2
          AND status IN ('Pending', 'Approved')
          AND start_time < $4
          AND end_time > $3
        LIMIT 1
        `,
        [
          facilityId,
          reservationDate,
          startTime,
          endTime
        ]
      )

      if (conflictCheck.rows.length > 0) {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(409).json({
          success: false,
          message:
            'The selected facility already has a pending or approved reservation during this time.'
        })
      }

      // 8. Verify the selected approval route and its steps.
      const stepsResult = await client.query(
        `
        SELECT
          ars.step_order,
          ars.approver_role_id
        FROM approval_route_steps ars
        INNER JOIN approval_routes ar
          ON ar.id = ars.approval_route_id
        WHERE ar.id = $1
        ORDER BY ars.step_order ASC
        `,
        [approvalRouteId]
      )

      if (stepsResult.rows.length === 0) {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(400).json({
          success: false,
          message:
            'No approval steps found for the selected approval route'
        })
      }

      // 9. Department Head approval requires a department.
      const hasDepartmentHeadStep = stepsResult.rows.some(
        (step) => Number(step.approver_role_id) === 2
      )

      if (hasDepartmentHeadStep && !requesterDepartmentId) {
        await client.query('ROLLBACK')
        transactionStarted = false

        return res.status(400).json({
          success: false,
          message:
            'You must belong to a department to use Department Head approval'
        })
      }

      // 10. Create the reservation and save both phone numbers.
      const reservationResult = await client.query(
        `
        INSERT INTO reservations (
          requester_id,
          facility_id,
          approval_route_id,
          reservation_date,
          start_time,
          end_time,
          purpose,
          participants,
          additional_requirements,
          notes,
          phone_number,
          additional_phone_number
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        )
        RETURNING *
        `,
        [
          requesterId,
          facilityId,
          approvalRouteId,
          reservationDate,
          startTime,
          endTime,
          purpose,
          participantCount,
          additionalRequirements || null,
          notes || null,
          normalizedPhone,
          normalizedAdditionalPhone
        ]
      )

      const reservation = reservationResult.rows[0]

      // NEW: Get the facility name for a useful notification message.
      const facilityResult = await client.query(
        `
        SELECT name
        FROM facilities
        WHERE id = $1
        `,
        [facilityId]
      )

      const facilityName =
        facilityResult.rows[0]?.name ?? 'the selected facility'

      // 11. Assign an approver to each configured approval step.
      for (const step of stepsResult.rows) {
        const roleId = Number(step.approver_role_id)
        let approverResult

        if (roleId === 2) {
          // Department Head must belong to the requester's department.
          approverResult = await client.query(
            `
            SELECT u.id
            FROM users u
            INNER JOIN user_roles ur
              ON ur.user_id = u.id
            WHERE ur.role_id = $1
              AND u.department_id = $2
              AND u.is_active = true
            ORDER BY u.id
            LIMIT 1
            `,
            [roleId, requesterDepartmentId]
          )
        } else {
          // Other approval roles, including Facility Manager.
          approverResult = await client.query(
            `
            SELECT u.id
            FROM users u
            INNER JOIN user_roles ur
              ON ur.user_id = u.id
            WHERE ur.role_id = $1
              AND u.is_active = true
            ORDER BY u.id
            LIMIT 1
            `,
            [roleId]
          )
        }

        if (approverResult.rows.length === 0) {
          await client.query('ROLLBACK')
          transactionStarted = false

          return res.status(400).json({
            success: false,
            message:
              roleId === 2
                ? 'No active Department Head was found in your department'
                : `No active user found for approval role ${roleId}`
          })
        }

        const approverId = Number(approverResult.rows[0].id)

        // First step is Pending; later steps are Waiting.
        const approvalStatus =
          Number(step.step_order) === 1 ? 'Pending' : 'Waiting'

        // Save the approval assignment.
        await client.query(
          `
          INSERT INTO reservation_approvals (
            reservation_id,
            step_order,
            approver_id,
            status,
            created_at
          )
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `,
          [
            reservation.id,
            step.step_order,
            approverId,
            approvalStatus
          ]
        )

        // =====================================================
        // NEW: NOTIFY THE FIRST ASSIGNED APPROVER
        // =====================================================
        // Only the first step is Pending, so notify that approver
        // immediately. Do not notify later approvers yet because
        // their approval steps are still Waiting.
        if (Number(step.step_order) === 1) {
          const approverRoleName =
            roleId === 2
              ? 'Department Head'
              : roleId === 3
                ? 'Facility Manager'
                : 'Approver'

          await client.query(
            `
            INSERT INTO notifications (
              user_id,
              reservation_id,
              title,
              message,
              notification_type,
              is_read,
              created_at
            )
            VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP)
            `,
            [
              approverId,
              reservation.id,
              'New reservation request',
              `A new reservation request has been submitted for ${facilityName} on ${String(reservationDate).slice(0, 10)} from ${String(startTime).slice(0, 5)} to ${String(endTime).slice(0, 5)}. Purpose: ${purpose}. Please review it in your Pending Approvals page.`,
              'info'
            ]
          )

          console.info(
            `Created reservation notification for ${approverRoleName} user ${approverId}, reservation ${reservation.id}`
          )
        }
      }

      // Commit the reservation, approval steps, and notification together.
      await client.query('COMMIT')
      transactionStarted = false

      return res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: reservation
      })
    } catch (error) {
      // Roll back everything if any database operation fails.
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK')
        } catch (rollbackError) {
          console.error('Reservation rollback failed:', rollbackError)
        }
      }

      console.error('Error creating reservation:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to create reservation'
      })
    } finally {
      client.release()
    }
  }
)

// =====================================================
// GET MY RESERVATIONS
// =====================================================

router.get(
  '/my',
  requirePermission('reservation.view_own'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const requesterId = req.user!.userId

      if (!requesterId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid requester ID'
        })
      }

      const result = await pool.query(
        `
        SELECT
          r.id,
          r.reservation_date,
          r.start_time,
          r.end_time,
          r.purpose,
          r.participants,
          r.additional_requirements,
          r.notes,
          r.status,
          f.name AS facility_name,
          f.location AS facility_location,
          ar.name AS approval_route
        FROM reservations r
        INNER JOIN facilities f
          ON r.facility_id = f.id
        INNER JOIN approval_routes ar
          ON r.approval_route_id = ar.id
        WHERE r.requester_id = $1
        ORDER BY r.created_at DESC
        `,
        [requesterId]
      )

      return res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error('Error fetching reservations:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve reservations'
      })
    }
  }
)

// =====================================================
// GET RESERVATION HISTORY
// Facility Manager / Administrator: all reservations
// Department Head: reservations from their department
// =====================================================

router.get(
  '/all',
  requirePermission('reservation.view_all'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId

      const userResult = await pool.query(
        `
        SELECT
          u.department_id,
          ARRAY_AGG(DISTINCT ur.role_id)
            FILTER (WHERE ur.role_id IS NOT NULL) AS role_ids
        FROM users u
        LEFT JOIN user_roles ur
          ON ur.user_id = u.id
        WHERE u.id = $1
        GROUP BY u.id, u.department_id
        `,
        [userId]
      )

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      const user = userResult.rows[0]
      const departmentId = user.department_id
      const roleIds: number[] = (user.role_ids ?? []).map(Number)

      const isAdministrator = roleIds.includes(4)
      const isFacilityManager = roleIds.includes(3)
      const isDepartmentHead = roleIds.includes(2)

      let query = `
        SELECT
          r.id,
          r.requester_id,
          u.full_name AS requester_name,
          u.email AS requester_email,
          d.name AS requester_department,
          r.reservation_date,
          r.start_time,
          r.end_time,
          r.purpose,
          r.participants,
          r.additional_requirements,
          r.notes,
          r.status,
          r.created_at,
          f.id AS facility_id,
          f.name AS facility_name,
          f.location AS facility_location,
          ar.id AS approval_route_id,
          ar.name AS approval_route
        FROM reservations r
        INNER JOIN users u
          ON r.requester_id = u.id
        LEFT JOIN departments d
          ON u.department_id = d.id
        INNER JOIN facilities f
          ON r.facility_id = f.id
        INNER JOIN approval_routes ar
          ON r.approval_route_id = ar.id
      `

      const params: number[] = []

      if (isAdministrator || isFacilityManager) {
        query += `
          ORDER BY
            r.reservation_date DESC,
            r.start_time DESC,
            r.created_at DESC
        `
      } else if (isDepartmentHead) {
        if (departmentId == null) {
          return res.status(403).json({
            success: false,
            message: 'Department Head is not assigned to a department'
          })
        }

        query += `
          WHERE u.department_id = $1
          ORDER BY
            r.reservation_date DESC,
            r.start_time DESC,
            r.created_at DESC
        `

        params.push(Number(departmentId))
      } else {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view reservation history'
        })
      }

      const result = await pool.query(query, params)

      return res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error('Error fetching reservation history:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve reservations'
      })
    }
  }
)

// =====================================================
// GET RESERVATION DETAILS (REQUESTER'S OWN RESERVATION)
// =====================================================

router.get(
  '/:id',
  requirePermission('reservation.view_own'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const reservationId = Number(req.params.id)
      const requesterId = req.user!.userId

      if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reservation ID'
        })
      }

      const result = await pool.query(
        `
        SELECT
          r.id,
          r.requester_id,
          r.reservation_date,
          r.start_time,
          r.end_time,
          r.purpose,
          r.participants,
          r.additional_requirements,
          r.notes,
          r.status,
          r.created_at,
          f.id AS facility_id,
          f.name AS facility_name,
          f.location AS facility_location,
          ar.id AS approval_route_id,
          ar.name AS approval_route
        FROM reservations r
        INNER JOIN facilities f
          ON r.facility_id = f.id
        INNER JOIN approval_routes ar
          ON r.approval_route_id = ar.id
        WHERE r.id = $1
          AND r.requester_id = $2
        `,
        [reservationId, requesterId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        })
      }

      return res.json({
        success: true,
        data: result.rows[0]
      })
    } catch (error) {
      console.error('Error fetching reservation details:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve reservation details'
      })
    }
  }
)

// =====================================================
// CANCEL RESERVATION (REQUESTER'S OWN RESERVATION)
// =====================================================

router.patch(
  '/:id/cancel',
  requirePermission('reservation.cancel_own'),
  async (req: AuthenticatedRequest, res) => {
    const reservationId = Number(req.params.id)
    const requesterId = req.user!.userId

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      })
    }

    try {
      const reservationResult = await pool.query(
        `
        SELECT id, status
        FROM reservations
        WHERE id = $1
          AND requester_id = $2
        `,
        [reservationId, requesterId]
      )

      if (reservationResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        })
      }

      const reservation = reservationResult.rows[0]

      if (
        reservation.status === 'Cancelled' ||
        reservation.status === 'Rejected'
      ) {
        return res.status(400).json({
          success: false,
          message: `Reservation is already ${reservation.status.toLowerCase()}.`
        })
      }

      if (reservation.status === 'Approved') {
        return res.status(400).json({
          success: false,
          message:
            'Approved reservations cannot be cancelled through this request.'
        })
      }

      const updateResult = await pool.query(
        `
        UPDATE reservations
        SET status = 'Cancelled'
        WHERE id = $1
          AND requester_id = $2
        RETURNING *
        `,
        [reservationId, requesterId]
      )

      return res.json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: updateResult.rows[0]
      })
    } catch (error) {
      console.error('Cancel reservation error:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to cancel reservation'
      })
    }
  }
)

export default router
