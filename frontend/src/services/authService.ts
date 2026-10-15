import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

export interface LoginData {
  email: string
  password: string
}

export interface LoggedInUser {
  id: number
  fullName: string
  email: string
  departmentId: number | null
  roleIds: number[]
  roleNames: string[]
}

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: LoggedInUser
}

export const login = async (
  loginData: LoginData
): Promise<LoginResponse> => {
  const response = await axios.post(
    `${API_URL}/auth/login`,
    loginData
  )

  return response.data
}