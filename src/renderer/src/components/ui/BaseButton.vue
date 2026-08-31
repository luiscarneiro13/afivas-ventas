<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | ghost | danger
  size: { type: String, default: 'md' }, // md | sm
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' }
})
defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    class="btn"
    :class="[`btn-${variant}`, { 'btn-block': block, 'btn-sm': size === 'sm' }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 18px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 14px;
  transition: 0.15s;
  white-space: nowrap;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 6px 16px rgba(93, 63, 211, 0.3);
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}
.btn-primary:disabled {
  background: var(--border);
  color: var(--text-muted);
  box-shadow: none;
  cursor: not-allowed;
}
.btn-block {
  width: 100%;
}
.btn-ghost {
  background: var(--surface-alt);
  color: var(--text);
  border: 1.5px solid var(--border);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--border);
}
.btn-danger {
  background: var(--danger);
  color: #fff;
}
.btn-danger:hover:not(:disabled) {
  background: #c01f1f;
}
.btn-sm {
  padding: 8px 14px;
  font-size: 12.5px;
}
</style>
