import { Router } from 'express'
// @ts-ignore
import serviceRoute from '../modules/services/service/service.route.js'
// @ts-ignore
import branchRoute from '../modules/catalogs/branches/branch.route.js'
// @ts-ignore
import roleRoute from '../modules/catalogs/roles/roles.route.js'
// @ts-ignore
import technicsRoute from '../modules/catalogs/technicians/technics.route.js'
// @ts-ignore
import deviceRoute from '../modules/catalogs/devices/device.route.js'
// @ts-ignore
import locationRoute from '../modules/catalogs/locations/location.route.js'
// @ts-ignore
import clientRoute from '../modules/catalogs/clients/client.route.js'
// @ts-ignore
import statusRoute from '../modules/catalogs/status/status.route.js'
// @ts-ignore
import documentTypesRoute from '../modules/catalogs/document-types/document-types.route.js'
// @ts-ignore
import typeClientsRoute from '../modules/catalogs/type-clients/type-clients.route.js'


const routes = Router()

routes.use('/services', serviceRoute)
routes.use('/branches', branchRoute)
routes.use('/roles', roleRoute)
routes.use('/technicians', technicsRoute)
routes.use('/devices', deviceRoute)
routes.use('/locations', locationRoute)
routes.use('/clients', clientRoute)
routes.use('/status', statusRoute)
routes.use('/document-types', documentTypesRoute)
routes.use('/type-clients', typeClientsRoute)

export default routes
