import { getAuthUser, isSuperAdminUser } from '@/lib/auth'
import type React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

export const WorkspaceRoute: React.FC = () => {
  const user = getAuthUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isSuperAdminUser(user)) {
    return <Navigate to="/superadmin/dashboard" replace />
  }

  return <Outlet />
}
