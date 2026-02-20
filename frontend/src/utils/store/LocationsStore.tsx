import { create } from 'zustand'
import { getAllLocations } from '@/services/catalogs/location.api.ts'
import type { LocationRecord } from '@/pages/catalogs/Locations.tsx'

interface LocationsState {
  locations: LocationRecord[]
  fetchLocations: () => Promise<void>
}

export const useLocationsStore = create<LocationsState>((set) => ({
  locations: [],
  fetchLocations: async () => {
    const data = await getAllLocations()
    set({ locations: data })
  },
}))
