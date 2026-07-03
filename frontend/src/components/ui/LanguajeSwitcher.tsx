// components/LanguageSwitcher.tsx
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LANGS = {
  es: { label: 'Español', flag: '🇲🇽' },
  en: { label: 'English', flag: '🇺🇸' },
} as const

export const LanguajeSwitch: React.FC = () => {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('es') ? 'es' : 'en'

  const setLang = (lng: 'es' | 'en') => {
    i18n.changeLanguage(lng)
    localStorage.setItem('i18nextLng', lng)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Cambiar idioma"
          className="h-10 gap-2 rounded-full border-slate-200/80 bg-white/85 px-3.5 text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-white dark:border-slate-600 dark:bg-slate-800/85 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:bg-slate-700"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {LANGS[current].flag}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.12em]">{current}</span>
          <ChevronDownIcon size={14} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl border-slate-200/80 bg-white/95 p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        {Object.entries(LANGS).map(([lng, meta]) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => setLang(lng as 'es' | 'en')}
            className="gap-3 rounded-xl px-3 py-2.5"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {meta.flag}
            </span>
            <span className="flex-1">{meta.label}</span>
            {current === lng && <Check className="h-4 w-4 text-teal-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
