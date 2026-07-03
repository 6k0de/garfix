import bcrypt from 'bcrypt'
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
    name: 'INE',
    description: 'Credencial para votar (INE/IFE)',
  },
  {
    name: 'Pasaporte',
    description: 'Pasaporte vigente',
  },
  {
    name: 'Licencia de conducir',
    description: 'Licencia de conducir vigente',
  },
]

const DEFAULT_STATUSES = [
  {
    name: 'Recibido',
    description: 'Equipo recibido en sucursal',
    colorHex: '#2563EB',
  },
  {
    name: 'En proceso',
    description: 'Servicio en proceso',
    colorHex: '#F59E0B',
  },
  {
    name: 'Entregado',
    description: 'Servicio entregado al cliente',
    colorHex: '#16A34A',
  },
  {
    name: 'Cancelado',
    description: 'Servicio cancelado',
    colorHex: '#DC2626',
  },
]

const DEFAULT_ROLES = [
  {
    code: 'SUPERADMIN',
    name: 'Superadmin',
    description: 'Perfil con control total multiempresa',
  },
  {
    code: 'ADMIN',
    name: 'Administrador',
    description: 'Administrador del cliente',
  },
  {
    code: 'TECH',
    name: 'Técnico',
    description: 'Usuario tecnico para servicios',
  },
]

const DEFAULT_COMPANY_ROLES = [
  {
    code: 'TECH',
    name: 'Técnico',
    description: 'Usuario tecnico para servicios',
  },
]

const DEFAULT_SUPERADMIN = {
  name: process.env.SUPERADMIN_NAME?.trim() || 'Superadmin Garfix',
  email: process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() || 'superadmin@garfix.local',
  username: process.env.SUPERADMIN_USERNAME?.trim().toLowerCase() || 'superadmin',
  password: process.env.SUPERADMIN_PASSWORD?.trim() || 'SuperAdmin123!',
}

const normalizeRoleNameKey = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const TECH_ROLE_KEYS = new Set(['tecnico', 'tech'])

const isTechnicianRoleName = (value: string | null | undefined) =>
  TECH_ROLE_KEYS.has(normalizeRoleNameKey(value))

const buildCompanyRoleCode = (companyId: string, code: string) => {
  const companyKey = companyId.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16)
  const normalizedCode = code.replace(/[^A-Z0-9_]/g, '').toUpperCase()

  return `COMPANY_${companyKey}_${normalizedCode}`.slice(0, 50)
}

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
  await Promise.all(
    DEFAULT_ROLES.map((role) =>
      prisma.role.upsert({
        where: {
          code: role.code,
        },
        update: {
          name: role.name,
          description: role.description,
          companyId: null,
        },
        create: {
          ...role,
          companyId: null,
        },
      }),
    ),
  )
}

export const ensureCompanyRoles = async (companyId: string) => {
  const normalizedCompanyId = companyId.trim()
  if (!normalizedCompanyId) {
    return []
  }

  const roles = await Promise.all(
    DEFAULT_COMPANY_ROLES.map((role) =>
      prisma.role.upsert({
        where: {
          companyId_name: {
            companyId: normalizedCompanyId,
            name: role.name,
          },
        },
        update: {
          code: buildCompanyRoleCode(normalizedCompanyId, role.code),
          description: role.description,
        },
        create: {
          code: buildCompanyRoleCode(normalizedCompanyId, role.code),
          name: role.name,
          description: role.description,
          companyId: normalizedCompanyId,
        },
      }),
    ),
  )

  const technicianRole = roles.find((role) => isTechnicianRoleName(role.name))
  if (!technicianRole) {
    return roles
  }

  const usersUsingGlobalTechRole = await prisma.user.findMany({
    where: {
      companyId: normalizedCompanyId,
      role: {
        companyId: null,
        name: {
          in: ['Técnico', 'Tecnico', 'Tech'],
        },
      },
    },
    select: {
      id: true,
    },
  })

  if (usersUsingGlobalTechRole.length > 0) {
    await prisma.user.updateMany({
      where: {
        id: {
          in: usersUsingGlobalTechRole.map((user) => user.id),
        },
      },
      data: {
        roleId: technicianRole.id,
      },
    })
  }

  return roles
}

export const ensureSuperadminUser = async () => {
  // En producción exigimos una contraseña explícita: nunca usar la de por defecto.
  if (process.env.NODE_ENV === 'production' && !process.env.SUPERADMIN_PASSWORD?.trim()) {
    throw new Error(
      'SUPERADMIN_PASSWORD es obligatoria en producción para crear el superadministrador.',
    )
  }

  await ensureDefaultRoles()

  const superAdminRole = await prisma.role.findFirst({
    where: {
      companyId: null,
      code: 'SUPERADMIN',
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!superAdminRole) {
    throw new Error('No fue posible resolver el rol Superadmin.')
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: DEFAULT_SUPERADMIN.email },
        { username: DEFAULT_SUPERADMIN.username },
      ],
    },
    select: {
      id: true,
      password: true,
      roleId: true,
    },
  })

  if (!existing) {
    const passwordHash = await bcrypt.hash(DEFAULT_SUPERADMIN.password, 12)

    return prisma.user.create({
      data: {
        name: DEFAULT_SUPERADMIN.name,
        email: DEFAULT_SUPERADMIN.email,
        username: DEFAULT_SUPERADMIN.username,
        password: passwordHash,
        roleId: superAdminRole.id,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })
  }

  if (!existing.password || existing.roleId !== superAdminRole.id) {
    const data: {
      password?: string
      roleId?: string
    } = {}

    if (!existing.password) {
      data.password = await bcrypt.hash(DEFAULT_SUPERADMIN.password, 12)
    }

    if (existing.roleId !== superAdminRole.id) {
      data.roleId = superAdminRole.id
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({
        where: {
          id: existing.id,
        },
        data,
      })
    }
  }

  return existing
}

interface EnsureDefaultClientCatalogsOptions {
  companyId?: string | null
  branchId?: string | null
}

const resolveClientCatalogBranch = async (
  options?: EnsureDefaultClientCatalogsOptions,
) => {
  const normalizedCompanyId = options?.companyId?.trim() || null
  const normalizedBranchId = options?.branchId?.trim() || null

  if (normalizedBranchId) {
    const branch = await prisma.branch.findFirst({
      where: {
        id: normalizedBranchId,
        ...(normalizedCompanyId ? { companyId: normalizedCompanyId } : {}),
      },
      select: {
        id: true,
        companyId: true,
      },
    })

    if (branch) {
      return branch
    }
  }

  if (normalizedCompanyId) {
    const firstCompanyBranch = await prisma.branch.findFirst({
      where: {
        companyId: normalizedCompanyId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        companyId: true,
      },
    })

    if (firstCompanyBranch) {
      return firstCompanyBranch
    }

    return prisma.branch.create({
      data: {
        name: DEFAULT_BRANCH.name,
        address: DEFAULT_BRANCH.address,
        companyId: normalizedCompanyId,
      },
      select: {
        id: true,
        companyId: true,
      },
    })
  }

  return ensureDefaultBranch()
}

export const ensureDefaultClientCatalogs = async (
  options?: EnsureDefaultClientCatalogsOptions,
) => {
  const branch = await resolveClientCatalogBranch(options)

  await Promise.all([
    ...DEFAULT_TYPE_CLIENTS.map((item) =>
      prisma.typeClient.upsert({
        where: {
          branchId_name: {
            branchId: branch.id,
            name: item.name,
          },
        },
        update: {
          description: item.description,
        },
        create: {
          name: item.name,
          description: item.description,
          branchId: branch.id,
        },
      }),
    ),
    ...DEFAULT_DOCUMENT_TYPES.map((item) =>
      prisma.documentType.upsert({
        where: {
          branchId_name: {
            branchId: branch.id,
            name: item.name,
          },
        },
        update: {
          description: item.description,
        },
        create: {
          name: item.name,
          description: item.description,
          branchId: branch.id,
        },
      }),
    ),
    ...DEFAULT_STATUSES.map((item) =>
      prisma.status.upsert({
        where: {
          branchId_name: {
            branchId: branch.id,
            name: item.name,
          },
        },
        update: {
          description: item.description,
          colorHex: item.colorHex,
        },
        create: {
          name: item.name,
          description: item.description,
          colorHex: item.colorHex,
          branchId: branch.id,
        },
      }),
    ),
  ])
}
