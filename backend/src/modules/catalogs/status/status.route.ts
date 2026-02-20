import { Router } from 'express'
import * as s from './status.controller.js'

const st = Router()

//GET
st.get('/select', s.getAllStatus)

//POST
st.post('/create', s.createStatus)

//PUT
st.put('/update', s.updateStatus)

//DELETE
st.delete('/status/:id', s.deleteStatus)

export default st
