import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    cajero: ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.cajero,
    initials: (state) => state.cajero.slice(0, 2).toUpperCase()
  },
  actions: {
    login(username) {
      this.cajero = (username || 'admin').trim() || 'admin'
    },
    logout() {
      this.cajero = ''
    }
  }
})
