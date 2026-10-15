import { useEffect, useState } from 'react'
import api from '../../services/api'

interface AuditLog {
  id: number
  user_id: number | null
  user_name: string | null
  action: string
  module: string
  entity_type: string | null
  entity_id: number | null
  description: string | null
  old_values: unknown
  new_values: unknown
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')

  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null)

 useEffect(() => {
  let cancelled = false

  const fetchLogs = async () => {
    try {
      const response = await api.get(
        '/admin/audit-logs',
        {
          params: {
            search: search || undefined,
            module: module || undefined,
            action: action || undefined
          }
        }
      )

      if (!cancelled) {
        setLogs(response.data.data || [])
        setLoading(false)
      }
    } catch (error) {
      if (!cancelled) {
        console.error(
          'Failed to load audit logs:',
          error
        )

        setLoading(false)
      }
    }
  }

  fetchLogs()

  return () => {
    cancelled = true
  }
}, [search, module, action])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const getActionClass = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'bg-green-100 text-green-700'

      case 'UPDATE':
        return 'bg-blue-100 text-blue-700'

      case 'DELETE':
        return 'bg-red-100 text-red-700'

      case 'ENABLE':
        return 'bg-green-100 text-green-700'

      case 'DISABLE':
        return 'bg-yellow-100 text-yellow-700'

      case 'LOGIN':
        return 'bg-purple-100 text-purple-700'

      case 'LOGOUT':
        return 'bg-gray-100 text-gray-700'

      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Audit / System Logs
        </h1>

        <p className="text-gray-500 mt-1">
          Monitor important activities performed
          throughout the system.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search activity..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Module */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module
            </label>

            <select
              value={module}
              onChange={(e) =>
                setModule(e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">
                All Modules
              </option>

              <option value="FACILITY">
                Facility
              </option>

              <option value="USER">
                User
              </option>

              <option value="ROLE">
                Role
              </option>

              <option value="DEPARTMENT">
                Department
              </option>

              <option value="APPROVAL_ROUTE">
                Approval Route
              </option>

              <option value="RESERVATION">
                Reservation
              </option>

              <option value="AUTH">
                Authentication
              </option>
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>

            <select
              value={action}
              onChange={(e) =>
                setAction(e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">
                All Actions
              </option>

              <option value="CREATE">
                Create
              </option>

              <option value="UPDATE">
                Update
              </option>

              <option value="DELETE">
                Delete
              </option>

              <option value="ENABLE">
                Enable
              </option>

              <option value="DISABLE">
                Disable
              </option>

              <option value="LOGIN">
                Login
              </option>

              <option value="LOGOUT">
                Logout
              </option>
            </select>
          </div>

        </div>

      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-gray-50 border-b">
                <tr>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Date / Time
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    User
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Module
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Description
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Details
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y">

                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(
                        log.created_at
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.user_name ||
                        'System'}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.module}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getActionClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.description ||
                        '-'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setSelectedLog(log)
                        }
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* Details Modal */}
      {selectedLog && (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Audit Log Details
              </h2>

              <button
                onClick={() =>
                  setSelectedLog(null)
                }
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>

            </div>

            <div className="p-6 space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <p className="text-sm text-gray-500">
                    User
                  </p>

                  <p className="font-medium">
                    {selectedLog.user_name ||
                      'System'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Date / Time
                  </p>

                  <p className="font-medium">
                    {formatDate(
                      selectedLog.created_at
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Module
                  </p>

                  <p className="font-medium">
                    {selectedLog.module}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Action
                  </p>

                  <p className="font-medium">
                    {selectedLog.action}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Entity
                  </p>

                  <p className="font-medium">
                    {selectedLog.entity_type ||
                      '-'}
                    {selectedLog.entity_id
                      ? ` #${selectedLog.entity_id}`
                      : ''}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    IP Address
                  </p>

                  <p className="font-medium">
                    {selectedLog.ip_address ||
                      '-'}
                  </p>
                </div>

              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Description
                </p>

                <p className="text-gray-800">
                  {selectedLog.description ||
                    '-'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Old Values
                </p>

                <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                  {selectedLog.old_values
                    ? JSON.stringify(
                        selectedLog.old_values,
                        null,
                        2
                      )
                    : 'No old values'}
                </pre>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">
                  New Values
                </p>

                <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                  {selectedLog.new_values
                    ? JSON.stringify(
                        selectedLog.new_values,
                        null,
                        2
                      )
                    : 'No new values'}
                </pre>
              </div>

            </div>

            <div className="px-6 py-4 border-t text-right">

              <button
                onClick={() =>
                  setSelectedLog(null)
                }
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default AuditLogs