export const round2 = (n) => Math.round(n * 100) / 100

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
