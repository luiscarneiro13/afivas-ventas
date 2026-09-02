import { defineStore } from 'pinia'
import { useCatalogStore } from './catalog'

export const useStockStore = defineStore('stock', {
  state: () => ({
    entries: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const rows = (await window.api?.stockList?.()) || []
        this.entries = rows.map((row) => ({
          fecha: row.fecha,
          codigo: row.producto_codigo,
          desc: row.producto_descripcion,
          cantidad: row.cantidad,
          proveedor: row.proveedor,
          usuario: row.usuario_nombre
        }))
      } finally {
        this.loading = false
      }
    },
    async registrarEntrada({ productoId, cantidad, proveedor, nota, usuarioId }) {
      await window.api.stockRegistrarEntrada({ productoId, cantidad, proveedor, nota, usuarioId })
      await this.fetchAll()
      const catalog = useCatalogStore()
      await catalog.fetchAll()
    }
  }
})
