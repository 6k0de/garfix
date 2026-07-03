import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
import * as l from './locations.controller.js'

const lo = Router()

//GET
lo.get('/select', authRequired, l.getAllLocations)

//POST
lo.post('/create', authRequired, l.createLocation)

//PUT
lo.put('/update', authRequired, l.updateLocation)

//DELETE
lo.delete('/location/:id', authRequired, l.deleteLocation)

export default lo
