import { useEffect, useMemo, useState } from 'react'
import {
  getSystemUsers,
  type SystemUser
} from '../../services/adminService'
import api from '../../services/api'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function UserManagement() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const [showAddUser, setShowAddUser] = useState(false)

  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

const handleAddUser = async () => {
  setFormError('')
  setFormSuccess('')

  if (!fullName.trim()) {
    setFormError('Full name is required.')
    return
  }

  if (!email.trim()) {
    setFormError('Email is required.')
    return
  }

  if (!password) {
    setFormError('Password is required.')
    return
  }

  if (password.length < 8) {
    setFormError(
      'Password must be at least 8 characters long.'
    )
    return
  }

  if (!roleId) {
    setFormError('Please select a role.')
    return
  }

  try {
    setSaving(true)

    await api.post('/admin/users', {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      departmentId: departmentId
        ? Number(departmentId)
        : null,
      roleId: Number(roleId)
    })

    setFormSuccess('User created successfully.')

    setFullName('')
    setEmail('')
    setPassword('')
    setDepartmentId('')
    setRoleId('')

    const updatedUsers = await getSystemUsers()
    setUsers(updatedUsers)

    setTimeout(() => {
      setShowAddUser(false)
      setFormSuccess('')
    }, 1000)
  }  catch (error) {
  console.error('Failed to create user:', error)

  if (axios.isAxiosError(error)) {
    setFormError(
      error.response?.data?.message ||
        'Failed to create user.'
    )
  } else {
    setFormError('Failed to create user.')
  }
} finally {
  setSaving(false)
}
}
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getSystemUsers()

        setUsers(data)
      } catch (error) {
        console.error(
          'Failed to load system users:',
          error
        )

        setError('Failed to load system users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase().trim()

      const matchesSearch =
        !searchText ||
        user.full_name.toLowerCase().includes(searchText) ||
        user.email.toLowerCase().includes(searchText)

      const matchesRole =
  roleFilter === 'All' ||
  user.roles.some(
    (role) => role.name === roleFilter
  )

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && user.is_active) ||
        (statusFilter === 'Inactive' && !user.is_active)




      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      )
    })
  }, [
    users,
    search,
    roleFilter,
    statusFilter
  ])

  return (
    <div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          User Management
        </h1>

        <p className="mt-1 text-gray-600">
          Manage system users, roles, departments,
          and account status.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">

        <div className="grid gap-4 md:grid-cols-3">

          {/* Search */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name or email..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            >
              <option value="All">
                All Roles
              </option>

              <option value="Employee">
                Employee
              </option>

              <option value="Department Head">
                Department Head
              </option>

              <option value="Facility Manager">
                Facility Manager
              </option>

              <option value="Administrator">
                Administrator
              </option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

        </div>

      </div>

      {/* Users */}
      <div className="rounded-lg bg-white shadow">

        <div className="flex items-center justify-between border-b p-6">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              System Users
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredUsers.length} user(s) found
            </p>
          </div>

  <button
  type="button"
  onClick={() => navigate('/admin/users/new')}
  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
>
  + Add User
</button>

{showAddUser && (
  <div className="border-b bg-gray-50 p-6">
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Add New User
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a new account for the reservation system.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddUser(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {formSuccess}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Enter full name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter email address"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Minimum 8 characters"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Role
          </label>

          <select
            value={roleId}
            onChange={(event) =>
              setRoleId(event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          >
            <option value="">Select Role</option>
            <option value="1">Employee</option>
            <option value="2">Department Head</option>
            <option value="3">Facility Manager</option>
            <option value="4">Administrator</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Department ID
          </label>

          <input
            type="number"
            value={departmentId}
            onChange={(event) =>
              setDepartmentId(event.target.value)
            }
            placeholder="Enter department ID"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowAddUser(false)}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleAddUser}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </div>
  </div>
)}







        </div>

        {loading && (
          <div className="p-6 text-gray-600">
            Loading system users...
          </div>
        )}

        {error && (
          <div className="p-6 text-red-600">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          filteredUsers.length === 0 && (
            <div className="p-6 text-gray-600">
              No users match your search criteria.
            </div>
          )}

        {!loading &&
          !error &&
          filteredUsers.length > 0 && (
            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Department
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Role
                    </th>

                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200">

                  {filteredUsers.map((user) => (

                    <tr
                      key={user.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {user.full_name}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {user.email}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {user.department_name || '-'}
                      </td>

                      <td className="px-6 py-4">
  <div className="flex flex-wrap gap-2">
    {user.roles.map((role) => (
      <span
        key={role.id}
        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
      >
        {role.name}
      </span>
    ))}
  </div>
</td>

                      <td className="px-6 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-right">

                    <button
  type="button"
  onClick={() =>
    navigate(
      `/admin/users/${user.id}/edit`
    )
  }
  className="text-sm font-medium text-blue-600 hover:text-blue-800"
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
  )
}

export default UserManagement