import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import LayoutHeaderControls from '../components/LayoutHeaderControls'

function AdminLayout() {
  const { user, logout } = useAuth()

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: '🏠'
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: '👥'
    },
    {
      name: 'Role & Permission Management',
      path: '/admin/roles',
      icon: '🔐'
    },
    {
      name: 'Facility Management',
      path: '/admin/facilities',
      icon: '🏢'
    },
    {
      name: 'Department Management',
      path: '/admin/departments',
      icon: '🏛️'
    },
    {
      name: 'Approval Routes',
      path: '/admin/approval-routes',
      icon: '🔀'
    },
    {
      name: 'Audit / System Logs',
      path: '/admin/audit-logs',
      icon: '📋'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-br from-[#0B2450] via-[#123B78] to-[#1557A6] text-white">
        {/* Logo */}
        <div className="shrink-0 border-b border-gray-700 p-6">
          <h1 className="text-xl font-bold">
            Room Reservation
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Administration
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Administration
          </p>

          <div className="space-y-1">

            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <span className="text-lg">
                  {item.icon}
                </span>

                <span>
                  {item.name}
                </span>
              </NavLink>
            ))}

          </div>

        </nav>
      </aside>
      {/* ================= MAIN CONTENT ================= */}
      <main className="ml-64 h-screen overflow-y-auto">

        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b bg-white px-6 py-4 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-semibold text-gray-800">
                Administrator Panel
              </h2>

              <p className="text-sm text-gray-500">
                System administration and configuration
              </p>

            </div>

            {/* Logged-in user */}
            <LayoutHeaderControls
    fullName={user?.fullName}
    roleNames={user?.roleNames}
    onLogout={logout}
  />

          </div>

        </header>


        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>

      </main>

    </div>
  )
}

export default AdminLayout