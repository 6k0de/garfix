import { Router } from 'express'
// @ts-ignore
import * as r from './roles.controller.ts'

const ro = Router()

//GET
ro.get('/select', r.getAllRoles)

//POST
ro.post('/create', r.createRole)

//PUT
ro.put('/update', r.updateRole)

//DELETE
ro.delete('/role/:id', r.deleteRole)

export default ro
