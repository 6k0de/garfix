import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
import * as d from './document-types.controller.js'

const dt = Router()

//GET
dt.get('/select', authRequired, d.getAllDocumentTypes)

//POST
dt.post('/create', authRequired, d.createDocumentType)

//PUT
dt.put('/update', authRequired, d.updateDocumentType)

//DELETE
dt.delete('/document-type/:id', authRequired, d.deleteDocumentType)

export default dt
