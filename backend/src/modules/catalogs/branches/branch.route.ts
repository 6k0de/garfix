import { Router } from 'express'
import * as b from './branche.controller.ts'

const br = Router()

//GET
br.get('/select', b.getAllBranches)

//POST
br.post('/create', b.createBranch)

//PUT
br.put('/update', b.updateBranche)

//DELETE
br.delete('/branch/:id', b.deleteBranch)

export default br
