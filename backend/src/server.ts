import express from 'express'
import cors from 'cors'
import pool from './config/database.js'
import path from 'path'
import approvalRoutes from './routes/approvalRoute.js'
import notificationRoutes from './routes/notificationRoutes.js'
import facilityRoutes from './routes/facilityRoutes.js'
import departmentRoutes from './routes/departmentRoutes.js'
import approvalRouteManagementRoutes from './routes/approvalRouteManagementRoutes.js'
import auditLogRoutes from './routes/auditLogRoutes.js'
import reservationRoutes from './routes/reservationRoutes.js'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import {
  authenticateToken
} from './middleware/authMiddleware.js'

const app = express()

const PORT = 5000

app.use(express.json())
app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(
  '/uploads',
  express.static(
    path.join(process.cwd(), 'uploads')
  )
)

app.use('/api/auth', authRoutes)

app.use(
  '/api/facilities',
  authenticateToken,
  facilityRoutes
)
app.use(
  '/api/departments',
  authenticateToken,
  departmentRoutes
)
app.use(
  '/api/admin/approval-routes',
  authenticateToken,
  approvalRouteManagementRoutes
)
app.use(
  '/api/admin/audit-logs',
  authenticateToken,
  auditLogRoutes
)

app.use(
  '/api/reservations',
  authenticateToken,
  reservationRoutes
)

app.use(
  '/api/approvals',
  authenticateToken,
  approvalRoutes
)

app.use(
  '/api/notifications',
  authenticateToken,
  notificationRoutes
)
app.use(
  '/api/admin',
  authenticateToken,
  adminRoutes
)

// Basic API health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Room Reservation System API is running'
  })
})

// Database connection test
app.get('/api/health/db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')

    res.json({
      success: true,
      message: 'PostgreSQL database connection is working',
      databaseTime: result.rows[0].now
    })
  } catch (error) {
    console.error('Database connection error:', error)

    res.status(500).json({
      success: false,
      message: 'PostgreSQL database connection failed'
    })
  }
})

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})