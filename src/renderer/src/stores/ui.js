import { defineStore } from 'pinia'

let uid = 0

export const useUiStore = defineStore('ui', {
  state: () => ({
    toasts: [],
    sidebarCollapsed: true
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    toast(message, type = 'info', icon) {
      const id = ++uid
      const map = { success: 'check', warning: 'alert', error: 'alert', info: 'check' }
      this.toasts.push({ id, message, type, icon: icon || map[type] })
      setTimeout(() => this.dismiss(id), 3000)
    },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    }
  }
})
