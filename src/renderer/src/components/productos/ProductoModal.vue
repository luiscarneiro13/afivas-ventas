<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useUiStore } from '@renderer/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  producto: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const catalog = useCatalogStore()
const ui = useUiStore()

const isEdit = computed(() => !!props.producto)
const title = computed(() => (isEdit.value ? 'Editar producto' : 'Nuevo producto'))

const form = reactive({
  codigo: '',
  desc: '',
  cat: catalog.categoryNames[0] || '',
  precio: '',
  existencia: 0,
  stockMinimo: 3
})

function resetForm() {
  if (props.producto) {
    form.codigo = props.producto.codigo
    form.desc = props.producto.desc
    form.cat = props.producto.cat
    form.precio = props.producto.precio
    form.existencia = props.producto.existencia
    form.stockMinimo = props.producto.stockMinimo ?? 3
  } else {
    form.codigo = ''
    form.desc = ''
    form.cat = catalog.categoryNames[0] || ''
    form.precio = ''
    form.existencia = 0
    form.stockMinimo = 3
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
  const codigo = form.codigo.trim().toUpperCase()
  const desc = form.desc.trim()
  const cat = form.cat
  const precio = parseFloat(form.precio)
  const existencia =
    form.existencia === '' || form.existencia === null ? 0 : parseInt(form.existencia, 10)
  const stockMinimo =
    form.stockMinimo === '' || form.stockMinimo === null ? 3 : parseInt(form.stockMinimo, 10)

  if (
    !codigo ||
    !desc ||
    !cat ||
    isNaN(precio) ||
    precio < 0 ||
    isNaN(existencia) ||
    existencia < 0 ||
    isNaN(stockMinimo) ||
    stockMinimo < 0
  ) {
    ui.toast('Completa todos los campos correctamente', 'error')
    return
  }

  if (!isEdit.value && catalog.exists(codigo)) {
    ui.toast('Ese código ya existe', 'error')
    return
  }

  saving.value = true
  try {
    if (!isEdit.value) {
      await catalog.create({ codigo, desc, cat, precio, existencia, stockMinimo })
      ui.toast(`Producto "${desc}" creado`, 'success')
    } else {
      await catalog.update(props.producto.codigo, { desc, cat, precio, existencia, stockMinimo })
      ui.toast(`Producto "${desc}" actualizado`, 'success')
    }
    close()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo guardar el producto', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <BaseField label="Código">
      <input v-model="form.codigo" type="text" placeholder="Ej. AA0011" :disabled="isEdit" />
    </BaseField>
    <BaseField label="Descripción">
      <input v-model="form.desc" type="text" placeholder="Ej. Llavero de silicona" />
    </BaseField>
    <div class="field-row">
      <BaseField label="Categoría">
        <select v-model="form.cat">
          <option v-for="c in catalog.categoryNames" :key="c" :value="c">{{ c }}</option>
        </select>
      </BaseField>
      <BaseField label="Precio ($)">
        <input v-model="form.precio" type="number" min="0" step="0.01" />
      </BaseField>
    </div>
    <div class="field-row">
      <BaseField label="Existencia (opcional)">
        <input v-model="form.existencia" type="number" min="0" step="1" placeholder="0" />
      </BaseField>
      <BaseField label="Alerta de cantidad mínima (opcional)">
        <input v-model="form.stockMinimo" type="number" min="0" step="1" placeholder="3" />
      </BaseField>
    </div>
    <BaseButton variant="primary" block :disabled="saving" @click="guardar">
      {{ saving ? 'Guardando...' : 'Guardar producto' }}
    </BaseButton>
  </BaseModal>
</template>

<style scoped>
.field-row {
  display: flex;
  gap: 12px;
}
.field-row > * {
  flex: 1;
  min-width: 0;
}
</style>
