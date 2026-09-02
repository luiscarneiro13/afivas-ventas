import { defineStore } from 'pinia'

export const useUsuariosStore = defineStore('usuarios', {
  state: () => ({
    items: [],
    loading: false
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        this.items = (await window.api?.usuariosList?.()) || []
      } finally {
        this.loading = false
      }
    },
    async create(payload) {
      await window.api.usuariosCreate(payload)
      await this.fetchAll()
    },
    async update(id, payload) {
      await window.api.usuariosUpdate(id, payload)
      await this.fetchAll()
    },
    async desactivar(id) {
      await window.api.usuariosDesactivar(id)
      await this.fetchAll()
    }
  }
})
