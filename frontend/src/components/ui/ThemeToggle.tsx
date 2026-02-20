// src/components/ui/ThemeToggle.tsx
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useThemeStore } from '@/utils/store/ThemeStore'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={
        theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'
      }
      className="p-2"
    >
      {theme === 'dark' ? (
        <Sun className="text-amber-400" size={20} />
      ) : (
        <Moon size={20} />
      )}
    </Button>
  )
}
