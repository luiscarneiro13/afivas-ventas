<script setup>
import { ref, computed, watch } from 'vue'
import { fmtBs, round2 } from '@renderer/utils/format'
import { useUiStore } from '@renderer/stores/ui'
import { useBancosStore } from '@renderer/stores/bancos'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import SearchDropdown from '@renderer/components/ui/SearchDropdown.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  total: { type: Number, default: 0 }, // dólares — base real que se guarda en la BD
  totalBs: { type: Number, default: 0 }, // bolívares — lo único que se muestra
  tasa: { type: Number, default: 1 },
  payMethods: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'finalizar'])

const ui = useUiStore()
const bancosStore = useBancosStore()

const metodoPago = ref('efectivo')
const montoRecibidoBs = ref('0.00')
const referencia = ref('')
const bancoId = ref(null)
const bancoQuery = ref('')

const bancoItems = computed(() => {
  const q = bancoQuery.value.trim().toLowerCase()
  return q ? bancosStore.items.filter((b) => b.nombre.toLowerCase().includes(q)) : bancosStore.items
})

function seleccionarBanco(b) {
  bancoId.value = b.id
  bancoQuery.value = b.nombre
}

const metodoActivo = computed(() => props.payMethods.find((m) => m.id === metodoPago.value) || null)

// Tarjeta de crédito y Divisas van primero en la lista, pero bloqueadas
// (no disponibles todavía) — se muestran atenuadas y no se pueden elegir.
const BLOCKED_IDS = ['credito', 'divisas']
function isBlocked(id) {
  return BLOCKED_IDS.includes(id)
}
const sortedMethods = computed(() => {
  const blocked = props.payMethods
    .filter((m) => isBlocked(m.id))
    .sort((a, b) => BLOCKED_IDS.indexOf(a.id) - BLOCKED_IDS.indexOf(b.id))
  const resto = props.payMethods.filter((m) => !isBlocked(m.id))
  return [...blocked, ...resto]
})

const vueltoBs = computed(() => round2((parseFloat(montoRecibidoBs.value) || 0) - props.totalBs))

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      metodoPago.value = 'efectivo'
      montoRecibidoBs.value = props.totalBs.toFixed(2)
      referencia.value = ''
      bancoId.value = null
      bancoQuery.value = ''
    }
  }
)

function seleccionarMetodo(id) {
  if (isBlocked(id)) return
  metodoPago.value = id
  if (metodoActivo.value?.cash) montoRecibidoBs.value = props.totalBs.toFixed(2)
}

function close() {
  emit('update:modelValue', false)
}

function finalizar() {
  const method = metodoActivo.value
  if (!method) return
  let recibido = props.total
  let vueltoFinal = 0
  if (method.cash) {
    const recibidoBs = parseFloat(montoRecibidoBs.value) || 0
    if (recibidoBs < props.totalBs) {
      ui.toast('El monto recibido es insuficiente', 'error')
      return
    }
    // Los montos se capturan en Bs, pero recibido/vuelto se guardan en
    // dólares (misma base que subtotal/iva/total en la BD).
    recibido = round2(recibidoBs / props.tasa)
    vueltoFinal = round2(recibido - props.total)
  }
  const admiteReferencia = method.id === 'transferencia' || method.id === 'pagomovil'
  emit('finalizar', {
    methodId: method.id,
    recibido,
    vuelto: vueltoFinal,
    referencia: admiteReferencia ? referencia.value.trim() || null : null,
    bancoId: method.id === 'transferencia' ? bancoId.value : null
  })
}
</script>

<template>
  <BaseModal :model-value="modelValue" title="Forma de pago" width="460px" @update:model-value="emit('update:modelValue', $event)">
    <div class="pay-total">
      <span>Total a pagar</span>
      <div class="amt num">{{ fmtBs(totalBs) }}</div>
    </div>

    <div class="pay-methods">
      <button
        v-for="m in sortedMethods"
        :key="m.id"
        type="button"
        class="pay-method"
        :class="{ active: metodoPago === m.id, blocked: isBlocked(m.id) }"
        :disabled="isBlocked(m.id)"
        :title="isBlocked(m.id) ? 'No disponible por ahora' : ''"
        @click="seleccionarMetodo(m.id)"
      >
        <AppIcon :name="m.icon" :size="20" />
        <span>{{ m.label }}</span>
      </button>
    </div>

    <div v-if="metodoActivo?.cash">
      <div class="field">
        <label>Monto recibido (Bs)</label>
        <input v-model="montoRecibidoBs" type="number" min="0" step="0.01" />
      </div>
      <div class="vuelto-box" :class="{ neg: vueltoBs < 0 }">
        <span>{{ vueltoBs < 0 ? 'Falta' : 'Vuelto' }}</span>
        <span class="num">{{ fmtBs(Math.abs(vueltoBs)) }}</span>
      </div>
    </div>
    <div v-else-if="metodoPago === 'transferencia'">
      <div class="field">
        <label>Banco (opcional)</label>
        <SearchDropdown
          v-model="bancoQuery"
          placeholder="Buscar banco..."
          :items="bancoItems"
          item-key="id"
          show-on-empty-focus
          empty-message="Sin coincidencias"
          @select="seleccionarBanco"
        >
          <template #item="{ item }">
            <b>{{ item.nombre }}</b>
          </template>
        </SearchDropdown>
      </div>
      <div class="field">
        <label>Referencia / N° de operación (opcional)</label>
        <input v-model="referencia" type="text" placeholder="Opcional" />
      </div>
    </div>
    <div v-else-if="metodoPago === 'pagomovil'">
      <div class="field">
        <label>Referencia / N° de operación (opcional)</label>
        <input v-model="referencia" type="text" placeholder="Opcional" />
      </div>
    </div>

    <BaseButton variant="primary" block style="margin-top: 18px" @click="finalizar">Finalizar venta</BaseButton>
  </BaseModal>
</template>

<style scoped>
.pay-total {
  text-align: center;
  padding: 6px 0 18px;
}
.pay-total span {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pay-total .amt {
  font-size: 32px;
  font-weight: 800;
  color: var(--primary);
  margin-top: 4px;
}
.pay-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}
.pay-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: var(--surface-alt);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  transition: 0.15s;
}
.pay-method:hover {
  border-color: var(--primary);
}
.pay-method.active {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary);
}
.pay-method.blocked {
  opacity: 0.45;
  cursor: not-allowed;
}
.pay-method.blocked:hover {
  border-color: var(--border);
}

.field label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 7px;
}
.field input {
  width: 100%;
  padding: 10px 13px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  background: var(--surface);
  color: var(--text);
}
.field input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}
.field + .field {
  margin-top: 14px;
}

.vuelto-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--success-light);
  color: var(--success);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-top: 14px;
  font-weight: 700;
  font-size: 14px;
}
.vuelto-box.neg {
  background: var(--danger-light);
  color: var(--danger);
}
</style>
