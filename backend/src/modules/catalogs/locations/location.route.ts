import { Router } from 'express'
import * as l from './locations.controller.js'

const lo = Router()

//GET
lo.get('/select', l.getAllLocations)

//POST
lo.post('/create', l.createLocation)

//PUT
lo.put('/update', l.updateLocation)

//DELETE
lo.delete('/location/:id', l.deleteLocation)

export default lo
