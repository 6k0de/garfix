import { create } from 'zustand'
import { getAllTypeClients } from '@/services/catalogs/typeClient.api.ts'
import type { TypeClientRecord } from '@/pages/catalogs/TypeClients.tsx'

interface TypeClientsState {
  typeClients: TypeClientRecord[]
  fetchTypeClients: () => Promise<void>
}

export const useTypeClientsStore = create<TypeClientsState>((set) => ({
  typeClients: [],
  fetchTypeClients: async () => {
    const data = await getAllTypeClients()
    set({ typeClients: data })
  },
}))
