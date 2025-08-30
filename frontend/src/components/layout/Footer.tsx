import type React from 'react'
import { Trans, useTranslation } from 'react-i18next'
//import { Link } from 'react-router-dom'

export const Footer: React.FC = () => {
  const { i18n } = useTranslation()
  return (
    <footer className=" dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-4">
      <div className="container mx-auto flex justify-center items-center">
        <p>
          <Trans
            key={i18n.language}
            i18nKey="footer:copyright"
            values={{ year: new Date().getFullYear(), brand: 'Garfix' }}
          />
        </p>
      </div>
    </footer>
  )
}
