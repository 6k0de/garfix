import { useThemeStore } from '@/utils/store/ThemeStore'
import { useEffect } from 'react'

export const ThemeEffect = () => {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])
  return null
}
