import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
import * as t from './type-clients.controller.js'

const tc = Router()

//GET
tc.get('/select', authRequired, t.getAllTypeClients)

//POST
tc.post('/create', authRequired, t.createTypeClient)

//PUT
tc.put('/update', authRequired, t.updateTypeClient)

//DELETE
tc.delete('/type-client/:id', authRequired, t.deleteTypeClient)

export default tc
