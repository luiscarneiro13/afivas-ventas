import { defineStore } from 'pinia'

// Fuente única del % de IVA para todo el sistema (cart.js lo usa para
// calcular iva/ivaBs, sales.js lo manda al registrar cada venta). Se edita
// desde Configuración > Máquina fiscal, pero vive en config_empresa porque
// es un dato de la empresa, no de la impresora.
export const useConfigEmpresaStore = defineStore('configEmpresa', {
  state: () => ({
    porcentajeIva: 16
  }),
  actions: {
    async fetchAll() {
      const config = await window.api?.configEmpresaGet?.()
      if (config) this.porcentajeIva = Number(config.porcentaje_iva)
    },
    async actualizarPorcentajeIva(valor) {
      const config = await window.api.configEmpresaUpdate({ porcentajeIva: valor })
      this.porcentajeIva = Number(config.porcentaje_iva)
      return this.porcentajeIva
    }
  }
})
