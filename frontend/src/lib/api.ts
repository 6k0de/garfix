import axios from 'axios'
export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: false,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err)
  }
)
