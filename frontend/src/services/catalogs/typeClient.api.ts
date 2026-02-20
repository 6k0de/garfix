import { api } from '@/lib/api.ts'
import type { TypeClientPayload } from '@/pages/catalogs/TypeClients.tsx'

export const createTypeClient = async (payload: TypeClientPayload) => {
  const { data } = await api.post('/type-clients/create', payload)
  return data
}

export const getAllTypeClients = async () => {
  const { data } = await api.get('/type-clients/select')
  return data
}

export const updateTypeClient = async (payload: TypeClientPayload) => {
  const { status } = await api.put('/type-clients/update', payload)
  return { status }
}

export const deleteTypeClient = async (id: string) => {
  const { status } = await api.delete(`/type-clients/type-client/${id}`)
  return { status }
}
