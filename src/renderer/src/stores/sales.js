import { defineStore } from 'pinia'
import { useCatalogStore } from './catalog'
import { PAY_METHODS, FACTURA_NUM_INICIAL, seedSales } from '@renderer/data/dummy'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    sales: [],
    facturaNum: FACTURA_NUM_INICIAL,
    payMethods: PAY_METHODS
  }),
  actions: {
    seed() {
      const catalog = useCatalogStore()
      this.sales = seedSales(catalog.products)
    },
    findMethod(id) {
      return this.payMethods.find((m) => m.id === id)
    },
    /**
     * Registra una venta a partir del carrito, descuenta existencias
     * y devuelve la factura generada.
     */
    registrarVenta({ items, cliente, cajero, methodId, recibido, vuelto, subtotal, iva, total }) {
      const catalog = useCatalogStore()
      const numero = this.facturaNum++
      const saleItems = items.map((i) => ({ ...i }))
      // Ajuste optimista en memoria (catalog.js ya no expone adjustStock:
      // el stock real se decrementa en BD solo vía stock:registrarEntrada).
      // Un catalog.fetchAll() posterior sobreescribe esto con el valor real.
      saleItems.forEach((i) => {
        const p = catalog.findByCodigo(i.codigo)
        if (p) p.existencia = Math.max(0, p.existencia - i.cantidad)
      })

      const sale = {
        numero,
        cliente,
        items: saleItems,
        subtotal,
        iva,
        total,
        method: this.findMethod(methodId),
        recibido,
        vuelto,
        fecha: new Date(),
        cajero
      }
      this.sales.push(sale)
      return sale
    }
  }
})
