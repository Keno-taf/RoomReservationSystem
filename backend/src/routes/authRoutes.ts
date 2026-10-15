import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'room-reservation-secret-key'

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    const result = await pool.query(
  `
  SELECT
    u.id,
    u.full_name,
    u.email,
    u.password_hash,
    u.department_id,
    u.is_active,

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

  LEFT JOIN user_roles ur
    ON u.id = ur.user_id

  LEFT JOIN roles r
    ON ur.role_id = r.id

  WHERE LOWER(u.email) = LOWER($1)

  GROUP BY
    u.id,
    u.full_name,
    u.email,
    u.password_hash,
    u.department_id,
    u.is_active
  `,
  [email.trim()]
)

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const user = result.rows[0]

    const roleIds = user.roles.map(
  (role: { id: number; name: string }) =>
    Number(role.id)
)

const roleNames = user.roles.map(
  (role: { id: number; name: string }) =>
    role.name
)

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive'
      })
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

   const token = jwt.sign(
  {
    userId: user.id,
    roleIds,
    roleNames
  },
  JWT_SECRET,
  {
    expiresIn: '8h'
  }
)

 return res.json({
  success: true,
  message: 'Login successful',
  token,
  user: {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    departmentId: user.department_id,
    roleIds,
    roleNames
  }
})
  } catch (error) {
    console.error('Login error:', error)

    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

export default router