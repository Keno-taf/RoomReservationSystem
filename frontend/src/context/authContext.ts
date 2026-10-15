import { createContext } from 'react'

export interface AuthUser {
  id: number
  fullName: string
  email: string
  departmentId: number | null
  roleIds: number[]
  roleNames: string[]
}

export interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (
    token: string,
    user: AuthUser
  ) => void
  logout: () => void
}

export const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  )