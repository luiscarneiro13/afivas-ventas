<script setup>
import { ref, computed, watch } from 'vue'
import { fmtUsd, fmtBs, round2 } from '@renderer/utils/format'
import { useUiStore } from '@renderer/stores/ui'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  totalBs: { type: Number, default: 0 },
  payMethods: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'finalizar'])

const ui = useUiStore()

const metodoPago = ref('efectivo')
const montoRecibido = ref('0.00')
const referencia = ref('')

const metodoActivo = computed(() => props.payMethods.find((m) => m.id === metodoPago.value) || null)

const vuelto = computed(() => round2((parseFloat(montoRecibido.value) || 0) - props.total))

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      metodoPago.value = 'efectivo'
      montoRecibido.value = props.total.toFixed(2)
      referencia.value = ''
    }
  }
)

function seleccionarMetodo(id) {
  metodoPago.value = id
  if (metodoActivo.value?.cash) montoRecibido.value = props.total.toFixed(2)
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
    recibido = parseFloat(montoRecibido.value) || 0
    if (recibido < props.total) {
      ui.toast('El monto recibido es insuficiente', 'error')
      return
    }
    vueltoFinal = round2(recibido - props.total)
  }
  emit('finalizar', { methodId: method.id, recibido, vuelto: vueltoFinal })
}
</script>

<template>
  <BaseModal :model-value="modelValue" title="Forma de pago" width="460px" @update:model-value="emit('update:modelValue', $event)">
    <div class="pay-total">
      <span>Total a pagar</span>
      <div class="amt num">{{ fmtUsd(total) }}</div>
      <div class="amt2 num">{{ fmtBs(totalBs) }}</div>
    </div>

    <div class="pay-methods">
      <button
        v-for="m in payMethods"
        :key="m.id"
        type="button"
        class="pay-method"
        :class="{ active: metodoPago === m.id }"
        @click="seleccionarMetodo(m.id)"
      >
        <AppIcon :name="m.icon" :size="20" />
        <span>{{ m.label }}</span>
      </button>
    </div>

    <div v-if="metodoActivo?.cash">
      <div class="field">
        <label>Monto recibido ($)</label>
        <input v-model="montoRecibido" type="number" min="0" step="0.01" />
      </div>
      <div class="vuelto-box" :class="{ neg: vuelto < 0 }">
        <span>{{ vuelto < 0 ? 'Falta' : 'Vuelto' }}</span>
        <span class="num">{{ fmtUsd(Math.abs(vuelto)) }}</span>
      </div>
    </div>
    <div v-else>
      <div class="field">
        <label>Referencia / N° de operación</label>
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
.pay-total .amt2 {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
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
