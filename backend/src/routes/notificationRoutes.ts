
import { Router } from 'express'
import pool from '../config/database.js'
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js'
import { requirePermission } from '../middleware/permissionMiddleware.js'

const router = Router()

// GET /api/notifications/my
// Retrieve the logged-in user's notifications.
router.get(
  '/my',
  requirePermission('reservation.view_own'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId

      const result = await pool.query(
        `
        SELECT
          id,
          user_id,
          reservation_id,
          title,
          message,
          notification_type,
          is_read,
          created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 100
        `,
        [userId]
      )

      const unreadResult = await pool.query(
        `
        SELECT COUNT(*)::int AS unread_count
        FROM notifications
        WHERE user_id = $1
          AND is_read = FALSE
        `,
        [userId]
      )

      return res.json({
        success: true,
        data: result.rows,
        unreadCount: unreadResult.rows[0].unread_count
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications'
      })
    }
  }
)

// PATCH /api/notifications/:id/read
// Mark one of the logged-in user's notifications as read.
router.patch(
  '/:id/read',
  requirePermission('reservation.view_own'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const notificationId = Number(req.params.id)
      const userId = req.user!.userId

      if (!Number.isInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification ID'
        })
      }

      const result = await pool.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1
          AND user_id = $2
        RETURNING id, is_read
        `,
        [notificationId, userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        })
      }

      return res.json({
        success: true,
        message: 'Notification marked as read',
        data: result.rows[0]
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to update notification'
      })
    }
  }
)

// PATCH /api/notifications/read-all
// Mark all of the logged-in user's notifications as read.
router.patch(
  '/read-all',
  requirePermission('reservation.view_own'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId

      await pool.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1
          AND is_read = FALSE
        `,
        [userId]
      )

      return res.json({
        success: true,
        message: 'All notifications marked as read'
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to update notifications'
      })
    }
  }
)

export default router
