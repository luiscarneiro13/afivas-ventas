<script setup>
import { useUiStore } from '@renderer/stores/ui'
import AppIcon from './AppIcon.vue'

const ui = useUiStore()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="t.type">
        <span class="ic"><AppIcon :name="t.icon" :size="16" /></span>
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  box-shadow: var(--shadow-md);
  font-size: 13px;
  font-weight: 500;
  min-width: 260px;
}
.toast .ic {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.toast.success .ic {
  background: var(--success-light);
  color: var(--success);
}
.toast.warning .ic {
  background: var(--warning-light);
  color: var(--warning);
}
.toast.error .ic {
  background: var(--danger-light);
  color: var(--danger);
}
.toast.info .ic {
  background: var(--primary-light);
  color: var(--primary);
}
.toast-enter-active {
  animation: slideIn 0.25s ease;
}
.toast-leave-active {
  animation: fadeOut 0.25s ease forwards;
  position: absolute;
}
</style>
