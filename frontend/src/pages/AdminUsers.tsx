
import { useState } from 'react'

interface User {
  id: number
  fullName: string
  username: string
  role: string
  departmentName?: string
  isActive: boolean
}

function AdminUsers() {
  const [users] = useState<User[]>([])

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            User Management
          </h1>

          <p className="mt-2 text-gray-600">
            Manage system users, roles, and account status.
          </p>
        </div>

        {/* Users Card */}
        <div className="rounded-lg bg-white shadow">

          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              System Users
            </h2>
          </div>

          {/* Users Table / Empty State */}
          {users.length === 0 ? (
            <div className="p-6 text-gray-600">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Full Name
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Username
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Department
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.fullName}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.username}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.role}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.departmentName || '-'}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        {user.isActive ? (
                          <span className="font-medium text-green-600">
                            Active
                          </span>
                        ) : (
                          <span className="font-medium text-red-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <button
                          type="button"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminUsers
