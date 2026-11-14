// columns: [{ key, header, format?(row) }]
// El PDF lo genera el proceso principal (webContents.printToPDF sobre una
// ventana oculta con la tabla HTML); acá solo se arman los datos y se
// guarda el buffer como blob, con el mismo patrón de descarga del Excel.
export async function exportToPdf({ filename, title, subtitle, resumen, columns, rows }) {
  const headers = columns.map((c) => c.header)
  const data = rows.map((row) =>
    columns.map((c) => String(c.format ? c.format(row) : (row[c.key] ?? '—')))
  )
  const buffer = await window.api.reportePdfGenerar({
    titulo: title,
    subtitulo: subtitle,
    resumen,
    headers,
    rows: data
  })

  const blob = new Blob([buffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
