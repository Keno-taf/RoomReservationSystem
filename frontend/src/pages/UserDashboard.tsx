import { useAuth } from '../context/useAuth'

function UserDashboard() {
  const { user } = useAuth()

  const isDepartmentHead =
    user?.roleIds?.includes(2)

  const isFacilityManager =
    user?.roleIds?.includes(3)

  const canApprove =
    isDepartmentHead || isFacilityManager

  return (
    <div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-600">
          Welcome back, {user?.fullName}.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            My Reservations
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            —
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Total reservations
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-600">
            —
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Waiting for approval
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Approved
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            —
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Approved reservations
          </p>
        </div>

        {canApprove ? (
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Pending Approvals
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              —
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Requests requiring action
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              Facilities
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              —
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Available facilities
            </p>
          </div>
        )}

      </div>

      {/* Quick Actions */}
      <div className="mt-6 rounded-lg bg-white p-6 shadow">

        <h2 className="text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Quickly access the activities you perform most often.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          <a
            href="/reservations/new"
            className="rounded-lg border border-gray-200 p-5 transition hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="text-2xl">
              ➕
            </div>

            <h3 className="mt-3 font-semibold text-gray-900">
              New Reservation
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Submit a new room or hall reservation request.
            </p>
          </a>

          <a
            href="/reservations"
            className="rounded-lg border border-gray-200 p-5 transition hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="text-2xl">
              📅
            </div>

            <h3 className="mt-3 font-semibold text-gray-900">
              My Reservations
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              View and track your submitted reservations.
            </p>
          </a>

          <a
            href="/facilities"
            className="rounded-lg border border-gray-200 p-5 transition hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="text-2xl">
              🏢
            </div>

            <h3 className="mt-3 font-semibold text-gray-900">
              Facilities
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              View available rooms and halls.
            </p>
          </a>

          {canApprove && (
            <a
              href="/approvals"
              className="rounded-lg border border-gray-200 p-5 transition hover:border-blue-500 hover:bg-blue-50"
            >
              <div className="text-2xl">
                ✅
              </div>

              <h3 className="mt-3 font-semibold text-gray-900">
                Pending Approvals
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Review and process pending reservation requests.
              </p>
            </a>
          )}

        </div>

      </div>

      {/* Information */}
      <div className="mt-6 rounded-lg bg-white p-6 shadow">

        <h2 className="text-lg font-semibold text-gray-900">
          Your Activities
        </h2>

        <p className="mt-2 text-gray-600">
          Use the navigation menu on the left to access
          your reservations, submit new requests, view
          facilities, and perform activities available to
          your role.
        </p>

      </div>

    </div>
  )
}

export default UserDashboard