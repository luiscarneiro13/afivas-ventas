<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import { useCategoriasStore } from '@renderer/stores/categorias'
import { useUiStore } from '@renderer/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  categoria: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const categorias = useCategoriasStore()
const ui = useUiStore()

const isEdit = computed(() => !!props.categoria)
const title = computed(() => (isEdit.value ? 'Editar categoría' : 'Nueva categoría'))

const form = reactive({
  nombre: '',
  color: '#5d3fd3'
})

function resetForm() {
  if (props.categoria) {
    form.nombre = props.categoria.nombre
    form.color = props.categoria.color
  } else {
    form.nombre = ''
    form.color = '#5d3fd3'
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm()
  }
)

function close() {
  emit('update:modelValue', false)
}

const saving = ref(false)

async function guardar() {
  const nombre = form.nombre.trim()
  if (!nombre || !form.color) {
    ui.toast('Completa todos los campos correctamente', 'error')
    return
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      await categorias.create({ nombre, color: form.color })
      ui.toast(`Categoría "${nombre}" creada`, 'success')
    } else {
      await categorias.update(props.categoria.id, { nombre, color: form.color })
      ui.toast(`Categoría "${nombre}" actualizada`, 'success')
    }
    close()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo guardar la categoría', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <BaseField label="Nombre">
      <input v-model="form.nombre" type="text" placeholder="Ej. Accesorios" />
    </BaseField>
    <BaseField label="Color">
      <input v-model="form.color" type="color" class="color-input" />
    </BaseField>
    <BaseButton variant="primary" block :disabled="saving" @click="guardar">
      {{ saving ? 'Guardando...' : 'Guardar categoría' }}
    </BaseButton>
  </BaseModal>
</template>

<style scoped>
.color-input {
  height: 42px;
  padding: 4px;
  cursor: pointer;
}
</style>
