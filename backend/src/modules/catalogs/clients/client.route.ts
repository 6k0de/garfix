import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
import * as c from './clients.controller.js'

const cl = Router()

//GET
cl.get('/select', authRequired, c.getAllClients)
cl.get('/catalogs', authRequired, c.getClientCatalogs)

//POST
cl.post('/create', authRequired, c.createClient)

//PUT
cl.put('/update', authRequired, c.updateClient)

//DELETE
cl.delete('/client/:id', authRequired, c.deleteClient)

export default cl
