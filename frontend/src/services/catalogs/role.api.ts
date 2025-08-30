import { api } from '@/lib/api'
import type { Role } from '@/pages/catalogs/Roles'

export const createRole = async (payload: Role) => {
  const { data } = await api.post('/roles/create', payload)
  return data
}

export const getAllRoles = async () => {
  const { data } = await api.get('/roles/select')
  return data
}

export const updateRole = async (payload: Role) => {
  const { status } = await api.put('/roles/update', payload)
  return {status}
}

export const deleteRole = async (id: string) => {
  const { status } = await api.delete(`/roles/role/${id}`)
  return {status}
}
