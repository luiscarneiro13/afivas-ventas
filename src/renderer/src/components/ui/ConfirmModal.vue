<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import AppIcon from './AppIcon.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '¿Confirmar?' },
  text: { type: String, default: 'Esta acción no se puede deshacer.' },
  icon: { type: String, default: 'trash' },
  confirmLabel: { type: String, default: 'Eliminar' }
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function cancel() {
  emit('update:modelValue', false)
  emit('cancel')
}
function confirm() {
  emit('update:modelValue', false)
  emit('confirm')
}
</script>

<template>
  <BaseModal :model-value="modelValue" width="360px" :show-header="false" @update:model-value="$emit('update:modelValue', $event)">
    <div class="confirm-body">
      <div class="ic"><AppIcon :name="icon" :size="22" /></div>
      <h3>{{ title }}</h3>
      <p>{{ text }}</p>
      <div class="confirm-actions">
        <BaseButton variant="ghost" @click="cancel">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="confirm">{{ confirmLabel }}</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.confirm-body {
  padding: 24px 22px;
  text-align: center;
}
.confirm-body .ic {
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
.confirm-body h3 {
  font-size: 16px;
  font-weight: 700;
}
.confirm-body p {
  font-size: 13.5px;
  color: var(--text-muted);
  margin: 6px 0 20px;
}
.confirm-actions {
  display: flex;
  gap: 10px;
}
.confirm-actions > * {
  flex: 1;
}
</style>
