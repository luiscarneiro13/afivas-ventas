import { defineStore } from 'pinia'

export const useClientesStore = defineStore('clientes', {
  state: () => ({
    items: [],
    loading: false
  }),
  actions: {
    search(query) {
      const q = query.trim().toLowerCase()
      if (!q) return []
      return this.items.filter(
        (c) => !c.es_eventual && (String(c.cedula).includes(q) || c.nombre.toLowerCase().includes(q))
      )
    },
    findByCedula(cedula) {
      return this.items.find((c) => !c.es_eventual && c.cedula === cedula) || null
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
      const cliente = await window.api.clientesCreate(payload)
      await this.fetchAll()
      return cliente
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
