<script setup>
import { ref, computed, watch } from 'vue'
import { fmtBs } from '@renderer/utils/format'
import AppIcon from '@renderer/components/ui/AppIcon.vue'

// Vista de detalle de una factura ya registrada, usada desde Reportes,
// Configuración > Ventas y Configuración > Ventas (histórico). Replica el
// formato del ticket que imprime la impresora fiscal (SENIAT/TFHKA) — la
// impresión real ocurre en esa impresora al cobrar (ver VentaView.vue),
// este modal es solo de consulta, no dispara ninguna impresión.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sale: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const empresa = ref(null)
watch(
  () => props.modelValue,
  async (open) => {
    if (open) empresa.value = await window.api.configEmpresaGet()
  },
  { immediate: true }
)

function close() {
  emit('update:modelValue', false)
}

const numeroFmt = computed(() => (props.sale ? String(props.sale.numero).padStart(8, '0') : ''))

const direccionLineas = computed(() =>
  (empresa.value?.direccion || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
)

const fechaFmt = computed(() => {
  if (!props.sale) return ''
  const d = new Date(props.sale.fecha)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
})
const horaFmt = computed(() => {
  if (!props.sale) return ''
  const d = new Date(props.sale.fecha)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

// Los montos en el ticket fiscal siempre están en bolívares, a la tasa
// vigente al momento de esa venta (sale.tasaCambio), no a la tasa actual.
const bs = (usd) => fmtBs((usd || 0) * (props.sale?.tasaCambio || 0))

const porcentajeIvaFmt = computed(() =>
  props.sale ? Number(props.sale.porcentajeIva).toFixed(2).replace('.', ',') : ''
)
const vueltoFmt = computed(() => ((props.sale?.vuelto || 0) * (props.sale?.tasaCambio || 0)).toFixed(2))
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && sale" class="modal-overlay active">
      <div class="modal receipt-modal">
        <button class="modal-close-x" title="Cerrar" @click="close">
          <AppIcon name="x" :size="16" />
        </button>

        <div class="receipt">
          <div class="receipt-head">
            <b>SENIAT</b>
            <span>{{ empresa?.rif }}</span>
            <span>{{ empresa?.razon_social }}</span>
            <span v-for="(linea, idx) in direccionLineas" :key="idx">{{ linea }}</span>
          </div>
          <div class="dashed"></div>
          <div class="receipt-meta">
            <div><span>RIF/CI</span><span>{{ sale.cliente.tipoDocumento }}{{ sale.cliente.cedula }}</span></div>
            <div><span>R.S.</span><span>{{ sale.cliente.nombre }}</span></div>
            <div><span>Dir</span><span>{{ sale.cliente.direccion || '' }}</span></div>
            <div><span>Telefonos</span><span>{{ sale.cliente.telefono || '' }}</span></div>
            <div><span>REF</span><span>{{ numeroFmt }}</span></div>
            <div><span>Vend</span><span>User:{{ sale.cajero }}</span></div>
          </div>
          <div class="dashed"></div>
          <div class="receipt-title">FACTURA</div>
          <div class="receipt-meta">
            <div><span>FACTURA</span><span>{{ numeroFmt }}</span></div>
            <div><span>FECHA {{ fechaFmt }}</span><span>HORA {{ horaFmt }}</span></div>
          </div>
          <div class="dashed"></div>
          <div class="receipt-items">
            <template v-for="i in sale.items" :key="i.codigo">
              <div v-if="i.cantidad > 1" class="ritem-qty">
                <span>{{ i.cantidad }}x</span><span>{{ bs(i.precio) }}</span>
              </div>
              <div class="ritem-desc">
                <span>{{ i.desc }} (G)</span><span>{{ bs(i.precio * i.cantidad) }}</span>
              </div>
            </template>
          </div>
          <div class="dashed"></div>
          <div class="receipt-totals">
            <div><span>BI G ({{ porcentajeIvaFmt }}%)</span><span>{{ bs(sale.subtotal) }}</span></div>
            <div><span>IVA G ({{ porcentajeIvaFmt }}%)</span><span>{{ bs(sale.iva) }}</span></div>
          </div>
          <div class="dashed"></div>
          <div class="receipt-totals">
            <div class="grand"><span>TOTAL</span><span>{{ bs(sale.total) }}</span></div>
            <div><span>{{ sale.method.label.toUpperCase() }}</span><span>{{ bs(sale.total) }}</span></div>
            <div class="vuelto">VUELTO:{{ vueltoFmt }}</div>
          </div>
          <div class="dashed"></div>
          <div class="receipt-control">
            <span>MH</span>
            <span>{{ sale.numeroFacturaFiscal || 'Pendiente de impresión fiscal' }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 35, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal.receipt-modal {
  background: var(--surface);
  border-radius: 22px;
  width: min(400px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: pop 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2);
  position: relative;
}
.modal-close-x {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  z-index: 2;
}
.modal-close-x:hover {
  color: var(--danger);
}
.receipt {
  padding: 26px 24px;
  font-family: 'Roboto Mono', monospace;
  font-size: 11.5px;
  color: var(--text);
}
.receipt-head {
  text-align: center;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.receipt-head b {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.receipt-head span {
  color: var(--text-muted);
  font-size: 10.5px;
}
.receipt-title {
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.dashed {
  border-top: 1px dashed var(--border);
  margin: 10px 0;
}
.receipt-meta div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 3px;
  font-size: 10.5px;
}
.receipt-meta div span:first-child {
  color: var(--text-muted);
  flex-shrink: 0;
}
.receipt-meta div span:last-child {
  text-align: right;
  word-break: break-word;
}
.receipt-items .ritem-qty,
.receipt-items .ritem-desc {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 2px;
}
.receipt-items .ritem-qty {
  color: var(--text-muted);
}
.receipt-items .ritem-desc {
  margin-bottom: 6px;
}
.receipt-totals div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.receipt-totals .grand {
  font-size: 13px;
  font-weight: 700;
}
.receipt-totals .vuelto {
  font-weight: 600;
}
.receipt-control {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  margin-top: 4px;
}
</style>
