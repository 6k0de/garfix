import type { DeviceType } from '@/pages/catalogs/Devices.tsx'
import { api } from '@/lib/api.ts'

export const createDevice = async(payload: DeviceType) => {
  const { data } = await api.post('/devices/create', payload)
  return data
}

export const getAllDevices = async() => {
  const { data } = await api.get('/devices/select')
  return data
}

export const updateDevice = async(payload: DeviceType) => {
  const { status } = await api.put('/devices/update', payload)
  return { status }
}

export const deleteDevice = async(id: string) => {
  const { status } = await api.delete(`/devices/device/${id}`)
  return { status }
}