import { z } from 'zod'

export const clientSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    phone: z.string().trim().min(1, 'phone is required'),
    // Solo nombre y teléfono son obligatorios; el resto es opcional.
    email: z
      .string()
      .trim()
      .email('email is invalid')
      .optional()
      .nullable()
      .or(z.literal('')),
    address: z.string().trim().optional().nullable(),
    typeClientId: z.string().trim().optional().nullable(),
    documentTypeId: z.string().trim().optional().nullable(),
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
