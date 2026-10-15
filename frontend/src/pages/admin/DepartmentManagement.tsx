import {
  useEffect,
  useMemo,
  useState
} from 'react'
import api from '../../services/api'

interface Department {
  id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  user_count: number
}

interface DepartmentForm {
  name: string
  description: string
}

const emptyForm: DepartmentForm = {
  name: '',
  description: ''
}

function DepartmentManagement() {
  const [departments, setDepartments] =
    useState<Department[]>([])

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('All')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [showForm, setShowForm] =
    useState(false)

  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null)

  const [form, setForm] =
    useState<DepartmentForm>(emptyForm)

  const [saving, setSaving] =
    useState(false)

  const loadDepartments = async () => {
    try {
      setLoading(true)
      setError('')

      const response =
        await api.get('/departments')

      if (response.data.success) {
        setDepartments(
          response.data.data
        )
      } else {
        setError(
          response.data.message ||
            'Failed to load departments.'
        )
      }
    } catch (error: unknown) {
      console.error(
        'Failed to load departments:',
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
            'Failed to load departments.'
        )
      } else {
        setError(
          'Failed to load departments.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchDepartments = async () => {
      try {
        setLoading(true)
        setError('')

        const response =
          await api.get('/departments')

        if (cancelled) {
          return
        }

        if (response.data.success) {
          setDepartments(
            response.data.data
          )
        } else {
          setError(
            response.data.message ||
              'Failed to load departments.'
          )
        }
      } catch (error: unknown) {
        if (cancelled) {
          return
        }

        console.error(
          'Failed to load departments:',
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
              'Failed to load departments.'
          )
        } else {
          setError(
            'Failed to load departments.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchDepartments()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredDepartments =
    useMemo(() => {
      return departments.filter(
        (department) => {
          const matchesSearch =
            department.name
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            (
              department.description || ''
            )
              .toLowerCase()
              .includes(
                search.toLowerCase()
              )

          const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Active' &&
              department.is_active) ||
            (statusFilter === 'Inactive' &&
              !department.is_active)

          return (
            matchesSearch &&
            matchesStatus
          )
        }
      )
    }, [
      departments,
      search,
      statusFilter
    ])

  const openCreateForm = () => {
    setEditingDepartment(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  const openEditForm = (
    department: Department
  ) => {
    setEditingDepartment(department)

    setForm({
      name: department.name,
      description:
        department.description || ''
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
    setEditingDepartment(null)
    setForm(emptyForm)
  }

  const handleChange = (
    field: keyof DepartmentForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError(
        'Department name is required.'
      )
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (editingDepartment) {
        const response =
          await api.put(
            `/departments/${editingDepartment.id}`,
            {
              name: form.name.trim(),
              description:
                form.description.trim() ||
                null
            }
          )

        if (response.data.success) {
          setSuccess(
            'Department updated successfully.'
          )
          closeForm()
          await loadDepartments()
        } else {
          setError(
            response.data.message ||
              'Failed to update department.'
          )
        }
      } else {
        const response =
          await api.post(
            '/departments',
            {
              name: form.name.trim(),
              description:
                form.description.trim() ||
                null
            }
          )

        if (response.data.success) {
          setSuccess(
            'Department created successfully.'
          )
          closeForm()
          await loadDepartments()
        } else {
          setError(
            response.data.message ||
              'Failed to create department.'
          )
        }
      }
    } catch (error: unknown) {
      console.error(
        'Failed to save department:',
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
            'Failed to save department.'
        )
      } else {
        setError(
          'Failed to save department.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (
    department: Department
  ) => {
    try {
      setError('')
      setSuccess('')

      const response =
        await api.patch(
          `/departments/${department.id}/status`,
          {
            isActive:
              !department.is_active
          }
        )

      if (response.data.success) {
        setSuccess(
          `Department ${
            department.is_active
              ? 'deactivated'
              : 'activated'
          } successfully.`
        )

        await loadDepartments()
      } else {
        setError(
          response.data.message ||
            'Failed to update department status.'
        )
      }
    } catch (error: unknown) {
      console.error(
        'Failed to update department status:',
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
            'Failed to update department status.'
        )
      } else {
        setError(
          'Failed to update department status.'
        )
      }
    }
  }

  const deleteDepartment = async (
    department: Department
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${department.name}"?`
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response =
        await api.delete(
          `/departments/${department.id}`
        )

      if (response.data.success) {
        setSuccess(
          'Department deleted successfully.'
        )

        await loadDepartments()
      } else {
        setError(
          response.data.message ||
            'Failed to delete department.'
        )
      }
    } catch (error: unknown) {
      console.error(
        'Failed to delete department:',
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
            'Failed to delete department.'
        )
      } else {
        setError(
          'Failed to delete department.'
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
            Department Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage organizational departments and their status.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add Department
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

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search departments..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                All
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

      {/* Department table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Department
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Users
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Loading departments...
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No departments found.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map(
                  (department) => (
                    <tr
                      key={department.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {department.name}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          ID: {department.id}
                        </div>
                      </td>

                      <td className="max-w-md px-6 py-4 text-sm text-gray-600">
                        {department.description ||
                          '—'}
                      </td>

                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                        {department.user_count}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            department.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {department.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                department
                              )
                            }
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                department
                              )
                            }
                            className={`text-sm font-medium ${
                              department.is_active
                                ? 'text-orange-600 hover:text-orange-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {department.is_active
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteDepartment(
                                department
                              )
                            }
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {!loading &&
          filteredDepartments.length > 0 && (
            <div className="border-t bg-gray-50 px-6 py-3 text-sm text-gray-500">
              Showing{' '}
              {filteredDepartments.length}{' '}
              of {departments.length}{' '}
              departments
            </div>
          )}
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDepartment
                  ? 'Edit Department'
                  : 'Create Department'}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {editingDepartment
                  ? 'Update department information.'
                  : 'Add a new organizational department.'}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Department Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleChange(
                      'name',
                      event.target.value
                    )
                  }
                  placeholder="e.g. Human Resources"
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
                    handleChange(
                      'description',
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Enter department description..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

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
                    : editingDepartment
                      ? 'Update Department'
                      : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentManagement