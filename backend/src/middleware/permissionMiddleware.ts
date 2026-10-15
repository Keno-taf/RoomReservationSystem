import { Response, NextFunction } from 'express'
import pool from '../config/database.js'
import {
  AuthenticatedRequest
} from './authMiddleware.js'

export async function hasPermission(
  userId: number,
  permissionCode: string
): Promise<boolean> {
  const result = await pool.query(
    `
    SELECT 1
    FROM user_roles ur
    INNER JOIN role_permissions rp
      ON rp.role_id = ur.role_id
    INNER JOIN permissions p
      ON p.id = rp.permission_id
    WHERE ur.user_id = $1
      AND p.code = $2
      AND p.is_active = TRUE
    LIMIT 1
    `,
    [
      userId,
      permissionCode
    ]
  )

  return result.rowCount !== null &&
    result.rowCount > 0
}

export function requirePermission(
  permissionCode: string
) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const allowed = await hasPermission(
        req.user.userId,
        permissionCode
      )

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            `Permission denied: ${permissionCode}`
        })
      }

      next()
    } catch (error) {
      console.error(
        'Permission check error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to verify permission'
      })
    }
  }
}