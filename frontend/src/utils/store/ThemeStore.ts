import type { Theme, ThemeStore } from '@/@types/theme'
import { create } from 'zustand'

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const savedTheme = (localStorage.getItem('theme') as Theme) || null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  }
  return 'light'
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    set({ theme })
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(nextTheme)
  },
}))
