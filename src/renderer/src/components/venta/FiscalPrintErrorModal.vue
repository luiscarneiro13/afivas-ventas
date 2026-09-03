<script setup>
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  message: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'retry'])

function close() {
  emit('update:modelValue', false)
}
function retry() {
  emit('retry')
  close()
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    width="380px"
    :show-header="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="fp-body">
      <div class="ic"><AppIcon name="alert" :size="22" /></div>
      <h3>No se pudo imprimir la factura fiscal</h3>
      <p>{{ message }}</p>
      <p class="fp-note">La venta ya quedó registrada. Puedes reintentar la impresión cuando la impresora esté disponible.</p>
      <div class="fp-actions">
        <BaseButton variant="ghost" @click="close">Cerrar</BaseButton>
        <BaseButton variant="primary" @click="retry">Reintentar</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.fp-body {
  padding: 24px 22px;
  text-align: center;
}
.fp-body .ic {
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
.fp-body h3 {
  font-size: 16px;
  font-weight: 700;
}
.fp-body p {
  font-size: 13.5px;
  color: var(--text-muted);
  margin: 6px 0;
}
.fp-note {
  margin-bottom: 18px;
}
.fp-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.fp-actions > * {
  flex: 1;
}
</style>
