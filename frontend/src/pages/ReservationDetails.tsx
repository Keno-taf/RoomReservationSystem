import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getReservationById,
  cancelReservation,
  type ReservationDetails as ReservationDetailsType
} from '../services/reservationService'

const ReservationDetails = () => {
  const { id } = useParams<{ id: string }>()

  const [reservation, setReservation] =
    useState<ReservationDetailsType | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [cancelling, setCancelling] = useState(false)
const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    const loadReservation = async () => {
      try {
        if (!id) {
          setError('Invalid reservation ID')
          return
        }

        const data = await getReservationById(Number(id))
        setReservation(data)
      } catch (error) {
        console.error('Failed to load reservation:', error)
        setError('Failed to load reservation details')
      } finally {
        setLoading(false)
      }
    }

    loadReservation()
  }, [id])

  const formatDate = (date: string) => {
    const datePart = date.substring(0, 10)
    const [year, month, day] = datePart.split('-')

    const dateObject = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    )

    return dateObject.toLocaleDateString('en-US', {
      month: 'long',
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

const getStatusClass = (status?: string) => {
  switch ((status || '').toLowerCase()) {
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

const handleCancel = async () => {
  if (!reservation) {
    return
  }

  const confirmed = window.confirm(
    'Are you sure you want to cancel this reservation?'
  )

  if (!confirmed) {
    return
  }

  try {
    setCancelling(true)
    setCancelError('')

    await cancelReservation(reservation.id)

    setReservation({
      ...reservation,
      status: 'Cancelled'
    })
  } catch (error) {
    console.error('Failed to cancel reservation:', error)
    setCancelError('Failed to cancel reservation')
  } finally {
    setCancelling(false)
  }
}


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">
          Loading reservation details...
        </div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/reservations"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to My Reservations
          </Link>

          <div className="mt-6 bg-white rounded-xl shadow-sm border border-red-200 p-8">
            <h1 className="text-xl font-semibold text-red-600">
              Reservation Not Found
            </h1>

            <p className="mt-2 text-gray-600">
              {error || 'The requested reservation could not be found.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/reservations"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to My Reservations
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <p className="text-sm text-gray-500">
                Reservation #{reservation.id}
              </p>

              <h1 className="text-2xl font-bold text-gray-900 mt-1">
                Reservation Details
              </h1>
            </div>

          <div className="flex items-center gap-3">
  <span
    className={`inline-flex w-fit px-4 py-2 rounded-full text-sm font-medium ${getStatusClass(
      reservation.status
    )}`}
  >
    {reservation.status || 'Unknown'}
  </span>

 {(reservation.status || '').toLowerCase() === 'pending' && (
    <button
      onClick={handleCancel}
      disabled={cancelling}
      className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
    </button>
  )}
</div>


{cancelError && (
  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
    {cancelError}
  </div>
)}
          </div>
        </div>

        {/* Facility */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Facility Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <p className="text-sm text-gray-500">
                Facility
              </p>

              <p className="mt-1 text-gray-900 font-medium">
                {reservation.facility_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Location
              </p>

              <p className="mt-1 text-gray-900 font-medium">
                {reservation.facility_location}
              </p>
            </div>

          </div>
        </div>

        {/* Reservation information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Reservation Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <p className="text-sm text-gray-500">
                Reservation Date
              </p>

              <p className="mt-1 text-gray-900 font-medium">
                {formatDate(reservation.reservation_date)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Time
              </p>

              <p className="mt-1 text-gray-900 font-medium">
                {formatTime(reservation.start_time)}
                {' - '}
                {formatTime(reservation.end_time)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Participants
              </p>

              <p className="mt-1 text-gray-900 font-medium">
                {reservation.participants}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Approval Route
              </p>

              <p className="mt-1 text-gray-900 font-medium">
                {reservation.approval_route}
              </p>
            </div>

          </div>
        </div>

        {/* Purpose */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Purpose
          </h2>

          <p className="text-gray-700 leading-relaxed">
            {reservation.purpose}
          </p>
        </div>

        {/* Additional requirements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Requirements
          </h2>

          <p className="text-gray-700 leading-relaxed">
            {reservation.additional_requirements || 'None specified'}
          </p>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notes
          </h2>

          <p className="text-gray-700 leading-relaxed">
            {reservation.notes || 'No notes provided'}
          </p>
        </div>

        {/* Created information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Request Information
          </h2>

          <div>
            <p className="text-sm text-gray-500">
              Submitted
            </p>

            <p className="mt-1 text-gray-900 font-medium">
              {formatDate(reservation.created_at)}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ReservationDetails