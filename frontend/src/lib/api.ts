import axios from 'axios'
import {
  clearAuthSession,
  getActiveBranchId,
  getAuthToken,
  getAuthUser,
  isSuperAdminUser,
} from './auth'

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')
const stripApiSuffix = (value: string) => value.replace(/\/api$/i, '')

export const API_BASE_URL = 'https://api.garfix.mx/api' // http://localhost:3001/api 

const normalizedApiBaseUrl = normalizeBaseUrl(API_BASE_URL)
export const API_PUBLIC_BASE_URL = stripApiSuffix(normalizedApiBaseUrl)

export const resolveApiAssetUrl = (resourcePath: string) => {
  if (!resourcePath) return resourcePath
  if (resourcePath.startsWith('http://') || resourcePath.startsWith('https://')) {
    return resourcePath
  }

  const normalizedPath = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`
  return `${API_PUBLIC_BASE_URL}${normalizedPath}`
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const user = getAuthUser()
  const branchId = getActiveBranchId()
  const url = config.url ?? ''

  const shouldScopeByBranch =
    !isSuperAdminUser(user) &&
    Boolean(branchId) &&
    (url.startsWith('/services') ||
      url.startsWith('/clients') ||
      url.startsWith('/status') ||
      url.startsWith('/locations') ||
      url.startsWith('/technicians') ||
      url.startsWith('/devices') ||
      url.startsWith('/document-types') ||
      url.startsWith('/type-clients'))

  if (shouldScopeByBranch) {
    config.params = {
      ...(config.params ?? {}),
      branchId,
    }
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearAuthSession()
    }
    return Promise.reject(err)
  }
)
