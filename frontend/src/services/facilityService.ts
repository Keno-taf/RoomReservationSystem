import api from './api'

export interface Facility {
  id: number
  name: string
  location: string
  capacity: number
  description?: string
  is_active: boolean
}

export const getFacilities = async (): Promise<Facility[]> => {
  const response = await api.get('/facilities')

  return response.data.data
}