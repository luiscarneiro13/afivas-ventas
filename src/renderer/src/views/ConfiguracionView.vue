<script setup>
import { ref, onMounted } from 'vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'

const ports = ref([])
const selectedPort = ref('')
const scanning = ref(false)
const scanned = ref(false)

// Conectores fiscales disponibles en /Conectores. La impresora fiscal
// instalada es TFHKA (tfhkaif.dll) — es el único con prueba habilitada;
// el resto queda deshabilitado hasta confirmar qué marca corresponde.
const CONECTORES = [
  'tfhkaif',
  'BemaFI32',
  'BemaMFD2ES',
  'dtp2usb',
  'EpsonFiscalDriver',
  'HybridFiscal',
  'mscifw32',
  'pnpdll',
  'vmax3fpi',
  'winfis32'
]

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

onMounted(scan)
</script>

<template>
  <div class="view-content">
    <div class="main-card">
      <div class="cfg-title">Configuración</div>

      <div class="cfg-body">
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

        <hr class="cfg-divider" />

        <div class="cfg-subtitle">Conectores</div>
        <div class="connector-list">
          <div v-for="c in CONECTORES" :key="c" class="connector-row">
            <span class="connector-name" :class="{ disabled: c !== 'tfhkaif' }">{{ c }}</span>

            <template v-if="c === 'tfhkaif'">
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
            </template>
            <span v-else class="connector-disabled">Deshabilitado</span>
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
}
.main-card {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  height: 100%;
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
.port-row {
  display: flex;
  gap: 10px;
  max-width: 360px;
}
.port-row select {
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
  max-width: 560px;
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
.connector-name.disabled {
  color: #c2c2cc;
}
.connector-disabled {
  font-size: 12.5px;
  font-weight: 600;
  color: #c2c2cc;
  text-decoration: line-through;
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
