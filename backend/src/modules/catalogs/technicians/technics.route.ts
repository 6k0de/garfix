import { Router } from 'express'
// @ts-ignore
import * as t from './technics.controller.ts'

const te = Router()

//GET
te.get('/select', t.getAllTechnicians)

//POST
te.post('/create', t.createTechnics)

//PUT
te.put('/update', t.updateTechnician)

//DELETE
te.delete('/technic/:id', t.deleteTechnician)

export default te
