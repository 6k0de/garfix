import { z } from 'zod'

const uuidString = z.string().uuid()

export const NewClientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  typeClientId: uuidString,
  documentTypeId: uuidString,
  branchId: uuidString,
})

export const DeviceInputSchema = z.object({
  deviceTypeId: uuidString,
  brand: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  problem: z.string().min(1),
  solution: z.string().optional().nullable(),
  cost: z.number().min(0),
  advance: z.number().min(0),
  technicianId: uuidString,
  locationId: uuidString,
  deliveryDate: z.string().optional().nullable(), // valida formato si quieres
  deliveryTime: z.string().optional().nullable(),
})

export const ServiceDetailsSchema = z.object({
  branchId: uuidString,
  receptionDate: z.string().min(1), // valida fecha si quieres con regexp
  statusId: uuidString,
  observations: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
})

export const CreateServicePayloadSchema = z.object({
  clientId: uuidString.optional().nullable(),
  newClient: NewClientSchema.optional().nullable(),
  devices: z.array(DeviceInputSchema).min(1),
  serviceDetails: ServiceDetailsSchema,
}).refine(
  (data) => Boolean(data.clientId || data.newClient),
  {
    message: 'Debe seleccionar un cliente existente o capturar uno nuevo.',
    path: ['clientId'],
  }
)

export type CreateServicePayload = z.infer<
  typeof CreateServicePayloadSchema
>
