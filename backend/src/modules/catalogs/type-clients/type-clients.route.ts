import { Router } from 'express'
import * as t from './type-clients.controller.js'

const tc = Router()

//GET
tc.get('/select', t.getAllTypeClients)

//POST
tc.post('/create', t.createTypeClient)

//PUT
tc.put('/update', t.updateTypeClient)

//DELETE
tc.delete('/type-client/:id', t.deleteTypeClient)

export default tc
