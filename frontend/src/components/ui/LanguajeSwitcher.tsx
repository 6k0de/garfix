// components/LanguageSwitcher.tsx
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MexicoSVG from '../../assets/Mexico-42.svg'
import AmericaSVG from '../../assets/America-44.svg'

const LANGS = {
  es: { label: 'Español' }, // cambia a 🇲🇽 si prefieres
  en: { label: 'English' },
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
        <Button variant="outline" size="sm" className="gap-2">
          <img
            src={current === 'es' ? MexicoSVG : AmericaSVG}
            alt=""
            className="h-4 w-6 rounded-[2px]"
          />
          <span className="uppercase">{current}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(LANGS).map(([lng, meta]) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => setLang(lng as 'es' | 'en')}
            className="gap-2"
          >
            <img
              src={lng === 'es' ? MexicoSVG : AmericaSVG}
              alt=""
              className="h-4 w-6 rounded-[2px]"
            />
            <span className="flex-1">{meta.label}</span>
            {current === lng && <Check className="h-4 w-4 opacity-60" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
