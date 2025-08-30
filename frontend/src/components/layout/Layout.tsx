import type React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Footer } from './Footer'

export const Layout: React.FC = () => {
  return (
    <>
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <Sidebar className="hidden md:block" />
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
