import { Router } from 'express'
import { authRequired } from '../../../lib/auth.js'
import * as s from './status.controller.js'

const st = Router()

//GET
st.get('/select', authRequired, s.getAllStatus)

//POST
st.post('/create', authRequired, s.createStatus)

//PUT
st.put('/update', authRequired, s.updateStatus)

//DELETE
st.delete('/status/:id', authRequired, s.deleteStatus)

export default st
