import { Layout } from './components/layout/Layout'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CreateService } from './pages/services/CreateService'
import { ServicesList } from './pages/services/ServiceList'
import { RolesCatalog } from './pages/catalogs/Roles'
import { StatusCatalog } from './pages/catalogs/Estatus'
import { LocationsCatalog } from './pages/catalogs/Locations'
import { DevicesCatalog } from './pages/catalogs/Devices'
import { Branches } from './pages/catalogs/Branches'
import { Technicians } from './pages/catalogs/Technicians'
import { Clients } from './pages/catalogs/Clients'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="services">
              <Route path="create" element={<CreateService />} />
              <Route path="list" element={<ServicesList />} />
            </Route>
            <Route path="catalogs">
              <Route path="branches" element={<Branches />} />
              <Route path="clients" element={<Clients />} />
              <Route path="technicians" element={<Technicians />} />
              <Route path="roles" element={<RolesCatalog />} />
              <Route path="status" element={<StatusCatalog />} />
              <Route path="locations" element={<LocationsCatalog />} />
              <Route path="devices" element={<DevicesCatalog />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
