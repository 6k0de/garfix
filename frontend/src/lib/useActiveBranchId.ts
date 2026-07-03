import { useSyncExternalStore } from 'react'
import { getActiveBranchId, subscribeToActiveBranchId } from './auth'

export const useActiveBranchId = () =>
  useSyncExternalStore(subscribeToActiveBranchId, getActiveBranchId, () => null)
