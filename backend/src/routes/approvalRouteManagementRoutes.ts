import { Router } from 'express'
import pool from '../config/database.js'
import {
  AuthenticatedRequest
} from '../middleware/authMiddleware.js'
import {
  requirePermission
} from '../middleware/permissionMiddleware.js'

import {
  logAudit
} from '../utils/auditLogger.js'

const router = Router()

// GET all approval routes
router.get(
  '/',
  requirePermission('approval_route.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
  try {
    const result = await pool.query(`
      SELECT
        ar.id,
        ar.name,
        ar.description,
        ar.created_at,

        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ars.id,
              'stepOrder', ars.step_order,
              'roleId', r.id,
              'roleName', r.name
            )
            ORDER BY ars.step_order
          ) FILTER (WHERE ars.id IS NOT NULL),
          '[]'
        ) AS steps

      FROM approval_routes ar

      LEFT JOIN approval_route_steps ars
        ON ar.id = ars.approval_route_id

      LEFT JOIN roles r
        ON ars.approver_role_id = r.id

      GROUP BY
        ar.id,
        ar.name,
        ar.description,
        ar.created_at

      ORDER BY ar.id
    `)

    return res.json({
      success: true,
      data: result.rows
    })
  } catch (error: unknown) {
    console.error(
      'Error fetching approval routes:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve approval routes'
    })
  }
})

// GET one approval route
router.get('/:id', async (req, res) => {
  try {
    const routeId = Number(req.params.id)

    if (Number.isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval route ID'
      })
    }

    const result = await pool.query(
      `
      SELECT
        ar.id,
        ar.name,
        ar.description,

        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ars.id,
              'stepOrder', ars.step_order,
              'roleId', r.id,
              'roleName', r.name
            )
            ORDER BY ars.step_order
          ) FILTER (WHERE ars.id IS NOT NULL),
          '[]'
        ) AS steps

      FROM approval_routes ar

      LEFT JOIN approval_route_steps ars
        ON ar.id = ars.approval_route_id

      LEFT JOIN roles r
        ON ars.approver_role_id = r.id

      WHERE ar.id = $1

      GROUP BY
        ar.id,
        ar.name,
        ar.description
      `,
      [routeId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Approval route not found'
      })
    }

    return res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: unknown) {
    console.error(
      'Error fetching approval route:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve approval route'
    })
  }
})

// CREATE approval route
router.post(
  '/',
  requirePermission('approval_route.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    const client = await pool.connect()

    try {
      const {
        name,
        description,
        steps
      } = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'Approval route name is required'
        })
      }

      if (
        !Array.isArray(steps) ||
        steps.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'At least one approval step is required'
        })
      }

      const cleanSteps = steps.map(
        (
          step: {
            roleId?: number
          },
          index: number
        ) => ({
          stepOrder: index + 1,
          roleId: Number(step.roleId)
        })
      )

      if (
        cleanSteps.some(
          (step) =>
            !Number.isInteger(
              step.roleId
            ) ||
            step.roleId <= 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Every approval step must have a valid role'
        })
      }

      const duplicateRoleIds =
        new Set(
          cleanSteps.map(
            (step) => step.roleId
          )
        )

      if (
        duplicateRoleIds.size !==
        cleanSteps.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            'The same role cannot appear more than once in an approval route'
        })
      }

      const existingRoute =
        await client.query(
          `
          SELECT id
          FROM approval_routes
          WHERE LOWER(name) = LOWER($1)
          `,
          [name.trim()]
        )

      if (
        existingRoute.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            'An approval route with this name already exists'
        })
      }

      const roleResult =
        await client.query(
          `
          SELECT id
          FROM roles
          WHERE id = ANY($1::integer[])
          `,
          [
            cleanSteps.map(
              (step) => step.roleId
            )
          ]
        )

      if (
        roleResult.rows.length !==
        cleanSteps.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            'One or more approval roles are invalid'
        })
      }

      await client.query('BEGIN')

      const routeResult =
        await client.query(
          `
          INSERT INTO approval_routes (
            name,
            description
          )
          VALUES ($1, $2)
          RETURNING
            id,
            name,
            description,
            created_at
          `,
          [
            name.trim(),
            description?.trim() || null
          ]
        )

      const routeId =
        routeResult.rows[0].id

      for (const step of cleanSteps) {
        await client.query(
          `
          INSERT INTO approval_route_steps (
            approval_route_id,
            step_order,
            approver_role_id
          )
          VALUES ($1, $2, $3)
          `,
          [
            routeId,
            step.stepOrder,
            step.roleId
          ]
        )
      }

      await client.query('COMMIT')

      /*
       * Audit log
       */
      await logAudit({
        userId: req.user!.userId,
        action: 'CREATE',
        module: 'APPROVAL_ROUTE',
        entityType: 'ApprovalRoute',
        entityId: routeId,
        description:
          `Created approval route: ${routeResult.rows[0].name}`,

        newValues: {
          name:
            routeResult.rows[0].name,

          description:
            routeResult.rows[0].description,

          steps: cleanSteps.map(
            (step) => ({
              stepOrder:
                step.stepOrder,
              roleId:
                step.roleId
            })
          )
        },

        ipAddress: req.ip,
        userAgent:
          req.get('user-agent')
      })

      return res.status(201).json({
        success: true,
        message:
          'Approval route created successfully',
        data: routeResult.rows[0]
      })
    } catch (error: unknown) {
      await client.query('ROLLBACK')

      console.error(
        'Error creating approval route:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to create approval route'
      })
    } finally {
      client.release()
    }
  }
)
// UPDATE approval route
router.put(
  '/:id',
  requirePermission('approval_route.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    const client = await pool.connect()

    try {
      const routeId = Number(
        req.params.id
      )

      if (Number.isNaN(routeId)) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid approval route ID'
        })
      }

      const {
        name,
        description,
        steps
      } = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'Approval route name is required'
        })
      }

      if (
        !Array.isArray(steps) ||
        steps.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'At least one approval step is required'
        })
      }

      const cleanSteps = steps.map(
        (
          step: {
            roleId?: number
          },
          index: number
        ) => ({
          stepOrder: index + 1,
          roleId: Number(step.roleId)
        })
      )

      if (
        cleanSteps.some(
          (step) =>
            !Number.isInteger(
              step.roleId
            ) ||
            step.roleId <= 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Every approval step must have a valid role'
        })
      }

      const duplicateRoleIds =
        new Set(
          cleanSteps.map(
            (step) => step.roleId
          )
        )

      if (
        duplicateRoleIds.size !==
        cleanSteps.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            'The same role cannot appear more than once in an approval route'
        })
      }

      /*
       * Get the existing route before updating.
       * These values are required for the audit log.
       */
      const existingRoute =
        await client.query(
          `
          SELECT
            id,
            name,
            description
          FROM approval_routes
          WHERE id = $1
          `,
          [routeId]
        )

      if (
        existingRoute.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Approval route not found'
        })
      }

      const oldRoute =
        existingRoute.rows[0]

      /*
       * Get the existing approval steps.
       */
      const existingSteps =
        await client.query(
          `
          SELECT
            step_order,
            approver_role_id
          FROM approval_route_steps
          WHERE approval_route_id = $1
          ORDER BY step_order
          `,
          [routeId]
        )

      const oldSteps =
        existingSteps.rows.map(
          (step) => ({
            stepOrder:
              step.step_order,
            roleId:
              step.approver_role_id
          })
        )

      const duplicateRoute =
        await client.query(
          `
          SELECT id
          FROM approval_routes
          WHERE LOWER(name) = LOWER($1)
          AND id <> $2
          `,
          [
            name.trim(),
            routeId
          ]
        )

      if (
        duplicateRoute.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            'Another approval route already uses this name'
        })
      }

      const roleResult =
        await client.query(
          `
          SELECT id
          FROM roles
          WHERE id = ANY($1::integer[])
          `,
          [
            cleanSteps.map(
              (step) => step.roleId
            )
          ]
        )

      if (
        roleResult.rows.length !==
        cleanSteps.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            'One or more approval roles are invalid'
        })
      }

      await client.query('BEGIN')

      /*
       * Update approval route.
       */
      const updatedRouteResult =
        await client.query(
          `
          UPDATE approval_routes
          SET
            name = $1,
            description = $2
          WHERE id = $3
          RETURNING
            id,
            name,
            description,
            created_at
          `,
          [
            name.trim(),
            description?.trim() || null,
            routeId
          ]
        )

      /*
       * Replace approval steps.
       */
      await client.query(
        `
        DELETE FROM approval_route_steps
        WHERE approval_route_id = $1
        `,
        [routeId]
      )

      for (const step of cleanSteps) {
        await client.query(
          `
          INSERT INTO approval_route_steps (
            approval_route_id,
            step_order,
            approver_role_id
          )
          VALUES ($1, $2, $3)
          `,
          [
            routeId,
            step.stepOrder,
            step.roleId
          ]
        )
      }

      await client.query('COMMIT')

      const updatedRoute =
        updatedRouteResult.rows[0]

      /*
       * Audit log
       */
      await logAudit({
        userId: req.user!.userId,
        action: 'UPDATE',
        module: 'APPROVAL_ROUTE',
        entityType: 'ApprovalRoute',
        entityId: routeId,
        description:
          `Updated approval route: ${updatedRoute.name}`,

        oldValues: {
          name: oldRoute.name,
          description:
            oldRoute.description,
          steps: oldSteps
        },

        newValues: {
          name: updatedRoute.name,
          description:
            updatedRoute.description,
          steps: cleanSteps
        },

        ipAddress: req.ip,
        userAgent:
          req.get('user-agent')
      })

      return res.json({
        success: true,
        message:
          'Approval route updated successfully',
        data: updatedRoute
      })
    } catch (error: unknown) {
      await client.query('ROLLBACK')

      console.error(
        'Error updating approval route:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to update approval route'
      })
    } finally {
      client.release()
    }
  }
)
// DELETE approval route
router.delete(
  '/:id',
  requirePermission('approval_route.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    const client = await pool.connect()

    try {
      const routeId = Number(
        req.params.id
      )

      if (Number.isNaN(routeId)) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid approval route ID'
        })
      }

      /*
       * Get the route details before deletion.
       * These values are required for the audit log.
       */
      const routeResult =
        await client.query(
          `
          SELECT
            id,
            name,
            description
          FROM approval_routes
          WHERE id = $1
          `,
          [routeId]
        )

      if (
        routeResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            'Approval route not found'
        })
      }

      const oldRoute =
        routeResult.rows[0]

      /*
       * Get the approval steps before deletion.
       */
      const stepsResult =
        await client.query(
          `
          SELECT
            step_order,
            approver_role_id
          FROM approval_route_steps
          WHERE approval_route_id = $1
          ORDER BY step_order
          `,
          [routeId]
        )

      const oldSteps =
        stepsResult.rows.map(
          (step) => ({
            stepOrder:
              step.step_order,
            roleId:
              step.approver_role_id
          })
        )

      /*
       * Check whether this route is already used
       * by an existing reservation.
       */
      const reservationResult =
        await client.query(
          `
          SELECT COUNT(*) AS count
          FROM reservations
          WHERE approval_route_id = $1
          `,
          [routeId]
        )

      const reservationCount =
        Number(
          reservationResult.rows[0].count
        )

      if (reservationCount > 0) {
        return res.status(409).json({
          success: false,
          message:
            'This approval route cannot be deleted because it is used by existing reservations. Keep it to preserve reservation history.'
        })
      }

      await client.query('BEGIN')

      /*
       * Delete approval steps first.
       */
      await client.query(
        `
        DELETE FROM approval_route_steps
        WHERE approval_route_id = $1
        `,
        [routeId]
      )

      /*
       * Then delete the approval route.
       */
      await client.query(
        `
        DELETE FROM approval_routes
        WHERE id = $1
        `,
        [routeId]
      )

      await client.query('COMMIT')

      /*
       * Audit log
       */
      await logAudit({
        userId: req.user!.userId,
        action: 'DELETE',
        module: 'APPROVAL_ROUTE',
        entityType: 'ApprovalRoute',
        entityId: routeId,
        description:
          `Deleted approval route: ${oldRoute.name}`,

        oldValues: {
          name: oldRoute.name,
          description:
            oldRoute.description,
          steps: oldSteps
        },

        ipAddress: req.ip,
        userAgent:
          req.get('user-agent')
      })

      return res.json({
        success: true,
        message:
          'Approval route deleted successfully'
      })
    } catch (error: unknown) {
      await client.query('ROLLBACK')

      console.error(
        'Error deleting approval route:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to delete approval route'
      })
    } finally {
      client.release()
    }
  }
)

export default router