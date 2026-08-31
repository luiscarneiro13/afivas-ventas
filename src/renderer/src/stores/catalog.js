import { defineStore } from 'pinia'
import { CATEGORIES, PRODUCTS_SEED } from '@renderer/data/dummy'

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    products: PRODUCTS_SEED.map((p) => ({ ...p })),
    categories: CATEGORIES
  }),
  getters: {
    categoryNames: (state) => Object.keys(state.categories)
  },
  actions: {
    findByCodigo(codigo) {
      return this.products.find((p) => p.codigo === codigo)
    },
    search(query, limit = 8) {
      const q = query.trim().toLowerCase()
      if (!q) return []
      return this.products
        .filter((p) => p.codigo.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
        .slice(0, limit)
    },
    exists(codigo) {
      return this.products.some((p) => p.codigo === codigo)
    },
    create(product) {
      this.products.push({ ...product })
    },
    update(codigo, changes) {
      const p = this.findByCodigo(codigo)
      if (p) Object.assign(p, changes)
    },
    remove(codigo) {
      this.products = this.products.filter((p) => p.codigo !== codigo)
    },
    adjustStock(codigo, delta) {
      const p = this.findByCodigo(codigo)
      if (p) p.existencia = Math.max(0, p.existencia + delta)
    }
  }
})
