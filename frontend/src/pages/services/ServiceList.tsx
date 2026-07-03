import { Button } from '@/components/ui/Button'
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
  FilterIcon,
  Pencil as EditIcon,
  PlusIcon,
  Printer as PrinterIcon,
  QrCodeIcon,
  SearchIcon,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getAllServices, getServiceTicket } from '@/services/service/service.api'
import type { ServiceListRecord } from './service.types'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  generateServiceTicketPdfBlob,
  preloadTicketPdfLibs,
} from '@/lib/serviceTicket'
import { ServiceQrModal } from '@/components/services/ServiceQrModal'
import { ServiceActionModal } from './ServiceActionModal'
import { getStatusTagStyle } from '@/lib/color'
import { useActiveBranchId } from '@/lib/useActiveBranchId'

export const ServicesList: React.FC = () => {
  const { t } = useTranslation(['common', 'list-service'])
  const navigate = useNavigate()
  const activeBranchId = useActiveBranchId()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [services, setServices] = useState<ServiceListRecord[]>([])
  const [filters, setFilters] = useState({
    status: '',
    branch: '',
    technician: '',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedQrService, setSelectedQrService] = useState<ServiceListRecord | null>(
    null
  )
  const [selectedEditService, setSelectedEditService] = useState<ServiceListRecord | null>(
    null
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [printingId, setPrintingId] = useState<number | null>(null)

  // Genera/imprime el ticket PDF del servicio directo desde la tabla, sin abrir
  // el modal del QR (útil si al crear no dio tiempo de imprimirlo).
  const handlePrintTicket = async (serviceId: number) => {
    if (printingId) return

    // Loading dentro del sistema (ícono pulsando + toast). Solo cuando el PDF ya está
    // generado se abre la ventana con el PDF (sin ventana en blanco ni descarga).
    setPrintingId(serviceId)
    const toastId = toast.loading(t('services:qr-modal.generatingPdf'))
    try {
      const ticket = await getServiceTicket(serviceId)
      const blob = await generateServiceTicketPdfBlob(ticket)
      toast.dismiss(toastId)

      const pdfWindow = window.open(URL.createObjectURL(blob), '_blank')
      if (!pdfWindow) toast.error(t('services:qr-modal.popupBlocked'))
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('services:qr-modal.pdfError')), {
        id: toastId,
      })
    } finally {
      setPrintingId(null)
    }
  }

  const loadServices = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAllServices()
      setServices(data)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible cargar la lista de servicios'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedQrService(null)
    setSelectedEditService(null)
    setFilters({
      status: '',
      branch: '',
      technician: '',
      dateFrom: '',
      dateTo: '',
    })
    if (!activeBranchId) return
    void loadServices()
  }, [activeBranchId, loadServices])

  // Precargamos las librerías de PDF para que imprimir desde la tabla sea rápido y la
  // nueva ventana del PDF se abra sin bloqueo del navegador.
  useEffect(() => {
    preloadTicketPdfLibs()
  }, [])

  const statusOptions = useMemo(
    () => Array.from(new Set(services.map((service) => service.status))).sort(),
    [services]
  )

  const branchOptions = useMemo(
    () => Array.from(new Set(services.map((service) => service.branch))).sort(),
    [services]
  )

  const technicianOptions = useMemo(
    () =>
      Array.from(new Set(services.map((service) => service.technician))).sort(),
    [services]
  )

  const filteredServices = useMemo(() => {
    let next = [...services]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      next = next.filter(
        (service) =>
          service.code.toLowerCase().includes(query) ||
          service.client.toLowerCase().includes(query) ||
          service.device.toLowerCase().includes(query) ||
          service.qrCode.toLowerCase().includes(query)
      )
    }

    if (filters.status) {
      next = next.filter((service) => service.status === filters.status)
    }
    if (filters.branch) {
      next = next.filter((service) => service.branch === filters.branch)
    }
    if (filters.technician) {
      next = next.filter((service) => service.technician === filters.technician)
    }
    if (filters.dateFrom) {
      next = next.filter(
        (service) =>
          new Date(service.receptionDate) >= new Date(`${filters.dateFrom}T00:00:00`)
      )
    }
    if (filters.dateTo) {
      next = next.filter(
        (service) =>
          new Date(service.receptionDate) <= new Date(`${filters.dateTo}T23:59:59`)
      )
    }

    return next
  }, [filters, searchQuery, services])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

  const itemsPerPage = 5
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage))

  const paginatedServices = useMemo(
    () =>
      filteredServices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage, filteredServices]
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const handleFilterChange = (name: string, value: string) => {
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

  return (
    <div>
      <Toaster />
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
                onChange={(event) => setSearchQuery(event.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('list-service:filter.status')}
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <SelectValue
                        placeholder={t('list-service:filterPlaceholder.status')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('common:others.branch')}
                  </label>
                  <Select
                    value={filters.branch}
                    onValueChange={(value) => handleFilterChange('branch', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <SelectValue
                        placeholder={t('list-service:filterPlaceholder.branch')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('list-service:table.columns.technic')}
                  </label>
                  <Select
                    value={filters.technician}
                    onValueChange={(value) => handleFilterChange('technician', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <SelectValue
                        placeholder={t('list-service:filterPlaceholder.technic')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {technicianOptions.map((technician) => (
                        <SelectItem key={technician} value={technician}>
                          {technician}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('list-service:filter.dateFrom')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="dateFrom"
                      className="bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={filters.dateFrom}
                      onChange={(event) =>
                        handleFilterChange(event.target.name, event.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('list-service:filter.dateTo')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="dateTo"
                      className="bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={filters.dateTo}
                      onChange={(event) =>
                        handleFilterChange(event.target.name, event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="mr-3" onClick={resetFilters}>
                  {t('list-service:filter.cleanButton')}
                </Button>
                <Button variant="secondary" onClick={() => setShowFilters(false)}>
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
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
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('list-service:table.columns.code')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('list-service:table.columns.client')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common:others.device')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common:others.branch')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('list-service:table.columns.technic')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('list-service:table.columns.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('list-service:table.columns.status')}
                  </th>
                  <th className="w-28 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                      {service.code}
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
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                        style={getStatusTagStyle(service.statusColor)}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td className="w-28 px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedQrService(service)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 dark:focus:ring-offset-gray-800"
                          title="Ver código QR"
                          aria-label="Ver código QR"
                        >
                          <QrCodeIcon size={18} />
                        </button>
                        <button
                          onClick={() => handlePrintTicket(service.id)}
                          disabled={printingId === service.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-teal-600 hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 dark:text-teal-400 dark:hover:bg-teal-900/30 dark:hover:text-teal-300 dark:focus:ring-offset-gray-800"
                          title={t('services:qr-modal.generatePdf')}
                          aria-label={t('services:qr-modal.generatePdf')}
                        >
                          <PrinterIcon
                            size={18}
                            className={printingId === service.id ? 'animate-pulse' : ''}
                          />
                        </button>
                        <button
                          onClick={() => setSelectedEditService(service)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 dark:focus:ring-offset-gray-800"
                          title={t('common:actions.edit')}
                          aria-label={t('common:actions.edit')}
                        >
                          <EditIcon size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
                    {Math.min(currentPage * itemsPerPage, filteredServices.length)}
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
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                    (page) => (
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
                    )
                  )}
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
      {selectedQrService && (
        <ServiceQrModal
          isOpen={Boolean(selectedQrService)}
          onClose={() => setSelectedQrService(null)}
          qrCode={selectedQrService.qrCode}
          serviceCode={selectedQrService.code}
          serviceRequestId={selectedQrService.id}
        />
      )}
      {selectedEditService && (
        <ServiceActionModal
          serviceId={selectedEditService.id}
          serviceCode={selectedEditService.code}
          qrCode={selectedEditService.qrCode}
          isOpen={Boolean(selectedEditService)}
          onClose={() => setSelectedEditService(null)}
          onSaved={() => {
            setSelectedEditService(null)
            void loadServices()
          }}
        />
      )}
    </div>
  )
}
