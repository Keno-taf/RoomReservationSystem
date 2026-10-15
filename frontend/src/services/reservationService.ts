
import api from './api'

export interface CreateReservationData {
  facilityId: number
  approvalRouteId: number
  reservationDate: string
  startTime: string
  endTime: string
  purpose: string
  participants: number
  additionalRequirements?: string
  notes?: string

  // Phone numbers for reservation approval notifications
  phoneNumber: string
  additionalPhoneNumber?: string | null
}

export const createReservation = async (
  reservation: CreateReservationData
) => {
  const response = await api.post('/reservations', reservation)

  return response.data
}

export interface Reservation {
  id: number
  reservation_date: string
  start_time: string
  end_time: string
  purpose: string
  participants: number
  additional_requirements: string | null
  notes: string | null
  status: string
  facility_name: string
  facility_location: string
  approval_route: string
}

export const getMyReservations = async (): Promise<Reservation[]> => {
  const response = await api.get('/reservations/my')

  return response.data.data
}

export interface ReservationDetails {
  id: number
  requester_id: number
  reservation_date: string
  start_time: string
  end_time: string
  purpose: string
  participants: number
  additional_requirements: string | null
  notes: string | null
  status: string
  created_at: string
  facility_id: number
  facility_name: string
  facility_location: string
  approval_route_id: number
  approval_route: string
}

export const getReservationById = async (
  id: number
): Promise<ReservationDetails> => {
  const response = await api.get(`/reservations/${id}`)

  return response.data.data
}

export const cancelReservation = async (id: number) => {
  const response = await api.patch(`/reservations/${id}/cancel`)

  return response.data.data
}
