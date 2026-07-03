import type React from 'react'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Footer } from './Footer'

export const Layout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('garfix-sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    window.localStorage.setItem(
      'garfix-sidebar-collapsed',
      String(isSidebarCollapsed)
    )
  }, [isSidebarCollapsed])

  return (
    <>
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Sidebar
          className="hidden md:block"
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </>
  )
}
