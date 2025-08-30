import { api } from '@/lib/api'

export const createService = async (payload: any) => {
  const { data } = await api.post('/services/create', payload)
  return data
}
