import { z } from 'zod'

export const technicSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    email: z.string().trim().min(1, 'email is required'),
    branchId: z.string().optional(),
    roleId: z.string(),
  })
  .strict()

export const updateTechnicScehma = technicSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export type NewTechnicInput = z.infer<typeof technicSchema>
export type UpdateTechnicInput = z.infer<typeof technicSchema>
