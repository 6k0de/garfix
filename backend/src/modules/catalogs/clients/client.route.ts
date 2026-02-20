import { Router } from 'express'
import * as c from './clients.controller.js'

const cl = Router()

//GET
cl.get('/select', c.getAllClients)
cl.get('/catalogs', c.getClientCatalogs)

//POST
cl.post('/create', c.createClient)

//PUT
cl.put('/update', c.updateClient)

//DELETE
cl.delete('/client/:id', c.deleteClient)

export default cl
