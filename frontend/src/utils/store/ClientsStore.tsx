import { create } from 'zustand'
import { getAllClients } from '@/services/catalogs/client.api.ts'
import type { ClientRecord } from '@/pages/catalogs/Clients.tsx'

interface ClientsState {
  clients: ClientRecord[]
  fetchClients: () => Promise<void>
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  fetchClients: async () => {
    const data = await getAllClients()
    set({ clients: data })
  },
}))
