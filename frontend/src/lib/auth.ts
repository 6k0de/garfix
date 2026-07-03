export const AUTH_TOKEN_STORAGE_KEY = 'garfix-auth-token'
export const AUTH_USER_STORAGE_KEY = 'garfix-auth-user'
export const ACTIVE_BRANCH_STORAGE_KEY = 'garfix-active-branch-id'
export const ACTIVE_BRANCH_CHANGE_EVENT = 'garfix:active-branch-change'

export interface AuthUser {
  id: string
  name: string
  email: string | null
  username: string | null
  branchId: string | null
  role: {
    id: string
    name: string
  }
  company: {
    id: string
    name: string
    status: string
    subscriptionPlan: string
    branchLimit: number
  } | null
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: AuthUser
}

const hasWindow = typeof window !== 'undefined'

const emitActiveBranchChange = () => {
  if (!hasWindow) return
  window.dispatchEvent(new CustomEvent(ACTIVE_BRANCH_CHANGE_EVENT))
}

export const getAuthToken = () => {
  if (!hasWindow) return null
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export const setAuthToken = (token: string) => {
  if (!hasWindow) return
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export const clearAuthToken = () => {
  if (!hasWindow) return
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export const getAuthUser = (): AuthUser | null => {
  if (!hasWindow) return null

  const rawValue = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as AuthUser
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  }
}

export const setAuthUser = (user: AuthUser) => {
  if (!hasWindow) return
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
}

export const setAuthSession = (payload: LoginResponse) => {
  setAuthToken(payload.token)
  setAuthUser(payload.user)
}

export const clearAuthSession = () => {
  clearAuthToken()
  if (!hasWindow) return
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  window.localStorage.removeItem(ACTIVE_BRANCH_STORAGE_KEY)
  emitActiveBranchChange()
}

export const resolveRoleKey = (roleName: string | null | undefined) => {
  if (!roleName) return ''
  return roleName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export const getActiveBranchId = () => {
  if (!hasWindow) return null
  const value = window.localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY)
  return value && value.trim().length > 0 ? value.trim() : null
}

export const setActiveBranchId = (branchId: string | null | undefined) => {
  if (!hasWindow) return
  const normalized = branchId?.trim()
  if (!normalized) {
    window.localStorage.removeItem(ACTIVE_BRANCH_STORAGE_KEY)
    emitActiveBranchChange()
    return
  }
  window.localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, normalized)
  emitActiveBranchChange()
}

export const subscribeToActiveBranchId = (callback: () => void) => {
  if (!hasWindow) {
    return () => undefined
  }

  const handleBranchChange = () => callback()
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ACTIVE_BRANCH_STORAGE_KEY) {
      callback()
    }
  }

  window.addEventListener(ACTIVE_BRANCH_CHANGE_EVENT, handleBranchChange)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(ACTIVE_BRANCH_CHANGE_EVENT, handleBranchChange)
    window.removeEventListener('storage', handleStorage)
  }
}

export const isSuperAdminUser = (user: AuthUser | null) => {
  const key = resolveRoleKey(user?.role?.name)
  if (!key) return false

  return key === 'superadmin' || key === 'super admin'
}

export const isAdminUser = (user: AuthUser | null) => {
  const key = resolveRoleKey(user?.role?.name)
  if (!key) return false
  return key === 'administrador' || key === 'admin' || key === 'administrador cliente'
}

export const isTechnicianUser = (user: AuthUser | null) => {
  const key = resolveRoleKey(user?.role?.name)
  if (!key) return false
  return key === 'tecnico' || key === 'tech'
}
