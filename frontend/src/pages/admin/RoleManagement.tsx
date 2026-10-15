import {
  useEffect,
  useState,
  type FormEvent
} from 'react'

import api from '../../services/api'

interface Role {
  id: number
  name: string
  description: string | null
  created_at: string
  permission_count: string
  user_count: string
}

interface Permission {
  id: number
  name: string
  code: string
  description: string | null
  module: string
  assigned: boolean
}

function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])

  const [permissions, setPermissions] =
    useState<Permission[]>([])

  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null)

  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState<number[]>([])

  const [loading, setLoading] =
    useState(true)

  const [loadingPermissions, setLoadingPermissions] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [showCreateForm, setShowCreateForm] =
    useState(false)

  const [roleName, setRoleName] =
    useState('')

  const [roleDescription, setRoleDescription] =
    useState('')

  // =====================================================
  // LOAD ROLES
  // =====================================================

  const loadRoles = async () => {
    try {
      setLoading(true)
      setError('')

      const response =
        await api.get('/admin/roles')

      setRoles(response.data.data)
    } catch (error: unknown) {
      console.error(
        'Failed to load roles:',
        error
      )

      console.error(
        'API response:',
     error
      )
      setError(
        'Failed to load system roles.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadRoles()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  // =====================================================
  // LOAD ROLE PERMISSIONS
  // =====================================================

  const loadRolePermissions = async (
    roleId: number
  ) => {
    try {
      setLoadingPermissions(true)
      setError('')
      setSuccess('')

      const response =
        await api.get(
          `/admin/roles/${roleId}/permissions`
        )

      const rolePermissions =
        response.data.data as Permission[]

      setPermissions(rolePermissions)

      const assignedIds =
        rolePermissions
          .filter(
            (permission) =>
              permission.assigned
          )
          .map(
            (permission) =>
              permission.id
          )

      setSelectedPermissionIds(
        assignedIds
      )
    } catch (error: unknown) {
      console.error(
        'Failed to load role permissions:',
        error
      )

      console.error(
        'API response:',
        error
      )

      setError(
        'Failed to load role permissions.'
      )
    } finally {
      setLoadingPermissions(false)
    }
  }

  // =====================================================
  // SELECT ROLE
  // =====================================================

  const handleSelectRole = (
    role: Role
  ) => {
    setSelectedRole(role)
    setShowCreateForm(false)
    setError('')
    setSuccess('')

    loadRolePermissions(role.id)
  }

  // =====================================================
  // PERMISSION CHECKBOX
  // =====================================================

  const handlePermissionChange = (
    permissionId: number
  ) => {
    setSelectedPermissionIds(
      (current) => {
        if (
          current.includes(
            permissionId
          )
        ) {
          return current.filter(
            (id) =>
              id !== permissionId
          )
        }

        return [
          ...current,
          permissionId
        ]
      }
    )
  }

  // =====================================================
  // SAVE ROLE PERMISSIONS
  // =====================================================

  const handleSavePermissions =
    async () => {
      if (!selectedRole) {
        return
      }

      try {
        setSaving(true)
        setError('')
        setSuccess('')

        await api.put(
          `/admin/roles/${selectedRole.id}/permissions`,
          {
            permissionIds:
              selectedPermissionIds
          }
        )

        setSuccess(
          'Role permissions updated successfully.'
        )

        await loadRoles()
      } catch (error: unknown) {
        console.error(
          'Failed to save permissions:',
          error
        )

        console.error(
          'API response:',
          error
        )

        setError(
          'Failed to save role permissions.'
        )
      } finally {
        setSaving(false)
      }
    }

  // =====================================================
  // CREATE ROLE
  // =====================================================

  const handleCreateRole =
    async (
      event: FormEvent
    ) => {
      event.preventDefault()

      if (!roleName.trim()) {
        setError(
          'Role name is required.'
        )

        return
      }

      try {
        setSaving(true)
        setError('')
        setSuccess('')

        const response =
          await api.post(
            '/admin/roles',
            {
              name:
                roleName.trim(),

              description:
                roleDescription.trim() ||
                null
            }
          )

        const newRole =
          response.data.data as Role

        const roleWithCounts: Role = {
          ...newRole,
          permission_count:
            '0',
          user_count:
            '0'
        }

        setRoles(
          (current) => [
            ...current,
            roleWithCounts
          ]
        )

        setRoleName('')
        setRoleDescription('')
        setShowCreateForm(false)

        setSelectedRole(
          roleWithCounts
        )

        setSuccess(
          'Role created successfully.'
        )

        await loadRolePermissions(
          roleWithCounts.id
        )
      } catch (error: unknown) {
        console.error(
          'Failed to create role:',
          error
        )

        console.error(
          'API response:',
          error
        )

        setError(
          'Failed to create role.'
        )
      } finally {
        setSaving(false)
      }
    }

  // =====================================================
  // GROUP PERMISSIONS BY MODULE
  // =====================================================

  const groupedPermissions =
    permissions.reduce<
      Record<
        string,
        Permission[]
      >
    >(
      (
        groups,
        permission
      ) => {
        const module =
          permission.module ||
          'Other'

        if (!groups[module]) {
          groups[module] = []
        }

        groups[module].push(
          permission
        )

        return groups
      },
      {}
    )

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Role & Permission Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create roles and control what each role can access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm(true)
            setSelectedRole(null)
            setError('')
            setSuccess('')
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Create Role
        </button>

      </div>

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* =================================================
          CREATE ROLE
      ================================================= */}

      {showCreateForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Create New Role
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create a role first, then assign permissions.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreateForm(false)
              }
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>

          </div>

          <form
            onSubmit={
              handleCreateRole
            }
            className="space-y-5"
          >

            {/* Role Name */}

            <div>
              <label
                htmlFor="roleName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Role Name
              </label>

              <input
                id="roleName"
                type="text"
                value={roleName}
                onChange={(event) =>
                  setRoleName(
                    event.target.value
                  )
                }
                placeholder="e.g. Meeting Coordinator"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Description */}

            <div>
              <label
                htmlFor="roleDescription"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="roleDescription"
                value={
                  roleDescription
                }
                onChange={(event) =>
                  setRoleDescription(
                    event.target.value
                  )
                }
                placeholder="Describe what this role is responsible for."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Buttons */}

            <div className="flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowCreateForm(false)
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {saving
                  ? 'Creating...'
                  : 'Create Role'}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      {!showCreateForm && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* =================================================
              ROLES
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-5 py-4">

              <h2 className="font-semibold text-gray-900">
                System Roles
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Select a role to manage permissions.
              </p>

            </div>

            <div className="divide-y divide-gray-100">

              {loading ? (

                <div className="p-5 text-sm text-gray-500">
                  Loading roles...
                </div>

              ) : roles.length === 0 ? (

                <div className="p-5 text-sm text-gray-500">
                  No roles found.
                </div>

              ) : (

                roles.map(
                  (role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() =>
                        handleSelectRole(
                          role
                        )
                      }
                      className={`w-full px-5 py-4 text-left transition ${
                        selectedRole?.id ===
                        role.id
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >

                      <div className="flex items-start justify-between">

                        <div>

                          <p className="font-medium text-gray-900">
                            {role.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {role.description ||
                              'No description'}
                          </p>

                        </div>

                        {selectedRole?.id ===
                          role.id && (
                            <span className="text-blue-600">
                              ✓
                            </span>
                          )}

                      </div>

                      <div className="mt-3 flex gap-4 text-xs text-gray-500">

                        <span>
                          {
                            role.permission_count
                          }{' '}
                          permissions
                        </span>

                        <span>
                          {
                            role.user_count
                          }{' '}
                          users
                        </span>

                      </div>

                    </button>
                  )
                )

              )}

            </div>

          </div>

          {/* =================================================
              PERMISSIONS
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">

            {!selectedRole ? (

              <div className="flex min-h-[400px] items-center justify-center p-8 text-center">

                <div>

                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl">
                    🔐
                  </div>

                  <h3 className="font-semibold text-gray-900">
                    Select a Role
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Select a role from the left to manage its permissions.
                  </p>

                </div>

              </div>

            ) : (

              <>

                {/* Permission Header */}

                <div className="border-b border-gray-200 px-6 py-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedRole.name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {selectedRole.description ||
                          'Manage permissions for this role.'}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={
                        handleSavePermissions
                      }
                      disabled={
                        saving ||
                        loadingPermissions
                      }
                      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                      {saving
                        ? 'Saving...'
                        : 'Save Permissions'}
                    </button>

                  </div>

                </div>

                {/* Permission List */}

                <div className="p-6">

                  {loadingPermissions ? (

                    <div className="py-12 text-center text-sm text-gray-500">
                      Loading permissions...
                    </div>

                  ) : permissions.length === 0 ? (

                    <div className="py-12 text-center text-sm text-gray-500">
                      No permissions found.
                    </div>

                  ) : (

                    <div className="space-y-6">

                      {Object.entries(
                        groupedPermissions
                      ).map(
                        ([
                          module,
                          modulePermissions
                        ]) => (

                          <div
                            key={module}
                          >

                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                              {module}
                            </h3>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                              {modulePermissions.map(
                                (
                                  permission
                                ) => (

                                  <label
                                    key={
                                      permission.id
                                    }
                                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                                  >

                                    <input
                                      type="checkbox"
                                      checked={selectedPermissionIds.includes(
                                        permission.id
                                      )}
                                      onChange={() =>
                                        handlePermissionChange(
                                          permission.id
                                        )
                                      }
                                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />

                                    <div>

                                      <p className="text-sm font-medium text-gray-900">
                                        {
                                          permission.name
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-gray-500">
                                        {
                                          permission.description
                                        }
                                      </p>

                                      <p className="mt-1 font-mono text-[11px] text-gray-400">
                                        {
                                          permission.code
                                        }
                                      </p>

                                    </div>

                                  </label>

                                )
                              )}

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </>

            )}

          </div>

        </div>
      )}

    </div>
  )
}

export default RoleManagement