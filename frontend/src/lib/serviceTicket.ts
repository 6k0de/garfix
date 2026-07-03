import type { ServiceTicket } from '@/services/service/service.api'

// Datos de marca del ticket. La empresa se toma de los datos del servicio; el
// eslogan y el teléfono no existen aún en el modelo, así que se usan estos
// valores por defecto (se pueden parametrizar más adelante por empresa/sucursal).
const TICKET_TAGLINE = 'Soluciones en electrónica'
const TICKET_PHONE = '826-113-2973'

const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const money = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value || 0)

const formatDateTime = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// Texto legal del resguardo (mismo contenido del ticket, con ortografía corregida).
const buildTerms = (company: string) =>
  `Esta papelería es indispensable para recoger su equipo. ${company} responsabiliza al cliente de la procedencia lícita del equipo. La garantía solo aplica en la mano de obra y piezas reemplazadas; cualquier otro fallo tendrá un costo extra. Los equipos con humedad, golpes o manipulación indebida no tendrán garantía de ningún tipo; estos equipos corren riesgo de apagarse definitivamente. El cliente cuenta con 30 días para recoger su equipo; después de este plazo, ${company} dispondrá de él para recuperar los gastos del mismo. NOTA: Retire su SIM y tarjeta SD, no nos hacemos responsables por extravío.`

const UNLOCK_LABELS: Record<string, string> = {
  PATTERN: 'Patrón',
  PIN: 'PIN',
  PASSWORD: 'Contraseña',
  FINGERPRINT: 'Huella',
  FACE: 'Rostro',
  NONE: 'Sin bloqueo',
}

const unlockText = (type: string, code: string) => {
  const label = UNLOCK_LABELS[type] ?? ''
  if (label && code) return `${label} — ${code}`
  return label || code || ''
}

const logoMark = `
  <svg width="46" height="46" viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="14" fill="#000"/>
    <path d="M36 12 L20 36 H31 L28 52 L46 26 H34 Z" fill="#fff"/>
  </svg>`

const patternGrid = () => {
  const dots = Array.from({ length: 9 }, (_, i) => `<div class="dot"><span>${i + 1}</span></div>`).join('')
  return `<div class="pattern">${dots}</div>`
}

const deviceBlock = (device: ServiceTicket['devices'][number], observations: string) => `
  <div class="bar">DATOS DEL EQUIPO</div>
  <div class="box">
    <div class="row2">
      <span><b>Equipo:</b> ${esc(device.deviceType)}</span>
      <span><b>Marca:</b> ${esc(device.brand)}</span>
    </div>
    <div class="row2">
      <span><b>Modelo:</b> ${esc(device.model)}</span>
      <span><b>Color:</b> ${esc(device.color)}</span>
    </div>
    <div><b>Desbloqueo:</b> ${esc(unlockText(device.unlockType, device.unlockCode))}</div>
    <div><b>Problema:</b> ${esc(device.problem)}</div>
    <div><b>Observaciones:</b> ${esc(observations)}</div>
    <div><b>Estado físico:</b> ${esc(device.appearance)}</div>
  </div>`

// CSS del ticket, todo bajo `.gfx-ticket` para no filtrar estilos a la app
// mientras se renderiza fuera de pantalla.
const TICKET_CSS = `
  .gfx-ticket { width: 72mm; color: #000; background: #fff; padding: 2mm;
    font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.45; }
  /* Neutraliza los tokens globales (oklch) heredados para que la captura no falle. */
  .gfx-ticket *, .gfx-ticket *::before, .gfx-ticket *::after {
    box-sizing: border-box; border-color: #000; outline-color: transparent; }
  .gfx-ticket .brand { display: flex; flex-direction: column; align-items: center; gap: 2px; margin-bottom: 8px; }
  .gfx-ticket .brand .name { font-size: 22px; font-weight: 800; font-style: italic; letter-spacing: .5px; }
  .gfx-ticket .brand .tag { font-size: 10px; font-style: italic; }
  .gfx-ticket .brand .phone { font-size: 11px; font-weight: 700; }
  .gfx-ticket .bar { background: #000; color: #fff; text-align: center; font-weight: 700;
    padding: 3px 6px; font-size: 12px; letter-spacing: .4px; margin-top: 8px; }
  .gfx-ticket .box { border: 1px solid #000; border-top: none; padding: 6px 8px; }
  .gfx-ticket .info { border: 1px solid #000; padding: 6px 8px; margin-top: 6px; }
  .gfx-ticket .info > div, .gfx-ticket .box > div { margin: 1px 0; }
  .gfx-ticket .row2 { display: flex; justify-content: space-between; gap: 8px; }
  .gfx-ticket .row2 > span { flex: 1; }
  .gfx-ticket .budget { display: flex; border: 1px solid #000; border-top: none; }
  .gfx-ticket .budget > div { flex: 1; text-align: center; padding: 6px 4px; }
  .gfx-ticket .budget .lbl { font-weight: 700; font-size: 11px; }
  .gfx-ticket .budget .val { font-size: 12px; }
  .gfx-ticket .terms { margin-top: 10px; font-size: 9.5px; font-style: italic; text-align: justify; line-height: 1.4; }
  .gfx-ticket .pattern { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 22px;
    width: 120px; margin: 16px auto 4px; }
  .gfx-ticket .dot { position: relative; width: 22px; height: 22px; border: 2px solid #000;
    border-radius: 50%; margin: 0 auto; }
  .gfx-ticket .dot::after { content: ""; position: absolute; inset: 7px; background: #000; border-radius: 50%; }
  .gfx-ticket .dot span { position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    font-size: 9px; font-weight: 700; }
`

const renderTicketBody = (ticket: ServiceTicket): string => {
  const companyName = ticket.company.name || 'GarFix'
  const technician = ticket.devices[0]?.technician ?? ''
  const devicesHtml = ticket.devices
    .map((device, index) => deviceBlock(device, index === 0 ? ticket.observations : ''))
    .join('')

  return `<div class="gfx-ticket">
    <div class="brand">
      ${logoMark}
      <div class="name">${esc(companyName)}</div>
      <div class="tag">${TICKET_TAGLINE}</div>
      <div class="phone">${TICKET_PHONE}</div>
    </div>

    <div class="info">
      <div><b>Fecha recepción:</b> ${esc(formatDateTime(ticket.receptionDate))}</div>
      <div><b>Cliente:</b> ${esc(ticket.client.name)}</div>
      <div><b>Contacto:</b> ${esc(ticket.client.phone)}</div>
      <div><b>Correo:</b> ${esc(ticket.client.email)}</div>
      <div><b>Dirección:</b> ${esc(ticket.client.address)}</div>
      <div><b>Técnico asignado:</b> ${esc(technician)}</div>
    </div>

    <div class="bar">No. SERVICIO: ${esc(ticket.folio)}</div>

    ${devicesHtml}

    <div class="bar">PRESUPUESTO</div>
    <div class="budget">
      <div><div class="lbl">Total</div><div class="val">${money(ticket.totals.total)}</div></div>
      <div><div class="lbl">Total pagado</div><div class="val">${money(ticket.totals.paid)}</div></div>
      <div><div class="lbl">Adeudo</div><div class="val">${money(ticket.totals.debt)}</div></div>
    </div>

    <div class="terms">${esc(buildTerms(companyName))}</div>

    ${patternGrid()}
  </div>`
}

// Las librerías de PDF se cargan de forma diferida (chunks aparte) para no engordar
// el bundle inicial. Cacheamos la promesa para poder precargarlas y que, al generar,
// la única espera sea el render (rápido) y la nueva ventana se abra sin bloqueo.
type PdfLibs = [typeof import('jspdf'), typeof import('html2canvas-pro')]
let pdfLibsPromise: Promise<PdfLibs> | null = null
const loadPdfLibs = (): Promise<PdfLibs> => {
  if (!pdfLibsPromise) {
    pdfLibsPromise = Promise.all([import('jspdf'), import('html2canvas-pro')])
  }
  return pdfLibsPromise
}

// Dispara la descarga de las librerías por adelantado (al abrir el modal/lista).
export const preloadTicketPdfLibs = () => {
  void loadPdfLibs()
}

// Genera un PDF real (Blob) del ticket. Reutiliza el diseño HTML del ticket y lo
// rasteriza con html2canvas-pro.
export const generateServiceTicketPdfBlob = async (
  ticket: ServiceTicket,
): Promise<Blob> => {
  const [{ jsPDF }, html2canvasMod] = await loadPdfLibs()
  const html2canvas = html2canvasMod.default

  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '0'
  host.style.zIndex = '-1'
  host.innerHTML = `<style>${TICKET_CSS}</style>${renderTicketBody(ticket)}`
  document.body.appendChild(host)

  const target = host.querySelector('.gfx-ticket') as HTMLElement
  try {
    const canvas = await html2canvas(target, {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const imgData = canvas.toDataURL('image/png')

    const pageWidth = 80 // mm (papel térmico)
    const margin = 4
    const contentWidth = pageWidth - margin * 2
    const contentHeight = (canvas.height / canvas.width) * contentWidth
    const pageHeight = contentHeight + margin * 2

    const doc = new jsPDF({ unit: 'mm', format: [pageWidth, pageHeight], compress: true })
    doc.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight)
    return doc.output('blob')
  } finally {
    document.body.removeChild(host)
  }
}
