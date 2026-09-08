<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import BaseField from '@renderer/components/ui/BaseField.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import SearchDropdown from '@renderer/components/ui/SearchDropdown.vue'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useDescargosStore } from '@renderer/stores/descargos'
import { useAuthStore } from '@renderer/stores/auth'
import { useUiStore } from '@renderer/stores/ui'

const MOTIVOS = ['Producto defectuoso', 'Auto consumo']

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const catalog = useCatalogStore()
const descargos = useDescargosStore()
const auth = useAuthStore()
const ui = useUiStore()

const searchQuery = ref('')
const searchResults = computed(() => catalog.search(searchQuery.value))
const selectedProduct = ref(null)

const form = reactive({
  cantidad: 1,
  motivo: MOTIVOS[0],
  nota: ''
})

function resetForm() {
  searchQuery.value = ''
  selectedProduct.value = null
  form.cantidad = 1
  form.motivo = MOTIVOS[0]
  form.nota = ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm()
  }
)

function selectProduct(item) {
  selectedProduct.value = item
  searchQuery.value = ''
}

function close() {
  emit('update:modelValue', false)
}

const saving = ref(false)

async function guardar() {
  if (!selectedProduct.value) {
    ui.toast('Selecciona un producto', 'error')
    return
  }
  const cantidad = parseInt(form.cantidad, 10)
  if (isNaN(cantidad) || cantidad <= 0) {
    ui.toast('Ingresa una cantidad válida', 'error')
    return
  }
  if (cantidad > selectedProduct.value.existencia) {
    ui.toast('La cantidad excede la existencia disponible', 'error')
    return
  }

  const desc = selectedProduct.value.desc
  saving.value = true
  try {
    await descargos.registrar({
      productoId: selectedProduct.value.id,
      cantidad,
      motivo: form.motivo,
      nota: form.nota.trim(),
      usuarioId: auth.usuarioId
    })
    ui.toast(`Se descargaron ${cantidad} unidades de "${desc}"`, 'success')
    close()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo registrar el descargo', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" title="Nuevo descargo" @update:model-value="$emit('update:modelValue', $event)">
    <div class="field" style="position: relative">
      <label>Producto</label>
      <SearchDropdown
        v-model="searchQuery"
        placeholder="Buscar por código o nombre..."
        :items="searchResults"
        item-key="codigo"
        empty-message="Sin coincidencias"
        @select="selectProduct"
      >
        <template #item="{ item }">
          <b>{{ item.desc }}</b>
          <span>{{ item.codigo }} · Exist: {{ item.existencia }}</span>
        </template>
      </SearchDropdown>
    </div>
    <div v-if="selectedProduct" class="selected-product-box">
      <div class="info">
        <b>{{ selectedProduct.desc }}</b>
        <span>{{ selectedProduct.codigo }} · Existencia actual: {{ selectedProduct.existencia }}</span>
      </div>
    </div>
    <BaseField label="Cantidad a extraer">
      <input v-model="form.cantidad" type="number" min="1" />
    </BaseField>
    <BaseField label="Motivo">
      <select v-model="form.motivo">
        <option v-for="m in MOTIVOS" :key="m" :value="m">{{ m }}</option>
      </select>
    </BaseField>
    <BaseField label="Nota (opcional)">
      <input v-model="form.nota" type="text" placeholder="Ej. Detalle adicional" />
    </BaseField>
    <BaseButton variant="primary" block :disabled="saving" @click="guardar">
      {{ saving ? 'Guardando...' : 'Registrar descargo' }}
    </BaseButton>
  </BaseModal>
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
.selected-product-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  margin-top: 6px;
  margin-bottom: 14px;
}
.selected-product-box .info {
  flex: 1;
  min-width: 0;
}
.selected-product-box b {
  font-size: 12.5px;
  display: block;
}
.selected-product-box span {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
