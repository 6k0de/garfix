import { api } from '@/lib/api'
import type { Branch } from '@/pages/catalogs/Branches'

export const createBranch = async (payload: Branch) => {
  const { data } = await api.post('/branches/create', payload)
  return data
}

export const getAllBranches = async () => {
  const { data } = await api.get('/branches/select')
  return data
}

export const updateBranch = async (payload: Branch) => {
  const { status } = await api.put('/branches/update', payload)
  return { status }
}

export const deleteBranch = async (id: string) => {
  const { status } = await api.delete(`/branches/branch/${id}`)
  return { status }
}
