import { defineStore } from 'pinia'

export const useCajaStore = defineStore('caja', {
  state: () => ({
    id: null,
    tasa: 189.35,
    abierta: false,
    loading: false
  }),
  actions: {
    // Consulta si ya hay una sesión de caja abierta en la BD (por ejemplo,
    // si la app se cerró sin pasar por Fiscalización). Se llama tras login,
    // ya que el estado de Pinia no sobrevive un reinicio de la app.
    async fetchActual() {
      this.loading = true
      try {
        const sesion = await window.api?.cajaActual?.()
        if (sesion) {
          this.id = sesion.id
          this.tasa = Number(sesion.tasa_apertura)
          this.abierta = true
        } else {
          this.id = null
          this.abierta = false
        }
      } finally {
        this.loading = false
      }
    },
    async aperturar(tasaInput, usuarioId) {
      const parsed = parseFloat(String(tasaInput).replace(',', '.'))
      const tasaApertura = parsed || 189.35
      const sesion = await window.api.cajaAbrir({ usuarioId, tasaApertura, montoInicial: 0 })
      this.id = sesion.id
      this.tasa = Number(sesion.tasa_apertura)
      this.abierta = true
    },
    async cerrar(payload = {}) {
      if (this.id) {
        await window.api.cajaCerrar(this.id, { tasaCierre: this.tasa, ...payload })
      }
      this.id = null
      this.abierta = false
    }
  }
})
