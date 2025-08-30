import { Router } from 'express'
// @ts-ignore
import serviceRoute from '../modules/services/service/service.route.ts'
// @ts-ignore
import branchRoute from '../modules/catalogs/branches/branch.route.ts'
// @ts-ignore
import roleRoute from '../modules/catalogs/roles/roles.route.ts'
// @ts-ignore
import technicsRoute from '../modules/catalogs/technicians/technics.route.ts'
// @ts-ignore
import deviceRoute from '../modules/catalogs/devices/device.route.ts'


const routes = Router()

routes.use('/services', serviceRoute)
routes.use('/branches', branchRoute)
routes.use('/roles', roleRoute)
routes.use('/technicians', technicsRoute)
routes.use('/devices', deviceRoute)

export default routes
