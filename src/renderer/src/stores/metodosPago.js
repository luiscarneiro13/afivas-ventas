import { defineStore } from 'pinia'

function mapMetodo(row) {
  return {
    id: row.id,
    label: row.etiqueta,
    icon: row.icono,
    cash: !!row.es_efectivo
  }
}

export const useMetodosPagoStore = defineStore('metodosPago', {
  state: () => ({
    items: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const rows = (await window.api?.metodosPagoList?.()) || []
        this.items = rows.map(mapMetodo)
      } finally {
        this.loading = false
      }
    }
  }
})
