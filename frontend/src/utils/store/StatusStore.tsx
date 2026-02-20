import { create } from 'zustand'
import { getAllStatuses } from '@/services/catalogs/status.api.ts'
import type { StatusRecord } from '@/pages/catalogs/Estatus.tsx'

interface StatusState {
  statuses: StatusRecord[]
  fetchStatuses: () => Promise<void>
}

export const useStatusStore = create<StatusState>((set) => ({
  statuses: [],
  fetchStatuses: async () => {
    const data = await getAllStatuses()
    set({ statuses: data })
  },
}))
