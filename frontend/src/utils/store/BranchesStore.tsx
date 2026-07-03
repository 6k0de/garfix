import { create } from 'zustand'
import { getAllBranches, type BranchItem } from '@/services/catalogs/branch.api.ts'

interface BranchesState {
  branches: BranchItem[]
  fetchBranches: () => Promise<void>
}

export const useBranchStore = create<BranchesState>((set) => ({
  branches: [],
  fetchBranches: async () => {
    const data = await getAllBranches()
    set({branches: data})
  }
}))
