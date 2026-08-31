<script setup>
// Wrapper de campo de formulario: label + slot con el input/select real.
// Uso: <BaseField label="Usuario"><input v-model="x" /></BaseField>
defineProps({
  label: { type: String, default: '' }
})
</script>

<template>
  <div class="field">
    <label v-if="label">{{ label }}</label>
    <slot />
  </div>
</template>

<style scoped>
.field {
  text-align: left;
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.field :deep(input),
.field :deep(select),
.field :deep(textarea) {
  width: 100%;
  padding: 11px 13px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--surface-alt);
  transition: 0.15s;
  color: var(--text);
}
.field :deep(input:focus),
.field :deep(select:focus),
.field :deep(textarea:focus) {
  outline: none;
  border-color: var(--primary);
  background: #fff;
  box-shadow: 0 0 0 4px var(--primary-light);
}
</style>
