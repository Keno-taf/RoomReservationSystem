import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../../services/api'

interface Role {
  id: number
  name: string
}

interface Department {
  id: number
  name: string
}

function CreateUser() {
  const navigate = useNavigate()

  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [loadingData, setLoadingData] = useState(true)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [departmentId, setDepartmentId] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] =
    useState<number[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoadingData(true)
        setError('')

        const [rolesResponse, departmentsResponse] =
          await Promise.all([
            api.get('/admin/roles'),
            api.get('/admin/departments')
          ])

        setRoles(rolesResponse.data.data)
        setDepartments(
          departmentsResponse.data.data
        )
      } catch (error) {
        console.error(
          'Failed to load user form data:',
          error
        )

        if (axios.isAxiosError(error)) {
          setError(
            error.response?.data?.message ||
              'Failed to load roles and departments.'
          )
        } else {
          setError(
            'Failed to load roles and departments.'
          )
        }
      } finally {
        setLoadingData(false)
      }
    }

    loadFormData()
  }, [])

  const handleRoleChange = (roleId: number) => {
    setSelectedRoleIds((currentRoles) => {
      if (currentRoles.includes(roleId)) {
        return currentRoles.filter(
          (id) => id !== roleId
        )
      }

      return [...currentRoles, roleId]
    })
  }

  const handleSubmit = async () => {
    setError('')

    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }

    if (!email.trim()) {
      setError('Email is required.')
      return
    }

    if (!password) {
      setError('Password is required.')
      return
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters long.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!departmentId) {
      setError('Please select a department.')
      return
    }

    if (selectedRoleIds.length === 0) {
      setError(
        'Please select at least one system role.'
      )
      return
    }

    try {
      setSaving(true)

      await api.post('/admin/users', {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        departmentId: Number(departmentId),
        roleIds: selectedRoleIds
      })

      navigate('/admin/users')
    } catch (error) {
      console.error(
        'Failed to create user:',
        error
      )

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message ||
            'Failed to create user.'
        )
      } else {
        setError('Failed to create user.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="rounded-lg bg-white p-8 shadow">
        <p className="text-gray-600">
          Loading user creation form...
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to User Management
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          Create New User
        </h1>

        <p className="mt-1 text-gray-600">
          Create a system account and assign one or
          more roles.
        </p>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b px-8 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            User Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the user's account and organization
            information.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Enter full name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter email address"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Re-enter password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Department
              </label>

              <select
                value={departmentId}
                onChange={(event) =>
                  setDepartmentId(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">
                  Select Department
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-semibold text-gray-900">
              System Roles
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Select all roles that should be assigned to
              this user.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {roles.map((role) => {
                const selected =
                  selectedRoleIds.includes(role.id)

                return (
                  <label
                    key={role.id}
                    className={`flex cursor-pointer items-center rounded-lg border p-4 transition ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        handleRoleChange(role.id)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />

                    <div className="ml-3">
                      <div className="font-medium text-gray-900">
                        {role.name}
                      </div>

                      <div className="text-xs text-gray-500">
                        Role ID: {role.id}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() =>
                navigate('/admin/users')
              }
              disabled={saving}
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Creating User...'
                : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateUser