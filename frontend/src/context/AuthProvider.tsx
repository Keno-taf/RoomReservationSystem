import { useState, type ReactNode } from 'react'
import {
  AuthContext,
  type AuthUser
} from './authContext'

interface AuthProviderProps {
  children: ReactNode
}

function getStoredToken(): string | null {
  return localStorage.getItem('token')
}

function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem('user')

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch (error) {
    console.error(
      'Failed to restore stored user:',
      error
    )

    localStorage.removeItem('user')

    return null
  }
}

function AuthProvider({
  children
}: AuthProviderProps) {
  const [token, setToken] =
    useState<string | null>(() =>
      getStoredToken()
    )

  const [user, setUser] =
    useState<AuthUser | null>(() =>
      getStoredUser()
    )

  const login = (
    newToken: string,
    newUser: AuthUser
  ) => {
    localStorage.setItem(
      'token',
      newToken
    )

    localStorage.setItem(
      'user',
      JSON.stringify(newUser)
    )

    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated:
          token !== null && user !== null,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
