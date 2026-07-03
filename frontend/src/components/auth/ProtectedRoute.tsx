import { getAuthToken } from '@/lib/auth'
import type React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export const ProtectedRoute: React.FC = () => {
  const location = useLocation()
  const token = getAuthToken()

  if (!token) {
    if (location.pathname === '/') {
      return <Navigate to="/landing" replace />
    }

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
