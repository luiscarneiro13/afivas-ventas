# Memoria del Proyecto — Afivas Ventas

## Preferencias Generales
- **Idioma de respuesta**: Siempre responder en **español**.
- **Actualización continua**: Mantener este archivo (`GEMINI.md` y `CLAUDE.md`) y la documentación sincronizados con cada cambio e iteración relevante en el proyecto.

---

## Resumen del Proyecto
**Afivas Ventas** (`v0.1.9`) es un sistema de punto de venta (POS) y control de inventario de escritorio para comercios minoristas en Venezuela, operando actualmente bajo modalidad de **notas de entrega** (sin cálculo de IVA ni impresión de facturas fiscales individuales, aunque conserva reportes X/Z de máquina fiscal).

### Stack Tecnológico
- **Frontend**: Vue 3 (`^3.5.13`, Composition API / `<script setup>`), Vite (`electron-vite`), Pinia (`^2.2.6`), Vue Router (`^4.4.5` con Hash History).
- **Backend de escritorio**: Electron `^28.3.3` (fijado específicamente para soportar compilación a Windows 32-bit / `ia32`).
- **Base de Datos**: SQLite local mediante `better-sqlite3` (`9.6.0`) y `knex` (`^3.1.0`) con sistema estático de migraciones y semillas ejecutadas automáticamente al iniciar (`migrateAndSeed` en `app.whenReady()`).
- **Seguridad**: `bcryptjs` para hash y verificación de contraseñas de usuarios y operaciones destructivas.
- **Integración con Hardware Fiscal**: `koffi` (`3.1.6`, FFI) junto con el binario `@koromix/koffi-win32-ia32` y el conector nativo `Conectores/tfhkaif.dll` (The Factory HKA / Aclas PP9-Plus) vía puerto COM.
- **Reportes y Exportación**:
  - **Excel**: `exceljs` (`^4.4.0`) desde el renderer (`src/renderer/src/utils/excel.js`).
  - **PDF**: Renderizado HTML en un `BrowserWindow` oculto en el proceso principal (`generarReportePdf` en `src/main/ipc/db-handlers.js`) usando `webContents.printToPDF` (sin dependencias externas para mantener compatibilidad offline en Windows 32-bit).
- **Empaquetado**: `electron-builder` (`^24.13.3`) para compilación cruzada hacia Windows 10 32-bit (`ia32`) desde Linux usando `WINEPREFIX=$HOME/.wine32` (formatos NSIS y Portable).

---

## Arquitectura y Estructura Principal
```
src/
├── main/                       # Proceso principal Electron
│   ├── db/                     # Conexión SQLite (connection.js), knexfile.js, migrate.js
│   │   ├── migrations/         # 27 migraciones estáticas (001 a 027) en index.js
│   │   ├── seeds/              # 8 seeds iniciales (usuarios, empresa, inventario CSV, clientes, etc.)
│   │   └── repositories/       # 15 repositorios de acceso a datos con Knex
│   ├── ipc/                    # Handlers IPC (db-handlers.js) + generador de reportes PDF
│   └── index.js                # Ciclo de vida Electron, escaneo de puertos COM (reg query) y FFI TFHKA
├── preload/                    # Puente IPC seguro (contextBridge -> window.api)
└── renderer/src/               # Aplicación SPA en Vue 3
    ├── views/                  # 14 vistas (Login, Caja, Venta, Productos, Entrada, Descargo, Reportes, Fiscalización, Configuraciones)
    ├── stores/                 # 15 stores Pinia (auth, caja, cart, catalog, clientes, sales, stock, descargos, etc.)
    ├── components/             # Componentes UI (layout, productos, shared, ui, venta)
    ├── router/                 # Rutas protegidas por meta requiresAuth y requiresCaja
    └── utils/                  # Utilidades de formato (format.js), exportación Excel (excel.js) y PDF (pdf.js)
```

---

## Comandos Clave (`package.json`)
- `npm run dev`: Inicia el entorno de desarrollo con `electron-vite dev`.
- `npm run build`: Compila `main`, `preload` y `renderer` en `out/`.
- `npm run build:win32`: Incrementa versión (`patch`), compila y genera instalador NSIS 32-bit en `release/`.
- `npm run build:win32:portable`: Incrementa versión (`patch`), compila y genera ejecutable portable 32-bit en `release/`.

---

## Reglas de Negocio y Aspectos Técnicos Clave

1. **Moneda y Tasas de Cambio (USD / Bs)**:
   - Los precios de los productos se registran en **USD ($)** como precio final de venta.
   - Al abrir una sesión de caja (`CajaView.vue`), se define la **tasa de cambio (Bs/USD)** vigente (actualizable durante la sesión).
   - El cobro se realiza en **Bolívares (Bs)**: `precioBs = round2(precio * tasa)`, `subtotalLineaBs = round2(precioBs * cantidad)`.
   - Al registrar una venta, se guardan **snapshots** tanto en USD como en Bs, además de los datos del cliente y producto en ese instante (`ventas` y `venta_items`).

2. **Modalidad Nota de Entrega (Sin IVA ni Factura Fiscal)**:
   - El sistema opera actualmente como **notas de entrega**: no calcula IVA (`iva = 0`, `ivaBs = 0`) y el precio del producto es el precio final.
   - La función `printFacturaFiscal` en `src/main/index.js` y el canal `tfhka:printFactura` están comentados/deshabilitados intencionalmente por si se reactivan en el futuro.
   - La numeración interna de ventas/notas inicia en `513` (`NUMERO_FACTURA_INICIAL` en `ventasRepository.js`).

3. **Identificación de Productos y Códigos Repetidos (Migración 027)**:
   - Desde la migración `027_drop_unique_codigo_productos.js`, la columna `codigo` en `productos` **no es UNIQUE** (variantes como tallas/colores o productos recreados pueden compartir código).
   - Toda operación puntual sobre un producto (carrito, actualización, eliminación, movimientos de stock, top producto vendido) se realiza por **`id` (`productoId`)** y nunca por `codigo`.
   - La migración 027 mantiene una tabla de respaldo permanente `productos_backup`.

4. **Control de Inventario y Mantenimiento**:
   - **Entradas (`entradas_stock`)**: Registran cargas de mercancía con proveedor, costo unitario y ajuste positivo de existencia.
   - **Descargos (`descargos_stock`)**: Registran salidas/ajustes manuales de inventario con motivo y ajuste negativo de existencia.
   - **Anulación de Ventas**: Marca la venta como `'anulada'` (sin borrarla para auditoría) y revierte el stock de cada ítem.
   - **Vaciado de Productos y Ventas (`operaciones:vaciarProductosYVentas`)**: Operación destructiva protegida por contraseña del usuario actual (`VaciarDatosModal.vue`). Elimina todas las ventas y productos (reiniciando `sqlite_sequence`), siempre que no existan movimientos en `entradas_stock` o `descargos_stock`.

5. **Integración Fiscal TFHKA (`Conectores/tfhkaif.dll`)**:
   - Solo se ejecuta en Windows (`process.platform === 'win32'`).
   - Escanea puertos COM leyendo el registro de Windows (`HKLM\HARDWARE\DEVICEMAP\SERIALCOMM`).
   - Soporta prueba de conexión (`testTfhka`: `OpenFpctrl` -> `CheckFprinter` -> `ReadFpStatus` -> `CloseFpctrl`), emisión de **Reporte X** (`I0X`) y emisión de **Reporte Z** (`I0Z`, con registro en `cierres_fiscales_z`).

6. **Flujo de Navegación y Atajos de Teclado**:
   - Rutas protegidas en `router/index.js`: requiere usuario autenticado (`requiresAuth`) y sesión de caja abierta (`requiresCaja`) para acceder al layout principal.
   - En `VentaView.vue`: `F1` enfoca búsqueda de productos, `F2` enfoca búsqueda/creación rápida de clientes, `F11` abre el modal de cobro, `Escape` cierra el modal de pago.
