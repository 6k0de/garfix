import { Router } from 'express'
import * as d from './devices.controller.js'
const de = Router()

//GET
de.get('/select', d.getAllDevices)

//POST
de.post('/create', d.createDevice)

//PUT
de.put('/update', d.updateDevice)

//DELETE
de.delete('/device/:id', d.deleteDevice)

export default de