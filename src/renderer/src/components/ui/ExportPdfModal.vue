<script setup>
import { ref, watch } from 'vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Exportar a PDF' },
  // fields: [{ key, label }]; defaults: keys marcados al abrir el modal.
  fields: { type: Array, required: true },
  defaults: { type: Array, required: true }
})
const emit = defineEmits(['update:modelValue', 'export'])

const selected = ref([...props.defaults])

watch(
  () => props.modelValue,
  (open) => {
    if (open) selected.value = [...props.defaults]
  }
)

function close() {
  emit('update:modelValue', false)
}

function exportPdf() {
  if (selected.value.length === 0) return
  emit(
    'export',
    props.fields.filter((f) => selected.value.includes(f.key))
  )
  close()
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" width="420px" @update:model-value="close">
    <p class="modal-hint">Selecciona los campos que se incluirán en el reporte:</p>
    <div class="fields-grid">
      <label v-for="f in fields" :key="f.key" class="checkbox-row">
        <input v-model="selected" type="checkbox" :value="f.key" />
        {{ f.label }}
      </label>
    </div>

    <template #footer>
      <div class="footer-actions">
        <BaseButton variant="ghost" @click="close">Cancelar</BaseButton>
        <BaseButton variant="primary" :disabled="selected.length === 0" @click="exportPdf">
          <AppIcon name="pdf" :size="15" />
          Exportar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.modal-hint {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
  cursor: pointer;
}
.checkbox-row input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--border);
}
</style>
