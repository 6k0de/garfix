import {
  BuildingIcon,
  CirclePlusIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  getActiveBranchId,
  getAuthUser,
  isAdminUser,
  isSuperAdminUser,
  isTechnicianUser,
  setActiveBranchId,
} from '@/lib/auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import { useMenuItems } from '@/customHooks/MenuItems'
import { createBranch, getAllBranches, type BranchItem } from '@/services/catalogs/branch.api'

interface SidebarProps {
  className?: string
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}) => {
  const items = useMenuItems()
  const user = getAuthUser()
  const isSuperAdmin = isSuperAdminUser(user)
  const isAdmin = isAdminUser(user)
  const isTechnician = isTechnicianUser(user)
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [branchNameDraft, setBranchNameDraft] = useState('')
  const [isCreatingBranch, setIsCreatingBranch] = useState(false)
  const [branchError, setBranchError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedMenu, setExpandedMenu] = useState<string[]>(
    isSuperAdmin ? ['/superadmin'] : ['services', 'catalogs']
  )
  const [collapsedSubmenuId, setCollapsedSubmenuId] = useState<string | null>(null)

  useEffect(() => {
    setCollapsedSubmenuId(null)
  }, [collapsed, location.pathname])

  useEffect(() => {
    if (isSuperAdmin) return

    let mounted = true

    const loadBranches = async () => {
      try {
        const data = await getAllBranches()
        if (!mounted) return

        setBranches(data)
        setBranchError(null)

        const persisted = getActiveBranchId()
        const technicianBranchId = isTechnician ? user?.branchId ?? null : null

        const fallbackBranchId =
          technicianBranchId ||
          (persisted && data.some((branch) => branch.id === persisted) ? persisted : null) ||
          data[0]?.id ||
          ''

        setSelectedBranchId(fallbackBranchId)

        setActiveBranchId(fallbackBranchId)
      } catch (error: any) {
        if (!mounted) return
        setBranches([])
        setBranchError(error?.response?.data?.message || 'No fue posible cargar sucursales.')
      }
    }

    void loadBranches()

    return () => {
      mounted = false
    }
  }, [isSuperAdmin, isTechnician, user?.branchId])

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId)
    setActiveBranchId(branchId)
  }

  const handleCreateBranch = async () => {
    if (!isAdmin || isTechnician || isSuperAdmin) return

    const normalizedName = branchNameDraft.trim()
    if (!normalizedName) {
      setBranchError('Escribe el nombre de la sucursal.')
      return
    }

    setIsCreatingBranch(true)
    setBranchError(null)
    try {
      const created = await createBranch({
        name: normalizedName,
        address: 'Dirección pendiente',
      })

      setBranchNameDraft('')
      const refreshed = await getAllBranches()
      setBranches(refreshed)

      const createdBranchId =
        created?.id ||
        refreshed.find((branch) => branch.name === normalizedName)?.id ||
        selectedBranchId

      if (createdBranchId) {
        handleBranchSelect(createdBranchId)
      }
    } catch (error: any) {
      setBranchError(error?.response?.data?.message || 'No fue posible crear la sucursal.')
    } finally {
      setIsCreatingBranch(false)
    }
  }

  const toggleSubMenu = (id: string) => {
    if (collapsed) {
      setCollapsedSubmenuId((prev) => (prev === id ? null : id))
      return
    }

    setExpandedMenu((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const isActive = (path: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    if (normalizedPath === '/') return location.pathname === '/'
    return location.pathname.startsWith(normalizedPath)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    setCollapsedSubmenuId(null)
    onNavigate?.()
  }

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId)
  const selectedBranchName = selectedBranch?.name || 'Sin sucursal'
  const branchLimit = user?.company?.branchLimit ?? 0
  const usedBranches = branches.length

  const userName = user?.name || 'Usuario'
  const userContact = user?.email || user?.username || 'Sin contacto'
  const userInitials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'

  return (
    <div
      className={cn(
        'bg-white border-r dark:bg-gray-800 shadow-md flex-shrink-0 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div
            className={cn(
              'mb-6',
              collapsed
                ? 'flex flex-col items-center gap-3'
                : 'flex items-center justify-between gap-2 pl-2'
            )}
          >
            <h1 className="text-3xl font-bold text-gray-800 dark:text-indigo-400">
              {collapsed ? 'G' : 'Garfix'}
            </h1>
            {onToggleCollapse && (
              <button
                type="button"
                className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/90 text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 dark:bg-gray-700/80 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus-visible:ring-offset-gray-800"
                onClick={onToggleCollapse}
                aria-expanded={!collapsed}
                aria-label={
                  collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'
                }
                title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              >
                <span className="transition-transform duration-200 group-hover:scale-105">
                  {collapsed ? (
                    <PanelLeftOpenIcon size={16} />
                  ) : (
                    <PanelLeftCloseIcon size={16} />
                  )}
                </span>
              </button>
            )}
          </div>

          {!isSuperAdmin &&
            (collapsed ? (
              <div
                className="flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                title={selectedBranchName}
              >
                <BuildingIcon size={18} className="text-gray-600 dark:text-gray-300" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 transition-colors duration-200">
                  <Select
                    name="type"
                    value={selectedBranchId}
                    onValueChange={handleBranchSelect}
                  >
                    <SelectTrigger
                      icon={
                        <BuildingIcon
                          size={18}
                          className="text-gray-600 dark:text-gray-300"
                        />
                      }
                      className="flex-1 outline-none text-gray-700 dark:text-gray-200 cursor-pointer"
                    >
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAdmin && (
                  <div className="rounded-md border border-gray-200/80 bg-white/90 px-3 py-2 text-[11px] text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <p>
                      Sucursales: <span className="font-semibold">{usedBranches}</span> / {branchLimit}
                    </p>
                    <p className="truncate">
                      Activa: <span className="font-medium">{selectedBranchName}</span>
                    </p>
                  </div>
                )}

                {!isTechnician && isAdmin && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={branchNameDraft}
                        onChange={(event) => setBranchNameDraft(event.target.value)}
                        placeholder="Nueva sucursal"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/40"
                      />
                      <button
                        type="button"
                        onClick={() => void handleCreateBranch()}
                        disabled={isCreatingBranch}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-indigo-300"
                        aria-label="Agregar sucursal"
                        title="Agregar nueva sucursal"
                      >
                        <CirclePlusIcon size={16} />
                      </button>
                    </div>

                    {branchError && (
                      <p className="text-[11px] text-red-500 dark:text-red-400">{branchError}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>

        <nav className="flex-1 pt-4 pb-4 overflow-y-auto overflow-x-visible">
          <ul className="px-2 space-y-1">
            {items.map((item) => (
              <li key={item.id} className="mb-1 relative">
                {item.submenu ? (
                  <div>
                    <button
                      className={cn(
                        'flex w-full rounded-lg transition-all duration-200',
                        collapsed
                          ? 'items-center justify-center p-3'
                          : 'items-center justify-between p-3',
                        isActive(item.id)
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                      onClick={() => toggleSubMenu(item.id)}
                      title={collapsed ? item.label : undefined}
                      aria-label={item.label}
                    >
                      <div className="flex items-center">
                        <span className={collapsed ? '' : 'mr-3'}>{item.icon}</span>
                        {!collapsed && <span className="font-medium">{item.label}</span>}
                      </div>

                      {!collapsed && (
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedMenu.includes(item.id) ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      )}
                    </button>

                    {!collapsed && expandedMenu.includes(item.id) && (
                      <ul className="mt-1 ml-6 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              className={cn(
                                'flex items-center w-full p-2 rounded-lg transition-all duration-200',
                                location.pathname === subItem.id
                                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              )}
                              onClick={() => handleNavigate(subItem.id)}
                            >
                              <span className="mr-3">{subItem.icon}</span>
                              <span className="font-medium text-sm">{subItem.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {collapsed && collapsedSubmenuId === item.id && (
                      <div className="absolute left-full top-0 z-30 ml-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {item.label}
                        </p>
                        <ul className="space-y-1">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.id}>
                              <button
                                className={cn(
                                  'flex items-center w-full p-2 rounded-lg transition-all duration-200',
                                  location.pathname === subItem.id
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                )}
                                onClick={() => handleNavigate(subItem.id)}
                              >
                                <span className="mr-3">{subItem.icon}</span>
                                <span className="font-medium text-sm">{subItem.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className={cn(
                      'flex w-full rounded-lg transition-all duration-200',
                      collapsed
                        ? 'items-center justify-center p-3'
                        : 'items-center p-3',
                      location.pathname === item.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    onClick={() => handleNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                  >
                    <span className={collapsed ? '' : 'mr-3'}>{item.icon}</span>
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div
            className={cn(
              'rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer',
              collapsed ? 'flex items-center justify-center p-2' : 'flex items-center space-x-3 p-2'
            )}
            title={collapsed ? userName : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userContact}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
