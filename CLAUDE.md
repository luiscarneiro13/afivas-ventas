# Memoria del Proyecto — Afivas Ventas

## Preferencias Generales
- **Idioma de respuesta**: Siempre responder en **español**.
- **Actualización continua**: Mantener este archivo y la documentación sincronizada con cada cambio e iteración relevante en el proyecto.

---

## Resumen del Proyecto
**Afivas Ventas** es un sistema de punto de venta (POS) y control de inventario de escritorio para comercios minoristas.

### Stack Tecnológico
- **Frontend**: Vue 3 (Composition API / Script Setup), Vite (`electron-vite`), Pinia, Vue Router.
- **Backend de escritorio**: Electron `^28.3.3` (fijado para compatibilidad con Windows 32-bit / `ia32`).
- **Base de Datos**: SQLite local a través de `better-sqlite3` gestionado con `knex` (migraciones y semillas).
- **Integración con Hardware Fiscal**: `koffi` (FFI) y conector nativo `tfhkaif.dll` (The Factory HKA / Aclas PP9-Plus) vía puerto COM.
- **Reportes**: `exceljs` para exportaciones.
- **Empaquetado**: `electron-builder` para compilación cruzada hacia Windows 10 32-bit (`ia32/x86`) desde Ubuntu (instalador NSIS y Portable).

---

## Módulos y Estructura Principal
```
src/
├── main/                       # Proceso principal Electron
│   ├── db/                     # Conexión Knex, migraciones, seeds y repositorios
│   │   ├── repositories/       # Capa de datos (ventas, stock, caja, clientes, etc.)
│   │   └── connection.js       # Instancia de SQLite
│   ├── ipc/                    # Handlers de comunicación IPC (db-handlers.js)
│   └── index.js                # Ciclo de vida Electron, comandos DLL TFHKA
├── preload/                    # Script puente IPC seguro (window.api)
└── renderer/src/               # Capa visual (Vue 3)
    ├── views/                  # Vistas (Ventas, Caja, Stock, Fiscal, Configuración)
    ├── stores/                 # Stores de Pinia (auth, cart, caja, stock, etc.)
    ├── components/             # Componentes UI reutilizables
    └── router/                 # Rutas de la SPA
```

---

## Comandos Clave
- `npm run dev`: Inicia el entorno de desarrollo con Vite hot-reload.
- `npm run build`: Compila main, preload y renderer a `out/`.
- `npm run build:win32`: Genera instalador NSIS para Windows 32-bit en `release/`.
- `npm run build:win32:portable`: Genera ejecutable portable para Windows 32-bit en `release/`.

---

## Estado Actual del Proyecto

### Módulos Implementados
- ✅ **Gestión de Ventas**: POS con carrito, autenticación de cajeros, gestión de clientes, métodos de pago y bancos
- ✅ **Inventario**: Catálogo de productos con categorías, control de stock (entradas/descargos), proveedores, alertas de stock mínimo
- ✅ **Caja**: Apertura/cierre de sesiones, control de tasa de cambio USD/Bs, registro de operaciones
- ✅ **Configuración**: Datos de empresa, configuración de impresora fiscal (puerto COM), usuarios y roles, parámetros de ventas
- ✅ **Reportes**: Gráficas de ventas, exportación a Excel
- ✅ **Integración Fiscal**: TFHKA (The Factory HKA / Aclas PP9-Plus) con Reportes X/Z

### Infraestructura de Datos
- **26 migraciones** de base de datos implementadas
- **15 repositorios** de datos (usuarios, categorías, productos, clientes, ventas, stock, caja, configuración, etc.)
- **13 stores Pinia** para estado global (auth, cart, caja, catalog, sales, stock, etc.)
- **18 vistas Vue** con routing protegido por autenticación y estado de caja

### Aspectos Técnicos Destacados
- Manejo de precios en USD con conversión a Bs al vuelo según tasa de cambio
- Cálculo de IVA del total hacia el subtotal (precios con IVA incluido)
- Protección de rutas por autenticación y estado de caja
- Integración FFI (koffi) para comunicación con hardware fiscal vía puerto COM
- Compilación cruzada para Windows 10 32-bit desde Ubuntu (WINEPREFIX)
- Sistema de snapshots para registrar precios en Bs al momento de la venta
