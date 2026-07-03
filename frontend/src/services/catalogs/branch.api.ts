import { api } from '@/lib/api'

export interface BranchItem {
  id: string
  name: string
  address: string
  clientsCount?: number
  technicCount?: number
}

export interface CreateBranchPayload {
  name: string
  address?: string
}

export interface CreateBranchResponse {
  id: string
  createdAt?: string
}

export interface UpdateBranchPayload {
  id?: string
  name?: string
  address?: string
}

export const createBranch = async (
  payload: CreateBranchPayload
): Promise<CreateBranchResponse> => {
  const { data } = await api.post('/branches/create', payload)
  return data
}

export const getAllBranches = async (): Promise<BranchItem[]> => {
  const { data } = await api.get('/branches/select')
  return data
}

export const updateBranch = async (payload: UpdateBranchPayload) => {
  const { status } = await api.put('/branches/update', payload)
  return { status }
}

export const deleteBranch = async (id: string) => {
  const { status } = await api.delete(`/branches/branch/${id}`)
  return { status }
}
