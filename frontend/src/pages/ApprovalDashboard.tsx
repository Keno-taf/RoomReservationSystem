import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import {
  getMyPendingApprovals,
  approveReservation,
  rejectReservation,
  type PendingApproval
} from '../services/approvalService'
function ApprovalDashboard() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
   const [selectedApproval, setSelectedApproval] =
    useState<PendingApproval | null>(null)
  const [comments, setComments] = useState('')
  const [processing, setProcessing] = useState(false)
  const loadApprovals = async () => {
    try {
      setLoading(true)
      setError('')
      const data =
  await getMyPendingApprovals()
      setApprovals(data)
    } catch (error) {
      console.error('Failed to load approvals:', error)
      setError('Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const data =
  await getMyPendingApprovals()

      setApprovals(data)
    } catch (error) {
      console.error('Failed to load approvals:', error)
      setError('Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  loadData()
}, [])

if (!user) {
    return null
  }

  const handleApprove = async (
    approval: PendingApproval
  ) => {
    try {
      setProcessing(true)
      setError('')

     await approveReservation(
  approval.approval_id,
  comments
)

      setSelectedApproval(null)
      setComments('')

      await loadApprovals()
    } catch (error) {
      console.error('Failed to approve reservation:', error)
      setError('Failed to approve reservation')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (
    approval: PendingApproval
  ) => {
    if (!comments.trim()) {
      setError('Please enter a rejection reason')
      return
    }

    try {
      setProcessing(true)
      setError('')

     await rejectReservation(
  approval.approval_id,
  comments
)

      setSelectedApproval(null)
      setComments('')

      await loadApprovals()
    } catch (error) {
      console.error('Failed to reject reservation:', error)
      setError('Failed to reject reservation')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Approval Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Review and process pending reservation requests.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <p className="text-gray-500">
              Loading pending approvals...
            </p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <div className="text-5xl mb-4">
              ✓
            </div>

            <h2 className="text-xl font-semibold text-gray-800">
              No Pending Approvals
            </h2>

            <p className="mt-2 text-gray-500">
              You currently have no reservation requests waiting for your approval.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">

                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Requester
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Facility
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Date
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Time
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Purpose
                    </th>

                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">

                  {approvals.map((approval) => (
                    <tr
                      key={approval.approval_id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">
                          {approval.requester_name}
                        </div>

                        <div className="text-sm text-gray-500">
                          {approval.participants} participants
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">
                          {approval.facility_name}
                        </div>

                        <div className="text-sm text-gray-500">
                          {approval.facility_location}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(approval.reservation_date)}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {formatTime(approval.start_time)}
                        {' - '}
                        {formatTime(approval.end_time)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-gray-700">
                          {approval.purpose}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedApproval(approval)
                            setComments('')
                            setError('')
                          }}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                        >
                          Review
                        </button>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {selectedApproval && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">

              {/* Modal Header */}
              <div className="px-6 py-5 border-b flex items-center justify-between">

                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Review Reservation
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Reservation #{selectedApproval.reservation_id}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedApproval(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>

              </div>

              {/* Details */}
              <div className="p-6 space-y-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <p className="text-sm text-gray-500">
                      Requester
                    </p>

                    <p className="font-medium text-gray-800">
                      {selectedApproval.requester_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Facility
                    </p>

                    <p className="font-medium text-gray-800">
                      {selectedApproval.facility_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Location
                    </p>

                    <p className="font-medium text-gray-800">
                      {selectedApproval.facility_location}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Participants
                    </p>

                    <p className="font-medium text-gray-800">
                      {selectedApproval.participants}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Date
                    </p>

                    <p className="font-medium text-gray-800">
                      {formatDate(selectedApproval.reservation_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Time
                    </p>

                    <p className="font-medium text-gray-800">
                      {formatTime(selectedApproval.start_time)}
                      {' - '}
                      {formatTime(selectedApproval.end_time)}
                    </p>
                  </div>

                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Purpose
                  </p>

                  <p className="mt-1 text-gray-800">
                    {selectedApproval.purpose}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Approval Route
                  </p>

                  <p className="mt-1 text-gray-800">
                    {selectedApproval.approval_route}
                  </p>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments
                  </label>

                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    placeholder="Enter comments or rejection reason..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="px-6 py-5 border-t flex justify-end gap-3">

                <button
                  onClick={() => setSelectedApproval(null)}
                  disabled={processing}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleReject(selectedApproval)}
                  disabled={processing}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Reject'}
                </button>

                <button
                  onClick={() => handleApprove(selectedApproval)}
                  disabled={processing}
                  className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Approve'}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default ApprovalDashboard