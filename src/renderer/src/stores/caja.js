import { defineStore } from 'pinia'

export const useCajaStore = defineStore('caja', {
  state: () => ({
    id: null,
    tasa: 189.35,
    abierta: false,
    abiertaAt: null,
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
          this.abiertaAt = sesion.abierta_at
          this.abierta = true
        } else {
          this.id = null
          this.abiertaAt = null
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
      this.abiertaAt = sesion.abierta_at
      this.abierta = true
    },
    // Corrige la tasa de la sesión abierta y la persiste en BD (tasa_apertura
    // de sesiones_caja), para que sobreviva un logout/login — mutar solo
    // this.tasa se pierde en cuanto fetchActual() vuelve a leer la sesión.
    async actualizarTasa(tasa) {
      if (!this.id) {
        this.tasa = tasa
        return
      }
      const sesion = await window.api.cajaActualizarTasa(this.id, tasa)
      this.tasa = Number(sesion.tasa_apertura)
    },
    async cerrar(payload = {}) {
      let sesionCerrada = null
      if (this.id) {
        sesionCerrada = await window.api.cajaCerrar(this.id, { tasaCierre: this.tasa, ...payload })
      }
      this.id = null
      this.abiertaAt = null
      this.abierta = false
      return sesionCerrada
    }
  }
})
