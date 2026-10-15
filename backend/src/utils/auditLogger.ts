import pool from '../config/database.js'

interface AuditLogData {
  userId?: number | null
  action: string
  module: string
  entityType?: string | null
  entityId?: number | null
  description?: string | null
  oldValues?: unknown
  newValues?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}

export async function logAudit({
  userId = null,
  action,
  module,
  entityType = null,
  entityId = null,
  description = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null
}: AuditLogData) {
  try {
    await pool.query(
      `
      INSERT INTO audit_logs (
        user_id,
        action,
        module,
        entity_type,
        entity_id,
        description,
        old_values,
        new_values,
        ip_address,
        user_agent
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10
      )
      `,
      [
        userId,
        action,
        module,
        entityType,
        entityId,
        description,
        oldValues
          ? JSON.stringify(oldValues)
          : null,
        newValues
          ? JSON.stringify(newValues)
          : null,
        ipAddress,
        userAgent
      ]
    )
  } catch (error) {
    console.error(
      'Audit logging failed:',
      error
    )
  }
}