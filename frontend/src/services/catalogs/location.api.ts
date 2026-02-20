import { api } from '@/lib/api.ts'
import type { LocationPayload } from '@/pages/catalogs/Locations.tsx'

export const createLocation = async (payload: LocationPayload) => {
  const { data } = await api.post('/locations/create', payload)
  return data
}

export const getAllLocations = async () => {
  const { data } = await api.get('/locations/select')
  return data
}

export const updateLocation = async (payload: LocationPayload) => {
  const { status } = await api.put('/locations/update', payload)
  return { status }
}

export const deleteLocation = async (id: string) => {
  const { status } = await api.delete(`/locations/location/${id}`)
  return { status }
}
