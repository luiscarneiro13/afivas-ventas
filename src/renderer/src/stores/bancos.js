import { defineStore } from 'pinia'

export const useBancosStore = defineStore('bancos', {
  state: () => ({
    items: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const rows = (await window.api?.bancosList?.()) || []
        this.items = rows.map((r) => ({ id: r.id, nombre: r.nombre }))
      } finally {
        this.loading = false
      }
    }
  }
})
