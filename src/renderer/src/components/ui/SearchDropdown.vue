<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AppIcon from './AppIcon.vue'

// Buscador con dropdown de resultados, reutilizado en Venta (producto/cliente)
// y Entrada de Productos. El componente padre controla el filtrado: recibe
// el texto vía v-model y expone los resultados ya filtrados en `items`.
const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  kbd: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  itemKey: { type: [String, Function], default: null },
  emptyMessage: { type: String, default: 'Sin coincidencias' },
  showOnEmptyFocus: { type: Boolean, default: false },
  // Clase(s) extra por fila del dropdown. Acepta lo mismo que :class, o una
  // función (item) => clases, para resaltar filas según su propio dato.
  itemClass: { type: [String, Object, Array, Function], default: null }
})
const emit = defineEmits(['update:modelValue', 'select', 'focus'])

const open = ref(false)
const wrapRef = ref(null)
const highlighted = ref(-1)
const itemRefs = ref([])

function keyOf(item, index) {
  if (typeof props.itemKey === 'function') return props.itemKey(item)
  if (typeof props.itemKey === 'string') return item[props.itemKey]
  return index
}

function itemClassOf(item) {
  return typeof props.itemClass === 'function' ? props.itemClass(item) : props.itemClass
}

function scrollHighlightedIntoView() {
  itemRefs.value[highlighted.value]?.scrollIntoView({ block: 'nearest' })
}

function onInput(e) {
  emit('update:modelValue', e.target.value)
  open.value = true
}
function onFocus() {
  open.value = true
  emit('focus')
}
function select(item) {
  emit('select', item)
  open.value = false
}
function onDocClick(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

watch(
  () => props.items,
  () => {
    highlighted.value = -1
  }
)
watch(open, (isOpen) => {
  if (!isOpen) highlighted.value = -1
})

function onKeydown(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!open.value) {
      if (props.modelValue.trim() || props.showOnEmptyFocus) open.value = true
      else return
    }
    if (!props.items.length) return
    e.preventDefault()
    if (e.key === 'ArrowDown') {
      highlighted.value = highlighted.value >= props.items.length - 1 ? 0 : highlighted.value + 1
    } else {
      highlighted.value = highlighted.value <= 0 ? props.items.length - 1 : highlighted.value - 1
    }
    scrollHighlightedIntoView()
  } else if (e.key === 'Enter') {
    if (open.value && highlighted.value >= 0 && props.items[highlighted.value]) {
      e.preventDefault()
      select(props.items[highlighted.value])
    }
  } else if (e.key === 'Escape') {
    if (open.value) {
      e.preventDefault()
      open.value = false
    }
  }
}

const inputRef = ref(null)

defineExpose({ close: () => (open.value = false), focus: () => inputRef.value?.focus() })
</script>

<template>
  <div ref="wrapRef" class="searchbar">
    <span class="sicon"><AppIcon name="search" :size="14" /></span>
    <input
      ref="inputRef"
      type="text"
      autocomplete="off"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onInput"
      @focus="onFocus"
      @keydown="onKeydown"
    />
    <span v-if="kbd" class="kbd">{{ kbd }}</span>
    <div v-if="open && (modelValue.trim() || showOnEmptyFocus)" class="dropdown">
      <template v-if="items.length">
        <div
          v-for="(item, i) in items"
          :key="keyOf(item, i)"
          :ref="(el) => (itemRefs[i] = el)"
          class="dropdown-item"
          :class="[{ active: i === highlighted }, itemClassOf(item)]"
          @click="select(item)"
          @mouseenter="highlighted = i"
        >
          <slot name="item" :item="item" />
        </div>
      </template>
      <div v-else class="dropdown-empty">{{ emptyMessage }}</div>
    </div>
  </div>
</template>

<style scoped>
/* Altura y estilo del input heredados de la regla global .searchbar
   en assets/styles/base.css — no redefinir aquí. */
.kbd {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10.5px;
  color: var(--text-muted);
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 6px;
  font-family: 'Roboto Mono', monospace;
}
.dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  max-height: 260px;
  overflow-y: auto;
  z-index: 30;
}
.dropdown-item {
  padding: 10px 13px;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.dropdown-item:last-child {
  border-bottom: none;
}
.dropdown-item.stock-low {
  background: rgba(249, 115, 22, 0.08);
}
.dropdown-item:hover,
.dropdown-item.active {
  background: var(--primary-light);
}
.dropdown-item :deep(b) {
  font-weight: 600;
}
.dropdown-item :deep(span) {
  font-size: 11px;
  color: var(--text-muted);
}
.dropdown-empty {
  padding: 14px;
  text-align: center;
  font-size: 12.5px;
  color: var(--text-muted);
}
</style>
