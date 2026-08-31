# Compilación para Windows 10 de 32 bits (desde Ubuntu)

Todos los comandos de este documento se ejecutan desde la **raíz del proyecto**
(`afivas-ventas/`, la carpeta que contiene `package.json`).

## 1. Objetivo

Generar, sin necesitar una máquina Windows, dos artefactos para Windows 10
**32 bits (ia32/x86)** — nunca 64 bits — mediante cross-compilation en Ubuntu con
`electron-builder`:

- Un **instalador NSIS** (`.exe` con asistente de instalación).
- Una **versión portable** (`.exe` único, sin instalación).

El `package.json` ya tiene esto configurado en la sección `build.win`:

```json
"win": {
  "target": [
    { "target": "nsis", "arch": ["ia32"] },
    { "target": "portable", "arch": ["ia32"] }
  ],
  "icon": "build/icon.ico"
}
```

## 2. Requisito: Wine

`electron-builder` necesita **Wine** instalado en Linux para poder generar el
instalador NSIS de Windows (firma de recursos, íconos, generación del `.exe`).

Instalación en Ubuntu:

```bash
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install --install-recommends wine wine32 winetricks
```

Notas:

- Los paquetes disponibles varían según la versión de Ubuntu. En versiones más
  recientes (p. ej. Ubuntu 24.04) es posible que `wine32` no esté en los
  repositorios oficiales y sea necesario agregar el repositorio de WineHQ. Ver la
  guía oficial: https://wiki.winehq.org/Ubuntu
- La build **portable** (`build:win32:portable`) reduce, pero no siempre elimina,
  la dependencia de Wine respecto al instalador NSIS (el target `portable` de
  `electron-builder` requiere menos procesamiento específico de Windows que NSIS,
  pero sigue usando el mismo empaquetado base).

## 3. Ícono de la aplicación

El `package.json` referencia `build/icon.ico` como ícono de la app en Windows.

**Estado actual: el archivo ya existe**, generado a partir del logo oficial
(`Afiva's Store`) en resoluciones 16, 24, 32, 48, 64, 128 y 256 px dentro del
mismo `.ico`. Si el logo cambia en el futuro, regenerarlo con el mismo criterio
(multi-resolución, mínimo 256x256) y sobrescribir `build/icon.ico`.

## 4. Nota importante: soporte de 32 bits en Electron

Electron ha ido **reduciendo el soporte de builds de 32 bits para Windows** en
versiones recientes. El proyecto actualmente fija:

```json
"electron": "^28.3.3"
```

Antes de compilar, verificar que la versión de Electron que realmente se instala
(puede ser una versión de parche más nueva dentro del rango `^28.3.3`, ver
`node_modules/electron/package.json` o `npm ls electron` para confirmar la exacta)
todavía publica el binario `win32-ia32`:

1. Ir a https://releases.electronjs.org/ y buscar la versión exacta instalada.
2. Confirmar que existe el asset `electron-v28.x.x-win32-ia32.zip` en esa
   release (puede verse también en la página de GitHub Releases del proyecto
   Electron).

**Si en el futuro se actualiza la dependencia `electron` a una versión mayor**
(29, 30, etc.), hay que repetir esta verificación antes de asumir que la
compilación a 32 bits seguirá funcionando — Electron no garantiza mantener el
target `win32-ia32` indefinidamente.

## 5. Comandos de compilación

Ambos scripts primero ejecutan `electron-vite build` (compilan `main`, `preload`
y el renderer Vue) y luego `electron-builder` (empaquetan el `.exe` para Windows
ia32). El resultado se genera en la carpeta `release/` en la raíz del proyecto
(definido en `directories.output` de `package.json`).

**Instalador NSIS:**

```bash
npm run build:win32
```

Equivale a: `electron-vite build && electron-builder --win --ia32`

**Versión portable:**

```bash
npm run build:win32:portable
```

Equivale a: `electron-vite build && electron-builder --win portable --ia32`

## 6. Verificación del resultado

Los nombres de archivo están definidos por `artifactName` en `package.json`.
Con `productName: "Afivas Ventas"` y la versión actual (`0.1.0`), los artefactos
generados en `release/` se llamarán:

- Instalador NSIS:

  ```
  Afivas Ventas-0.1.0-win32-setup.exe
  ```

- Versión portable:

  ```
  Afivas Ventas-0.1.0-win32-portable.exe
  ```

El número de versión cambiará automáticamente si se actualiza el campo
`version` de `package.json`.

## 7. Prueba del instalador

Dado que la compilación se hace en Linux, antes de distribuir el `.exe` se
recomienda una verificación rápida:

- **Preferido**: probar en una máquina virtual con Windows 10 de 32 bits real.
- **Verificación rápida con Wine** (no sustituye la prueba en Windows real):

  ```bash
  wine "release/Afivas Ventas-0.1.0-win32-setup.exe"
  ```

  o, para la versión portable:

  ```bash
  wine "release/Afivas Ventas-0.1.0-win32-portable.exe"
  ```

Wine sirve para detectar errores evidentes de empaquetado (el instalador no
abre, faltan recursos, etc.), pero **no garantiza** el mismo comportamiento que
un Windows 10 de 32 bits real, especialmente en temas de drivers, permisos o
hardware específico.

## 8. Problemas comunes

- **Errores de permisos o comportamiento extraño de Wine en el primer uso**:
  inicializar el prefijo de Wine antes de compilar:

  ```bash
  winecfg
  ```

  Esto crea/configura `~/.wine` la primera vez que se usa Wine en el sistema.

- **`electron-builder` falla pidiendo `mono` o `wine`**: instalar el paquete
  faltante indicado en el mensaje de error, por ejemplo:

  ```bash
  sudo apt install mono-devel
  ```

  o revisar el paso 2 de este documento si el error es específicamente sobre
  Wine.

- **Falla relacionada con el ícono (`build/icon.ico`)**: confirmar que el
  archivo existe y es un `.ico` válido (ver sección 3).
