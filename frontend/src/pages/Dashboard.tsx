import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
function Dashboard() {
 const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold text-blue-700">
              Room Reservation System
            </h1>

            <p className="text-xs text-gray-500">
              Organization Facility Management
            </p>
 <h2 className="text-xl font-semibold">
      Welcome, {user?.fullName}
    </h2>

    <p className="text-gray-600">
      Role: {user?.roleNames}
    </p>

          </div>
          <div className="flex items-center gap-6">
            <Link
  to="/"
  className="text-gray-700 hover:text-blue-600"
>
  Dashboard
</Link>

            <Link
  to="/reservations"
  className="text-gray-700 hover:text-blue-600"
>
  My Reservations
</Link>

            <a href="#" className="text-gray-700 hover:text-blue-600">
              Profile
            </a>

            <button
    onClick={logout}
    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
  >
    Logout
  </button>
          </div>

        </div>
      </nav>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Welcome Section */}
        <section className="bg-blue-700 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-blue-200 mb-2">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold mb-3">
                Employee Dashboard
              </h2>

              <p className="text-blue-100">
                Manage your room and facility reservations easily.
              </p>
            </div>

            <Link
  to="/reservations/new"
  className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100"
>
  + Request Reservation
</Link>

          </div>
        </section>


        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500 text-sm">
              Total Reservations
            </p>

            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              12
            </h3>
          </div>


          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500 text-sm">
              Pending Requests
            </p>

            <h3 className="text-3xl font-bold text-yellow-600 mt-2">
              2
            </h3>
          </div>


          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500 text-sm">
              Approved Reservations
            </p>

            <h3 className="text-3xl font-bold text-green-600 mt-2">
              10
            </h3>
          </div>

        </section>


        {/* Recent Reservations */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200">

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Reservations
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Your latest room reservation requests
            </p>
          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Facility
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Date
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Time
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>


              <tbody>

                <tr className="border-t border-gray-200">
                  <td className="px-6 py-4 font-medium">
                    Conference Hall A
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    October 5, 2026
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    9:00 AM - 12:00 PM
                  </td>

                  <td className="px-6 py-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      Approved
                    </span>
                  </td>
                </tr>


                <tr className="border-t border-gray-200">
                  <td className="px-6 py-4 font-medium">
                    Meeting Room 2
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    October 10, 2026
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    2:00 PM - 4:00 PM
                  </td>

                  <td className="px-6 py-4">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                      Pending
                    </span>
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </section>

      </main>


      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          © 2026 Room Reservation System. All rights reserved.
        </div>
      </footer>

    </div>
  )
}

export default Dashboard