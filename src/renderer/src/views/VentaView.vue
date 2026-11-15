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
import { fmtBs, fmtUsd, round2 } from '@renderer/utils/format'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseBadge from '@renderer/components/ui/BaseBadge.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import SearchDropdown from '@renderer/components/ui/SearchDropdown.vue'
import ClienteModal from '@renderer/components/productos/ClienteModal.vue'
import PagoModal from '@renderer/components/venta/PagoModal.vue'
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

// Igual que fmtBs/fmtUsd pero sin el prefijo de moneda, para las columnas de
// la grilla del carrito donde el encabezado ya deja claro la moneda de cada
// una ("P.Uni. ($)", "P.Uni. (Bs)", etc.).
const fmtNum = (n) =>
  Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const clientQuery = ref('')
const productQuery = ref('')
const clientSearchRef = ref(null)
const productSearchRef = ref(null)

const pagoOpen = ref(false)

const clientItems = computed(() => clientsStore.search(clientQuery.value))
const productItems = computed(() => catalog.search(productQuery.value, 8))

// Precio de venta en Bs derivado del precio final del producto, igual que
// en el carrito (ver itemsConBs en stores/cart.js), para que lo que se ve
// al buscar coincida con lo que termina cobrándose.
const precioVentaBs = (p) => round2(p.precio * caja.tasa)

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
  // Se agrega por `id` y no por código: el código puede estar repetido
  // (migración 027) y dos productos distintos pueden compartirlo.
  cart.addProduct(p.id)
  productQuery.value = ''
  focusProductSearch()
}

const qtyModalOpen = ref(false)
const qtyModalProductoId = ref(null)
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

function onQtyChange(productoId, e) {
  const item = cart.items.find((x) => x.productoId === productoId)
  const p = catalog.findById(productoId)
  if (!item || !p) return
  const qty = Math.floor(Number(e.target.value))
  if (!qty || qty <= 0) {
    cart.removeProduct(productoId)
    return
  }
  if (qty > p.existencia) {
    // Revertimos el texto mostrado: item.cantidad no cambió, así que el
    // binding :value no repinta el input solo por eso.
    e.target.value = item.cantidad
    qtyModalProductoId.value = productoId
    qtyModalDesc.value = p.desc
    qtyModalSolicitado.value = qty
    qtyModalDisponible.value = p.existencia
    qtyModalOpen.value = true
    return
  }
  cart.setQty(productoId, qty)
  checkLowStock(p, qty)
}

function onQtyModalConfirm(qty) {
  const productoId = qtyModalProductoId.value
  const p = catalog.findById(productoId)
  cart.setQty(productoId, qty)
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
    // Sin impresión fiscal: la venta se registra como nota de entrega. El
    // IVA ya no se calcula en ninguna parte del sistema, así que se guarda
    // en 0 por compatibilidad con las columnas existentes de la BD.
    await sales.registrarVenta({
      items: cart.itemsConBs,
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
      subtotalBs: cart.subtotalBs,
      iva: 0,
      ivaBs: 0,
      total: cart.total,
      totalBs: cart.totalBs
    })
    pagoOpen.value = false
    ui.toast('Venta finalizada con éxito', 'success')
    cart.clear()
  } catch (e) {
    ui.toast(e?.message || 'No se pudo registrar la venta', 'error')
  }
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
                <span>{{ item.codigo }} · {{ fmtBs(precioVentaBs(item)) }} · {{ estadoProducto(item) }}</span>
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
                <th style="width: 90px">P.Uni. ($)</th>
                <th style="width: 90px">Subtotal ($)</th>
                <th style="width: 90px">Cantidad</th>
                <th style="width: 90px">P.Uni. (Bs)</th>
                <th style="width: 90px">Subtotal (Bs)</th>
                <th style="width: 36px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cart.items.length === 0">
                <td colspan="9">
                  <EmptyState
                    icon="cart"
                    title="Sin productos"
                    subtitle="Busca un producto arriba y selecciónalo para agregarlo"
                  />
                </td>
              </tr>
              <tr v-for="(item, i) in cart.itemsConBs" v-else :key="item.productoId">
                <td class="num">{{ i + 1 }}</td>
                <td class="num">{{ item.codigo }}</td>
                <td>{{ item.desc }}</td>
                <td class="num">{{ fmtNum(item.precio) }}</td>
                <td class="num">{{ fmtNum(item.precio * item.cantidad) }}</td>
                <td>
                  <input
                    type="text"
                    inputmode="numeric"
                    class="vb-qty-input"
                    :value="item.cantidad"
                    @change="onQtyChange(item.productoId, $event)"
                    @focus="selectQtyContent"
                    @click="selectQtyContent"
                  />
                </td>
                <td class="num">{{ fmtNum(item.precioBs) }}</td>
                <td class="num">{{ fmtNum(item.subtotalLineaBs) }}</td>
                <td>
                  <button class="vb-row-del" title="Quitar" @click="cart.removeProduct(item.productoId)">
                    <AppIcon name="x" :size="13" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="vb-right">
        <template v-if="cart.items.length > 0">
          <div class="vb-fiscal-title">Resumen de la venta</div>
          <div class="vb-fiscal-items">
            <div v-for="(item, i) in cart.itemsConBs" :key="item.productoId" class="vb-fiscal-item">
              <div class="vb-fiscal-item-desc">{{ item.desc }}</div>
              <!-- Precio unitario y total por cantidad, en $ y en Bs. El
                   monto que se cobra es el de Bs (ver cart.totalBs). -->
              <div class="vb-fiscal-item-detalle">
                {{ item.cantidad }}x {{ fmtUsd(item.precio) }} = {{ fmtUsd(round2(item.precio * item.cantidad)) }}
              </div>
              <div class="vb-fiscal-item-detalle">
                {{ item.cantidad }}x {{ fmtBs(item.precioBs) }} = {{ fmtBs(item.subtotalLineaBs) }}
              </div>
            </div>
          </div>
          <div class="vb-fiscal-totals">
            <div><span>Artículos</span><b>{{ cart.count }}</b></div>
            <div class="vb-fiscal-total-row">
              <span>TOTAL A COBRAR</span>
              <b>{{ fmtBs(cart.totalBs) }}</b>
            </div>
            <div class="vb-fiscal-total-usd">{{ fmtUsd(cart.total) }}</div>
          </div>
        </template>
        
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
/* La vista ocupa exactamente el alto disponible y no scrollea como página:
   el scroll vive dentro de la grilla de productos y de la vista previa
   fiscal. Por eso la cadena completa lleva min-height:0 (si no, cada
   contenedor crece con su contenido y nunca se activa el overflow). */
.view-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 22px 26px;
  display: flex;
}
.vb-shell {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 18px;
  width: 100%;
  min-height: 0;
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
  min-height: 0;
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
  min-height: 0;
  overflow: hidden;
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
  table-layout: fixed;
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
  padding: 0 12px;
  font-size: 10px;
  font-weight: 400;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  vertical-align: middle;
}
.vb-datagrid tbody td:nth-child(2) {
  padding-left: 8px;
  padding-right: 8px;
  white-space: nowrap;
}
.vb-datagrid tbody td:nth-child(3) {
  word-break: break-word;
  overflow-wrap: anywhere;
}
.vb-datagrid tbody td:nth-child(4),
.vb-datagrid tbody td:nth-child(5),
.vb-datagrid tbody td:nth-child(6),
.vb-datagrid tbody td:nth-child(7),
.vb-datagrid tbody td:nth-child(8),
.vb-datagrid tbody td:nth-child(9) {
  padding: 0;
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
  display: inline-flex;
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

.checkout-btn {
  width: 100%;
  /* margin-top:auto lo mantiene pegado al fondo del panel derecho aunque la
     vista previa fiscal ocupe poco alto. */
  margin-top: auto;
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

.vb-fiscal-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
/* Bloque monoespaciado con el detalle por producto (cantidad x precio unitario
   = total de la línea, en $ y en Bs). Ocupa todo el alto libre entre el título
   y el bloque de totales (fijo justo encima del botón Cobrar): el scroll solo
   aparece cuando los productos no caben. */
.vb-fiscal-items {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  line-height: 14px;
  color: var(--text);
}
.vb-fiscal-item {
  flex: none;
}
.vb-fiscal-item + .vb-fiscal-item {
  border-top: 1px dashed var(--border);
  padding-top: 6px;
}
/* Descripción del producto: si es larga se recorta en una sola línea para
   que el bloque monoespaciado no desborde el ancho del resumen. */
.vb-fiscal-item-desc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text);
}
/* Detalle de la línea: "2x $5.00 = $10.00" y su equivalente en Bs. */
.vb-fiscal-item-detalle {
  white-space: nowrap;
  color: var(--text-muted);
}
.vb-fiscal-totals {
  display: flex;
  flex-direction: column;
  flex: none;
  gap: 2px;
  margin-bottom: 14px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  line-height: 14px;
}
.vb-fiscal-totals div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.vb-fiscal-totals span {
  color: var(--text);
  font-weight: 400;
}
.vb-fiscal-totals b {
  font-weight: 400;
  color: var(--text);
  white-space: nowrap;
}
/* Fila del total a cobrar: separa visualmente del detalle de artículos. */
.vb-fiscal-total-row {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--border);
}
.vb-fiscal-total-row span {
  font-weight: 700;
}
.vb-fiscal-total-row b {
  font-weight: 700;
}
/* Equivalente del total en dólares, debajo del monto en Bs. */
.vb-fiscal-total-usd {
  justify-content: flex-end;
  color: var(--text-muted);
}
</style>
