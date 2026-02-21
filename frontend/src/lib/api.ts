import axios from 'axios'

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')
const stripApiSuffix = (value: string) => value.replace(/\/api$/i, '')

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://eds-accepts-police-server.trycloudflare.com/api' //https://api.garfix.mx/api

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

api.interceptors.response.use(
  (res) => res,
  (err) => {  
    return Promise.reject(err)
  }
)
