import { defineStore } from 'pinia'

export const useClientesStore = defineStore('clientes', {
  state: () => ({
    items: [],
    loading: false
  }),
  actions: {
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
