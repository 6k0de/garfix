import type { Role } from '@/pages/catalogs/Roles.tsx'
import { create } from 'zustand'
import { getAllRoles } from '@/services/catalogs/role.api.ts'

interface RolesStore {
  roles: Role[],
  fetchRoles: () => Promise<void>
}

export const useRoleStore = create<RolesStore>((set) => ({
  roles: [],
  fetchRoles: async() => {
    const data = await getAllRoles()
    set({roles: data})
  }
}))