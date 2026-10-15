import api from './api'


export interface PendingApproval {
  approval_id: number
  reservation_id: number
  step_order: number
  approval_status: string
  comments: string | null
  acted_at: string | null

  requester_id: number
  requester_name: string

  reservation_date: string
  start_time: string
  end_time: string
  purpose: string
  participants: number
  reservation_status: string

  facility_id: number
  facility_name: string
  facility_location: string

  approval_route: string
}

export const getMyPendingApprovals = async (): Promise<
  PendingApproval[]
> => {
  const response = await api.get('/approvals/my')

  return response.data.data
}

export const approveReservation = async (
  approvalId: number,
  comments?: string
) => {
  const response = await api.patch(
    `/approvals/${approvalId}/approve`,
    {
      comments
    }
  )

  return response.data
}

export const rejectReservation = async (
  approvalId: number,
  comments: string
) => {
  const response = await api.patch(
    `/approvals/${approvalId}/reject`,
    {
      comments
    }
  )

  return response.data
}