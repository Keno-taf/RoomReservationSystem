import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginUser } from '../services/authService'
import { useAuth } from '../context/useAuth'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    try {
      setLoading(true)
      const response = await loginUser({ email: email.trim(), password })

      if (response.success) {
        login(response.token, response.user)

        if (response.user.roleIds.includes(4)) {
          navigate('/admin')
        } else {
          navigate('/')
        }
      } else {
        setError(response.message || 'Login failed. Please try again.')
      }
    } catch (error: unknown) {
      console.error('Login error:', error)

      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } }
        }
        const message = axiosError.response?.data?.message

        if (message) {
          setError(message)
          return
        }
      }

      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      number: '01',
      title: 'Online Room & Hall Reservations',
      description: 'Submit meeting room and hall requests from one convenient place.',
    },
    {
      number: '02',
      title: 'Structured Approval Workflows',
      description: 'Choose the Facility Manager route or Department Head followed by Facility Manager.',
    },
    {
      number: '03',
      title: 'Reservation Tracking',
      description: 'Review request status and follow reservation progress.',
    },
    {
      number: '04',
      title: 'Availability & Scheduling',
      description: 'Organize reservation dates, times, facilities, and participant needs.',
    },
    {
      number: '05',
      title: 'Notifications & Updates',
      description: 'Receive updates about reservation activity and approval decisions.',
    },
    {
      number: '06',
      title: 'Role-Based Access',
      description: 'Provide tailored access for employees, approvers, and administrators.',
    },
  ]

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-2">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0B2450] via-[#123B78] to-[#1557A6] px-6 py-10 text-white sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-20">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur">
              <svg aria-hidden="true" viewBox="0 0 48 48" className="h-9 w-9" fill="none">
                <path d="M8 40V17L24 7L40 17V40H8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M17 40V25H31V40M15 19H18M23 19H26M30 19H33" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100 sm:text-sm">
                Federal Civil Service Commission
              </p>
              <p className="mt-1 text-xs text-blue-200">
                Organization Room & Hall Reservation System
              </p>
            </div>
          </div>
          <div className="mt-10 max-w-xl lg:mt-16">
            <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Room & Hall Reservation Management System
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              A centralized way to request, approve, and manage meeting rooms and halls across your organization.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-5 lg:mt-10">
            {features.map((feature) => (
              <article key={feature.number} className="flex gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-xs font-bold text-blue-100">
                  {feature.number}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">{feature.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-blue-100/80 sm:text-sm">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="relative mt-10 border-t border-white/15 pt-5 lg:mt-12">
          <p className="text-xs text-blue-100/80">
            Efficient service · Transparent workflows · Organized facilities
          </p>
          <p className="mt-2 text-[11px] text-blue-200/70">
            Federal Civil Service Commission
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:min-h-screen lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold tracking-tight text-white shadow-lg shadow-blue-600/25">
              RRS
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in to your account to continue</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading && (
                  <svg aria-hidden="true" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-90" />
                  </svg>
                )}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600" fill="none">
                <path d="M12 3L19 6V11C19 15.5 16 19 12 21C8 19 5 15.5 5 11V6L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Secure sign-in for authorized users
            </div>
          </div>

          <p className="mt-7 text-center text-xs leading-5 text-slate-500">
            Organization Room & Hall Reservation System
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login
