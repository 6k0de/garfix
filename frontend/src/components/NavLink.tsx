import type React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export const NavLink: React.FC<NavLinkProps> = ({
  href,
  children,
  className,
}) => {
  const baseClassName =
    'text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900'

  if (href.startsWith('#')) {
    return (
      <a href={href} className={cn(baseClassName, className)}>
        {children}
      </a>
    )
  }

  return (
    <Link to={href} className={cn(baseClassName, className)}>
      {children}
    </Link>
  )
}
