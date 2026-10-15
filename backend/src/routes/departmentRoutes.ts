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

// GET all departments
router.get(
  '/',
  requirePermission('department.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
  try {
    const result = await pool.query(`
      SELECT
        d.id,
        d.name,
        d.description,
        d.is_active,
        d.created_at,
        COUNT(u.id) AS user_count
      FROM departments d
      LEFT JOIN users u
        ON d.id = u.department_id
      GROUP BY
        d.id,
        d.name,
        d.description,
        d.is_active,
        d.created_at
      ORDER BY d.name
    `)

    return res.json({
      success: true,
      data: result.rows
    })
  } catch (error: unknown) {
    console.error(
      'Error fetching departments:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments'
    })
  }
})

// GET department by ID
router.get('/:id', async (req, res) => {
  try {
    const departmentId = Number(
      req.params.id
    )

    if (Number.isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      })
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at
      FROM departments
      WHERE id = $1
      `,
      [departmentId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      })
    }

    return res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: unknown) {
    console.error(
      'Error fetching department:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve department'
    })
  }
})

// CREATE department
router.post(
  '/',
  requirePermission('department.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        name,
        description
      } = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Department name is required'
        })
      }

      const existingDepartment =
        await pool.query(
          `
          SELECT id
          FROM departments
          WHERE LOWER(name) = LOWER($1)
          `,
          [name.trim()]
        )

      if (
        existingDepartment.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            'A department with this name already exists'
        })
      }

      const result = await pool.query(
        `
        INSERT INTO departments (
          name,
          description,
          is_active
        )
        VALUES ($1, $2, TRUE)
        RETURNING
          id,
          name,
          description,
          is_active,
          created_at
        `,
        [
          name.trim(),
          description?.trim() || null
        ]
      )

      const newDepartment =
        result.rows[0]

      await logAudit({
        userId: req.user!.userId,
        action: 'CREATE',
        module: 'DEPARTMENT',
        entityType: 'Department',
        entityId: newDepartment.id,
        description:
          `Created department: ${newDepartment.name}`,

        newValues: {
          name: newDepartment.name,
          description:
            newDepartment.description,
          is_active:
            newDepartment.is_active
        },

        ipAddress: req.ip,
        userAgent:
          req.get('user-agent')
      })

      return res.status(201).json({
        success: true,
        message:
          'Department created successfully',
        data: newDepartment
      })
    } catch (error: unknown) {
      console.error(
        'Error creating department:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to create department'
      })
    }
  }
)

// UPDATE department
router.put(
  '/:id',
  requirePermission('department.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const departmentId = Number(
        req.params.id
      )

      if (Number.isNaN(departmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID'
        })
      }

      const {
        name,
        description
      } = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'Department name is required'
        })
      }

      const existingDepartment =
        await pool.query(
          `
          SELECT
            id,
            name,
            description,
            is_active
          FROM departments
          WHERE id = $1
          `,
          [departmentId]
        )

      if (
        existingDepartment.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        })
      }

      const oldDepartment =
        existingDepartment.rows[0]

      const duplicateDepartment =
        await pool.query(
          `
          SELECT id
          FROM departments
          WHERE LOWER(name) = LOWER($1)
          AND id <> $2
          `,
          [
            name.trim(),
            departmentId
          ]
        )

      if (
        duplicateDepartment.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            'A department with this name already exists'
        })
      }

      const result = await pool.query(
        `
        UPDATE departments
        SET
          name = $1,
          description = $2
        WHERE id = $3
        RETURNING
          id,
          name,
          description,
          is_active,
          created_at
        `,
        [
          name.trim(),
          description?.trim() || null,
          departmentId
        ]
      )

      const updatedDepartment =
        result.rows[0]

      await logAudit({
        userId: req.user!.userId,
        action: 'UPDATE',
        module: 'DEPARTMENT',
        entityType: 'Department',
        entityId: departmentId,
        description:
          `Updated department: ${updatedDepartment.name}`,

        oldValues: {
          name: oldDepartment.name,
          description:
            oldDepartment.description,
          is_active:
            oldDepartment.is_active
        },

        newValues: {
          name: updatedDepartment.name,
          description:
            updatedDepartment.description,
          is_active:
            updatedDepartment.is_active
        },

        ipAddress: req.ip,
        userAgent:
          req.get('user-agent')
      })

      return res.json({
        success: true,
        message:
          'Department updated successfully',
        data: updatedDepartment
      })
    } catch (error: unknown) {
      console.error(
        'Error updating department:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to update department'
      })
    }
  }
)

// ACTIVATE / DEACTIVATE department
router.patch(
  '/:id/status',
  requirePermission('department.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const departmentId = Number(
        req.params.id
      )

      if (Number.isNaN(departmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID'
        })
      }

    const {
  is_active,
  isActive,
  status
} = req.body

let activeValue: boolean

if (typeof is_active === 'boolean') {
  activeValue = is_active
} else if (typeof isActive === 'boolean') {
  activeValue = isActive
} else if (
  typeof status === 'string'
) {
  const normalizedStatus =
    status.trim().toLowerCase()

  if (
    normalizedStatus === 'active' ||
    normalizedStatus === 'available' ||
    normalizedStatus === 'enabled'
  ) {
    activeValue = true
  } else if (
    normalizedStatus === 'inactive' ||
    normalizedStatus === 'disabled'
  ) {
    activeValue = false
  } else {
    return res.status(400).json({
      success: false,
      message:
        'Invalid department status'
    })
  }
} else {
  return res.status(400).json({
    success: false,
    message:
      'Department status is required'
  })
}
      const existingDepartment =
        await pool.query(
          `
          SELECT
            id,
            name,
            description,
            is_active
          FROM departments
          WHERE id = $1
          `,
          [departmentId]
        )

      if (
        existingDepartment.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        })
      }

      const oldDepartment =
        existingDepartment.rows[0]

      const result = await pool.query(
        `
        UPDATE departments
        SET is_active = $1
        WHERE id = $2
        RETURNING
          id,
          name,
          description,
          is_active
        `,
       [
  activeValue,
  departmentId
]
      )

      const updatedDepartment =
        result.rows[0]

      const auditAction =
        updatedDepartment.is_active
          ? 'ENABLE'
          : 'DISABLE'

      await logAudit({
        userId: req.user!.userId,
        action: auditAction,
        module: 'DEPARTMENT',
        entityType: 'Department',
        entityId: departmentId,
        description:
          updatedDepartment.is_active
            ? `Enabled department: ${updatedDepartment.name}`
            : `Disabled department: ${updatedDepartment.name}`,

        oldValues: {
          is_active:
            oldDepartment.is_active
        },

        newValues: {
          is_active:
            updatedDepartment.is_active
        },

        ipAddress: req.ip,
        userAgent:
          req.get('user-agent')
      })

      return res.json({
        success: true,
        message:
          'Department status updated successfully',
        data: updatedDepartment
      })
    } catch (error: unknown) {
      console.error(
        'Error updating department status:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to update department status'
      })
    }
  }
)

// DELETE department
router.delete(
  '/:id',
  requirePermission('department.manage'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const departmentId = Number(
        req.params.id
      )

      if (Number.isNaN(departmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID'
        })
      }

      const departmentResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            description,
            is_active
          FROM departments
          WHERE id = $1
          `,
          [departmentId]
        )

      if (
        departmentResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        })
      }

      const oldDepartment =
        departmentResult.rows[0]

      /*
       * Do not delete a department that
       * still has users assigned to it.
       */
      const userResult =
        await pool.query(
          `
          SELECT COUNT(*) AS count
          FROM users
          WHERE department_id = $1
          `,
          [departmentId]
        )

      const userCount = Number(
        userResult.rows[0].count
      )

      if (userCount > 0) {
        return res.status(409).json({
          success: false,
          message:
            'This department cannot be deleted because users are assigned to it. Reassign the users first.'
        })
      }

      await pool.query(
        `
        DELETE FROM departments
        WHERE id = $1
        `,
        [departmentId]
      )

      await logAudit({
        userId: req.user!.userId,
        action: 'DELETE',
        module: 'DEPARTMENT',
        entityType: 'Department',
        entityId: departmentId,
        description:
          `Deleted department: ${oldDepartment.name}`,

        oldValues: {
          name: oldDepartment.name,
          description:
            oldDepartment.description,
          is_active:
            oldDepartment.is_active
        },

        ipAddress: req.ip,
        userAgent:
          req.get('user-agent')
      })

      return res.json({
        success: true,
        message:
          'Department deleted successfully'
      })
    } catch (error: unknown) {
      console.error(
        'Error deleting department:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to delete department'
      })
    }
  }
)

export default router