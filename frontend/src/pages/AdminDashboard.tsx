function AdminDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-600">
          Overview of the Room Reservation System.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Total Users
          </p>

          <p className="mt-2 text-3xl font-bold">
            —
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Facilities
          </p>

          <p className="mt-2 text-3xl font-bold">
            —
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Departments
          </p>

          <p className="mt-2 text-3xl font-bold">
            —
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Pending Approvals
          </p>

          <p className="mt-2 text-3xl font-bold">
            —
          </p>
        </div>

      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">
          System Overview
        </h2>

        <p className="mt-2 text-gray-600">
          Use the administration menu on the left
          to manage users, facilities, departments,
          approval routes, and system logs.
        </p>
      </div>
    </div>
  )
}

export default AdminDashboard