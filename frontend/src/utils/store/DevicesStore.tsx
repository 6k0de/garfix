import type { DeviceType } from '@/pages/catalogs/Devices.tsx'
import { create } from 'zustand'
import { getAllDevices } from '@/services/catalogs/device.api.ts'

interface DevicesState {
  deviceTypes: DeviceType[],
  fetchDevices: () => Promise<void>
}

export const useDevicesStore = create<DevicesState>((set) => ({
  deviceTypes: [],
  fetchDevices: async () => {
    const data = await getAllDevices()
    set({deviceTypes: data})
  }
}))