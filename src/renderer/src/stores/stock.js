import { defineStore } from 'pinia'
import { useCatalogStore } from './catalog'
import { seedStockEntries } from '@renderer/data/dummy'

export const useStockStore = defineStore('stock', {
  state: () => ({
    entries: []
  }),
  actions: {
    seed() {
      this.entries = seedStockEntries()
    },
    registrarEntrada({ codigo, cantidad, proveedor, usuario }) {
      const catalog = useCatalogStore()
      const p = catalog.findByCodigo(codigo)
      if (!p) return null
      catalog.adjustStock(codigo, cantidad)
      const entry = {
        fecha: new Date(),
        codigo: p.codigo,
        desc: p.desc,
        cantidad,
        proveedor: proveedor?.trim() || '—',
        usuario
      }
      this.entries.unshift(entry)
      return entry
    }
  }
})
