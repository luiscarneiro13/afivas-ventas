import { defineStore } from 'pinia'

export const useProveedoresStore = defineStore('proveedores', {
  state: () => ({
    items: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        this.items = (await window.api?.proveedoresList?.()) || []
      } finally {
        this.loading = false
      }
    },
    async create(payload) {
      await window.api.proveedoresCreate(payload)
      await this.fetchAll()
    },
    async update(id, payload) {
      await window.api.proveedoresUpdate(id, payload)
      await this.fetchAll()
    },
    async remove(id) {
      await window.api.proveedoresRemove(id)
      await this.fetchAll()
    }
  }
})
