<script setup>
import { ref, computed, watch } from 'vue'
import { useCajaStore } from '@renderer/stores/caja'
import { fmtUsd, fmtBs, fmtDateTime } from '@renderer/utils/format'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'

// Modal de factura/recibo, reutilizado en Venta (mode="sale", tras cobrar)
// y en Reportes (mode="view", al hacer clic en una factura del historial).
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sale: { type: Object, default: null },
  mode: { type: String, default: 'sale' } // 'sale' | 'view'
})
const emit = defineEmits(['update:modelValue', 'new-sale'])

const caja = useCajaStore()

const barcodeBars = ref([])
watch(
  () => [props.modelValue, props.sale],
  ([open]) => {
    if (open) barcodeBars.value = Array.from({ length: 40 }, () => Math.random() * 20 + 8)
  },
  { immediate: true }
)

const numeroFmt = computed(() => (props.sale ? String(props.sale.numero).padStart(6, '0') : ''))

function close() {
  emit('update:modelValue', false)
}
function imprimir() {
  window.print()
}
function nuevaVenta() {
  emit('update:modelValue', false)
  emit('new-sale')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && sale" class="modal-overlay active">
      <div id="facturaModalPrint" class="modal receipt-modal">
        <button v-if="mode === 'view'" class="modal-close-x" title="Cerrar" @click="close">
          <AppIcon name="x" :size="16" />
        </button>

        <div class="receipt">
          <div class="receipt-head">
            <div class="rlogo">A</div>
            <b>AFIVAS STORE</b>
            <span>RIF J-40512378-3 · Sistema Afivas Ventas</span>
          </div>
          <div class="dashed"></div>
          <div class="receipt-meta">
            <div><span>Factura</span><span>#{{ numeroFmt }}</span></div>
            <div><span>Fecha</span><span>{{ fmtDateTime(sale.fecha) }}</span></div>
            <div><span>Cliente</span><span>{{ sale.cliente.nombre }}</span></div>
            <div><span>Cédula</span><span>{{ sale.cliente.cedula }}</span></div>
            <div><span>Cajero</span><span>{{ sale.cajero }}</span></div>
          </div>
          <div class="dashed"></div>
          <div class="receipt-items">
            <table>
              <thead>
                <tr><th>Cant</th><th>Descripción</th><th>Total</th></tr>
              </thead>
              <tbody>
                <tr v-for="i in sale.items" :key="i.codigo">
                  <td>{{ i.cantidad }}</td>
                  <td>{{ i.desc }}<br /><span class="muted">{{ fmtUsd(i.precio) }} c/u</span></td>
                  <td>{{ fmtUsd(i.precio * i.cantidad) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="dashed"></div>
          <div class="receipt-totals">
            <div><span>Subtotal</span><span>{{ fmtUsd(sale.subtotal) }}</span></div>
            <div><span>IVA (16%)</span><span>{{ fmtUsd(sale.iva) }}</span></div>
            <div class="grand"><span>TOTAL</span><span>{{ fmtUsd(sale.total) }}</span></div>
            <div class="muted-row"><span>Equivalente</span><span>{{ fmtBs(sale.total * caja.tasa) }}</span></div>
            <div class="mt8"><span>Método de pago</span><span>{{ sale.method.label }}</span></div>
            <template v-if="sale.method.cash">
              <div><span>Recibido</span><span>{{ fmtUsd(sale.recibido) }}</span></div>
              <div><span>Vuelto</span><span>{{ fmtUsd(sale.vuelto) }}</span></div>
            </template>
          </div>
          <div class="barcode">
            <i v-for="(h, idx) in barcodeBars" :key="idx" :style="{ height: h + 'px' }"></i>
          </div>
          <div class="receipt-foot">¡Gracias por tu compra!<br />www.afivasstore.com</div>
        </div>

        <div class="receipt-actions">
          <BaseButton variant="ghost" style="flex: 1" @click="imprimir">Imprimir</BaseButton>
          <BaseButton v-if="mode === 'sale'" variant="primary" style="flex: 1" @click="nuevaVenta">
            Nueva venta
          </BaseButton>
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
  font-size: 12px;
  color: var(--text);
}
.receipt-head {
  text-align: center;
  margin-bottom: 14px;
}
.receipt-head .rlogo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  margin: 0 auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-family: 'Poppins', sans-serif;
}
.receipt-head b {
  font-size: 15px;
  font-family: 'Poppins', sans-serif;
  display: block;
}
.receipt-head span {
  color: var(--text-muted);
  font-size: 10.5px;
}
.dashed {
  border-top: 1px dashed var(--border);
  margin: 12px 0;
}
.receipt-meta div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  font-size: 11px;
}
.receipt-items table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.receipt-items th {
  text-align: left;
  color: var(--text-muted);
  font-weight: 600;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--border);
}
.receipt-items td {
  padding: 5px 0;
  vertical-align: top;
}
.receipt-items td:last-child,
.receipt-items th:last-child {
  text-align: right;
}
.muted {
  color: var(--text-muted);
}
.receipt-totals div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11.5px;
}
.receipt-totals .muted-row {
  color: var(--text-muted);
}
.receipt-totals .mt8 {
  margin-top: 8px;
}
.receipt-totals .grand {
  font-size: 15px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}
.receipt-foot {
  text-align: center;
  margin-top: 16px;
  color: var(--text-muted);
  font-size: 10.5px;
}
.barcode {
  display: flex;
  gap: 2px;
  justify-content: center;
  align-items: flex-end;
  height: 34px;
  margin: 14px 0;
}
.barcode i {
  display: block;
  width: 2px;
  background: var(--text);
}
.receipt-actions {
  display: flex;
  gap: 10px;
  padding: 0 22px 22px;
}
</style>
