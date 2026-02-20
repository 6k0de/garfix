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
interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select'
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
          ) : (
            <input
              type="text"
              id={field.name}
              name={field.name}
              value={getFieldValue(field.name)}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
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
