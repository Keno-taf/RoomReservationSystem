
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import LayoutHeaderControls from '../components/LayoutHeaderControls'

function UserLayout() {
  const { user, logout } = useAuth()

  const roleIds = user?.roleIds ?? []

  const isDepartmentHead = roleIds.includes(2)
  const isFacilityManager = roleIds.includes(3)

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: '🏠'
    },
    {
      name: 'My Reservations',
      path: '/reservations',
      icon: '📅'
    },
    {
      name: 'New Reservation',
      path: '/reservations/new',
      icon: '➕'
    },
    {
      name: 'Facilities',
      path: '/facilities',
      icon: '🏢'
    }
  ]

  const managementItems = [
    ...(isDepartmentHead || isFacilityManager
      ? [
          {
            name: 'Pending Approvals',
            path: '/approvals',
            icon: '✅'
          },
          {
            name: 'All Reservations',
            path: '/reservations/all',
            icon: '📋'
          }
        ]
      : [])
  ]

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-br from-[#0B2450] via-[#123B78] to-[#1557A6] text-white">

        {/* System name */}
        <div className="border-b border-gray-700 p-6">
          <h1 className="text-xl font-bold">
            Room Reservation
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Reservation System
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Main Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={
                  item.path === '/' ||
                  item.path === '/reservations'
                }
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

                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Management links */}
          {managementItems.length > 0 && (
            <>
              <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Management
              </p>

              <div className="space-y-1">
                {managementItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
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

                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="ml-64 min-h-screen">

        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex min-h-[84px] flex-wrap items-center justify-between gap-4 px-6 py-4">

            {/* Title on the left */}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-800">
                Room Reservation System
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your reservations and activities
              </p>
            </div>

            {/* Header controls on the right */}
            <div className="flex shrink-0 items-center justify-end">
              <LayoutHeaderControls
                fullName={user?.fullName}
                roleNames={user?.roleNames}
                onLogout={logout}
              />
            </div>

          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default UserLayout
