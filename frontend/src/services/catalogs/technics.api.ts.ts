import type { Technician } from '@/pages/catalogs/Technicians.tsx'
import { api } from '@/lib/api.ts'

export const createTechnic = async (payload: Technician) => {
  const { data } = await api.post('/technicians/create', payload)
  return data
}

export const getAllTechnicians = async() => {
  const { data } = await api.get('/technicians/select')
  return data
}

export const updateTechnics = async (payload: Technician) => {
  const { status } = await api.put('/technicians/update', payload)
  return { status }
}

export const deleteTechnic = async(id: string) => {
  const { status } = await api.delete(`/technicians/technic/${id}`)
  return { status }
}

