import { defineStore } from 'pinia'
import { useCategoriasStore } from '@renderer/stores/categorias'

function mapProducto(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    desc: row.descripcion,
    cat: row.categoria_nombre,
    categoriaId: row.categoria_id,
    // El sistema ya no calcula IVA (funciona como notas de entrega): el
    // precio de venta es directamente la columna `precio` de la BD.
    // `precio_con_iva` sigue guardada (no se mueve la BD) pero ya no se usa.
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
    // Como el código de producto puede estar repetido (migración 027: un
    // producto borrado, un color o una talla pueden compartirlo), NO existe
    // un "buscar por código" que devuelva un único producto: hay que usar
    // `findAllByCodigo` (para ver todos los que lo comparten) o `findById`.
    findAllByCodigo(codigo) {
      return this.products.filter((p) => p.codigo === codigo)
    },
    findById(id) {
      return this.products.find((p) => p.id === id)
    },
    search(query, limit = 8) {
      const q = query.trim().toLowerCase()
      if (!q) return []
      return this.products
        .filter((p) => p.codigo.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
        .slice(0, limit)
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
    async update(id, { desc, cat, precio, existencia, stockMinimo }) {
      const categorias = useCategoriasStore()
      const categoria = categorias.items.find((c) => c.nombre === cat)
      if (!categoria) throw new Error('Categoría no válida')
      await window.api.productosUpdate(id, {
        descripcion: desc,
        categoriaId: categoria.id,
        precio,
        existencia,
        stockMinimo
      })
      await this.fetchAll()
    },
    async remove(id) {
      await window.api.productosRemove(id)
      await this.fetchAll()
    }
  }
})
