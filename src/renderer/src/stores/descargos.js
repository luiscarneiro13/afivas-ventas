import { defineStore } from 'pinia'
import { useCatalogStore } from './catalog'

export const useDescargosStore = defineStore('descargos', {
  state: () => ({
    entries: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const rows = (await window.api?.descargosList?.()) || []
        this.entries = rows.map((row) => ({
          fecha: row.fecha,
          codigo: row.producto_codigo,
          desc: row.producto_descripcion,
          cantidad: row.cantidad,
          motivo: row.motivo,
          nota: row.nota,
          usuario: row.usuario_nombre
        }))
      } finally {
        this.loading = false
      }
    },
    async registrar({ productoId, cantidad, motivo, nota, usuarioId }) {
      await window.api.descargosRegistrar({ productoId, cantidad, motivo, nota, usuarioId })
      await this.fetchAll()
      const catalog = useCatalogStore()
      await catalog.fetchAll()
    }
  }
})
