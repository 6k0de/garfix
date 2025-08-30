import type React from 'react'
import { useState } from 'react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { BellIcon, MenuIcon } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useTranslation } from 'react-i18next'
import { LanguajeSwitch } from '../ui/LanguajeSwitcher'

export const Topbar: React.FC = () => {
  const { t } = useTranslation('profile')
  const [showMobileMenu, setShowMobilMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifications = [
    {
      id: 1,
      text: 'Nuevo servicio asignado',
      time: 'Hace 5 min',
    },
    {
      id: 2,
      text: 'Inventario bajo de pantallas iPhone',
      time: 'Hace 2 horas',
    },
    {
      id: 3,
      text: 'Servicio #1234 completado',
      time: 'Hace 1 día',
    },
  ]
  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm z-10 transition-colors duration-300">
        <div className="flex items-center px-4 py-3">
          <button
            className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setShowMobilMenu(!showMobileMenu)}
          >
            <MenuIcon size={24} />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white md:hidden pl-3">
            Garfix
          </h2>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="relative">
              <button
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <BellIcon size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 z-20 transition-all duration-200 animate-fadeIn">
                  <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    Notificaciones
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {notification.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                    <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                      Ver todas
                    </button>
                  </div>
                </div>
              )}
            </div>
            <ThemeToggle />
            <LanguajeSwitch />
            <div className="relative">
              <button
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  <span className="text-sm font-medium">AT</span>
                </div>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 z-20 transition-all duration-200 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Admin Taller
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      admin@taller.com
                    </p>
                  </div>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('profile:myProfile')}
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('profile:logout')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {showMobileMenu && (
        <div
          className="absolute inset-0 z-20 md:hidden bg-black/20"
          onClick={() => setShowMobilMenu(false)}
        >
          <div
            className="w-64 h-full bg-white dark:bg-gray-800 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              className="block md:hidden"
              onNavigate={() => setShowMobilMenu(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
