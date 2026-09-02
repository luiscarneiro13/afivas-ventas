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
  nombre: ''
})

function resetForm() {
  form.nombre = props.categoria ? props.categoria.nombre : ''
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
  if (!nombre) {
    ui.toast('Completa todos los campos correctamente', 'error')
    return
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      await categorias.create({ nombre })
      ui.toast(`Categoría "${nombre}" creada`, 'success')
    } else {
      await categorias.update(props.categoria.id, { nombre })
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
    <BaseButton variant="primary" block :disabled="saving" @click="guardar">
      {{ saving ? 'Guardando...' : 'Guardar categoría' }}
    </BaseButton>
  </BaseModal>
</template>
