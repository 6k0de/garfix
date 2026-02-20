import { api } from '@/lib/api.ts'
import type { StatusPayload } from '@/pages/catalogs/Estatus.tsx'

export const createStatus = async (payload: StatusPayload) => {
  const { data } = await api.post('/status/create', payload)
  return data
}

export const getAllStatuses = async () => {
  const { data } = await api.get('/status/select')
  return data
}

export const updateStatus = async (payload: StatusPayload) => {
  const { status } = await api.put('/status/update', payload)
  return { status }
}

export const deleteStatus = async (id: string) => {
  const { status } = await api.delete(`/status/status/${id}`)
  return { status }
}
