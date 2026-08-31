import { defineStore } from 'pinia'
import { CLIENTS_SEED, CLIENTE_EVENTUAL } from '@renderer/data/dummy'

export const useClientsStore = defineStore('clients', {
  state: () => ({
    clients: CLIENTS_SEED.map((c) => ({ ...c })),
    eventual: CLIENTE_EVENTUAL
  }),
  actions: {
    search(query) {
      const q = query.trim().toLowerCase()
      if (!q) return []
      return this.clients.filter((c) => c.cedula.includes(q) || c.nombre.toLowerCase().includes(q))
    },
    findByCedula(cedula) {
      if (cedula === this.eventual.cedula) return this.eventual
      return this.clients.find((c) => c.cedula === cedula)
    }
  }
})
