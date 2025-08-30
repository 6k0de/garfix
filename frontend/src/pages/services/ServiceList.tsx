import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FilterIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export const ServicesList: React.FC = () => {
  const { t } = useTranslation(['common', 'list-service'])
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    branch: '',
    technician: '',
    dateFrom: '',
    dateTo: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  // Mock data
  const mockServices = [
    {
      id: 'SRV-123456',
      client: 'Juan Pérez',
      device: 'iPhone 12',
      branch: 'Sucursal Principal',
      technician: 'María López',
      receptionDate: '2023-07-15',
      status: 'En reparación',
    },
    {
      id: 'SRV-123457',
      client: 'María González',
      device: 'Samsung S21',
      branch: 'Sucursal Norte',
      technician: 'Carlos Rodríguez',
      receptionDate: '2023-07-14',
      status: 'Esperando repuesto',
    },
    {
      id: 'SRV-123458',
      client: 'Carlos Rodríguez',
      device: 'Laptop Dell',
      branch: 'Sucursal Sur',
      technician: 'Juan Méndez',
      receptionDate: '2023-07-13',
      status: 'Completado',
    },
    {
      id: 'SRV-123459',
      client: 'Ana Martínez',
      device: 'iPad Pro',
      branch: 'Sucursal Principal',
      technician: 'María López',
      receptionDate: '2023-07-12',
      status: 'Pendiente',
    },
    {
      id: 'SRV-123460',
      client: 'Pedro Sánchez',
      device: 'MacBook Air',
      branch: 'Sucursal Norte',
      technician: 'Carlos Rodríguez',
      receptionDate: '2023-07-11',
      status: 'En diagnóstico',
    },
    {
      id: 'SRV-123461',
      client: 'Laura Jiménez',
      device: 'Huawei P40',
      branch: 'Sucursal Principal',
      technician: 'Juan Méndez',
      receptionDate: '2023-07-10',
      status: 'Listo para entrega',
    },
    {
      id: 'SRV-123462',
      client: 'Roberto Gómez',
      device: 'Xiaomi Mi 11',
      branch: 'Sucursal Sur',
      technician: 'María López',
      receptionDate: '2023-07-09',
      status: 'Entregado',
    },
    {
      id: 'SRV-123463',
      client: 'Carmen Díaz',
      device: 'HP Pavilion',
      branch: 'Sucursal Principal',
      technician: 'Carlos Rodríguez',
      receptionDate: '2023-07-08',
      status: 'Cancelado',
    },
  ]
  const [services, setServices] = useState(mockServices)
  const [filteredServices, setFilteredServices] = useState(mockServices)
  // Simulating data loading
  useEffect(() => {
    setTimeout(() => {
      setServices(mockServices)
      setFilteredServices(mockServices)
      setIsLoading(false)
    }, 1000)
  }, [])
  // Filter and search
  useEffect(() => {
    let filtered = [...services]
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (service) =>
          service.id.toLowerCase().includes(query) ||
          service.client.toLowerCase().includes(query) ||
          service.device.toLowerCase().includes(query)
      )
    }
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((service) => service.status === filters.status)
    }
    if (filters.branch) {
      filtered = filtered.filter((service) => service.branch === filters.branch)
    }
    if (filters.technician) {
      filtered = filtered.filter(
        (service) => service.technician === filters.technician
      )
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (service) =>
          new Date(service.receptionDate) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (service) => new Date(service.receptionDate) <= new Date(filters.dateTo)
      )
    }
    setFilteredServices(filtered)
    setCurrentPage(1)
  }, [searchQuery, filters, services])
  // Pagination
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }
  const handleFilterChange = ({
    name,
    value,
  }: {
    name: string
    value: string
  }) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  const resetFilters = () => {
    setFilters({
      status: '',
      branch: '',
      technician: '',
      dateFrom: '',
      dateTo: '',
    })
  }
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'En diagnóstico':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'En reparación':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
      case 'Esperando repuesto':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'Listo para entrega':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Completado':
      case 'Entregado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }
  // Filter options
  const statusOptions = [
    'Pendiente',
    'En diagnóstico',
    'En reparación',
    'Esperando repuesto',
    'Listo para entrega',
    'Completado',
    'Entregado',
    'Cancelado',
  ]
  const branchOptions = ['Sucursal Principal', 'Sucursal Norte', 'Sucursal Sur']
  const technicianOptions = ['María López', 'Carlos Rodríguez', 'Juan Méndez']
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('list-service:title')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('list-service:subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="default"
            icon={<PlusIcon size={16} />}
            onClick={() => navigate('/services/create')}
          >
            {t('list-service:buttonAddNew')}
          </Button>
        </div>
      </div>
      <Card className="mb-6 py-2">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-white dark:bg-gray-800 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
                placeholder={t('list-service:placeholder.searchInput')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Button
                variant="outline"
                icon={<FilterIcon size={16} />}
                onClick={() => setShowFilters(!showFilters)}
                className="w-full md:w-auto"
              >
                {t('list-service:filter.title')}

                <ChevronDownIcon
                  size={16}
                  className={`ml-1 transition-transform duration-200 ${
                    showFilters ? 'transform rotate-180' : ''
                  }`}
                />
              </Button>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('list-service:filter.status')}
                  </label>

                  <Select
                    name="status"
                    value={filters.status}
                    onValueChange={(val) => {
                      handleFilterChange({ name: 'status', value: val })
                    }}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <SelectValue
                        placeholder={t('list-service:filterPlaceholder.status')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <>
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        </>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor="branch"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('common:others.branch')}
                  </label>
                  <div className="relative">
                    <Select
                      name="branch"
                      value={filters.branch}
                      onValueChange={(val) => {
                        handleFilterChange({ name: 'branch', value: val })
                      }}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <SelectValue
                          placeholder={t(
                            'list-service:filterPlaceholder.branch'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {branchOptions.map((branch) => (
                          <>
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          </>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="technician"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('list-service:table.columns.technic')}
                  </label>
                  <div className="relative">
                    <Select
                      name="technician"
                      value={filters.technician}
                      onValueChange={(val) => {
                        handleFilterChange({ name: 'technician', value: val })
                      }}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <SelectValue
                          placeholder={t(
                            'list-service:filterPlaceholder.technic'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {technicianOptions.map((tech) => (
                          <>
                            <SelectItem key={tech} value={tech}>
                              {tech}
                            </SelectItem>
                          </>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="dateFrom"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('list-service:filter.dateFrom')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="dateFrom"
                      name="dateFrom"
                      className="bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={filters.dateFrom}
                      onChange={(e) => {
                        handleFilterChange({
                          name: e.target.name,
                          value: e.target.value,
                        })
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="dateTo"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('list-service:filter.dateTo')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="dateTo"
                      name="dateTo"
                      className="bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={filters.dateTo}
                      onChange={(e) => {
                        handleFilterChange({
                          name: e.target.name,
                          value: e.target.value,
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  className="mr-3"
                  onClick={resetFilters}
                >
                  {t('list-service:filter.cleanButton')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowFilters(false)}
                >
                  {t('list-service:filter.applyButton')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      <Card className="py-0 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-indigo-500"
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
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {t('list-service:table.noData')}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('list-service:table.noFilters')}
              </p>
              <div className="mt-6">
                <Button
                  variant="secondary"
                  icon={<PlusIcon size={16} />}
                  onClick={() => navigate('/services/create')}
                >
                  {t('list-service:buttonAddNew')}
                </Button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('list-service:table.columns.code')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('list-service:table.columns.client')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('common:others.device')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('common:others.branch')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('list-service:table.columns.technic')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('list-service:table.columns.date')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('list-service:table.columns.status')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('common:actions.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedServices.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {service.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                      {service.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {service.device}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {service.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {service.technician}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(service.receptionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                          service.status
                        )}`}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Ver detalles"
                        >
                          <EyeIcon size={18} />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Editar"
                        >
                          <PencilIcon size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        {!isLoading && filteredServices.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  {t('common:actions.show')}{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  {t('common:table.a')}{' '}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredServices.length
                    )}
                  </span>{' '}
                  {t('common:table.of')}{' '}
                  <span className="font-medium">{filteredServices.length}</span>{' '}
                  {t('common:actions.results_other')}
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                      currentPage === 1
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeftIcon size={18} />
                  </button>
                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        page === currentPage
                          ? 'z-10 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } text-sm font-medium`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRightIcon size={18} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
