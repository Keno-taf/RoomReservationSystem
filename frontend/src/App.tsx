import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ReservationRequest from './pages/ReservationRequest'
import MyReservations from './pages/MyReservations'
import ReservationDetails from './pages/ReservationDetails'
import ApprovalDashboard from './pages/ApprovalDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Facilities from './pages/Facilities'

import UserLayout from './components/UserLayout'
import UserDashboard from './pages/UserDashboard'
import AllReservations from './pages/AllReservations'

import AdminLayout from './components/AdminLayout'
import UserManagement from './pages/admin/UserManagement'
import CreateUser from './pages/admin/CreateUser'
import EditUser from './pages/admin/EditUser'
import RoleManagement from './pages/admin/RoleManagement'
import FacilityManagement from './pages/admin/FacilityManagement'
import DepartmentManagement from './pages/admin/DepartmentManagement'
import ApprovalRouteManagement from './pages/admin/ApprovalRouteManagement'
import AuditLogs from './pages/admin/AuditLogs'

import AuthProvider from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'


function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* =====================================================
              PUBLIC ROUTE
          ===================================================== */}

          <Route
            path="/login"
            element={<Login />}
          />


          {/* =====================================================
              OLD / ROOT DASHBOARD ROUTE
          ===================================================== */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              USER ROUTES
          ===================================================== */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >

            {/* User Dashboard */}
            <Route
              index
              element={<UserDashboard />}
            />


            {/* New Reservation */}
            <Route
              path="reservations/new"
              element={<ReservationRequest />}
            />


            {/* My Reservations */}
            <Route
              path="reservations"
              element={<MyReservations />}
            />


            {/* Reservation Details */}
            <Route
              path="reservations/:id"
              element={<ReservationDetails />}
            />


            {/* Pending Approvals */}
          <Route path="/approvals" element={<ApprovalDashboard />} />


            {/* All Reservations */}
            <Route
              path="reservations/all"
              element={
                <ProtectedRoute
                  allowedRoles={[2, 3, 4]}
                >
                  <AllReservations />
                </ProtectedRoute>
              }
            />


            {/* =================================================
                FACILITIES
            ================================================= */}

            <Route
              path="facilities"
              element={<Facilities />}
            />

          </Route>


          {/* =====================================================
              ADMIN ROUTES
          ===================================================== */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={[4]}
              >
                <AdminLayout />
              </ProtectedRoute>
            }
          >

            {/* Admin Dashboard */}
            <Route
              index
              element={<AdminDashboard />}
            />


            {/* User Management */}
            <Route
              path="users"
              element={<UserManagement />}
            />


            {/* Create User */}
            <Route
              path="users/new"
              element={<CreateUser />}
            />


            {/* Edit User */}
            <Route
              path="users/:id/edit"
              element={<EditUser />}
            />


            {/* Role & Permission Management */}
            <Route
              path="roles"
              element={<RoleManagement />}
            />


            {/* Facility Management */}
            <Route
              path="facilities"
              element={<FacilityManagement />}
            />


            {/* Department Management */}
            <Route
              path="departments"
              element={<DepartmentManagement />}
            />


            {/* Approval Route Management */}
            <Route
              path="approval-routes"
              element={<ApprovalRouteManagement />}
            />


            {/* Audit Logs */}
            <Route
              path="audit-logs"
              element={<AuditLogs />}
            />

          </Route>

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  )
}

export default App