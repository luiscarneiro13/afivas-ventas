# Integración con impresora fiscal TFHKA (Aclas PP9-Plus)

Documentación de la integración con la impresora fiscal instalada
(**Aclas PP9-Plus**, protocolo **The Factory HKA / TFHKA**), usada desde
la vista de Configuración (`ConfiguracionView.vue`) vía el conector
`tfhkaif.dll` (`Conectores/tfhkaif.dll`).

## Identificación del conector

De las 10 DLL en `Conectores/`, la que corresponde a esta impresora es
**`tfhkaif.dll`**, confirmado por el usuario tras la prueba de conexión.
Su tabla de exportación (`objdump -p`) coincide exactamente con la ABI
pública documentada por The Factory HKA para el driver "Bixolon/TFHKA":

```
OpenFpctrl    CloseFpctrl    CheckFprinter    ReadFpStatus
SendCmd       SendNCmd       SendFileCmd
UploadReportCmd   UploadReportDin   UploadStatusCmd   UploadStatusDin
giFpCtrlLastError   giNumFpCtrlAllProcesses   giNumFpCtrlThisProcess
```

Las demás DLL de la carpeta (Bematech, PNP, Epson, VMAX/Elepos, etc.)
quedan deshabilitadas en la UI — no corresponden al equipo instalado.

## Firmas de función (confirmadas)

No hay header oficial público; las firmas se confirmaron cruzando la
tabla de exportación real contra un proyecto open-source que reimplementa
la misma ABI de `tfhkaif.dll` ([luisjavierjn/tfhkaif en GitHub](https://github.com/luisjavierjn/tfhkaif)):

```c
bool __stdcall OpenFpctrl(const char *lpPortName);              // ej. "COM3"
bool __stdcall CloseFpctrl();
bool __stdcall CheckFprinter();
bool __stdcall ReadFpStatus(_Out_ int *status, _Out_ int *error);
bool __stdcall SendCmd(_Out_ int *status, _Out_ int *error, const char *cmd);
int  __stdcall SendNCmd(_Out_ int *status, _Out_ int *error, const char *buffer);
int  __stdcall SendFileCmd(_Out_ int *status, _Out_ int *error, const char *file);
bool __stdcall UploadStatusCmd(_Out_ int *status, _Out_ int *error, const char *cmd, const char *file);
bool __stdcall UploadReportCmd(_Out_ int *status, _Out_ int *error, const char *cmd, const char *file);
```

## Prueba de conexión (implementada)

`src/main/index.js` → `testTfhka(comPort)`, expuesta al renderer como
`window.api.testTfhka(comPort)` (canal IPC `tfhka:test`).

Secuencia, **de solo lectura** (no imprime ni toca memoria fiscal):

```
OpenFpctrl(puerto) → CheckFprinter() → ReadFpStatus(status, error) → CloseFpctrl()
```

Se invoca desde el botón "Probar" de la fila `tfhkaif` en
`ConfiguracionView.vue`, usando el puerto COM seleccionado en el
dropdown "Puertos COM" de la misma vista.

### Dependencias necesarias para esto

- **`koffi`** (FFI para llamar DLLs nativas desde Node/Electron), pinneado
  en `package.json` a una versión exacta (debe coincidir con el paquete
  nativo de la plataforma, o `koffi` lanza "Mismatched native Koffi
  modules").
- El binario nativo `@koromix/koffi-win32-ia32` se descarga aparte, porque
  el desarrollo/compilación ocurre en Linux y `npm install` normal solo
  trae el binario de la plataforma anfitriona. Por eso el script
  `postinstall` en `package.json` fuerza esa descarga:
  ```
  npm install @koromix/koffi-win32-ia32@<version-exacta-de-koffi> --no-save --force
  ```
- `tfhkaif.dll` se empaqueta como `extraResource` (carpeta `Conectores/`
  dentro de `resources/` en el build final).
- `koffi` y `@koromix/koffi-win32-ia32` se excluyen del `asar` vía
  `asarUnpack` — un binario nativo `.node` no puede ejecutarse comprimido
  dentro de un archivo `asar`.

Verificado inspeccionando `release/win-ia32-unpacked/` tras un build real:
DLL en la ruta correcta, `koffi.node` desempaquetado y confirmado como
`PE32 (DLL) Intel 80386` (arquitectura ia32 correcta).

## Protocolo de comandos

Fuente: manual oficial **"Manual de Protocolos y Comandos — Impresoras
Fiscales, Versión 8.3 - Venezuela, Marzo 2017, The Factory HKA, C.A."**
(copia entregada por el usuario en
`/media/desarrollo/PROYECTOS/Afivas/manual-impresora.pdf`; menciona "PP9"
explícitamente en la tabla de medios de pago, confirmando que aplica al
equipo instalado).

### Estructura de trama

Protocolo directo: `STX(0x02) + DATA + ETX(0x03) + LRC`, donde `LRC` es
el XOR de `DATA` y `ETX`.

**Importante:** al usar `tfhkaif.dll` (`SendCmd`) solo se envía el campo
`DATA` — la DLL arma STX/ETX/LRC y maneja el handshake ACK(0x06)/NAK(0x15)
automáticamente. Los comandos abajo son ese campo `DATA`.

### Factura (comandos principales, en orden)

| Paso | Comando (DATA) | Obligatorio |
|---|---|---|
| RIF/C.I. del cliente | `iR*<rif>` | No |
| Razón social del cliente | `iS*<nombre>` | No |
| Información adicional del cliente | `i<línea 00-09><datos>` | No |
| Comentario | `@<mensaje>` | No |
| Registro de producto | `!<precio 10c><cantidad 8c>[\|código\|]<descripción>` (precio: 8 enteros + 2 decimales; cantidad: 5 enteros + 3 decimales) | **Sí**, al menos uno |
| Corrección (cancela el último ítem) | `k` | No |
| Subtotal | `3` (impreso) / `4` (en visor) | No |
| Descuento/recargo % | `p<signo +/-><porcentaje 4c>` | No |
| Descuento/recargo monto | `q<signo +/-><monto 9c>` | No |
| Anular ítem | mismo formato que registro, con CMD `¡`/`¢`/`£` según tasa | No |
| Anular factura (antes de totalizar) | `7` | No |
| Código de barras | `Y<código>` (cuerpo) / `y<código>` (pie) | No |
| **Totalización pago directo** | `1<medio de pago 2c>` — cierra el documento y abre la gaveta | **Sí** |
| Totalización pago parcial | `2<medio 2c><monto 12c>` | Alternativa a la anterior |

Ejemplo — registrar "arroz", precio $1.00, cantidad 10.000, código 000001:

```
!000000010000001000|000001|arroz
```

Cerrar con medio de pago "01" (efectivo):

```
101
```

### Reporte X (consulta, no fiscal — no resetea nada)

**Implementado.** `src/main/index.js` → `printReporteX(comPort)` (canal IPC
`tfhka:printReporteX`, expuesto como `window.api.printReporteX`). Envía
`SendCmd(status, error, "I0X")` sobre la misma conexión (`OpenFpctrl` /
`CloseFpctrl`) que usa la prueba de conexión. En la UI, el botón
"Imprimir reporte X" solo aparece junto al mensaje de éxito, después de
una prueba de conexión exitosa — y una vez exitosa la prueba, el botón
"Probar" se deshabilita.

| Comando | Qué hace |
|---|---|
| `I0X` | Imprime el Reporte X (acumulado del día hasta el momento) |
| `I1X` | Reporte X2 (parcial, para corte entre cajeros) |
| `XIX` | Borra el acumulado del X2 (enviar siempre después de `I1X`) |
| `U0X` | Extrae por comunicación los datos del X, sin imprimir (formato de trama varía según modelo) |

### Reporte Z (cierre fiscal diario — resetea acumulados)

| Comando | Qué hace |
|---|---|
| `I0Z` | Imprime el Reporte Z (cierre fiscal del día) |
| `I1Z` | Reporte Z2 (no fiscal, acumulado entre Z's; se borra solo al imprimirse) |
| `X1Z` | Borra el acumulado del Z2 manualmente |
| `U0Z` | Extrae por comunicación los datos del último Z emitido (número, fecha, hora, última factura, acumulados por tasa, etc.), sin imprimir |

Si la impresora rechaza ventas por exceder el monto máximo diario, es
necesario emitir un Reporte Z (`I0Z`) para poder seguir vendiendo.

## Precaución fiscal

Cualquier comando que registre, anule o totalice un documento (factura,
nota de crédito/débito, reporte Z) tiene efectos sobre la memoria fiscal
del equipo y no es reversible por software. Antes de integrar estos
flujos en producción, probar exhaustivamente con montos mínimos y
confirmar con el usuario cada paso que toque memoria fiscal.
