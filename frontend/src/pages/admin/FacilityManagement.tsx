import {
  useEffect,
  useState,
  type FormEvent
} from 'react'

import api from '../../services/api'

interface Facility {
  id: number
  name: string
  location: string
  capacity: number
  status: string
}

interface FacilityForm {
  name: string
  location: string
  capacity: string
  status: string
}

const emptyForm: FacilityForm = {
  name: '',
  location: '',
  capacity: '',
  status: 'Available'
}

function FacilityManagement() {
  const [facilities, setFacilities] =
    useState<Facility[]>([])

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

  const [editingFacility, setEditingFacility] =
    useState<Facility | null>(null)

  const [form, setForm] =
    useState<FacilityForm>(emptyForm)

  const [saving, setSaving] =
    useState(false)

  const loadFacilities = async () => {
    try {
      setLoading(true)
      setError('')

      const response =
        await api.get('/facilities')

      if (response.data.success) {
        setFacilities(
          response.data.data
        )
      } else {
        setError(
          response.data.message ||
          'Failed to load facilities.'
        )
      }
    } catch (error: unknown) {
      console.error(
        'Failed to load facilities:',
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
          'Failed to load facilities.'
        )
      } else {
        setError(
          'Failed to load facilities.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

useEffect(() => {
  let cancelled = false

  const fetchFacilities = async () => {
    try {
      setLoading(true)
      setError('')

      const response =
        await api.get('/facilities')

      if (cancelled) {
        return
      }

      if (response.data.success) {
        setFacilities(
          response.data.data
        )
      } else {
        setError(
          response.data.message ||
          'Failed to load facilities.'
        )
      }
    } catch (error: unknown) {
      if (cancelled) {
        return
      }

      console.error(
        'Failed to load facilities:',
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
          'Failed to load facilities.'
        )
      } else {
        setError(
          'Failed to load facilities.'
        )
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  void fetchFacilities()

  return () => {
    cancelled = true
  }
}, [])

  const openCreateForm = () => {
    setEditingFacility(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  const openEditForm = (
    facility: Facility
  ) => {
    setEditingFacility(facility)

    setForm({
      name: facility.name,
      location: facility.location,
      capacity: String(
        facility.capacity
      ),
      status: facility.status
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
    setEditingFacility(null)
    setForm(emptyForm)
  }

  const handleFormChange = (
    field: keyof FacilityForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!form.name.trim()) {
      setError(
        'Facility name is required.'
      )
      return
    }

    if (!form.location.trim()) {
      setError(
        'Facility location is required.'
      )
      return
    }

    const capacity =
      Number(form.capacity)

    if (
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      setError(
        'Capacity must be a positive whole number.'
      )
      return
    }

    try {
      setSaving(true)

      if (editingFacility) {
        const response =
          await api.put(
            `/facilities/${editingFacility.id}`,
            {
              name: form.name.trim(),
              location:
                form.location.trim(),
              capacity,
              status: form.status
            }
          )

        if (!response.data.success) {
          setError(
            response.data.message ||
            'Failed to update facility.'
          )
          return
        }

        setSuccess(
          'Facility updated successfully.'
        )
      } else {
        const response =
          await api.post(
            '/facilities',
            {
              name: form.name.trim(),
              location:
                form.location.trim(),
              capacity,
              status: form.status
            }
          )

        if (!response.data.success) {
          setError(
            response.data.message ||
            'Failed to create facility.'
          )
          return
        }

        setSuccess(
          'Facility created successfully.'
        )
      }

      await loadFacilities()

      setShowForm(false)
      setEditingFacility(null)
      setForm(emptyForm)
    } catch (error: unknown) {
      console.error(
        'Failed to save facility:',
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
          'Failed to save facility.'
        )
      } else {
        setError(
          'Failed to save facility.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (
    facility: Facility
  ) => {
    const newStatus =
      facility.status === 'Available'
        ? 'Inactive'
        : 'Available'

    const confirmed =
      window.confirm(
        `Are you sure you want to change "${facility.name}" status to ${newStatus}?`
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response =
        await api.patch(
          `/facilities/${facility.id}/status`,
          {
            status: newStatus
          }
        )

      if (!response.data.success) {
        setError(
          response.data.message ||
          'Failed to update facility status.'
        )
        return
      }

      setSuccess(
        `Facility ${newStatus.toLowerCase()} successfully.`
      )

      await loadFacilities()
    } catch (error: unknown) {
      console.error(
        'Failed to update facility status:',
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
          'Failed to update facility status.'
        )
      } else {
        setError(
          'Failed to update facility status.'
        )
      }
    }
  }

  const handleDelete = async (
    facility: Facility
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${facility.name}"?`
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response =
        await api.delete(
          `/facilities/${facility.id}`
        )

      if (!response.data.success) {
        setError(
          response.data.message ||
          'Failed to delete facility.'
        )
        return
      }

      setSuccess(
        'Facility deleted successfully.'
      )

      await loadFacilities()
    } catch (error: unknown) {
      console.error(
        'Failed to delete facility:',
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
          'Failed to delete facility.'
        )
      } else {
        setError(
          'Failed to delete facility.'
        )
      }
    }
  }

  const filteredFacilities =
    facilities.filter(
      (facility) => {
        const searchText =
          search.toLowerCase().trim()

        const matchesSearch =
          !searchText ||
          facility.name
            .toLowerCase()
            .includes(searchText) ||
          facility.location
            .toLowerCase()
            .includes(searchText)

        const matchesStatus =
          statusFilter === 'All' ||
          facility.status === statusFilter

        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Facility Management
          </h1>

          <p className="mt-2 text-gray-600">
            Manage rooms, halls, capacity,
            locations, and availability.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add Facility
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Search / Filter */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="facilitySearch"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <input
              id="facilitySearch"
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search facility name or location..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="statusFilter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Available">
                Available
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Facility Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            System Facilities
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {filteredFacilities.length}{' '}
            facility/facilities found
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Loading facilities...
          </div>
        ) : filteredFacilities.length ===
          0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">
              No facilities found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Facility
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Location
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Capacity
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredFacilities.map(
                  (facility) => (
                    <tr
                      key={facility.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {facility.name}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {facility.location}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {facility.capacity}{' '}
                        people
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            facility.status ===
                            'Available'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {facility.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                facility
                              )
                            }
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                facility
                              )
                            }
                            className="text-sm font-medium text-gray-600 hover:text-gray-900"
                          >
                            {facility.status ===
                            'Available'
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                facility
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
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingFacility
                      ? 'Edit Facility'
                      : 'Add New Facility'}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {editingFacility
                      ? 'Update facility information.'
                      : 'Create a new room or hall.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="text-2xl text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
            >
              <div className="grid gap-5 p-6 md:grid-cols-2">
                {/* Name */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="facilityName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Facility Name
                  </label>

                  <input
                    id="facilityName"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      handleFormChange(
                        'name',
                        event.target.value
                      )
                    }
                    placeholder="e.g. Main Conference Hall"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="facilityLocation"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Location
                  </label>

                  <input
                    id="facilityLocation"
                    type="text"
                    value={form.location}
                    onChange={(event) =>
                      handleFormChange(
                        'location',
                        event.target.value
                      )
                    }
                    placeholder="e.g. Main Building"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label
                    htmlFor="facilityCapacity"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Capacity
                  </label>

                  <input
                    id="facilityCapacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) =>
                      handleFormChange(
                        'capacity',
                        event.target.value
                      )
                    }
                    placeholder="e.g. 100"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="facilityStatus"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>

                  <select
                    id="facilityStatus"
                    value={form.status}
                    onChange={(event) =>
                      handleFormChange(
                        'status',
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Available">
                      Available
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingFacility
                      ? 'Save Changes'
                      : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacilityManagement