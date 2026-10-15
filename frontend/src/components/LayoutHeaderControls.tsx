import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/i18n'
import api from '../services/api'

export type AppLanguage = 'en' | 'am' | 'om'
export type AppTheme = 'light' | 'dark'

interface LayoutHeaderControlsProps {
  fullName?: string
  roleNames?: string[]
  onLogout: () => void
}

interface NotificationItem {
  id: number
  reservation_id: number | null
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}

interface NotificationResponse {
  success: boolean
  data: NotificationItem[]
  unreadCount: number
}

function LayoutHeaderControls({
  fullName,
  roleNames,
  onLogout
}: LayoutHeaderControlsProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Read the current language from i18next, the single source of truth.
  const language = (
    i18n.resolvedLanguage ?? i18n.language ?? 'en'
  ).split('-')[0] as AppLanguage

  const [theme, setTheme] = useState<AppTheme>(() =>
    localStorage.getItem('app-theme') === 'dark' ? 'dark' : 'light'
  )
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [notificationError, setNotificationError] = useState('')

  // Fetch notifications for the currently authenticated user.
  const loadNotifications = useCallback(async () => {
    try {
      if (showNotifications) setLoading(true)
      setNotificationError('')

      const response = await api.get<NotificationResponse>('/notifications/my')

      if (!response.data.success) {
        throw new Error('Notification API request was unsuccessful')
      }

      setNotifications(response.data.data ?? [])
      setUnreadCount(response.data.unreadCount ?? 0)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      setNotificationError(t('header.loadError'))
    } finally {
      setLoading(false)
    }
  }, [showNotifications, t])

  // Load notifications on mount and refresh every 15 seconds.
  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    const intervalId = window.setInterval(() => {
      void loadNotifications()
    }, 15000)

    return () => {
      window.clearTimeout(initialLoadId)
      window.clearInterval(intervalId)
    }
  }, [loadNotifications])

  // Persist theme settings and apply the browser color scheme.
  useEffect(() => {
    localStorage.setItem('app-theme', theme)
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  // Mark one notification as read.
  const markAsRead = async (
    notification: NotificationItem
  ): Promise<boolean> => {
    if (notification.is_read) return true

    try {
      await api.patch(`/notifications/${notification.id}/read`)

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      )
      setUnreadCount((count) => Math.max(0, count - 1))
      return true
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      setNotificationError(t('header.markReadError'))
      return false
    }
  }

  // Route a clicked notification to approvals or the user's reservations.
  const handleNotificationClick = async (
    notification: NotificationItem
  ) => {
    await markAsRead(notification)
    setShowNotifications(false)

    const type = (notification.notification_type ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
    const title = (notification.title ?? '').toLowerCase()
    const message = (notification.message ?? '').toLowerCase()
    const text = `${title} ${message}`

    const isReservationDecision =
      type === 'approved' ||
      type === 'rejected' ||
      type === 'reservation_approved' ||
      type === 'reservation_rejected' ||
      /\byour reservation\b.*\b(approved|rejected)\b/.test(text)

    if (isReservationDecision) {
      navigate('/reservations')
      return
    }

    const isPendingApproval =
      type === 'approval_required' ||
      type === 'pending_approval' ||
      type === 'approval_pending' ||
      /\b(requires your approval|requires your review|awaiting your approval|pending approval|approval required|approve this reservation|reservation request for approval)\b/.test(text)

    if (isPendingApproval) {
      navigate('/approvals')
      return
    }

    const looksLikeNewRequest =
      /\b(new reservation request|reservation request submitted|submitted a reservation request|request awaits your approval)\b/.test(text)

    const isApprover = roleNames?.some((role) => {
      const normalizedRole = role.trim().toLowerCase()
      return (
        normalizedRole.includes('department head') ||
        normalizedRole.includes('facility manager') ||
        normalizedRole.includes('administrator')
      )
    })

    if (looksLikeNewRequest && isApprover) {
      navigate('/approvals')
      return
    }

    if (notification.reservation_id !== null) {
      navigate('/reservations')
    }
  }

  // Mark all notifications as read.
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      setNotificationError(t('header.markReadError'))
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {/* Notification bell and unread-count badge */}
      <div className="relative">
        <button
          type="button"
          title={t('header.notifications')}
          aria-label={
            unreadCount > 0
              ? `${t('header.notifications')}: ${unreadCount} ${t('header.unread')}`
              : t('header.notifications')
          }
          aria-expanded={showNotifications}
          onClick={() => {
            const opening = !showNotifications
            setShowNotifications(opening)
            if (opening) void loadNotifications()
          }}
          className="relative rounded-lg border border-gray-200 p-2.5 text-gray-700 transition hover:bg-gray-100"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 z-50 mt-2 max-h-[min(70vh,480px)] w-80 max-w-[90vw] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">
                {t('header.notifications')}
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  {t('header.markAllRead')}
                </button>
              )}
            </div>

            {loading && (
              <p className="py-4 text-gray-500">{t('header.loading')}</p>
            )}

            {!loading && notificationError && (
              <div className="py-3">
                <p className="text-red-600">{notificationError}</p>
                <button
                  type="button"
                  onClick={() => void loadNotifications()}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  {t('header.retry')}
                </button>
              </div>
            )}

            {!loading && !notificationError && notifications.length === 0 && (
              <p className="py-4 text-gray-500">
                {t('header.noNotifications')}
              </p>
            )}

            {!loading && !notificationError && notifications.length > 0 && (
              <ul className="mt-3 divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      aria-label={`${notification.title}. ${
                        notification.is_read
                          ? t('header.read')
                          : `${t('header.unread')}. ${t('header.openRelated')}.`
                      }`}
                      className={`block w-full cursor-pointer rounded-md px-2 py-3 text-left transition hover:bg-gray-50 ${
                        notification.is_read ? 'opacity-70' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            notification.is_read ? 'bg-gray-300' : 'bg-blue-600'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-gray-600">
                            {notification.message}
                          </p>
                          <p className="mt-2 text-xs text-gray-400">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          <p
                            className={`mt-1 text-xs ${
                              notification.is_read
                                ? 'text-gray-400'
                                : 'font-medium text-blue-600'
                            }`}
                          >
                            {notification.is_read
                              ? t('header.read')
                              : t('header.unread')}
                          </p>
                          <p className="mt-1 text-xs font-medium text-indigo-600">
                            {t('header.openRelated')} →
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button
        type="button"
        title={t('header.theme')}
        aria-label={t('header.theme')}
        onClick={() =>
          setTheme((previous) => (previous === 'light' ? 'dark' : 'light'))
        }
        className="rounded-lg border border-gray-200 p-2.5 text-gray-700 transition hover:bg-gray-100"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Language selector */}
      <label className="flex items-center gap-2">
        <span className="sr-only">{t('header.language')}</span>
        <select
          value={language}
          onChange={(event) => {
            const selectedLanguage = event.target.value as AppLanguage
            void i18n.changeLanguage(selectedLanguage)
          }}
          aria-label={t('header.language')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"
        >
          <option value="en">English</option>
          <option value="am">አማርኛ</option>
          <option value="om">Afaan Oromoo</option>
        </select>
      </label>

      {/* Current user information */}
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-gray-800">{fullName}</p>
        <p className="text-xs text-gray-500">{roleNames?.join(', ')}</p>
      </div>

      {/* Logout button */}
      <button
        type="button"
        onClick={onLogout}
        className="rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
      >
        {t('header.logout')}
      </button>
    </div>
  )
}

export default LayoutHeaderControls
