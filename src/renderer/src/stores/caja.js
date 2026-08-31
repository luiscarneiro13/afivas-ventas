import { defineStore } from 'pinia'

export const useCajaStore = defineStore('caja', {
  state: () => ({
    tasa: 189.35,
    abierta: false
  }),
  actions: {
    aperturar(tasaInput) {
      const parsed = parseFloat(String(tasaInput).replace(',', '.'))
      this.tasa = parsed || 189.35
      this.abierta = true
    },
    cerrar() {
      this.abierta = false
    }
  }
})
