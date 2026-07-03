import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
// @ts-ignore
import * as t from './technics.controller.js'

const te = Router()

//GET
te.get('/select', authRequired, t.getAllTechnicians)

//POST
te.post('/create', authRequired, t.createTechnics)

//PUT
te.put('/update', authRequired, t.updateTechnician)

//DELETE
te.delete('/technic/:id', authRequired, t.deleteTechnician)

export default te
