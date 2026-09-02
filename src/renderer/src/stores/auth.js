import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    cajero: '',
    usuarioId: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.cajero,
    initials: (state) => state.cajero.slice(0, 2).toUpperCase()
  },
  actions: {
    async login(username) {
      this.cajero = (username || 'admin').trim() || 'admin'

      // El login es demo (cualquier usuario/contraseña funciona) y nunca debe
      // depender de que la BD responda: si falla, seguimos sin usuarioId real
      // (solo afecta a "registrar entrada", no al acceso a la app).
      try {
        const users = (await window.api?.usuariosList?.()) || []
        const match = users.find((u) => u.usuario?.toLowerCase() === this.cajero.toLowerCase())
        const user = match || users[0] || null
        this.usuarioId = user?.id ?? null
      } catch {
        this.usuarioId = null
      }
    },
    logout() {
      this.cajero = ''
      this.usuarioId = null
    }
  }
})
