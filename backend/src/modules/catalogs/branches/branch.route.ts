import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
import * as b from './branche.controller.js'

const br = Router()

//GET
br.get('/select', authRequired, b.getAllBranches)

//POST
br.post('/create', authRequired, b.createBranch)

//PUT
br.put('/update', authRequired, b.updateBranche)

//DELETE
br.delete('/branch/:id', authRequired, b.deleteBranch)

export default br
