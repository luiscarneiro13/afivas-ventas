<script setup>
import { ref, onMounted } from 'vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'

const ports = ref([])
const selectedPort = ref('')
const scanning = ref(false)
const scanned = ref(false)

// Conectores fiscales disponibles en /Conectores (DLLs de integración).
// El resultado de la prueba de cada uno se rellena cuando se conecte la
// lógica real de prueba; hasta entonces permanece oculto.
const CONECTORES = [
  'BemaFI32',
  'BemaMFD2ES',
  'dtp2usb',
  'EpsonFiscalDriver',
  'HybridFiscal',
  'mscifw32',
  'pnpdll',
  'tfhkaif',
  'vmax3fpi',
  'winfis32'
]

const testStatus = ref({})

function probarConector(nombre) {
  // TODO: integrar la prueba real del conector (invocación a la DLL vía IPC)
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
            <span class="connector-name">{{ c }}</span>
            <BaseButton variant="ghost" size="sm" @click="probarConector(c)">Probar</BaseButton>
            <span v-if="testStatus[c] === 'success'" class="connector-status ok">Éxito</span>
            <span v-else-if="testStatus[c] === 'error'" class="connector-status err">Error</span>
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
  max-width: 480px;
}
.connector-row {
  display: flex;
  align-items: center;
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
}
.connector-status.ok {
  color: var(--success);
}
.connector-status.err {
  color: var(--danger);
}
</style>
