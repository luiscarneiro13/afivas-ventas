<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { ICONS } from '@renderer/icons/icons'
import { useCategoriasStore } from '@renderer/stores/categorias'
import { useUiStore } from '@renderer/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  categoria: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const categorias = useCategoriasStore()
const ui = useUiStore()

// excel/pdf son iconos de marca con colores fijos, no sirven para teñir con
// el color elegido de la categoría.
const ICON_OPTIONS = Object.keys(ICONS).filter((k) => k !== 'excel' && k !== 'pdf')

const isEdit = computed(() => !!props.categoria)
const title = computed(() => (isEdit.value ? 'Editar categoría' : 'Nueva categoría'))

const form = reactive({
  nombre: '',
  icono: ICON_OPTIONS[0],
  color: '#5d3fd3'
})

function resetForm() {
  if (props.categoria) {
    form.nombre = props.categoria.nombre
    form.icono = props.categoria.icono
    form.color = props.categoria.color
  } else {
    form.nombre = ''
    form.icono = ICON_OPTIONS[0]
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
  if (!nombre || !form.icono || !form.color) {
    ui.toast('Completa todos los campos correctamente', 'error')
    return
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      await categorias.create({ nombre, icono: form.icono, color: form.color })
      ui.toast(`Categoría "${nombre}" creada`, 'success')
    } else {
      await categorias.update(props.categoria.id, { nombre, icono: form.icono, color: form.color })
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
    <BaseField label="Icono">
      <div class="icon-grid">
        <button
          v-for="key in ICON_OPTIONS"
          :key="key"
          type="button"
          class="icon-opt"
          :class="{ active: form.icono === key }"
          :title="key"
          @click="form.icono = key"
        >
          <AppIcon :name="key" :size="18" />
        </button>
      </div>
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
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
  gap: 6px;
  max-height: 160px;
  overflow-y: auto;
  padding: 2px;
}
.icon-opt {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: var(--surface-alt);
  border: 1.5px solid var(--border);
  transition: 0.15s;
}
.icon-opt:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.icon-opt.active {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}
</style>
