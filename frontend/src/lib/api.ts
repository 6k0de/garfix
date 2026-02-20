import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api' //https://api.garfix.mx/api

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
