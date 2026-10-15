import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: number[]
}

function ProtectedRoute({
  children,
  allowedRoles
}: ProtectedRouteProps) {
  const {
    user,
    isAuthenticated
  } = useAuth()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (
    allowedRoles &&
    user &&
    !user.roleIds.some((roleId) =>
      allowedRoles.includes(roleId)
    )
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <>{children}</>
}

export default ProtectedRoute