import { z } from 'zod'


export const deviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'name is required'),
  description: z.string().trim().optional(),
}).strict()

export const updateDeviceSchema = deviceSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, 'id is required'),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'id'), {
    message: 'At least one field must be provided',
  })

export type NewDeviceInput = z.infer<typeof deviceSchema>
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>
