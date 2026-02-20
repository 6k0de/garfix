import { api } from '@/lib/api.ts'
import type { ClientFormPayload } from '@/pages/catalogs/Clients.tsx'

export const createClient = async (payload: ClientFormPayload) => {
  const { data } = await api.post('/clients/create', payload)
  return data
}

export const getAllClients = async () => {
  const { data } = await api.get('/clients/select')
  return data
}

export const getClientCatalogs = async () => {
  const { data } = await api.get('/clients/catalogs')
  return data
}

export const updateClient = async (payload: ClientFormPayload) => {
  const { status } = await api.put('/clients/update', payload)
  return { status }
}

export const deleteClient = async (id: string) => {
  const { status } = await api.delete(`/clients/client/${id}`)
  return { status }
}
