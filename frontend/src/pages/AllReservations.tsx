import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

interface Reservation {
  id: number
  requester_id: number
  requester_name: string
  requester_email: string
  reservation_date: string
  start_time: string
  end_time: string
  purpose: string
  participants: number
  additional_requirements?: string
  notes?: string
  status: string
  created_at: string
  facility_id: number
  facility_name: string
  facility_location: string
  approval_route_id: number
  approval_route: string
}

function AllReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

const isDepartmentHead =
  user?.roleIds.includes(2) ?? false

const isFacilityManager =
  user?.roleIds.includes(3) ?? false

const isAdministrator =
  user?.roleIds.includes(4) ?? false

  useEffect(() => {
    let cancelled = false

    const loadReservations = async () => {
      try {
        const response = await api.get(
          '/reservations/all'
        )

        if (!cancelled) {
          setReservations(
            response.data.data || []
          )
          setLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to load reservations:',
            error
          )

          setError(
            'Failed to load reservations.'
          )

          setLoading(false)
        }
      }
    }

    loadReservations()

    return () => {
      cancelled = true
    }
  }, [])

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700'

      case 'pending':
        return 'bg-yellow-100 text-yellow-700'

      case 'rejected':
        return 'bg-red-100 text-red-700'

      case 'cancelled':
        return 'bg-gray-100 text-gray-700'

      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const formatDate = (date: string) => {
    if (!date) return '-'

    return new Date(
      `${date.substring(0, 10)}T00:00:00`
    ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    if (!time) return '-'

    return time.substring(0, 5)
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            All Reservations
          </h1>

          <p className="mt-1 text-gray-600">
            View reservations submitted by users.
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">
            Loading reservations...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>

      {/* Header */}
      <div className="mb-6">
       <h1 className="text-2xl font-bold text-gray-900">
  {isDepartmentHead &&
  !isFacilityManager &&
  !isAdministrator
    ? 'Department Reservations'
    : 'All Reservations'}
</h1>

<p className="mt-1 text-gray-600">
  {isDepartmentHead &&
  !isFacilityManager &&
  !isAdministrator
    ? 'View reservation history for employees in your department.'
      : 'View all reservation history across the organization.'}
</p>

        <p className="mt-1 text-gray-600">
          View and monitor reservations across the organization.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 grid gap-6 md:grid-cols-3">

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Total Reservations
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {reservations.length}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {
              reservations.filter(
                (reservation) =>
                  reservation.status?.toLowerCase() ===
                  'pending'
              ).length
            }
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Approved
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {
              reservations.filter(
                (reservation) =>
                  reservation.status?.toLowerCase() ===
                  'approved'
              ).length
            }
          </p>
        </div>

      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">

        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Reservation Requests
          </h2>
        </div>

        {reservations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              No reservations found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Time
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Purpose
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">

                {reservations.map(
                  (reservation) => (
                    <tr
                      key={reservation.id}
                      className="transition hover:bg-gray-50"
                    >

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.requester_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {reservation.requester_email}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">

                        <div className="text-sm font-medium text-gray-900">
                          {reservation.facility_name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {reservation.facility_location}
                        </div>

                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatDate(
                          reservation.reservation_date
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatTime(
                          reservation.start_time
                        )}
                        {' - '}
                        {formatTime(
                          reservation.end_time
                        )}
                      </td>

                      <td className="max-w-xs px-6 py-4">

                        <p className="truncate text-sm text-gray-700">
                          {reservation.purpose}
                        </p>

                        <p className="text-xs text-gray-500">
                          {reservation.participants} participant(s)
                        </p>

                      </td>

                      <td className="whitespace-nowrap px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            reservation.status
                          )}`}
                        >
                          {reservation.status}
                        </span>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  )
}

export default AllReservations