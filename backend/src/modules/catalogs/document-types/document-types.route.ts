import { Router } from 'express'
import * as d from './document-types.controller.js'

const dt = Router()

//GET
dt.get('/select', d.getAllDocumentTypes)

//POST
dt.post('/create', d.createDocumentType)

//PUT
dt.put('/update', d.updateDocumentType)

//DELETE
dt.delete('/document-type/:id', d.deleteDocumentType)

export default dt
