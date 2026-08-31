<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '460px' },
  closeOnOverlay: { type: Boolean, default: true },
  showHeader: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'close'])

function close() {
  emit('update:modelValue', false)
  emit('close')
}
function onOverlayClick() {
  if (props.closeOnOverlay) close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay active" @click.self="onOverlayClick">
      <div class="modal" :style="{ width: `min(${width}, 100%)` }">
        <div v-if="showHeader" class="modal-head">
          <h3>{{ title }}</h3>
          <button class="icon-btn" title="Cerrar" @click="close"><AppIcon name="x" :size="18" /></button>
        </div>
        <div class="modal-body" :class="{ 'no-header-pad': !showHeader }">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 35, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal {
  background: var(--surface);
  border-radius: 22px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: pop 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2);
  position: relative;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px;
  border-bottom: 1px solid var(--border);
}
.modal-head h3 {
  font-size: 16px;
  font-weight: 700;
}
.modal-body {
  padding: 22px;
}
.modal-body.no-header-pad {
  padding: 0;
}
.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: var(--surface-alt);
  border: 1px solid var(--border);
  transition: 0.15s;
  flex-shrink: 0;
}
.icon-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
}
</style>
