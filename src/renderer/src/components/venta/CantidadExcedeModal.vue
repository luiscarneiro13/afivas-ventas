<script setup>
import { nextTick, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { useUiStore } from '@renderer/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  desc: { type: String, default: '' },
  solicitado: { type: Number, default: 0 },
  disponible: { type: Number, default: 0 }
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const ui = useUiStore()
const cantidad = ref(0)
const inputRef = ref(null)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    cantidad.value = Math.max(1, props.disponible)
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  }
)

function close() {
  emit('update:modelValue', false)
}
function cancelar() {
  close()
  emit('cancel')
}
function confirmar() {
  const qty = Math.floor(Number(cantidad.value))
  if (!qty || qty <= 0 || qty > props.disponible) {
    ui.toast(`Ingresa una cantidad entre 1 y ${props.disponible}`, 'error')
    return
  }
  close()
  emit('confirm', qty)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    width="380px"
    :show-header="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="cx-body">
      <div class="ic"><AppIcon name="alert" :size="22" /></div>
      <h3>Existencia insuficiente</h3>
      <p>
        Estás solicitando <b>{{ solicitado }}</b> unidades de "<b>{{ desc }}</b>", pero solo hay
        <b>{{ disponible }}</b> disponibles.
      </p>
      <BaseField label="Cantidad a vender">
        <input
          ref="inputRef"
          v-model="cantidad"
          type="number"
          min="1"
          :max="disponible"
          @keydown.enter.prevent="confirmar"
        />
      </BaseField>
      <div class="cx-actions">
        <BaseButton variant="ghost" @click="cancelar">Cancelar</BaseButton>
        <BaseButton variant="primary" @click="confirmar">Confirmar</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.cx-body {
  padding: 24px 22px;
  text-align: center;
}
.cx-body .ic {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--danger-light);
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
.cx-body h3 {
  font-size: 16px;
  font-weight: 700;
}
.cx-body p {
  font-size: 13.5px;
  color: var(--text-muted);
  margin: 6px 0 18px;
}
.cx-body p b {
  color: var(--text);
}
.cx-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.cx-actions > * {
  flex: 1;
}
</style>
