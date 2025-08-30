import { BuildingIcon } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import { useMenuItems } from '@/customHooks/MenuItems'
export const Sidebar: React.FC<{
  className?: string
  onNavigate?: () => void
}> = ({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) => {
  const items = useMenuItems()
  const [selectBranch, setselectedBranch] = useState('Sucursal principal')
  const navigate = useNavigate()
  const location = useLocation()
  const branches = ['Sucursal principal', 'Sucursal 2', 'Sucursal 3']
  const [expandedMenu, setExpandedMenu] = useState<string[]>([
    'services',
    'catalogs',
  ])

  const toggleSubMenu = (id: string) => {
    setExpandedMenu((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    onNavigate?.()
  }

  return (
    <>
      <div
        className={cn(
          'w-64 bg-white border-r dark:bg-gray-800 shadow-md flex-shrink-0 transition-colors duration-300',
          className
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center pl-2 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-indigo-400">
                Garfix
              </h1>
            </div>
            <div className="relative">
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700  cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                <Select
                  name="type"
                  value={selectBranch}
                  onValueChange={(val) => setselectedBranch(val)}
                >
                  <SelectTrigger
                    icon={
                      <BuildingIcon
                        size={18}
                        className="text-gray-600 dark:text-gray-300"
                      />
                    }
                    className=" flex-1 outline-none text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    <SelectValue placeholder="Seleccionar dispositivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
            <ul className="px-2 space-y-1">
              {items.map((item) => (
                <li key={item.id} className="mb-1">
                  {item.submenu ? (
                    <div>
                      <button
                        className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 ${
                          isActive(item.id)
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => toggleSubMenu(item.id)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedMenu.includes(item.id)
                              ? 'transform rotate-180'
                              : ''
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
                      </button>
                      {expandedMenu.includes(item.id) && (
                        <ul className="mt-1 ml-6 space-y-1">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.id}>
                              <button
                                className={`flex items-center w-full p-2 rounded-lg transition-all duration-200 ${
                                  location.pathname === subItem.id
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => handleNavigate(subItem.id)}
                              >
                                <span className="mr-3">{subItem.icon}</span>
                                <span className="font-medium text-sm">
                                  {subItem.label}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <button
                      className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 ${
                        location.pathname === item.id
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleNavigate(item.id)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                AT
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Admin Taller
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  admin@taller.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
