import {
  useEffect,
  useMemo,
  useState
} from 'react'
import api from '../../services/api'

interface Role {
  id: number
  name: string
}

interface ApprovalStep {
  id?: number
  stepOrder: number
  roleId: number
  roleName?: string
}

interface ApprovalRoute {
  id: number
  name: string
  description: string | null
  created_at: string
  steps: ApprovalStep[]
}

interface RouteForm {
  name: string
  description: string
  steps: number[]
}

const emptyForm: RouteForm = {
  name: '',
  description: '',
  steps: []
}

function ApprovalRouteManagement() {
  const [routes, setRoutes] =
    useState<ApprovalRoute[]>([])

  const [roles, setRoles] =
    useState<Role[]>([])

  const [search, setSearch] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [showForm, setShowForm] =
    useState(false)

  const [editingRoute, setEditingRoute] =
    useState<ApprovalRoute | null>(null)

  const [form, setForm] =
    useState<RouteForm>(emptyForm)

  const [saving, setSaving] =
    useState(false)

  const loadRoutes = async () => {
    try {
      setLoading(true)
      setError('')

      const response =
        await api.get(
          '/admin/approval-routes'
        )

      if (response.data.success) {
        setRoutes(
          response.data.data
        )
      } else {
        setError(
          response.data.message ||
            'Failed to load approval routes.'
        )
      }
    } catch (error: unknown) {
      console.error(
        'Failed to load approval routes:',
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
            'Failed to load approval routes.'
        )
      } else {
        setError(
          'Failed to load approval routes.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          routesResponse,
          rolesResponse
        ] = await Promise.all([
          api.get(
            '/admin/approval-routes'
          ),
          api.get('/admin/roles')
        ])

        if (cancelled) {
          return
        }

        if (
          routesResponse.data.success
        ) {
          setRoutes(
            routesResponse.data.data
          )
        } else {
          setError(
            routesResponse.data.message ||
              'Failed to load approval routes.'
          )
        }

        if (
          rolesResponse.data.success
        ) {
          setRoles(
            rolesResponse.data.data
          )
        } else {
          setError(
            rolesResponse.data.message ||
              'Failed to load roles.'
          )
        }
      } catch (error: unknown) {
        if (cancelled) {
          return
        }

        console.error(
          'Failed to load approval route data:',
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
              'Failed to load approval route data.'
          )
        } else {
          setError(
            'Failed to load approval route data.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredRoutes = useMemo(() => {
    const searchValue =
      search.toLowerCase().trim()

    if (!searchValue) {
      return routes
    }

    return routes.filter(
      (route) =>
        route.name
          .toLowerCase()
          .includes(searchValue) ||
        (
          route.description || ''
        )
          .toLowerCase()
          .includes(searchValue) ||
        route.steps.some(
          (step) =>
            (
              step.roleName || ''
            )
              .toLowerCase()
              .includes(searchValue)
        )
    )
  }, [routes, search])

  const openCreateForm = () => {
    setEditingRoute(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  const openEditForm = (
    route: ApprovalRoute
  ) => {
    setEditingRoute(route)

    setForm({
      name: route.name,
      description:
        route.description || '',
      steps: route.steps
        .sort(
          (a, b) =>
            a.stepOrder -
            b.stepOrder
        )
        .map(
          (step) => step.roleId
        )
    })

    setError('')
    setSuccess('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) {
      return
    }

    setShowForm(false)
    setEditingRoute(null)
    setForm(emptyForm)
  }

  const addStep = () => {
    setForm((current) => ({
      ...current,
      steps: [
        ...current.steps,
        0
      ]
    }))
  }

  const removeStep = (
    index: number
  ) => {
    setForm((current) => ({
      ...current,
      steps: current.steps.filter(
        (_, stepIndex) =>
          stepIndex !== index
      )
    }))
  }

  const updateStep = (
    index: number,
    roleId: number
  ) => {
    setForm((current) => ({
      ...current,
      steps: current.steps.map(
        (currentRoleId, stepIndex) =>
          stepIndex === index
            ? roleId
            : currentRoleId
      )
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError(
        'Approval route name is required.'
      )
      return
    }

    if (form.steps.length === 0) {
      setError(
        'At least one approval step is required.'
      )
      return
    }

    if (
      form.steps.some(
        (roleId) =>
          !Number.isInteger(roleId) ||
          roleId <= 0
      )
    ) {
      setError(
        'Please select a valid role for every approval step.'
      )
      return
    }

    const uniqueRoles =
      new Set(form.steps)

    if (
      uniqueRoles.size !==
      form.steps.length
    ) {
      setError(
        'The same role cannot be used more than once in one approval route.'
      )
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const steps = form.steps.map(
        (roleId) => ({
          roleId
        })
      )

      if (editingRoute) {
        const response =
          await api.put(
            `/admin/approval-routes/${editingRoute.id}`,
            {
              name: form.name.trim(),
              description:
                form.description.trim() ||
                null,
              steps
            }
          )

        if (response.data.success) {
          setSuccess(
            'Approval route updated successfully.'
          )

          closeForm()
          await loadRoutes()
        } else {
          setError(
            response.data.message ||
              'Failed to update approval route.'
          )
        }
      } else {
        const response =
          await api.post(
            '/admin/approval-routes',
            {
              name: form.name.trim(),
              description:
                form.description.trim() ||
                null,
              steps
            }
          )

        if (response.data.success) {
          setSuccess(
            'Approval route created successfully.'
          )

          closeForm()
          await loadRoutes()
        } else {
          setError(
            response.data.message ||
              'Failed to create approval route.'
          )
        }
      }
    } catch (error: unknown) {
      console.error(
        'Failed to save approval route:',
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
            'Failed to save approval route.'
        )
      } else {
        setError(
          'Failed to save approval route.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteRoute = async (
    route: ApprovalRoute
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${route.name}"?`
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response =
        await api.delete(
          `/admin/approval-routes/${route.id}`
        )

      if (response.data.success) {
        setSuccess(
          'Approval route deleted successfully.'
        )

        await loadRoutes()
      } else {
        setError(
          response.data.message ||
            'Failed to delete approval route.'
        )
      }
    } catch (error: unknown) {
      console.error(
        'Failed to delete approval route:',
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
            'Failed to delete approval route.'
        )
      } else {
        setError(
          'Failed to delete approval route.'
        )
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Approval Route Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Configure the approval sequence used by reservation requests.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add Approval Route
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Search approval routes
        </label>

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search by route name, description, or role..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Routes */}
      <div className="grid gap-5 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 lg:col-span-2">
            Loading approval routes...
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 lg:col-span-2">
            No approval routes found.
          </div>
        ) : (
          filteredRoutes.map(
            (route) => (
              <div
                key={route.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {route.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {route.description ||
                        'No description provided.'}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    Route {route.id}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Approval Sequence
                  </p>

                  <div className="space-y-3">
                    {route.steps.map(
                      (
                        step,
                        index
                      ) => (
                        <div
                          key={
                            step.id ??
                            `${route.id}-${step.stepOrder}`
                          }
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                            {step.stepOrder}
                          </div>

                          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                            <p className="text-sm font-medium text-gray-800">
                              {step.roleName ||
                                `Role ${step.roleId}`}
                            </p>

                            <p className="text-xs text-gray-400">
                              Approval step{' '}
                              {index + 1}
                            </p>
                          </div>

                          {index <
                            route.steps
                              .length -
                              1 && (
                            <div className="hidden text-gray-300 sm:block">
                              →
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-4 border-t pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(
                        route
                      )
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteRoute(route)
                    }
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingRoute
                  ? 'Edit Approval Route'
                  : 'Create Approval Route'}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Define the order in which roles approve reservation requests.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Route Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        name: event.target
                          .value
                      })
                    )
                  }
                  placeholder="e.g. Department Head then Facility Manager"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target
                            .value
                      })
                    )
                  }
                  rows={3}
                  placeholder="Describe when this approval route should be used..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Approval steps */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Approval Steps
                    </label>

                    <p className="mt-1 text-xs text-gray-500">
                      Steps are processed from top to bottom.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addStep}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    + Add Step
                  </button>
                </div>

                {form.steps.length ===
                0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">
                      No approval steps added.
                    </p>

                    <button
                      type="button"
                      onClick={addStep}
                      className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Add the first step
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.steps.map(
                      (
                        roleId,
                        index
                      ) => (
                        <div
                          key={`${index}-${roleId}`}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                            {index + 1}
                          </div>

                          <select
                            value={
                              roleId || ''
                            }
                            onChange={(
                              event
                            ) =>
                              updateStep(
                                index,
                                Number(
                                  event
                                    .target
                                    .value
                                )
                              )
                            }
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">
                              Select approver role
                            </option>

                            {roles.map(
                              (role) => (
                                <option
                                  key={
                                    role.id
                                  }
                                  value={
                                    role.id
                                  }
                                >
                                  {
                                    role.name
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              removeStep(
                                index
                              )
                            }
                            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingRoute
                      ? 'Update Route'
                      : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalRouteManagement