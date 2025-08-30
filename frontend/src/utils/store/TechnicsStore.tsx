import type { Technician } from '@/pages/catalogs/Technicians.tsx'
import { create } from 'zustand'
import { getAllTechnicians } from '@/services/catalogs/technics.api.ts.ts'


interface TechnicsState {
  technicians: Technician[]
  fetchTechnics: () => Promise<void>
}

export const useTechnicStore = create<TechnicsState>((set) => ({
  technicians: [],
  fetchTechnics: async () => {
    const data = await getAllTechnicians()
    set({technicians: data})
  }
}))