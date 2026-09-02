import { defineStore } from 'pinia'

export const useClientesStore = defineStore('clientes', {
  state: () => ({
    items: [],
    loading: false
  }),
  getters: {
    // El Cliente Eventual (venta sin registrar) viene sembrado en la BD
    // como una fila real más, marcada con es_eventual — no un objeto aparte.
    eventual: (state) => state.items.find((c) => c.es_eventual) || null
  },
  actions: {
    search(query) {
      const q = query.trim().toLowerCase()
      if (!q) return []
      return this.items.filter(
        (c) => !c.es_eventual && (String(c.cedula).includes(q) || c.nombre.toLowerCase().includes(q))
      )
    },
    async fetchAll() {
      this.loading = true
      try {
        this.items = (await window.api?.clientesList?.()) || []
      } finally {
        this.loading = false
      }
    },
    async create(payload) {
      await window.api.clientesCreate(payload)
      await this.fetchAll()
    },
    async update(id, payload) {
      await window.api.clientesUpdate(id, payload)
      await this.fetchAll()
    },
    async remove(id) {
      await window.api.clientesRemove(id)
      await this.fetchAll()
    }
  }
})
