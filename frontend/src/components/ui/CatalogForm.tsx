import React from 'react'
import { Button } from './Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select'
import { useTranslation } from 'react-i18next'
import { normalizeHexColor } from '@/lib/color'

const COLOR_SWATCHES = [
  '#0EA5E9',
  '#14B8A6',
  '#22C55E',
  '#EAB308',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#6366F1',
  '#64748B',
]

const normalizeColorDraft = (value: string) => {
  const clean = value.toUpperCase().replace(/[^#0-9A-F]/g, '')
  if (!clean) {
    return ''
  }

  const withoutHash = clean.replace(/#/g, '')
  return `#${withoutHash.slice(0, 6)}`
}
interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'color' | 'password'
  required?: boolean
  options?: {
    value: string
    label: string
  }[]
  placeholder?: string
}
interface CatalogFormProps<TValues extends object = Record<string, unknown>> {
  fields: FormField[]
  values: TValues
  onChange: (name: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  errors: Record<string, string>
}
export const CatalogForm = <TValues extends object>({
  fields,
  values,
  onChange,
  onSubmit,
  isSubmitting,
  errors,
}: CatalogFormProps<TValues>) => {
  const { t } = useTranslation(['common', 'roles'])
  const getFieldValue = (name: string) => {
    const value = (values as Record<string, unknown>)[name]
    return typeof value === 'string' ? value : ''
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {field.label}{' '}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              id={field.name}
              name={field.name}
              value={getFieldValue(field.name)}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              rows={3}
              className="bg-white dark:bg-gray-800 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          ) : field.type === 'select' ? (
            <Select
              key={field.name + getFieldValue(field.name)}
              name={field.name}
              value={getFieldValue(field.name)}
              onValueChange={(val) => onChange(field.name, val)}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <SelectValue placeholder={t('common:actions.select')} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'color' ? (
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 dark:border-gray-700 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="color"
                  id={field.name}
                  name={field.name}
                  value={normalizeHexColor(getFieldValue(field.name))}
                  onChange={(e) => onChange(field.name, e.target.value.toUpperCase())}
                  className="h-11 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-900"
                />
                <input
                  type="text"
                  value={getFieldValue(field.name)}
                  onChange={(e) =>
                    onChange(field.name, normalizeColorDraft(e.target.value))
                  }
                  required={field.required}
                  placeholder={field.placeholder || '#64748B'}
                  maxLength={7}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={`${field.name}-${swatch}`}
                    type="button"
                    onClick={() => onChange(field.name, swatch)}
                    className="h-7 w-7 rounded-full border border-white shadow-sm ring-1 ring-black/10 transition-transform hover:scale-105 dark:border-gray-800 dark:ring-white/15"
                    style={{ backgroundColor: swatch }}
                    aria-label={`Seleccionar color ${swatch}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <input
              type={field.type === 'password' ? 'password' : 'text'}
              id={field.name}
              name={field.name}
              value={getFieldValue(field.name)}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              autoComplete={field.type === 'password' ? 'new-password' : undefined}
              className="bg-white dark:bg-gray-800 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          )}
          {errors[field.name] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors[field.name]}
            </p>
          )}
        </div>
      ))}
      <div className="flex justify-end pt-4">
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t('roles:formNewRoleLabel.saveButton')}
            </span>
          ) : (
            <>{t('roles:formEditRole.saveButton')}</>
          )}
        </Button>
      </div>
    </form>
  )
}
