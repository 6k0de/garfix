import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
// @ts-ignore
import * as r from './roles.controller.js'

const ro = Router()

//GET
ro.get('/select', authRequired, r.getAllRoles)

//POST
ro.post('/create', authRequired, r.createRole)

//PUT
ro.put('/update', authRequired, r.updateRole)

//DELETE
ro.delete('/role/:id', authRequired, r.deleteRole)

export default ro
