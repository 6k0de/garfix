import { Router } from 'express'
import * as adminController from './admin.controller.js'

const adminRoute = Router()

adminRoute.get('/overview', adminController.getAdminOverview)
adminRoute.get('/accounts', adminController.getAdminAccounts)
adminRoute.post('/accounts', adminController.createAdminAccount)
adminRoute.patch('/accounts/:companyId/subscription', adminController.updateAdminSubscription)
adminRoute.post('/accounts/:companyId/branches', adminController.addBranchToCompany)
adminRoute.delete('/users/:userId', adminController.deleteUserAccount)

export default adminRoute
