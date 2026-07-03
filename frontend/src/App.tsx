import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { SuperAdminRoute } from './components/auth/SuperAdminRoute'
import { WorkspaceRoute } from './components/auth/WorkspaceRoute'
import { HomeRouteRedirect } from './components/auth/HomeRouteRedirect'
import { AdminRoute } from './components/auth/AdminRoute'

// Carga diferida por ruta: cada página se descarga en su propio chunk, de modo
// que la landing pública no arrastra el código de la app autenticada.
const LandingPage = lazy(() =>
  import('./pages/landing/Index').then((m) => ({ default: m.LandingPage })),
)
const LandingCheckout = lazy(() =>
  import('./pages/landing/Checkout').then((m) => ({ default: m.LandingCheckout })),
)
const Login = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })))
const ServiceEvidencePage = lazy(() =>
  import('./pages/services/ServiceEvidencePage').then((m) => ({ default: m.ServiceEvidencePage })),
)
const CreateService = lazy(() =>
  import('./pages/services/CreateService').then((m) => ({ default: m.CreateService })),
)
const ServicesList = lazy(() =>
  import('./pages/services/ServiceList').then((m) => ({ default: m.ServicesList })),
)
const Clients = lazy(() =>
  import('./pages/catalogs/Clients').then((m) => ({ default: m.Clients })),
)
const DocumentTypesCatalog = lazy(() =>
  import('./pages/catalogs/DocumentTypes').then((m) => ({ default: m.DocumentTypesCatalog })),
)
const StatusCatalog = lazy(() =>
  import('./pages/catalogs/Estatus').then((m) => ({ default: m.StatusCatalog })),
)
const LocationsCatalog = lazy(() =>
  import('./pages/catalogs/Locations').then((m) => ({ default: m.LocationsCatalog })),
)
const DevicesCatalog = lazy(() =>
  import('./pages/catalogs/Devices').then((m) => ({ default: m.DevicesCatalog })),
)
const Branches = lazy(() =>
  import('./pages/catalogs/Branches').then((m) => ({ default: m.Branches })),
)
const TypeClientsCatalog = lazy(() =>
  import('./pages/catalogs/TypeClients').then((m) => ({ default: m.TypeClientsCatalog })),
)
const Technicians = lazy(() =>
  import('./pages/catalogs/Technicians').then((m) => ({ default: m.Technicians })),
)
const RolesCatalog = lazy(() =>
  import('./pages/catalogs/Roles').then((m) => ({ default: m.RolesCatalog })),
)
const SuperAdminDashboard = lazy(() =>
  import('./pages/superadmin/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard })),
)
const SuperAdminClients = lazy(() =>
  import('./pages/superadmin/SuperAdminClients').then((m) => ({ default: m.SuperAdminClients })),
)
const SuperAdminNewClient = lazy(() =>
  import('./pages/superadmin/SuperAdminNewClient').then((m) => ({ default: m.SuperAdminNewClient })),
)

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f6f3ee] text-slate-500">
    <span className="text-sm">Cargando…</span>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/checkout" element={<LandingCheckout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/evidencias/:qrCode" element={<ServiceEvidencePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomeRouteRedirect />} />
              <Route element={<WorkspaceRoute />}>
                <Route path="services">
                  <Route path="create" element={<CreateService />} />
                  <Route path="edit/:id" element={<CreateService />} />
                  <Route path="list" element={<ServicesList />} />
                </Route>
                {/* Catálogos compartidos: visibles para ADMIN y TECH */}
                <Route path="catalogs">
                  <Route path="clients" element={<Clients />} />
                  <Route path="document-types" element={<DocumentTypesCatalog />} />
                  <Route path="status" element={<StatusCatalog />} />
                  <Route path="locations" element={<LocationsCatalog />} />
                  <Route path="devices" element={<DevicesCatalog />} />
                </Route>
                {/* Catálogos solo para ADMIN */}
                <Route element={<AdminRoute />}>
                  <Route path="catalogs">
                    <Route path="branches" element={<Branches />} />
                    <Route path="type-clients" element={<TypeClientsCatalog />} />
                    <Route path="technicians" element={<Technicians />} />
                    <Route path="roles" element={<RolesCatalog />} />
                  </Route>
                </Route>
              </Route>
              <Route element={<SuperAdminRoute />}>
                <Route path="superadmin">
                  <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
                  <Route path="dashboard" element={<SuperAdminDashboard />} />
                  <Route path="clients" element={<SuperAdminClients />} />
                  <Route path="new-client" element={<SuperAdminNewClient />} />
                  <Route path="roles" element={<RolesCatalog />} />
                  <Route path="accounts" element={<Navigate to="/superadmin/clients" replace />} />
                </Route>
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
