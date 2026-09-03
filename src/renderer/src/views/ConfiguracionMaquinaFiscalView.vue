<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { useConfigEmpresaStore } from '@renderer/stores/configEmpresa'
import { digitsFromDecimal, maskDisplay } from '@renderer/utils/format'

const configEmpresa = useConfigEmpresaStore()

const ports = ref([])
const selectedPort = ref('')
const scanning = ref(false)
const scanned = ref(false)

// Correlativo de la máquina fiscal: el último número de factura que la
// impresora física ya tiene emitido. Se guarda en config_impresora_fiscal
// (autocompletado la primera vez con el último id de factura de la BD) y se
// usa al finalizar cada venta para asignarle el siguiente número — se edita
// a mano aquí solo para corregirlo si se desincroniza con el equipo real.
// Importante: al abrir la pantalla NO se resincroniza solo con la BD, para
// no pisar un valor guardado a mano (la BD interna puede ir por detrás del
// correlativo real de la impresora).
const correlativo = ref(0)
const correlativoLoading = ref(false)
const correlativoSaving = ref(false)
const correlativoSaved = ref(false)

async function cargarCorrelativo() {
  correlativoLoading.value = true
  try {
    const config = await window.api?.configImpresoraGet?.()
    correlativo.value = config?.correlativo_factura_fiscal ?? 0
  } finally {
    correlativoLoading.value = false
  }
}

async function guardarCorrelativo() {
  correlativoSaving.value = true
  correlativoSaved.value = false
  try {
    const config = await window.api?.configImpresoraUpdate?.({
      correlativoFacturaFiscal: Number(correlativo.value) || 0
    })
    correlativo.value = config?.correlativo_factura_fiscal ?? correlativo.value
    correlativoSaved.value = true
  } finally {
    correlativoSaving.value = false
  }
}

// Porcentaje de IVA: valor único usado por todo el sistema para calcular
// iva/ivaBs del carrito y el que se manda al registrar cada venta (ver
// stores/cart.js y stores/sales.js) — vive en config_empresa, no en la
// impresora, pero se edita desde acá por conveniencia. Misma máscara de
// centavos que la tasa de cambio del header (ver utils/format.js).
const ivaDigits = ref(digitsFromDecimal(16))
const ivaDisplay = computed(() => maskDisplay(ivaDigits.value))
const ivaLoading = ref(false)
const ivaSaving = ref(false)
const ivaSaved = ref(false)

function onIvaInput(e) {
  ivaDigits.value = e.target.value.replace(/\D/g, '').slice(0, 10) || '0'
  ivaSaved.value = false
  nextTick(() => {
    const len = e.target.value.length
    e.target.setSelectionRange(len, len)
  })
}

function selectIvaAll(e) {
  e.target.select()
}

async function cargarIva() {
  ivaLoading.value = true
  try {
    await configEmpresa.fetchAll()
    ivaDigits.value = digitsFromDecimal(configEmpresa.porcentajeIva)
  } finally {
    ivaLoading.value = false
  }
}

async function guardarIva() {
  ivaSaving.value = true
  ivaSaved.value = false
  try {
    const parsed = Number(ivaDigits.value) / 100
    await configEmpresa.actualizarPorcentajeIva(parsed)
    ivaDigits.value = digitsFromDecimal(configEmpresa.porcentajeIva)
    ivaSaved.value = true
  } finally {
    ivaSaving.value = false
  }
}

// La impresora fiscal instalada es TFHKA (tfhkaif.dll) — es el único
// conector soportado.

// La prueba de tfhkaif solo abre el puerto, hace ping (CheckFprinter) y lee
// el estado (ReadFpStatus) — nunca envía comandos de impresión ni toca la
// memoria fiscal.
const tfhkaTesting = ref(false)
const tfhkaResult = ref(null) // { ok: boolean, message: string } | null

async function probarTfhka() {
  tfhkaTesting.value = true
  tfhkaResult.value = null
  try {
    tfhkaResult.value = (await window.api?.testTfhka?.(selectedPort.value)) || {
      ok: false,
      message: 'API no disponible'
    }
    // Recuerda el puerto que funcionó, para que Fiscalización (Reporte X/Z)
    // no tenga que volver a pedirlo.
    if (tfhkaResult.value.ok) {
      await window.api?.configImpresoraUpdate?.({
        puertoCom: selectedPort.value,
        conector: 'tfhkaif',
        ultimoTestOk: true,
        ultimoTestMensaje: tfhkaResult.value.message
      })
    }
  } finally {
    tfhkaTesting.value = false
  }
}

// Reporte X: consulta no fiscal, no resetea acumulados. Solo se ofrece
// tras una prueba de conexión exitosa.
const reporteXPrinting = ref(false)
const reporteXResult = ref(null) // { ok: boolean, message: string } | null

async function imprimirReporteX() {
  reporteXPrinting.value = true
  reporteXResult.value = null
  try {
    reporteXResult.value = (await window.api?.printReporteX?.(selectedPort.value)) || {
      ok: false,
      message: 'API no disponible'
    }
  } finally {
    reporteXPrinting.value = false
  }
}

async function scan() {
  scanning.value = true
  try {
    const found = (await window.api?.scanComPorts?.()) || []
    ports.value = found
    if (!found.includes(selectedPort.value)) {
      selectedPort.value = found[0] || ''
    }
  } finally {
    scanning.value = false
    scanned.value = true
  }
}

onMounted(async () => {
  const config = await window.api?.configImpresoraGet?.()
  if (config?.puerto_com) selectedPort.value = config.puerto_com
  await scan()
  await cargarCorrelativo()
  await cargarIva()
})
</script>

<template>
  <div class="view-content">
    <router-link :to="{ name: 'configuracion' }" class="back-link">
      <AppIcon name="chevron" :size="14" />
      Volver a Configuración
    </router-link>

    <div class="main-card">
      <div class="cfg-title">Conf. Fiscal</div>

      <div class="cfg-body">
        <div class="cfg-row">
          <BaseField label="Correlativo de la máquina">
            <div class="port-row">
              <input
                v-model.number="correlativo"
                type="number"
                min="0"
                step="1"
                :disabled="correlativoLoading || correlativoSaving"
                @input="correlativoSaved = false"
              />
              <BaseButton
                variant="ghost"
                size="sm"
                :disabled="correlativoLoading || correlativoSaving"
                @click="guardarCorrelativo"
              >
                <AppIcon name="check" :size="14" />
                {{ correlativoSaving ? 'Guardando...' : 'Guardar' }}
              </BaseButton>
              <span v-if="correlativoSaved" class="connector-status ok">Guardado</span>
            </div>
            <small class="port-hint">Este es el último id de factura de la máquina</small>
          </BaseField>

          <div></div>

          <BaseField label="Porcentaje de IVA">
            <div class="port-row">
              <input
                :value="ivaDisplay"
                type="text"
                inputmode="numeric"
                :disabled="ivaLoading || ivaSaving"
                @input="onIvaInput"
                @click="selectIvaAll"
              />
              <BaseButton
                variant="ghost"
                size="sm"
                :disabled="ivaLoading || ivaSaving"
                @click="guardarIva"
              >
                <AppIcon name="check" :size="14" />
                {{ ivaSaving ? 'Guardando...' : 'Actualizar' }}
              </BaseButton>
              <span v-if="ivaSaved" class="connector-status ok">Guardado</span>
            </div>
            <small class="port-hint">Se usa en todos los cálculos de IVA del sistema</small>
          </BaseField>
        </div>

        <hr class="cfg-divider" />

        <div class="cfg-row">
          <BaseField label="Puertos COM">
            <div class="port-row">
              <select v-model="selectedPort" :disabled="ports.length === 0">
                <option v-if="ports.length === 0" value="" disabled>
                  {{ scanning ? 'Escaneando...' : 'Sin puertos detectados' }}
                </option>
                <option v-for="p in ports" :key="p" :value="p">{{ p }}</option>
              </select>
              <BaseButton variant="ghost" size="sm" :disabled="scanning" @click="scan">
                <AppIcon name="repeat" :size="14" />
                {{ scanning ? 'Escaneando...' : 'Escanear' }}
              </BaseButton>
            </div>
            <span v-if="scanned && ports.length === 0" class="port-hint">
              No se detectó ningún puerto COM en este equipo.
            </span>
          </BaseField>

          <div></div>

          <div>
            <div class="cfg-subtitle">Conectores</div>
            <div class="connector-list">
              <div class="connector-row">
                <span class="connector-name">tfhkaif</span>

                <BaseButton
                  variant="ghost"
                  size="sm"
                  :disabled="tfhkaTesting || !selectedPort || tfhkaResult?.ok === true"
                  @click="probarTfhka"
                >
                  {{ tfhkaTesting ? 'Probando...' : 'Probar' }}
                </BaseButton>
                <span v-if="tfhkaResult?.ok === true" class="connector-status ok">
                  Éxito — {{ tfhkaResult.message }}
                </span>
                <span v-else-if="tfhkaResult?.ok === false" class="connector-status err">
                  Error — {{ tfhkaResult.message }}
                </span>

                <template v-if="tfhkaResult?.ok === true">
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    :disabled="reporteXPrinting"
                    @click="imprimirReporteX"
                  >
                    {{ reporteXPrinting ? 'Imprimiendo...' : 'Imprimir reporte X' }}
                  </BaseButton>
                  <span v-if="reporteXResult?.ok === true" class="connector-status ok">
                    Éxito — {{ reporteXResult.message }}
                  </span>
                  <span v-else-if="reporteXResult?.ok === false" class="connector-status err">
                    Error — {{ reporteXResult.message }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-content {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  padding: 22px 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  padding: 6px 4px;
}
.back-link:hover {
  color: var(--primary);
}
.main-card {
  flex: 1;
  min-height: 0;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cfg-title {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}
.cfg-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 22px;
}
.cfg-row {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}
.cfg-row > * {
  grid-column: span 4;
}
.port-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.port-row select,
.port-row input {
  flex: 1;
}
.port-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.cfg-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 22px 0;
}

.cfg-subtitle {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 14px;
}
.connector-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.connector-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--border);
}
.connector-row:last-child {
  border-bottom: none;
}
.connector-name {
  flex: 1;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
}
.connector-status {
  font-size: 12px;
  font-weight: 700;
  word-break: break-word;
}
.connector-status.ok {
  color: var(--success);
}
.connector-status.err {
  color: var(--danger);
}
</style>
