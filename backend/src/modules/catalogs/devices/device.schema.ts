import { z } from 'zod'


export const deviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'name is required'),
  description: z.string().trim().min(1, 'description is required'),
}).strict()

export const updateDeviceSchema = deviceSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
})

export type NewDeviceInput = z.infer<typeof deviceSchema>
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>
