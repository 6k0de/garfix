import { z } from 'zod'

export const typeClientSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    description: z.string().trim().optional(),
  })
  .strict()

export const updateTypeClientSchema = typeClientSchema
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

export type NewTypeClientInput = z.infer<typeof typeClientSchema>
export type UpdateTypeClientInput = z.infer<typeof updateTypeClientSchema>
