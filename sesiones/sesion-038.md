# Sesión 038 — 012-paneles-vendedores: Fase 5, ventas en persona (2026-11-10)

**Fecha:** 2026-11-10
**Estado:** Cerrada — feature `012-paneles-vendedores` completa, desplegada
**Objetivo:** Que el vendedor registre ventas en persona desde su panel y que
el admin las confirme; al confirmar, las piezas en stock pasan a "agotado"
en la página (decisión del dueño, spec punto 8). Sigue de `sesion-037.md`.

---

## Temas cubiertos

### A. Reglas de ventas más estrictas
Antes, un vendedor podía crear una venta con cualquier campo mientras
`sellerId` y `estado` fueran correctos. Ahora la regla exige la lista exacta
de campos, `fecha == request.time` (no se puede inventar la fecha), 1 a 30
piezas y `precioFinal` entre 0 y el subtotal; la comisión no es un campo
(se calcula). El vendedor no puede editar ni borrar su venta. +8 pruebas →
**59 ok / 0 fallos** en el emulador. **Sin desplegar todavía.**

### B. Formulario de venta en persona (vendedor)
`vendedor.html` + `js/vendedor/venta.js`: código de pieza con lista de
sugerencias (sin las agotadas), cantidad 1-20, el precio sale del catálogo;
aviso si la pieza figura agotada; descuento único (5% del código o monto
aprobado, uno bloquea al otro — RF-08); anticipo y saldo opcionales si hay
piezas bajo pedido (RS-16); método de pago obligatorio; cliente opcional;
resumen con total y comisión estimada. Se guarda como `pendiente`.
Verificado headless con piezas simuladas: $25 con código → $23.75 y
comisión $2.38; con $5 aprobados → $20.00 y $2.00 (ejemplos del doc);
código inexistente y falta de método de pago dan mensaje claro. En celular,
la fila Anticipo/Saldo se salía del borde: ahora los campos se apilan.

### C. Pestaña Ventas (admin)
`js/admin/ventas.js`: lista con filtros (estado, vendedor, mes) y "Cargar
más"; por venta: piezas, descuento y su tipo, total, comisión, método de
pago, cliente, anticipo/saldo; revisión contra el catálogo (precio distinto,
pieza inexistente o ya agotada, descuento de código mal calculado, aviso de
descuento en dólares para confirmar que se aprobó). Al pasar a **pagada**:
confirmación que lista las piezas que se agotan y, en el mismo batch,
`productos/{codigo}.estado = "agotado"` para las que estaban disponibles
(las "bajo pedido" no cambian). Cancelar/devolver avisa que no hay comisión
y que el stock no se repone solo. Historial `{estado, fecha, por}`.

### D. Avisos
El recuadro de entrada suma las ventas pendientes por vendedor (botón "Ver
ventas"); aviso en vivo 🧾 por cada venta nueva; contador "Ventas (n)" que
baja al resolver una.


### E. Visto bueno de la Fase 5 (2026-11-10)
El dueño registró una venta como vendedor y la confirmó como admin: "ya
probé, está bien". Sigue pendiente su permiso para desplegar las reglas.

### F. Reglas desplegadas (2026-11-10)
Con permiso del dueño: `npx firebase-tools@13 deploy --only firestore:rules`
→ liberadas. Catálogo público verificado después (7 categorías, 364
piezas, destacados visibles, sin errores de consola).

### G. Fase 6 — comisiones, metas, bono y pagos (local)
- `resumenMes()` (en `negocio.js`, la misma cuenta para admin y vendedor):
  una venta cuenta en el mes de su fecha y solo si está pagada; una
  devolución/cancelación de algo que se pagó en un mes **ya liquidado** se
  descuenta en el mes en que se devolvió (si ese mes aún no se pagó, ya no
  la cuenta al recalcularse, no hace falta descontar); si el descuento
  supera la comisión del mes, queda "saldo en contra" para el siguiente.
  25 pruebas (incluye devolución de octubre pagada que se descuenta en
  noviembre, y que no se descuenta si octubre no se pagó).
- Admin, pestaña **Comisiones**: mes elegible; por vendedor: ventas pagadas
  y pendientes, % de meta, comisión, descuento por devoluciones, a pagar,
  bono alcanzado y cuánto falta para el siguiente; casillas "Comisión
  pagada" y "Bono entregado"; "Registrar pago" (comisión o bono, monto,
  fecha, comprobante) → `pagos/` (solo admin, RF-15) y marca el resumen;
  "Guardar resumen" → `resumenes/{vendedor_AAAA-MM}` (RNF-07), sin el
  comprobante porque el vendedor puede leer su resumen.
- Editor de reglas (RF-16, RNF-13): % del código, mínimo sin comisión,
  meta, tramos (agregar/quitar, $ fijos o %) y bonos. Valida (último tramo
  sin límite, tramos crecientes, sin negativos, bonos con monto y texto).
  Si cambia el %, actualiza todos los `codigos/` en el mismo batch, así el
  carrito y el panel usan el mismo número.
- Vendedor: debajo de la meta, "Comisión de este mes: $X" + si ya se pagó
  y el bono entregado, más los 3 meses anteriores con su estado. Lee sus
  resúmenes con `where()` (leer directo uno que no existe lo rechazan las
  reglas).
- Pestaña Ventas del admin: ahora usa las reglas guardadas.
- Reglas de Firestore: sin cambios (ya cubrían config, resumenes y pagos).
  +10 pruebas → 69 ok / 0 fallos. Todas las pestañas sin errores de consola.

### H. Visto bueno de la Fase 6 y aclaración del bono (2026-11-10)
El dueño probó Comisiones, pagos y reglas: "salió todo bien". Preguntó si
"Comisión" incluía lo de la meta: se aclaró que no — Comisión = suma por
venta según tramos; el bono de la meta va aparte (línea "Bono", se registra
con "Registrar pago" → tipo Bono) y no se suma a "A pagar" porque puede ser
una pieza. Decidió dejarlo así.

### I. "A pagar" descuenta lo ya pagado (pedido del dueño)
Antes, registrar un pago marcaba "pagada" pero "A pagar" seguía mostrando el
total. Ahora, en Comisiones: **A pagar = comisión − devoluciones − pagos de
comisión registrados ese mes**; desglose "Comisión $X · ya pagado $Y";
verde "Pagada completa ✓" en $0; pagos parciales soportados (solo marca
"pagada" cuando se cubre todo); si entra otra venta pagada en ese mes,
vuelve a aparecer lo que falta. El monto de "Registrar pago" se llena con
lo que falta. El resumen guarda `pagado` y `falta` (sin comprobante).
Vendedor: "pagada ✓", o "ya te pagaron $Y, faltan $Z". Compatibilidad: los
resúmenes marcados antes de este cambio (sin `pagado`) siguen mostrándose
como pagados. Sin errores de consola.

### J. Fase 7 — Excel y margen (local)
Pedido del dueño: tener el registro completo por si un vendedor pide
trazabilidad de todo su tiempo.
- **Excel** (`js/admin/exportar.js`), en Comisiones → "Exportar a Excel":
  vendedor (o todos) y período (todo el historial o el mes de arriba). Hojas:
  Pedidos web; Ventas en persona (piezas, descuento y tipo, total, pago,
  cliente, anticipo/saldo, comisión); **Historial de estados** (cada cambio
  de cada pedido y venta, con fecha, hora y quién lo hizo, incluido el
  registro inicial del vendedor); Comisiones por mes (todos los meses con
  movimiento: ventas, meta, comisión, devoluciones, a pagar, pagado, falta,
  bono, margen); Pagos (con comprobante); Vendedores. Archivo
  `SilverCow_<vendedor>_<período>.xlsx`, se descarga al momento.
  SheetJS **0.20.3 oficial** (`cdn.sheetjs.com`), no la 0.18.5 de npm (fallas
  de seguridad conocidas), importado recién al tocar "Descargar" (si el CDN
  falla, solo falla la exportación — lección de la sesión 030).
- **Margen** (RF-20, solo admin, informativo): "Costo (solo tú)" en cada
  pieza del Catálogo, guardado en `costos/{codigo}` en el mismo batch que la
  pieza (vacío = borra el costo); `margenMes()`: ingreso (sin envío) − costo
  de las piezas de ventas pagadas del mes; las piezas sin costo no entran y
  se avisan; % del margen que representa el bono según su "valor" (nuevo
  campo en el editor de reglas, por defecto $10 y $15). 4 pruebas nuevas →
  29 ok.
- Paginación del catálogo (RNF-06): ya resuelta (por categoría en el admin,
  de a 20 en el vendedor).
- Verificado headless: SheetJS carga, genera y relee un libro de 2 hojas;
  todas las pestañas sin errores. La exportación con datos reales necesita
  el login del dueño.

### K. Visto bueno de la Fase 7 + editor de reglas más intuitivo
El dueño probó costo, margen y exportación: "funciona perfecto". Pidió que
el editor de "Reglas de comisión, meta y bonos" sea más intuitivo. Se
rehízo (mismo modelo de datos, `config/negocio` no cambia de forma):
- 4 bloques numerados que se leen como frases: (1) "Los clientes que usen
  el código reciben [5] % de descuento"; (2) "Ventas de menos de $[10]: sin
  comisión" + cada tramo como "De $10 a $[15] → [$ fijos] $[2]" / "Más de
  $90 → [%] [6] %", donde el "desde" de cada tramo se completa solo con el
  límite del anterior; (3) "Meta de $[50] en ventas pagadas al mes";
  (4) "Al llegar a $[50] gana: [texto] · le cuesta a la casa $[10]".
- **Simulador en vivo** con la misma `comision()` del sistema: "Si vende
  $[25] → gana $2.50" + tabla de montos de ejemplo + resumen de bonos.
- Validación en vivo con mensajes claros (ej. "$40 no es mayor que $50"),
  aviso "Tienes cambios sin guardar", botones Descartar / Guardar cambios
  fijos abajo. Cambiar de mes ya no borra lo que se está editando.
- Verificado headless: simulador ($25 → $2.50, $100 → $6.00), encadenado
  de tramos, error de orden, descartar, aviso de cambios. Sin errores.

### L. Visto bueno del editor de reglas (2026-11-10)
"Ahora sí está bien". Se pasa a la Fase 8.

### M. Fase 8 — auditoría de seguridad y verificación final
- **Auditoría de reglas, línea por línea.** Dos huecos reales:
  1. Un cliente podía crear un pedido con `sellerId` de cualquier vendedor
     sin usar su código (escribiéndolo a mano en la consola del navegador),
     inflando la meta de ese vendedor si el admin lo confirmaba sin mirar.
     Ahora la regla exige que, si hay vendedor, exista y esté activo.
  2. `config/negocio` lo lee el vendedor, y ahí iba el "valor" (costo para
     la casa) de cada bono — RNF-16 pide que eso lo vea solo el admin.
     Movido a `config/privado` (solo admin); `conValoresBono()` lo une al
     leer, en Comisiones y en el Excel. No hacía falta migrar: el dueño
     todavía no había guardado reglas propias (`config/negocio` no existía).
  + comentario viejo que hablaba del TTL, corregido.
  Riesgos que quedan, conocidos y aceptados: un cliente puede crear pedidos
  falsos sin límite de cantidad (no hay forma de frenarlo sin App Check o
  servidor; el admin los ve y se borran a las 24 h), y los precios del
  pedido no se validan en el servidor (decisión 2 de la spec: los revisa el
  admin al confirmar, con aviso automático si no coinciden).
- **Pruebas:** reglas 80 ok / 0 fallos (+11: atribución a vendedor
  inexistente/inactivo, `config/privado`, cliente sin acceso a config /
  vendedores / resúmenes, vendedor sin escribir códigos ni costos);
  comisiones 29 ok / 0 fallos.
- **Smoke final:** `index.html` (364 piezas), `admin.html`, `vendedor.html`
  en 1400 px y 390 px: sin errores de consola ni scroll horizontal.
- **Simulación del deploy:** se repitió la copia de `pages.yml` en una
  carpeta aparte y se comprobó que existe cada `src`/`href` de las 3
  páginas y cada `import` relativo de `js/`: ninguno falta.
- **Docs:** roadmap, AGENTS (comandos de prueba y deploy de reglas, colecciones
  nuevas, 2 gotchas), tech-stack (SheetJS, firebase-tools@13, TTL), bóveda
  (`01-Estado-Actual`, `02-Web`), plan y tasks de la feature.
- **Comentarios en el código:** cada archivo ya tenía su encabezado (qué hace,
  por qué, qué requisitos cumple), pero en los archivos grandes del panel
  muchas funciones no tenían su propia explicación. Se agregaron **59
  comentarios** (uno antes de cada función o bloque que no lo tenía, en
  `js/vendedor/panel.js`, `venta.js`, `js/admin/vendedores.js`, `pedidos.js`,
  `ventas.js`, `comisiones.js`, `avisos.js`, `exportar.js`, `alta.js`). Solo
  comentarios: `git diff` de los archivos con historial no muestra ninguna
  línea de código nueva; sintaxis, pruebas (29/29) y smoke de las 3 páginas
  repetidos sin errores.
- **Cierre (con visto bueno del dueño):** reglas corregidas desplegadas;
  verificado en producción con un pedido real con DOME (guardado con
  `sellerId: dome`, $19) y **borrado** después; catálogo público OK
  (364 piezas). Commit + push de toda la feature.

## Archivos tocados
```
Paguina_joyas/
├── firestore.rules                     (M) — creación de ventas validada
├── scripts/test-reglas.mjs             (M) — 59 pruebas
├── vendedor.html, css/vendedor.css     (M) — formulario de venta
├── js/vendedor/venta.js                (??) NUEVO
├── js/vendedor/panel.js                (M) — inicia el formulario con el catálogo
├── admin.html, css/admin.css           (M) — pestaña Ventas
├── js/admin/ventas.js                  (??) NUEVO
├── js/admin/avisos.js, js/admin/vendedores.js (M)
├── js/admin/comisiones.js             (??) NUEVO — Fase 6 (+ margen, valor del bono)
├── js/admin/exportar.js               (??) NUEVO — Fase 7
├── js/admin/productos.js              (M) — campo costo (solo admin)
├── js/vendedor/negocio.js, scripts/test-comisiones.mjs (M) — resumenMes
└── spec/features/012-paneles-vendedores/tasks.md (M)
```

## Pendientes
- Riesgos aceptados (ver tema M): pedidos falsos sin límite (se ven en el
  panel y se borran a las 24 h) y precios web validados por el admin, no
  por el servidor.
- Si algún día se quiere TTL real o crear cuentas desde el panel: requiere
  plan Blaze (decisión del dueño: no).
- Revisión del dueño: registrar una venta como vendedor y confirmarla como admin.
