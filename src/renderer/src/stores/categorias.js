import { defineStore } from 'pinia'

export const useCategoriasStore = defineStore('categorias', {
  state: () => ({
    items: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        this.items = (await window.api?.categoriasList?.()) || []
      } finally {
        this.loading = false
      }
    },
    async create(payload) {
      await window.api.categoriasCreate(payload)
      await this.fetchAll()
    },
    async update(id, payload) {
      await window.api.categoriasUpdate(id, payload)
      await this.fetchAll()
    },
    async remove(id) {
      await window.api.categoriasRemove(id)
      await this.fetchAll()
    }
  }
})
