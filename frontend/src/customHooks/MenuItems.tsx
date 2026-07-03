import {
  BarChart3Icon,
  BuildingIcon,
  ClipboardListIcon,
  FileTextIcon,
  HomeIcon,
  ListIcon,
  MapPinIcon,
  MonitorSmartphoneIcon,
  PencilRulerIcon,
  PlusIcon,
  ShieldIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAuthUser, resolveRoleKey } from '@/lib/auth'
import { filterByRole } from '@/utils/menu/filterByRole'
import type { MenuItem, Role } from '@/@types'

const resolveRole = (roleName: string | null | undefined): Role | undefined => {
  const key = resolveRoleKey(roleName)
  if (!key) return undefined

  if (key === 'superadmin' || key === 'super admin') return 'SUPERADMIN'
  if (key === 'administrador' || key === 'admin' || key === 'administrador cliente') {
    return 'ADMIN'
  }
  if (key === 'tecnico' || key === 'tech') return 'TECH'

  return undefined
}

export const useMenuItems = () => {
  const { t } = useTranslation('menu')
  const user = getAuthUser()

  const userRole = resolveRole(user?.role?.name)
  const userRoles: Role[] = userRole ? [userRole] : []

  const items: MenuItem[] = [
    {
      id: '/',
      label: t('home'),
      icon: <HomeIcon size={20} />,
      roles: ['ADMIN']
    },
    {
      id: 'services',
      label: t('workshop'),
      icon: <PencilRulerIcon size={20} />,
      roles: ['ADMIN', 'TECH'],
      submenu: [
        {
          id: '/services/create',
          label: t('submenu.workshop.services'),
          icon: <PlusIcon size={18} />,
          roles: ['ADMIN', 'TECH'],
        },
        {
          id: '/services/list',
          label: t('submenu.workshop.listServices'),
          icon: <ClipboardListIcon size={18} />,
          roles: ['ADMIN', 'TECH'],
        },
      ],
    },
   /*  {
      id: '/inventory',
      label: t('inventory'),
      icon: <PackageIcon size={20} />,
      roles: ['ADMIN'],
    }, */
    {
      id: 'catalogs',
      label: t('catalogs'),
      icon: <ListIcon size={20} />,
      roles: ['ADMIN', 'TECH'],
      submenu: [
        {
          id: '/catalogs/branches',
          label: t('submenu.catalogs.branches'),
          icon: <BuildingIcon size={18} />,
          roles: ['ADMIN'],
        },
        {
          id: '/catalogs/clients',
          label: t('submenu.catalogs.clients'),
          icon: <UserIcon size={18} />,
          roles: ['ADMIN', 'TECH'],
        },
        {
          id: '/catalogs/type-clients',
          label: t('submenu.catalogs.typeClients'),
          icon: <UserIcon size={18} />,
          roles: ['ADMIN'],
        },
        {
          id: '/catalogs/document-types',
          label: t('submenu.catalogs.documentTypes'),
          icon: <FileTextIcon size={18} />,
          roles: ['ADMIN', 'TECH'],
        },
        {
          id: '/catalogs/technicians',
          label: t('submenu.catalogs.technics'),
          icon: <UserIcon size={18} />,
          roles: ['ADMIN'],
        },
        {
          id: '/catalogs/roles',
          label: t('submenu.catalogs.roles'),
          icon: <ShieldIcon size={18} />,
          roles: ['ADMIN'],
        },
        {
          id: '/catalogs/status',
          label: t('submenu.catalogs.status'),
          icon: <TagIcon size={18} />,
          roles: ['ADMIN', 'TECH'],
        },
        {
          id: '/catalogs/locations',
          label: t('submenu.catalogs.locations'),
          icon: <MapPinIcon size={18} />,
          roles: ['ADMIN', 'TECH'],
        },
        {
          id: '/catalogs/devices',
          label: t('submenu.catalogs.devices'),
          icon: <MonitorSmartphoneIcon size={18} />,
          roles: ['ADMIN', 'TECH'],
        },
      ],
    },
    {
      id: '/superadmin',
      label: t('superadmin'),
      icon: <UsersIcon size={18} />,
      roles: ['SUPERADMIN'],
      submenu: [
        {
          id: '/superadmin/dashboard',
          label: t('submenu.superadmin.dashboard'),
          icon: <BarChart3Icon size={18} />,
          roles: ['SUPERADMIN']
        },
        {
          id: '/superadmin/clients',
          label: t('submenu.superadmin.clients'),
          icon: <BuildingIcon size={18} />,
          roles: ['SUPERADMIN']
        },
        {
          id: '/superadmin/new-client',
          label: t('submenu.superadmin.newClient'),
          icon: <UserIcon size={18} />,
          roles: ['SUPERADMIN']
        },
        {
          id: '/superadmin/roles',
          label: t('submenu.catalogs.roles'),
          icon: <ShieldIcon size={18} />,
          roles: ['SUPERADMIN']
        }
      ]
    },
    /* {
      id: '/setting',
      label: t('settings'),
      icon: <SettingsIcon size={20} />,
      roles: ['ADMIN', 'SUPERADMIN'],
    }, */
  ]

  return filterByRole(items, userRoles)
}
