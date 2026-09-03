export const round2 = (n) => Math.round(n * 100) / 100

// Máscara de centavos para inputs de montos/porcentajes con coma decimal
// (tasa de cambio, % de IVA): el estado real es la cadena de dígitos
// tipeados (sin signos ni separadores); los últimos 2 dígitos son siempre
// la parte decimal, como un monto de POS. digitsFromDecimal convierte un
// número guardado (ej. 189.35) al estado inicial ("18935"); maskDisplay
// arma el texto a mostrar ("189,35") a partir de esos dígitos.
export const digitsFromDecimal = (n) => String(Math.round(Number(n || 0) * 100))

export const maskDisplay = (digits) => {
  const padded = digits.padStart(3, '0')
  const intPart = padded.slice(0, -2).replace(/^0+(?=\d)/, '')
  const decPart = padded.slice(-2)
  return `${intPart},${decPart}`
}

export const fmtUsd = (n) =>
  '$' + Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtBs = (n) =>
  'Bs ' + Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtDate = (date) => new Date(date).toLocaleDateString('es-VE')

export const fmtTime = (date, opts = { hour: '2-digit', minute: '2-digit' }) =>
  new Date(date).toLocaleTimeString('es-VE', opts)

export const fmtDateTime = (date) => `${fmtDate(date)} ${fmtTime(date)}`

export const isSameDay = (d1, d2) => {
  const a = new Date(d1)
  const b = new Date(d2)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
