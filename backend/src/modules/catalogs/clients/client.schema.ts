import { z } from 'zod'

export const clientSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    phone: z.string().trim().min(1, 'phone is required'),
    email: z.string().trim().email('email is invalid'),
    address: z.string().trim().min(1, 'address is required'),
    typeClientId: z.string().trim().min(1, 'typeClientId is required'),
    documentTypeId: z.string().trim().min(1, 'documentTypeId is required'),
    branchId: z.string().trim().min(1, 'branchId is required'),
  })
  .strict()

export const updateClientSchema = clientSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, 'id is required'),
  })
  .refine(
    (data) => Object.keys(data).some((key) => key !== 'id'),
    {
      message: 'At least one field must be provided',
    }
  )

export type NewClientInput = z.infer<typeof clientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
