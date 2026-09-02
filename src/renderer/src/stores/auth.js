import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    cajero: '',
    usuarioId: null,
    rol: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.cajero,
    initials: (state) => state.cajero.slice(0, 2).toUpperCase()
  },
  actions: {
    async login(username, password) {
      const usuario = (username || '').trim()
      const user = await window.api?.usuariosLogin?.(usuario, password)
      if (!user) {
        throw new Error('Usuario o contraseña incorrectos')
      }
      this.cajero = user.nombreCompleto || user.usuario
      this.usuarioId = user.id
      this.rol = user.rol
    },
    logout() {
      this.cajero = ''
      this.usuarioId = null
      this.rol = null
    }
  }
})
