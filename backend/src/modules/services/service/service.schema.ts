import { z } from 'zod'

export const NewClientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.email().optional().nullable(),
  address: z.string().optional().nullable(),
  typeClientId: z.uuid(),
  documentTypeId: z.uuid(),
  branchId: z.uuid(),
})

export const DeviceInputSchema = z.object({
  deviceTypeId: z.uuid(),
  brand: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  problem: z.string().min(1),
  solution: z.string().optional().nullable(),
  cost: z.number().min(0),
  advance: z.number().min(0),
  technicianId: z.uuid().optional().nullable(),
  locationId: z.uuid().optional().nullable(),
  deliveryDate: z.string().optional().nullable(), // valida formato si quieres
  deliveryTime: z.string().optional().nullable(),
})

export const ServiceDetailsSchema = z.object({
  branchId: z.uuid(),
  receptionDate: z.string().min(1), // valida fecha si quieres con regexp
  statusId: z.uuid(),
  observations: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
})

export const CreateServicePayloadSchema = z.object({
  clientId: z.uuid().optional().nullable(),
  newClient: NewClientSchema.optional().nullable(),
  devices: z.array(DeviceInputSchema).min(1),
  serviceDetails: ServiceDetailsSchema,
})

export type CreateServicePayloadSchema = z.infer<
  typeof CreateServicePayloadSchema
>
