# Ejecución local en Ubuntu (modo desarrollo)

Todos los comandos de este documento se ejecutan desde la **raíz del proyecto**
(`afivas-ventas/`, la carpeta que contiene `package.json`).

## 1. Requisitos previos

- **Node.js 22 LTS**. Instalación recomendada mediante [nvm](https://github.com/nvm-sh/nvm):

  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  nvm install 22
  nvm use 22
  ```

  Alternativa: descargar el instalador desde [nodejs.org](https://nodejs.org/) (versión 22.x LTS).

- **npm** (se instala junto con Node.js). Verificar versiones:

  ```bash
  node -v   # debe reportar v22.x.x
  npm -v
  ```

## 2. Instalación de dependencias

Ejecutar una sola vez al clonar el repositorio, y cada vez que cambie `package.json`
o `package-lock.json`:

```bash
npm install
```

Esto también dispara el script `postinstall` (`electron-builder install-app-deps`),
que ajusta los módulos nativos para Electron.

## 3. Levantar el entorno de desarrollo

```bash
npm run dev
```

Este comando ejecuta `electron-vite dev`, que:

- Compila y sirve el proceso `main` y el `preload`.
- Levanta el servidor de desarrollo Vite para el renderer (Vue 3) con **hot-reload**:
  los cambios en los componentes `.vue` se reflejan al instante en la ventana de
  Electron sin necesidad de reiniciar la app.
- Abre automáticamente la ventana de la aplicación Electron.

## 4. Probar el build de producción sin empaquetar instalador

Para verificar que el código compila correctamente en modo producción, sin generar
un instalador de Windows:

```bash
npm run build
npm run start
```

- `npm run build` ejecuta `electron-vite build`: compila `main`, `preload` y el
  renderer, dejando el resultado en `out/`.
- `npm run start` ejecuta `electron-vite preview`: abre la aplicación Electron
  usando ese build ya compilado (sin hot-reload), simulando cómo se comportaría
  en producción.

## 5. Solución de problemas

En un **Ubuntu de escritorio normal** (con entorno gráfico y aceleración por
hardware disponible), `npm run dev` debería funcionar sin configuración adicional.

Si la ventana de Electron no llega a abrir o falla con errores relacionados a GPU,
sandbox o falta de librerías gráficas (típico en **WSL, contenedores Docker o
máquinas virtuales sin aceleración gráfica**):

- Deshabilitar la GPU antes de levantar el proyecto:

  ```bash
  ELECTRON_DISABLE_GPU=1 npm run dev
  ```

- Verificar que estén instaladas las librerías del sistema que Electron necesita
  para renderizar (el nombre exacto del paquete varía según la distro/versión):

  ```bash
  sudo apt install libnss3 libgtk-3-0
  ```

  En distribuciones más recientes basadas en Debian/Ubuntu, el paquete puede
  llamarse `libgtk-3-0t64` en lugar de `libgtk-3-0`; si el `apt install` falla,
  buscar el nombre correcto con `apt search libgtk-3`.
