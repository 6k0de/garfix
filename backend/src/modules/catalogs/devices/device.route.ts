import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
import * as d from './devices.controller.js'
const de = Router()

//GET
de.get('/select', authRequired, d.getAllDevices)

//POST
de.post('/create', authRequired, d.createDevice)

//PUT
de.put('/update', authRequired, d.updateDevice)

//DELETE
de.delete('/device/:id', authRequired, d.deleteDevice)

export default de
