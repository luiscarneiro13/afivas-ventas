import ExcelJS from 'exceljs'

// columns: [{ key, header, width?, format?(row) }]
export async function exportToExcel({ filename, sheetName = 'Datos', columns, rows }) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }))
  rows.forEach((row) => {
    const values = {}
    columns.forEach((c) => {
      values[c.key] = c.format ? c.format(row) : row[c.key]
    })
    sheet.addRow(values)
  })
  sheet.getRow(1).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Lee la primera hoja de un archivo .xlsx y devuelve un array de objetos
// { header: valor }, usando la fila 1 como encabezados. Filas totalmente
// vacías se descartan.
export async function importFromExcel(file) {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const headers = []
  const rows = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? '').trim()
      })
      return
    }
    const obj = {}
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headers[colNumber]
      if (!key) return
      obj[key] = cell.value && typeof cell.value === 'object' && 'text' in cell.value
        ? cell.value.text
        : cell.value
    })
    const tieneDatos = Object.values(obj).some((v) => v !== null && v !== undefined && String(v).trim() !== '')
    if (tieneDatos) rows.push(obj)
  })
  return rows
}

// Dispara el selector de archivos del navegador y resuelve con el File
// elegido (o null si el usuario cancela).
export function pickExcelFile() {
  return new Promise((resolveFile) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.style.display = 'none'
    input.addEventListener('change', () => {
      resolveFile(input.files?.[0] || null)
      input.remove()
    })
    document.body.appendChild(input)
    input.click()
  })
}
