import { Router } from 'express'
import pool from '../config/database.js'
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js'
import {
  hasPermission,
  requirePermission
} from '../middleware/permissionMiddleware.js'

import bcrypt from 'bcryptjs'
import { logAudit } from '../utils/auditLogger.js'

const router = Router()

// Get all system users
router.get(
  '/users',
  requirePermission('user.view'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {

      const result = await pool.query(`
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.department_id,
          d.name AS department_name,
          u.is_active,
          u.created_at,

          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', r.id,
                'name', r.name
              )
              ORDER BY r.id
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) AS roles

        FROM users u

        LEFT JOIN departments d
          ON u.department_id = d.id

        LEFT JOIN user_roles ur
          ON u.id = ur.user_id

        LEFT JOIN roles r
          ON ur.role_id = r.id

        GROUP BY
          u.id,
          u.full_name,
          u.email,
          u.department_id,
          d.name,
          u.is_active,
          u.created_at

        ORDER BY u.id ASC
      `)

      return res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error(
        'Get system users error:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to load system users'
      })
    }
  }
)
router.post(
  '/users',
  requirePermission('user.create'),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    const client = await pool.connect()

    try {
      // ============================================================
      // ADMINISTRATOR ACCESS CHECK
      // ============================================================
      const {
        fullName,
        email,
        password,
        departmentId,
        roleIds
      } = req.body

      // ============================================================
      // VALIDATE REQUIRED USER INFORMATION
      // ============================================================
      if (
        !fullName ||
        !email ||
        !password ||
        !Array.isArray(roleIds) ||
        roleIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Full name, email, password, and at least one role are required'
        })
      }

      // ============================================================
      // VALIDATE PASSWORD
      // ============================================================
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message:
            'Password must be at least 8 characters long'
        })
      }

      const normalizedEmail = email
        .trim()
        .toLowerCase()

      // ============================================================
      // CHECK WHETHER EMAIL ALREADY EXISTS
      // ============================================================
      const existingUser = await client.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = $1
        `,
        [normalizedEmail]
      )

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            'A user with this email already exists'
        })
      }

      // ============================================================
      // VALIDATE SELECTED ROLES
      // ============================================================
      const validRoles = await client.query(
        `
        SELECT id
        FROM roles
        WHERE id = ANY($1::integer[])
        `,
        [roleIds.map(Number)]
      )

      if (validRoles.rows.length !== roleIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more selected roles are invalid'
        })
      }

      // ============================================================
      // HASH USER PASSWORD
      // ============================================================
      const passwordHash = await bcrypt.hash(
        password,
        10
      )

      await client.query('BEGIN')

      /*
       * Keep role_id temporarily for compatibility
       * with the current authentication system.
       *
       * The first selected role is stored here.
       * All selected roles are stored in user_roles.
       */
      const primaryRoleId = Number(roleIds[0])

      // ============================================================
      // CREATE USER
      // ============================================================
      const userResult = await client.query(
        `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          department_id,
          role_id,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING
          id,
          full_name,
          email,
          department_id,
          role_id,
          is_active,
          created_at
        `,
        [
          fullName.trim(),
          normalizedEmail,
          passwordHash,
          departmentId || null,
          primaryRoleId
        ]
      )

      const newUser = userResult.rows[0]

      // ============================================================
      // ASSIGN SELECTED ROLES TO THE NEW USER
      // ============================================================
      for (const roleId of roleIds) {
        await client.query(
          `
          INSERT INTO user_roles (
            user_id,
            role_id
          )
          VALUES ($1, $2)
          `,
          [
            newUser.id,
            Number(roleId)
          ]
        )
      }

      await client.query('COMMIT')

      // ============================================================
      // AUDIT LOG
      // Record that an administrator created a new system user.
      // Password/passwordHash is intentionally NOT recorded.
      // ============================================================
      await logAudit({
        userId: req.user!.userId,
        action: 'CREATE',
        module: 'USER',
        entityType: 'User',
        entityId: newUser.id,
        description: `Created user: ${newUser.full_name}`,
        newValues: {
          fullName: newUser.full_name,
          email: newUser.email,
          departmentId: newUser.department_id,
          roleIds: roleIds.map(Number),
          isActive: newUser.is_active
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      // ============================================================
      // RETURN SUCCESS RESPONSE
      // ============================================================
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      })
    } catch (error) {
      await client.query('ROLLBACK')

      console.error(
        'Create system user error:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to create system user'
      })
    } finally {
      client.release()
    }
  }
)
router.put(
  '/users/:id',
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    const client = await pool.connect()

    try {
      const userId = Number(req.params.id)

      if (Number.isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        })
      }

      const {
        fullName,
        email,
        departmentId,
        roleIds,
        isActive
      } = req.body

      // ============================================================
      // VALIDATE USER INFORMATION
      // ============================================================
      if (!fullName || !fullName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required'
        })
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        })
      }

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one role is required'
        })
      }

      const cleanRoleIds = roleIds
        .map(Number)
        .filter((id: number) =>
          Number.isInteger(id)
        )

      if (cleanRoleIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one valid role is required'
        })
      }

      // ============================================================
      // GET EXISTING USER
      // We keep the old values for audit logging.
      // Password information is intentionally NOT selected.
      // ============================================================
      const existingUser = await client.query(
        `
        SELECT
          id,
          full_name,
          email,
          department_id,
          is_active
        FROM users
        WHERE id = $1
        `,
        [userId]
      )

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      const oldUser = existingUser.rows[0]

      // ============================================================
      // GET EXISTING USER ROLES
      // These are also needed for the audit log.
      // ============================================================
      const existingRoles = await client.query(
        `
        SELECT role_id
        FROM user_roles
        WHERE user_id = $1
        ORDER BY role_id
        `,
        [userId]
      )

      const oldRoleIds = existingRoles.rows.map(
        (row) => Number(row.role_id)
      )

      // ============================================================
      // CHECK FOR DUPLICATE EMAIL
      // ============================================================
      const duplicateEmail = await client.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        AND id <> $2
        `,
        [
          email.trim(),
          userId
        ]
      )

      if (duplicateEmail.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Another user already uses this email'
        })
      }

      // ============================================================
      // VALIDATE SELECTED ROLES
      // ============================================================
      const roleResult = await client.query(
        `
        SELECT id
        FROM roles
        WHERE id = ANY($1::integer[])
        `,
        [cleanRoleIds]
      )

      if (
        roleResult.rows.length !==
        cleanRoleIds.length
      ) {
        return res.status(400).json({
          success: false,
          message: 'One or more selected roles are invalid'
        })
      }

      // ============================================================
      // VALIDATE DEPARTMENT
      // ============================================================
      if (
        departmentId !== null &&
        departmentId !== undefined &&
        departmentId !== ''
      ) {
        const departmentResult =
          await client.query(
            `
            SELECT id
            FROM departments
            WHERE id = $1
            `,
            [Number(departmentId)]
          )

        if (
          departmentResult.rows.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message: 'Selected department is invalid'
          })
        }
      }

      // ============================================================
      // BEGIN TRANSACTION
      // ============================================================
      await client.query('BEGIN')

      // ============================================================
      // UPDATE USER
      // ============================================================
      const updatedUserResult =
        await client.query(
          `
          UPDATE users
          SET
            full_name = $1,
            email = $2,
            department_id = $3,
            role_id = $4,
            is_active = $5
          WHERE id = $6
          RETURNING
            id,
            full_name,
            email,
            department_id,
            is_active
          `,
          [
            fullName.trim(),
            email.trim(),
            departmentId
              ? Number(departmentId)
              : null,
            cleanRoleIds[0],
            isActive !== false,
            userId
          ]
        )

      const updatedUser =
        updatedUserResult.rows[0]

      // ============================================================
      // UPDATE USER ROLES
      // ============================================================
      await client.query(
        `
        DELETE FROM user_roles
        WHERE user_id = $1
        `,
        [userId]
      )

      for (const roleId of cleanRoleIds) {
        await client.query(
          `
          INSERT INTO user_roles (
            user_id,
            role_id
          )
          VALUES ($1, $2)
          `,
          [
            userId,
            roleId
          ]
        )
      }

      // ============================================================
      // COMMIT USER UPDATE
      // ============================================================
      await client.query('COMMIT')

      // ============================================================
// AUDIT LOG
// Record whether the user was updated, enabled, or disabled.
// Password/passwordHash is intentionally NOT recorded.
// ============================================================

const statusChanged =
  oldUser.is_active !== updatedUser.is_active
  if (statusChanged) {
  const allowed = await hasPermission(
    req.user!.userId,
    'user.disable'
  )

  if (!allowed) {
    return res.status(403).json({
      success: false,
      message:
        'Permission denied: user.disable'
    })
  }
} else {
  const allowed = await hasPermission(
    req.user!.userId,
    'user.edit'
  )

  if (!allowed) {
    return res.status(403).json({
      success: false,
      message:
        'Permission denied: user.edit'
    })
  }
}

const auditAction = statusChanged
  ? updatedUser.is_active
    ? 'ENABLE'
    : 'DISABLE'
  : 'UPDATE'

const auditDescription = statusChanged
  ? updatedUser.is_active
    ? `Enabled user: ${updatedUser.full_name}`
    : `Disabled user: ${updatedUser.full_name}`
  : `Updated user: ${updatedUser.full_name}`

await logAudit({
  userId: req.user!.userId,
  action: auditAction,
  module: 'USER',
  entityType: 'User',
  entityId: userId,
  description: auditDescription,

  oldValues: {
    fullName: oldUser.full_name,
    email: oldUser.email,
    departmentId: oldUser.department_id,
    roleIds: oldRoleIds,
    isActive: oldUser.is_active
  },

  newValues: {
    fullName: updatedUser.full_name,
    email: updatedUser.email,
    departmentId: updatedUser.department_id,
    roleIds: cleanRoleIds,
    isActive: updatedUser.is_active
  },

  ipAddress: req.ip,
  userAgent: req.get('user-agent')
})
      // ============================================================
      // RETURN SUCCESS RESPONSE
      // ============================================================
      return res.json({
        success: true,
        message: 'User updated successfully'
      })
    } catch (error: unknown) {
      await client.query('ROLLBACK')

      console.error(
        'Update user error:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to update user'
      })
    } finally {
      client.release()
    }
  }
)
router.get(
  '/roles',
  requirePermission('role.manage'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await pool.query(`
        SELECT
          r.id,
          r.name,
          r.description,
          r.created_at,
          COUNT(
            DISTINCT rp.permission_id
          ) AS permission_count,

          COUNT(
            DISTINCT ur.user_id
          ) AS user_count

        FROM roles r

        LEFT JOIN role_permissions rp
          ON r.id = rp.role_id

        LEFT JOIN user_roles ur
          ON r.id = ur.role_id

        GROUP BY
          r.id,
          r.name,
          r.description,
          r.created_at

        ORDER BY r.id ASC
      `)

      return res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error(
        'Get roles error:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to load roles'
      })
    }
  }
)


router.get(
  '/permissions',
  requirePermission('permission.manage'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          name,
          code,
          description,
          module,
          is_active,
          created_at
        FROM permissions
        WHERE is_active = true
        ORDER BY
          module ASC,
          id ASC
      `)

      return res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error(
        'Get permissions error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to load permissions'
      })
    }
  }
)

router.get(
  '/roles/:id/permissions',
  requirePermission('permission.manage'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const roleId = Number(
        req.params.id
      )

      if (Number.isNaN(roleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        })
      }

      const result = await pool.query(
        `
        SELECT
          p.id,
          p.name,
          p.code,
          p.description,
          p.module,
          CASE
            WHEN rp.role_id IS NOT NULL
            THEN true
            ELSE false
          END AS assigned
        FROM permissions p
        LEFT JOIN role_permissions rp
          ON p.id = rp.permission_id
          AND rp.role_id = $1
        WHERE p.is_active = true
        ORDER BY
          p.module ASC,
          p.id ASC
        `,
        [roleId]
      )

      return res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error(
        'Get role permissions error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to load role permissions'
      })
    }
  }
)

router.post(
  '/roles',
  requirePermission('role.manage'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        name,
        description
      } = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        })
      }

      const normalizedName =
        name.trim()

      const existingRole =
        await pool.query(
          `
          SELECT id
          FROM roles
          WHERE LOWER(name) = LOWER($1)
          `,
          [normalizedName]
        )

      if (existingRole.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            'A role with this name already exists'
        })
      }

      const result = await pool.query(
        `
        INSERT INTO roles (
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
          normalizedName,
          description?.trim() || null
        ]
      )

      return res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: result.rows[0]
      })
    } catch (error) {
      console.error(
        'Create role error:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to create role'
      })
    }
  }
)
router.put(
  '/roles/:id',
  requirePermission('role.manage'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const roleId = Number(
        req.params.id
      )

      const {
        name,
        description
      } = req.body

      if (Number.isNaN(roleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        })
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        })
      }

      const result = await pool.query(
        `
        UPDATE roles
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
          roleId
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      return res.json({
        success: true,
        message: 'Role updated successfully',
        data: result.rows[0]
      })
    } catch (error) {
      console.error(
        'Update role error:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to update role'
      })
    }
  }
)


router.put(
  '/roles/:id/permissions',
  requirePermission('permission.manage'),
  async (req: AuthenticatedRequest, res) => {
    const client = await pool.connect()

    try {
      const roleId = Number(
        req.params.id
      )

      const {
        permissionIds
      } = req.body

      if (Number.isNaN(roleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        })
      }

      if (
        !Array.isArray(permissionIds)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'permissionIds must be an array'
        })
      }

      const cleanPermissionIds =
        permissionIds
          .map(Number)
          .filter(
            (id) => Number.isInteger(id)
          )

      const roleResult =
        await client.query(
          `
          SELECT id
          FROM roles
          WHERE id = $1
          `,
          [roleId]
        )

      if (roleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      if (
        cleanPermissionIds.length > 0
      ) {
        const permissionResult =
          await client.query(
            `
            SELECT id
            FROM permissions
            WHERE id = ANY($1::integer[])
            AND is_active = true
            `,
            [cleanPermissionIds]
          )

        if (
          permissionResult.rows.length !==
          cleanPermissionIds.length
        ) {
          return res.status(400).json({
            success: false,
            message:
              'One or more permissions are invalid'
          })
        }
      }

      await client.query('BEGIN')

      await client.query(
        `
        DELETE FROM role_permissions
        WHERE role_id = $1
        `,
        [roleId]
      )

      for (
        const permissionId
        of cleanPermissionIds
      ) {
        await client.query(
          `
          INSERT INTO role_permissions (
            role_id,
            permission_id
          )
          VALUES ($1, $2)
          `,
          [
            roleId,
            permissionId
          ]
        )
      }

      await client.query('COMMIT')

      return res.json({
        success: true,
        message:
          'Role permissions updated successfully'
      })
    } catch (error) {
      await client.query('ROLLBACK')

      console.error(
        'Update role permissions error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to update role permissions'
      })
    } finally {
      client.release()
    }
  }
)
router.get(
  '/departments',
  requirePermission('department.manage'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          name
        FROM departments
        ORDER BY name ASC
      `)

      return res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error(
        'Get departments error:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to load departments'
      })
    }
  }
)
export default router