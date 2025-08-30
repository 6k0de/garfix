import type { Branch } from '@/pages/catalogs/Branches.tsx'
import { create } from 'zustand'
import { getAllBranches } from '@/services/catalogs/branch.api.ts'

interface BranchesState {
  branches: Branch[]
  fetchBranches: () => Promise<void>
}

export const useBranchStore = create<BranchesState>((set) => ({
  branches: [],
  fetchBranches: async () => {
    const data = await getAllBranches()
    set({branches: data})
  }
}))