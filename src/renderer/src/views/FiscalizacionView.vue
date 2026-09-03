<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCajaStore } from '@renderer/stores/caja'
import { useCartStore } from '@renderer/stores/cart'
import { useUiStore } from '@renderer/stores/ui'
import { useAuthStore } from '@renderer/stores/auth'
import NavCard from '@renderer/components/ui/NavCard.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'

const router = useRouter()
const caja = useCajaStore()
const cart = useCartStore()
const ui = useUiStore()
const auth = useAuthStore()

// Puerto configurado desde Configuración · Máquina fiscal (se guarda ahí
// al probar la conexión con éxito). Si nunca se configuró, los comandos de
// impresión fallan con un mensaje claro en vez de romper la pantalla.
const puertoCom = ref('')

onMounted(async () => {
  const config = await window.api?.configImpresoraGet?.()
  puertoCom.value = config?.puerto_com || ''
})

const confirmZOpen = ref(false)
const confirmXOpen = ref(false)

// Genera el Reporte Z: lo envía a la impresora fiscal (resetea sus
// acumulados, irreversible en el equipo real), cierra la sesión de caja
// actual y deja registro del cierre en cierres_fiscales_z — el histórico de
// Reportes Z, aparte del histórico de aperturas/cierres que ya vive en
// sesiones_caja (esa tabla nunca borra filas: cada apertura inserta una
// nueva y el cierre solo la actualiza).
async function generarReporteZ() {
  const result = (await window.api?.printReporteZ?.(puertoCom.value)) || {
    ok: false,
    message: 'API no disponible'
  }
  if (!result.ok) {
    ui.toast(result.message, 'error')
    return
  }
  ui.toast(result.message, 'success')
  cart.clear()

  const sesionCajaId = caja.id
  let sesionCerrada
  try {
    sesionCerrada = await caja.cerrar()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo cerrar la caja', 'error')
    return
  }

  try {
    await window.api?.fiscalReporteZRegistrar?.({
      sesionCajaId,
      usuarioId: auth.usuarioId,
      totalVentas: sesionCerrada?.total_ventas ?? null,
      respuestaCruda: result.message
    })
  } catch (e) {
    // La caja ya cerró y el equipo ya imprimió el Z (irreversible); si el
    // registro del histórico falla, se avisa aparte en vez de bloquear el
    // flujo — no hay nada que "deshacer" en este punto.
    ui.toast(e?.message || 'El Reporte Z se generó, pero no se pudo guardar en el histórico.', 'error')
  }

  router.push({ name: 'caja' })
}

async function generarReporteX() {
  const result = (await window.api?.printReporteX?.(puertoCom.value)) || {
    ok: false,
    message: 'API no disponible'
  }
  ui.toast(result.message, result.ok ? 'success' : 'error')
}
</script>

<template>
  <div class="view-content">
    <div class="config-grid">
      <NavCard icon="filetext" label="Reporte Z" clickable @click="confirmZOpen = true" />
      <NavCard icon="printer" label="Reporte X" clickable @click="confirmXOpen = true" />
    </div>

    <ConfirmModal
      v-model="confirmZOpen"
      title="¿Generar Reporte Z?"
      text="Se enviará a la impresora fiscal y cerrará la caja. Esta acción reinicia los acumulados del equipo y no se puede deshacer."
      icon="filetext"
      confirm-label="Generar"
      @confirm="generarReporteZ"
    />
    <ConfirmModal
      v-model="confirmXOpen"
      title="¿Generar Reporte X?"
      text="Se enviará a la impresora fiscal. Es un reporte de consulta: no reinicia los acumulados ni cierra la caja."
      icon="printer"
      confirm-label="Generar"
      @confirm="generarReporteX"
    />
  </div>
</template>

<style scoped>
.view-content {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  padding: 22px 26px;
}
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 400px;
}
</style>
