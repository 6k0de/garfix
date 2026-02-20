import { z } from 'zod'

export const statusSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    description: z.string().trim().optional(),
  })
  .strict()

export const updateStatusSchema = statusSchema
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

export type NewStatusInput = z.infer<typeof statusSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
