import { Router } from 'express'
import * as s from './service.controller.js'

const rs = Router()

rs.get('/select', s.getAllServices)
rs.get('/catalogs', s.getServiceCatalogs)
rs.get('/detail/:id', s.getServiceById)
rs.post('/create', s.createService)
rs.put('/update/:id', s.updateService)

export default rs
