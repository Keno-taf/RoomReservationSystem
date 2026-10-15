import api from './api'

export interface UserRole {
  id: number
  name: string
}

export interface SystemUser {
  id: number
  full_name: string
  email: string
  department_id: number | null
  department_name: string | null
  roles: UserRole[]
  is_active: boolean
  created_at: string
}

export const getSystemUsers = async (): Promise<SystemUser[]> => {
  const response = await api.get('/admin/users')

  return response.data.data
}