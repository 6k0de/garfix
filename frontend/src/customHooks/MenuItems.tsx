import {
  BuildingIcon,
  ClipboardListIcon,
  FileTextIcon,
  HomeIcon,
  ListIcon,
  MapPinIcon,
  MonitorSmartphoneIcon,
  PackageIcon,
  PencilRulerIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
  UserIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const useMenuItems = () => {
  const { t } = useTranslation('menu')
  return [
    {
      id: '/',
      label: t('home'),
      icon: <HomeIcon size={20} />,
    },
    {
      id: 'services',
      label: t('workshop'),

      icon: <PencilRulerIcon size={20} />,
      submenu: [
        {
          id: '/services/create',
          label: t('submenu.workshop.services'),
          icon: <PlusIcon size={18} />,
        },
        {
          id: '/services/list',
          label: t('submenu.workshop.listServices'),
          icon: <ClipboardListIcon size={18} />,
        },
      ],
    },
    {
      id: '/inventory',
      label: t('inventory'),
      icon: <PackageIcon size={20} />,
    },
    {
      id: 'catalogs',
      label: t('catalogs'),
      icon: <ListIcon size={20} />,
      submenu: [
        {
          id: '/catalogs/branches',
          label: t('submenu.catalogs.branches'),
          icon: <BuildingIcon size={18} />,
        },
        {
          id: '/catalogs/clients',
          label: t('submenu.catalogs.clients'),
          icon: <UserIcon size={18} />
        },
        {
          id: '/catalogs/type-clients',
          label: t('submenu.catalogs.typeClients'),
          icon: <UserIcon size={18} />
        },
        {
          id: '/catalogs/document-types',
          label: t('submenu.catalogs.documentTypes'),
          icon: <FileTextIcon size={18} />
        },
        {
          id: '/catalogs/technicians',
          label: t('submenu.catalogs.technics'),
          icon: <UserIcon size={18} />
        },
        {
          id: '/catalogs/roles',
          label: t('submenu.catalogs.roles'),
          icon: <ShieldIcon size={18} />,
        },
        {
          id: '/catalogs/status',
          label: t('submenu.catalogs.status'),
          icon: <TagIcon size={18} />,
        },
        {
          id: '/catalogs/locations',
          label: t('submenu.catalogs.locations'),
          icon: <MapPinIcon size={18} />,
        },
        {
          id: '/catalogs/devices',
          label: t('submenu.catalogs.devices'),
          icon: <MonitorSmartphoneIcon size={18} />,
        },
      ],
    },
    {
      id: '/setting',
      label: t('settings'),
      icon: <SettingsIcon size={20} />,
    },
  ]
}
