// src/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Carga estática (importa tus JSON)
import common_es from '../public/locales/es/common.json'
import common_en from '../public/locales/en/common.json'
import services_es from '../public/locales/es/workshop/services.json'
import services_en from '../public/locales/en/workshop/services.json'
import listService_es from '../public/locales/es/workshop/list-services.json'
import listService_en from '../public/locales/en/workshop/list-services.json'
import device_es from '../public/locales/es/catalogs/devices.json'
import device_en from '../public/locales/en/catalogs/devices.json'
import location_es from '../public/locales/es/catalogs/location.json'
import location_en from '../public/locales/en/catalogs/location.json'
import roles_es from '../public/locales/es/catalogs/roles.json'
import roles_en from '../public/locales/en/catalogs/roles.json'
import status_es from '../public/locales/es/catalogs/status.json'
import status_en from '../public/locales/en/catalogs/status.json'
import footer_es from '../public/locales/es/footer.json'
import footer_en from '../public/locales/en/footer.json'
import menu_es from '../public/locales/es/menuItems.json'
import menu_en from '../public/locales/en/menuItems.json'
import profile_es from '../public/locales/es/menuUser.json'
import profile_en from '../public/locales/en/menuUser.json'
import branch_es from '../public/locales/es/catalogs/branches.json'
import branch_en from '../public/locales/en/catalogs/branches.json'
import technic_es from '../public/locales/es/catalogs/technicians.json'
import technic_en from '../public/locales/en/catalogs/technicians.json'
import client_es from '../public/locales/es/catalogs/clients.json'
import client_en from '../public/locales/en/catalogs/clients.json'
import documentType_es from '../public/locales/es/catalogs/document-types.json'
import documentType_en from '../public/locales/en/catalogs/document-types.json'
import typeClient_es from '../public/locales/es/catalogs/type-clients.json'
import typeClient_en from '../public/locales/en/catalogs/type-clients.json'

i18n
  .use(LanguageDetector) // detecta por localStorage, navigator, etc.
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    ns: [
      'common',
      'services',
      'list-service',
      'device',
      'location',
      'roles',
      'status',
      'footer',
      'menu',
      'profile',
      'documentType',
      'typeClient',
    ],
    defaultNS: 'common',
    resources: {
      es: {
        common: common_es,
        services: services_es,
        'list-service': listService_es,
        device: device_es,
        location: location_es,
        roles: roles_es,
        status: status_es,
        footer: footer_es,
        menu: menu_es,
        profile: profile_es,
        branch: branch_es,
        technic: technic_es,
        client: client_es,
        documentType: documentType_es,
        typeClient: typeClient_es,
      },
      en: {
        common: common_en,
        services: services_en,
        'list-service': listService_en,
        device: device_en,
        location: location_en,
        roles: roles_en,
        status: status_en,
        footer: footer_en,
        menu: menu_en,
        profile: profile_en,
        branch: branch_en,
        technic: technic_en,
        client: client_en,
        documentType: documentType_en,
        typeClient: typeClient_en,
      },
    },
    interpolation: {
      escapeValue: false, // React ya escapa
    },
    returnNull: false, // evita renderizar "null"
    debug: false,
    detection: {
      // guardará la preferencia en localStorage por defecto
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
