import {
  useEffect,
  useState,
  type FormEvent
} from 'react'

import {
  useNavigate,
  useParams
} from 'react-router-dom'

import api from '../../services/api'
import type { SystemUser } from '../../services/adminService'

interface Role {
  id: number
  name: string
}

interface Department {
  id: number
  name: string
}

function EditUser() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] =
    useState<SystemUser | null>(null)

  const [roles, setRoles] =
    useState<Role[]>([])

  const [departments, setDepartments] =
    useState<Department[]>([])

  const [fullName, setFullName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [departmentId, setDepartmentId] =
    useState('')

  const [selectedRoleIds, setSelectedRoleIds] =
    useState<number[]>([])

  const [isActive, setIsActive] =
    useState(true)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          usersResponse,
          rolesResponse,
          departmentsResponse
        ] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/roles'),
          api.get('/admin/departments')
        ])

        if (cancelled) {
          return
        }

        const users =
          usersResponse.data.data as SystemUser[]

        const loadedRoles =
          rolesResponse.data.data as Role[]

        const loadedDepartments =
          departmentsResponse.data.data as Department[]

        const selectedUser =
          users.find(
            (item) =>
              item.id === Number(id)
          )

        if (!selectedUser) {
          setError('User not found.')
          return
        }

        setUser(selectedUser)

        setFullName(
          selectedUser.full_name
        )

        setEmail(
          selectedUser.email
        )

        setDepartmentId(
          selectedUser.department_id
            ? String(
                selectedUser.department_id
              )
            : ''
        )

        setSelectedRoleIds(
          selectedUser.roles.map(
            (role) => role.id
          )
        )

        setIsActive(
          selectedUser.is_active
        )

        setRoles(
          loadedRoles
        )

        setDepartments(
          loadedDepartments
        )
      } catch (error: unknown) {
        console.error(
          'Failed to load edit user data:',
          error
        )

        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error
        ) {
          const axiosError = error as {
            response?: {
              data?: {
                message?: string
              }
            }
          }

          setError(
            axiosError.response?.data?.message ||
            'Failed to load user information.'
          )
        } else {
          setError(
            'Failed to load user information.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [id])

  const handleRoleChange = (
    roleId: number
  ) => {
    setSelectedRoleIds(
      (currentRoles) => {
        if (
          currentRoles.includes(roleId)
        ) {
          return currentRoles.filter(
            (id) => id !== roleId
          )
        }

        return [
          ...currentRoles,
          roleId
        ]
      }
    )
  }

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!fullName.trim()) {
      setError(
        'Full name is required.'
      )
      return
    }

    if (!email.trim()) {
      setError(
        'Email address is required.'
      )
      return
    }

    if (selectedRoleIds.length === 0) {
      setError(
        'Select at least one system role.'
      )
      return
    }

    try {
      setSaving(true)

      const response = await api.put(
        `/admin/users/${id}`,
        {
          fullName: fullName.trim(),
          email: email.trim(),
          departmentId:
            departmentId
              ? Number(departmentId)
              : null,
          roleIds:
            selectedRoleIds,
          isActive
        }
      )

      if (response.data.success) {
        setSuccess(
          'User updated successfully.'
        )

        setTimeout(() => {
          navigate('/admin/users')
        }, 1000)
      } else {
        setError(
          response.data.message ||
          'Failed to update user.'
        )
      }
    } catch (error: unknown) {
      console.error(
        'Failed to update user:',
        error
      )

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string
            }
          }
        }

        setError(
          axiosError.response?.data?.message ||
          'Failed to update user.'
        )
      } else {
        setError(
          'Failed to update user.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          Loading user information...
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            navigate('/admin/users')
          }
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to User Management
        </button>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          {error || 'User not found.'}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Back */}
      <button
        type="button"
        onClick={() =>
          navigate('/admin/users')
        }
        className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← Back to User Management
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Edit User
        </h1>

        <p className="mt-2 text-gray-600">
          Update the user's account,
          department, roles, and status.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* User Information */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              User Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the user's basic
              account information.
            </p>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Department
              </label>

              <select
                id="department"
                value={departmentId}
                onChange={(event) =>
                  setDepartmentId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select Department
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Account Status
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) =>
                    setIsActive(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded"
                />

                <span className="text-sm text-gray-700">
                  Account is active
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              System Roles
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select all roles that should
              be assigned to this user.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(
                    role.id
                  )}
                  onChange={() =>
                    handleRoleChange(
                      role.id
                    )
                  }
                  className="h-4 w-4 rounded"
                />

                <div>
                  <p className="font-medium text-gray-900">
                    {role.name}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() =>
              navigate('/admin/users')
            }
            disabled={saving}
            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? 'Saving Changes...'
              : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditUser