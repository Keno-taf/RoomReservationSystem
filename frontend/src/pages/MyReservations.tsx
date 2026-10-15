import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyReservations,
  type Reservation
} from '../services/reservationService'

function MyReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
const [statusFilter, setStatusFilter] = useState('')
const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const data = await getMyReservations()
        setReservations(data)
      } catch (error) {
        console.error('Failed to load reservations:', error)
        setError('Failed to load reservations')
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [])

   const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
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
    const datePart = date.substring(0, 10)

    const [year, month, day] = datePart.split('-')

    const dateObject = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    )

    return dateObject.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')

    const hour = Number(hours)

    if (isNaN(hour)) {
      return time
    }

    const period = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12

    return `${formattedHour}:${minutes} ${period}`
  }


  const filteredReservations = reservations.filter((reservation) => {
  const matchesSearch =
    reservation.facility_name
      .toLowerCase()
      .includes(search.toLowerCase())

  const matchesStatus =
    statusFilter === '' ||
    reservation.status.toLowerCase() === statusFilter.toLowerCase()

  const matchesDate =
    dateFilter === '' ||
    reservation.reservation_date.substring(0, 10) === dateFilter

  return matchesSearch && matchesStatus && matchesDate
})


  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
          Reservations
          </h2>

          <p className="text-gray-500 mt-1">
            View and track your facility reservation requests.
          </p>
        </div>


        {/* Filter Area */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>

              <input
  type="text"
  placeholder="Search facility..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>

              <select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="">All Statuses</option>
  <option value="pending">Pending</option>
  <option value="approved">Approved</option>
  <option value="rejected">Rejected</option>
  <option value="cancelled">Cancelled</option>
</select>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>

              <input
  type="date"
  value={dateFilter}
  onChange={(e) => setDateFilter(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
            </div>

          </div>

        </div>


        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-500">
              Loading reservations...
            </p>
          </div>
        )}


        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-red-700">
              {error}
            </p>
          </div>
        )}


        {/* Reservations Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

            {reservations.length === 0 ? (

              <div className="p-10 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  No reservations found
                </h3>

                <p className="text-gray-500 mt-2">
                  You have not submitted any reservation requests yet.
                </p>

                <Link
                  to="/reservations/new"
                  className="inline-block mt-5 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700"
                >
                  Create Reservation
                </Link>
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead className="bg-gray-50 border-b border-gray-200">

                    <tr>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Facility
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Date
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Time
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Approval Route
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Status
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Action
                      </th>

                    </tr>

                  </thead>
           <tbody>
  {filteredReservations.map((reservation) => (
    <tr
      key={reservation.id}
      className="border-b border-gray-200 hover:bg-gray-50"
    >
      <td className="px-6 py-5">
        <div className="font-medium text-gray-900">
          {reservation.facility_name}
        </div>

        <div className="text-sm text-gray-500 mt-1">
          {reservation.facility_location}
        </div>
      </td>

      <td className="px-6 py-5 text-gray-600">
        {formatDate(reservation.reservation_date)}
      </td>

      <td className="px-6 py-5 text-gray-600">
        {formatTime(reservation.start_time)}
        {' - '}
        {formatTime(reservation.end_time)}
      </td>

      <td className="px-6 py-5 text-gray-600">
        {reservation.approval_route}
      </td>

      <td className="px-6 py-5">
        <span
          className={`px-3 py-1 rounded-full text-sm ${getStatusClass(
            reservation.status
          )}`}
        >
          {reservation.status}
        </span>
      </td>

      <td className="px-6 py-5">
        <Link
          to={`/reservations/${reservation.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View
        </Link>
      </td>
    </tr>
  ))}
</tbody>

                </table>

              </div>

            )}

          </div>
        )}

      </main>

    </div>
  )
}

export default MyReservations