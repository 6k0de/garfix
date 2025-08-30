import { Request, Response } from 'express'
import { CreateServicePayloadSchema } from './service.schema.ts'

export const createService = async (req: Request, res: Response) => {
    const parse = CreateServicePayloadSchema.safeParse(req.body)
    if(!parse.success){
        return res.status(400).json({error: 'Datos Invalidos', details: parse.error.issues})
    }
    console.log(parse)
}
