import { Router } from 'express'
import pool from '../config/database.js'
import {
  AuthenticatedRequest
} from '../middleware/authMiddleware.js'

import {
  requirePermission
} from '../middleware/permissionMiddleware.js'

const router = Router()

// GET audit logs
router.get(
  '/',
  requirePermission('audit.view'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
  try {
    const {
      search,
      module,
      action,
      userId
    } = req.query

    const conditions: string[] = []
    const values: unknown[] = []

    if (
      typeof search === 'string' &&
      search.trim()
    ) {
      values.push(
        `%${search.trim()}%`
      )

      conditions.push(`
        (
          al.action ILIKE $${values.length}
          OR al.module ILIKE $${values.length}
          OR al.description ILIKE $${values.length}
          OR al.entity_type ILIKE $${values.length}
          OR u.full_name ILIKE $${values.length}
          OR u.email ILIKE $${values.length}
        )
      `)
    }

    if (
      typeof module === 'string' &&
      module.trim()
    ) {
      values.push(module.trim())

      conditions.push(
        `al.module = $${values.length}`
      )
    }

    if (
      typeof action === 'string' &&
      action.trim()
    ) {
      values.push(action.trim())

      conditions.push(
        `al.action = $${values.length}`
      )
    }

    if (
      typeof userId === 'string' &&
      userId.trim()
    ) {
      const numericUserId =
        Number(userId)

      if (
        !Number.isInteger(
          numericUserId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        })
      }

      values.push(numericUserId)

      conditions.push(
        `al.user_id = $${values.length}`
      )
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            ' AND '
          )}`
        : ''

    const result = await pool.query(
      `
      SELECT
        al.id,
        al.user_id,
        u.full_name AS user_name,
        u.email AS user_email,
        al.action,
        al.module,
        al.entity_type,
        al.entity_id,
        al.description,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.created_at
      FROM audit_logs al

      LEFT JOIN users u
        ON al.user_id = u.id

      ${whereClause}

      ORDER BY al.created_at DESC
      `,
      values
    )

    return res.json({
      success: true,
      data: result.rows
    })
  } catch (error: unknown) {
    console.error(
      'Error fetching audit logs:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs'
    })
  }
})

// GET audit log by ID
router.get(
  '/:id',
  requirePermission('audit.view'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
  try {
    const logId = Number(
      req.params.id
    )

    if (Number.isNaN(logId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit log ID'
      })
    }

    const result = await pool.query(
      `
      SELECT
        al.id,
        al.user_id,
        u.full_name AS user_name,
        u.email AS user_email,
        al.action,
        al.module,
        al.entity_type,
        al.entity_id,
        al.description,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.created_at
      FROM audit_logs al

      LEFT JOIN users u
        ON al.user_id = u.id

      WHERE al.id = $1
      `,
      [logId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      })
    }

    return res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: unknown) {
    console.error(
      'Error fetching audit log:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit log'
    })
  }
})

export default router