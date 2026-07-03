import { Navigate, Outlet } from 'react-router-dom'
import { getAuthUser, isAdminUser, isSuperAdminUser } from '@/lib/auth'

export const AdminRoute = () => {
  const user = getAuthUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdminUser(user)) {
    if (isSuperAdminUser(user)) {
      return <Navigate to="/superadmin/dashboard" replace />
    }

    return <Navigate to="/services/list" replace />
  }

  return <Outlet />
}
