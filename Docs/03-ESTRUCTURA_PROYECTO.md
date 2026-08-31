# Estructura del proyecto

Vista rápida de la organización de carpetas de `afivas-ventas`
(Electron + Vue 3 + Vite, gestionado con `electron-vite`).

```
afivas-ventas/
├── build/                  # Recursos de empaquetado (debe contener icon.ico)
├── out/                    # Salida compilada de electron-vite (main/preload/renderer)
├── release/                # Instaladores/portables generados por electron-builder
├── src/
│   ├── main/                # Proceso principal de Electron (index.js)
│   ├── preload/              # Script de preload (puente main <-> renderer)
│   └── renderer/             # Aplicación Vue 3 (frontend)
│       └── src/
│           ├── assets/       # Imágenes, estilos estáticos
│           ├── components/   # Componentes Vue reutilizables
│           ├── data/         # Datos locales/estáticos
│           ├── icons/        # Íconos usados en la UI
│           ├── router/       # Configuración de Vue Router
│           ├── stores/       # Estado global (Pinia)
│           ├── utils/        # Funciones utilitarias
│           └── views/        # Vistas/páginas de la aplicación
├── electron.vite.config.mjs  # Configuración de electron-vite (main/preload/renderer)
├── package.json               # Scripts npm y configuración de electron-builder
└── Docs/                      # Esta documentación
```

Notas:

- `out/` y `release/` son carpetas generadas por los comandos de build; no se
  editan a mano.
- La app renderer usa el alias `@renderer` apuntando a `src/renderer/src`
  (definido en `electron.vite.config.mjs`).
