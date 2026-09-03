import { defineStore } from 'pinia'
import { useCategoriasStore } from '@renderer/stores/categorias'

function mapProducto(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    desc: row.descripcion,
    cat: row.categoria_nombre,
    categoriaId: row.categoria_id,
    precio: Number(row.precio),
    existencia: row.existencia,
    stockMinimo: row.stock_minimo
  }
}

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    products: [],
    loading: false
  }),
  getters: {
    categories() {
      const categorias = useCategoriasStore()
      return Object.fromEntries(categorias.items.map((c) => [c.nombre, c]))
    },
    categoryNames() {
      return Object.keys(this.categories)
    }
  },
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const rows = (await window.api?.productosList?.()) || []
        this.products = rows.map(mapProducto)
      } finally {
        this.loading = false
      }
    },
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
    async create({ codigo, desc, cat, precio, existencia, stockMinimo }) {
      const categorias = useCategoriasStore()
      const categoria = categorias.items.find((c) => c.nombre === cat)
      if (!categoria) throw new Error('Categoría no válida')
      await window.api.productosCreate({
        codigo,
        descripcion: desc,
        categoriaId: categoria.id,
        precio,
        existencia,
        stockMinimo
      })
      await this.fetchAll()
    },
    async update(codigo, { desc, cat, precio, existencia, stockMinimo }) {
      const categorias = useCategoriasStore()
      const categoria = categorias.items.find((c) => c.nombre === cat)
      if (!categoria) throw new Error('Categoría no válida')
      await window.api.productosUpdate(codigo, {
        descripcion: desc,
        categoriaId: categoria.id,
        precio,
        existencia,
        stockMinimo
      })
      await this.fetchAll()
    },
    async remove(codigo) {
      await window.api.productosRemove(codigo)
      await this.fetchAll()
    }
  }
})
