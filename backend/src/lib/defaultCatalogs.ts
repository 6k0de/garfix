import { prisma } from './prisma.js'

const DEFAULT_COMPANY = {
  name: 'Empresa Demo',
  email: 'demo@garfix.local',
  status: 'active',
}

const DEFAULT_BRANCH = {
  name: 'Sucursal Principal',
  address: 'Direccion de prueba',
}

const DEFAULT_TYPE_CLIENTS = [
  {
    name: 'Persona natural',
    description: 'Cliente individual de prueba',
  },
  {
    name: 'Empresa',
    description: 'Cliente corporativo de prueba',
  },
]

const DEFAULT_DOCUMENT_TYPES = [
  {
    name: 'Cedula',
    description: 'Documento de identidad',
  },
  {
    name: 'NIT',
    description: 'Numero de identificacion tributaria',
  },
]

const DEFAULT_ROLES = [
  {
    name: 'Administrador',
    description: 'Acceso completo al sistema',
  },
  {
    name: 'Técnico',
    description: 'Usuario tecnico para servicios',
  },
]

export const ensureDefaultCompany = async () => {
  return prisma.customerCompany.upsert({
    where: { email: DEFAULT_COMPANY.email },
    update: {
      name: DEFAULT_COMPANY.name,
      status: DEFAULT_COMPANY.status,
    },
    create: {
      name: DEFAULT_COMPANY.name,
      email: DEFAULT_COMPANY.email,
      status: DEFAULT_COMPANY.status,
    },
    select: { id: true },
  })
}

export const ensureDefaultBranch = async () => {
  const existingBranch = await prisma.branch.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, companyId: true },
  })

  if (existingBranch) {
    return existingBranch
  }

  const company = await ensureDefaultCompany()

  return prisma.branch.create({
    data: {
      name: DEFAULT_BRANCH.name,
      address: DEFAULT_BRANCH.address,
      companyId: company.id,
    },
    select: { id: true, companyId: true },
  })
}

export const ensureDefaultRoles = async () => {
  const count = await prisma.role.count()
  if (count > 0) return

  await prisma.role.createMany({
    data: DEFAULT_ROLES,
    skipDuplicates: true,
  })
}

export const ensureDefaultClientCatalogs = async () => {
  const [typeClientCount, documentTypeCount] = await Promise.all([
    prisma.typeClient.count(),
    prisma.documentType.count(),
  ])

  if (typeClientCount === 0) {
    await prisma.typeClient.createMany({
      data: DEFAULT_TYPE_CLIENTS,
      skipDuplicates: true,
    })
  }

  if (documentTypeCount === 0) {
    await prisma.documentType.createMany({
      data: DEFAULT_DOCUMENT_TYPES,
      skipDuplicates: true,
    })
  }

  await ensureDefaultBranch()
}
