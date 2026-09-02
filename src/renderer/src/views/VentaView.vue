<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCatalogStore } from '@renderer/stores/catalog'
import { useClientesStore } from '@renderer/stores/clientes'
import { useCartStore } from '@renderer/stores/cart'
import { useSalesStore } from '@renderer/stores/sales'
import { useMetodosPagoStore } from '@renderer/stores/metodosPago'
import { useCajaStore } from '@renderer/stores/caja'
import { useAuthStore } from '@renderer/stores/auth'
import { useUiStore } from '@renderer/stores/ui'
import { fmtBs } from '@renderer/utils/format'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseBadge from '@renderer/components/ui/BaseBadge.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import SearchDropdown from '@renderer/components/ui/SearchDropdown.vue'
import ClienteModal from '@renderer/components/productos/ClienteModal.vue'
import PagoModal from '@renderer/components/venta/PagoModal.vue'
import FacturaModal from '@renderer/components/shared/FacturaModal.vue'
import CantidadExcedeModal from '@renderer/components/venta/CantidadExcedeModal.vue'

const route = useRoute()
const catalog = useCatalogStore()
const clientsStore = useClientesStore()
const cart = useCartStore()
const sales = useSalesStore()
const metodosPago = useMetodosPagoStore()
const caja = useCajaStore()
const auth = useAuthStore()
const ui = useUiStore()

// Igual que fmtBs pero sin el prefijo "Bs", para las columnas de la grilla
// del carrito donde el encabezado ya deja claro que la cifra es en bolívares.
const fmtNumBs = (n) =>
  Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const clientQuery = ref('')
const productQuery = ref('')
const clientSearchRef = ref(null)
const productSearchRef = ref(null)

const pagoOpen = ref(false)
const facturaOpen = ref(false)
const facturaSale = ref(null)

const clientItems = computed(() => clientsStore.search(clientQuery.value))
const productItems = computed(() => catalog.search(productQuery.value, 8))

function estadoProducto(p) {
  if (p.existencia === 0) return 'Agotado'
  if (p.existencia <= (p.stockMinimo ?? 3)) return `¡Quedan ${p.existencia}!`
  return `Exist: ${p.existencia}`
}

function itemClassProducto(p) {
  return { 'stock-low': p.existencia > 0 && p.existencia <= (p.stockMinimo ?? 3) }
}

function selectClient(c) {
  cart.setCliente(c)
  clientQuery.value = ''
  clienteInvalido.value = false
}
function quitarCliente() {
  cart.setCliente(null)
}

const clienteModalOpen = ref(false)
const clientePrefill = ref(null)

function onClientQueryEnter() {
  const q = clientQuery.value.trim()
  if (!q) return
  const registrado = clientsStore.findByCedula(q)
  if (registrado) {
    selectClient(registrado)
    return
  }
  if (clientsStore.search(q).length > 0) return
  const esCedula = /^\d+$/.test(q)
  clientePrefill.value = esCedula
    ? { cedula: q, tipoDocumento: q.length === 9 ? 'J' : 'V' }
    : { nombre: q }
  clienteModalOpen.value = true
}

function onClienteCreado(c) {
  selectClient(c)
}

function selectProduct(p) {
  cart.addProduct(p.codigo)
  productQuery.value = ''
  focusProductSearch()
}

const qtyModalOpen = ref(false)
const qtyModalCodigo = ref(null)
const qtyModalDesc = ref('')
const qtyModalSolicitado = ref(0)
const qtyModalDisponible = ref(0)

function checkLowStock(p, qty) {
  const restante = p.existencia - qty
  const minimo = p.stockMinimo ?? 3
  if (restante <= minimo && restante > 0) {
    ui.toast(`Quedan solo ${restante} unidades de "${p.desc}"`, 'warning')
  }
}

function onQtyChange(codigo, e) {
  const item = cart.items.find((x) => x.codigo === codigo)
  const p = catalog.findByCodigo(codigo)
  if (!item || !p) return
  const qty = Math.floor(Number(e.target.value))
  if (!qty || qty <= 0) {
    cart.removeProduct(codigo)
    return
  }
  if (qty > p.existencia) {
    // Revertimos el texto mostrado: item.cantidad no cambió, así que el
    // binding :value no repinta el input solo por eso.
    e.target.value = item.cantidad
    qtyModalCodigo.value = codigo
    qtyModalDesc.value = p.desc
    qtyModalSolicitado.value = qty
    qtyModalDisponible.value = p.existencia
    qtyModalOpen.value = true
    return
  }
  cart.setQty(codigo, qty)
  checkLowStock(p, qty)
}

function onQtyModalConfirm(qty) {
  const codigo = qtyModalCodigo.value
  const p = catalog.findByCodigo(codigo)
  cart.setQty(codigo, qty)
  if (p) checkLowStock(p, qty)
}

function selectQtyContent(e) {
  e.target.select()
}

const vaciarConfirmOpen = ref(false)

function pedirVaciarProductos() {
  if (cart.items.length === 0) return
  vaciarConfirmOpen.value = true
}
function vaciarProductos() {
  cart.clear()
  ui.toast('Productos del carrito eliminados', 'info')
}

const clienteInvalido = ref(false)

function abrirPago() {
  if (cart.items.length === 0) return
  if (!cart.cliente) {
    clienteInvalido.value = true
    focusClientSearch()
    ui.toast('Selecciona un cliente antes de cobrar', 'error')
    return
  }
  pagoOpen.value = true
}

async function onFinalizar({ methodId, recibido, vuelto, referencia, bancoId }) {
  const cliente = cart.cliente
  if (!cliente) {
    ui.toast('No se pudo determinar el cliente de la venta', 'error')
    return
  }
  try {
    const sale = await sales.registrarVenta({
      items: cart.items,
      clienteId: cliente.id,
      sesionCajaId: caja.id,
      usuarioId: auth.usuarioId,
      metodoPagoId: methodId,
      recibido,
      vuelto,
      referenciaPago: referencia || null,
      bancoId: bancoId || null,
      tasaCambio: caja.tasa,
      subtotal: cart.subtotal,
      iva: cart.iva,
      total: cart.total
    })
    facturaSale.value = sale
    pagoOpen.value = false
    facturaOpen.value = true
    cart.clear()
    ui.toast('Venta finalizada con éxito', 'success')
  } catch (e) {
    ui.toast(e?.message || 'No se pudo registrar la venta', 'error')
  }
}

function onNewSale() {
  cart.clear()
}

function focusProductSearch() {
  productSearchRef.value?.focus?.()
}
function focusClientSearch() {
  clientSearchRef.value?.focus?.()
}

function handleKeydown(e) {
  if (route.name !== 'venta') return
  if (e.key === 'F1') {
    e.preventDefault()
    focusProductSearch()
  } else if (e.key === 'F2') {
    e.preventDefault()
    focusClientSearch()
  } else if (e.key === 'F11') {
    e.preventDefault()
    abrirPago()
  } else if (e.key === 'Escape') {
    pagoOpen.value = false
    facturaOpen.value = false
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="view-content">
    <div class="vb-shell">
      <div class="vb-window">
        <div class="vb-row">
          <div class="vb-field vb-field-cliente">
            <SearchDropdown
              v-if="!cart.cliente"
              ref="clientSearchRef"
              v-model="clientQuery"
              class="client-search"
              :class="{ invalid: clienteInvalido }"
              placeholder="Buscar o registrar cliente"
              kbd="F2"
              :items="clientItems"
              item-key="cedula"
              show-on-empty-focus
              empty-message="Sin coincidencias — presiona Enter para registrarlo"
              @select="selectClient"
              @keydown.enter="onClientQueryEnter"
            >
              <template #item="{ item }">
                <b>{{ item.nombre }}</b>
                <span>C.I. {{ item.cedula }}</span>
              </template>
            </SearchDropdown>
            <div v-else class="client-selected">
              <div class="info">
                <b>{{ cart.cliente.nombre }}</b>
                <span>{{ cart.cliente.cedula }}</span>
              </div>
              <button title="Quitar cliente" @click="quitarCliente"><AppIcon name="x" :size="15" /></button>
            </div>
          </div>

          <div class="vb-field vb-field-producto">
            <SearchDropdown
              ref="productSearchRef"
              v-model="productQuery"
              placeholder="Buscar producto por código o nombre..."
              kbd="F1"
              :items="productItems"
              item-key="codigo"
              :item-class="itemClassProducto"
              empty-message="Sin coincidencias"
              @select="selectProduct"
            >
              <template #item="{ item }">
                <b>{{ item.desc }}</b>
                <span>{{ item.codigo }} · {{ fmtBs(item.precio * caja.tasa) }} · {{ estadoProducto(item) }}</span>
              </template>
            </SearchDropdown>
          </div>
        </div>

        <div class="vb-grid-title">
          Productos de la venta
          <BaseBadge variant="ok">{{ cart.count }}</BaseBadge>
          <BaseButton
            variant="ghost"
            size="sm"
            class="vb-vaciar-btn"
            @click="pedirVaciarProductos"
          >
            Vaciar productos
          </BaseButton>
        </div>
        <div class="vb-grid-wrap">
          <table class="vb-datagrid">
            <thead>
              <tr>
                <th style="width: 38px">#</th>
                <th style="width: 78px">Código</th>
                <th>Producto</th>
                <th style="width: 135px">P.Uni. (Bs)</th>
                <th style="width: 80px">Cantidad</th>
                <th style="width: 135px">Subtotal (Bs)</th>
                <th style="width: 36px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cart.items.length === 0">
                <td colspan="7">
                  <EmptyState
                    icon="cart"
                    title="Sin productos"
                    subtitle="Busca un producto arriba y selecciónalo para agregarlo"
                  />
                </td>
              </tr>
              <tr v-for="(item, i) in cart.items" v-else :key="item.codigo">
                <td class="num">{{ i + 1 }}</td>
                <td class="num">{{ item.codigo }}</td>
                <td>{{ item.desc }}</td>
                <td class="num">{{ fmtNumBs(item.precio * caja.tasa) }}</td>
                <td>
                  <input
                    type="text"
                    inputmode="numeric"
                    class="vb-qty-input"
                    :value="item.cantidad"
                    @change="onQtyChange(item.codigo, $event)"
                    @focus="selectQtyContent"
                    @click="selectQtyContent"
                  />
                </td>
                <td class="num">{{ fmtNumBs(item.precio * item.cantidad * caja.tasa) }}</td>
                <td>
                  <button class="vb-row-del" title="Quitar" @click="cart.removeProduct(item.codigo)">
                    <AppIcon name="x" :size="13" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="vb-right">
        <div class="vb-right-title">Resumen de venta</div>
        <div class="vb-totals">
          <div><span>Subtotal</span><b class="num">{{ fmtBs(cart.subtotalBs) }}</b></div>
          <div><span>IVA (16%)</span><b class="num">{{ fmtBs(cart.ivaBs) }}</b></div>
          <div class="tot"><span>Total</span><b class="num">{{ fmtBs(cart.totalBs) }}</b></div>
        </div>
        <button class="checkout-btn" :disabled="cart.items.length === 0" @click="abrirPago">
          <span>Cobrar</span>
          <span class="num">{{ fmtBs(cart.totalBs) }}</span>
        </button>
      </div>
    </div>

    <PagoModal
      v-model="pagoOpen"
      :total="cart.total"
      :total-bs="cart.totalBs"
      :tasa="caja.tasa"
      :pay-methods="metodosPago.items"
      @finalizar="onFinalizar"
    />
    <FacturaModal v-model="facturaOpen" :sale="facturaSale" mode="sale" @new-sale="onNewSale" />
    <CantidadExcedeModal
      v-model="qtyModalOpen"
      :desc="qtyModalDesc"
      :solicitado="qtyModalSolicitado"
      :disponible="qtyModalDisponible"
      @confirm="onQtyModalConfirm"
    />
    <ConfirmModal
      v-model="vaciarConfirmOpen"
      title="¿Vaciar productos?"
      text="Se quitarán todos los productos del carrito. Esta acción no se puede deshacer."
      icon="trash"
      confirm-label="Vaciar productos"
      @confirm="vaciarProductos"
    />
    <ClienteModal v-model="clienteModalOpen" :prefill="clientePrefill" @created="onClienteCreado" />
  </div>
</template>

<style scoped>
.view-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 22px 26px;
  display: flex;
}
.vb-shell {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 18px;
  width: 100%;
}
.vb-window {
  grid-column: span 9;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.vb-right {
  grid-column: span 3;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  padding: 20px;
  height: 100%;
}
.vb-row {
  display: grid;
  grid-template-columns: minmax(200px, 3fr) minmax(200px, 9fr);
  gap: 16px;
  padding: 18px 20px 4px;
}
.vb-field {
  min-width: 0;
}

.vb-grid-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 20px 8px;
}
.vb-vaciar-btn {
  margin-left: auto;
  text-transform: none;
  letter-spacing: normal;
}
.vb-grid-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 0 20px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
table.vb-datagrid {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.vb-datagrid thead th {
  position: sticky;
  top: 0;
  background: var(--surface-alt);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 11px;
  text-align: left;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  white-space: nowrap;
}
.vb-datagrid thead th:last-child {
  border-right: none;
}
.vb-datagrid tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  vertical-align: middle;
}
.vb-datagrid tbody td:nth-child(2) {
  padding-left: 8px;
  padding-right: 8px;
  white-space: nowrap;
}
.vb-datagrid tbody td:nth-child(5) {
  padding-left: 6px;
  padding-right: 6px;
  text-align: center;
}
.vb-datagrid tbody td:last-child {
  border-right: none;
}
.vb-datagrid tbody tr:hover td {
  background: var(--primary-light);
}
.vb-datagrid td.num {
  font-family: 'Roboto Mono', monospace;
}
.vb-qty-input {
  width: 50px;
  text-align: center;
  padding: 5px 4px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  font-size: 12.5px;
  background: var(--surface);
  color: var(--text);
}
.vb-qty-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}
.vb-row-del {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
.vb-row-del:hover {
  background: var(--danger-light);
  color: var(--danger);
}

.client-search.invalid :deep(input),
.client-search.invalid :deep(input:focus) {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px var(--danger-light);
}

.client-selected {
  height: 34px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-light);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 8px 0 6px;
}
.client-selected .info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}
.client-selected .info b {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.client-selected .info span {
  font-size: 9.5px;
  line-height: 1.2;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Roboto Mono', monospace;
}
.client-selected button {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}
.client-selected button:hover {
  color: var(--danger);
}

.vb-right-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 14px;
}
.vb-totals {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.vb-totals div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.vb-totals span {
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 600;
}
.vb-totals b {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text);
}
.vb-totals .tot {
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}
.vb-totals .tot span {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.vb-totals .tot b {
  font-size: 20px;
  color: var(--primary);
}
.checkout-btn {
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  font-size: 14.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-shadow: 0 8px 20px rgba(93, 63, 211, 0.32);
  transition: 0.15s;
  flex-shrink: 0;
}
.checkout-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.checkout-btn:disabled {
  background: var(--border);
  color: var(--text-muted);
  box-shadow: none;
  cursor: not-allowed;
}
</style>
