import { lazy } from 'react'
import type React from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthUser, isSuperAdminUser, isTechnicianUser } from '@/lib/auth'

// La página de inicio (dashboard) se carga de forma diferida en su propio chunk.
const Home = lazy(() =>
  import('@/pages/home/Home').then((m) => ({ default: m.Home })),
)

export const HomeRouteRedirect: React.FC = () => {
  const user = getAuthUser()

  if (isSuperAdminUser(user)) {
    return <Navigate to="/superadmin/dashboard" replace />
  }

  // El técnico no tiene "Inicio" en su menú: lo enviamos directo a su lista.
  if (isTechnicianUser(user)) {
    return <Navigate to="/services/list" replace />
  }

  return <Home />
}
