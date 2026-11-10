# Plan técnico: Paneles de vendedores + pedidos en Firestore

## Arquitectura
- **Plan gratis (Spark), sin Cloud Functions.**
- **Auth:** admin = Google (existe). Vendedor = Email/Password de Firebase con
  correo interno `<usuario>@silvercow.app`; el login agrega el dominio. La
  cuenta la crea el dueño a mano en la consola (Authentication) y también
  resetea contraseñas ahí.
- **Rol:** documento `roles/{uid}` = `{role:'vendedor', sellerId, activo}`.
  Lo escribe el admin desde el panel (pega el UID de la cuenta). Las reglas
  lo leen con `get()`. Desactivar = `activo:false` (corta acceso al instante)
  + deshabilitar la cuenta en la consola.
- **Borrado 24 h:** lo hace el panel admin al abrirse (`js/admin/avisos.js`): borra los `sin_confirmar` con `expira` vencido. TTL de Firestore descartado: exige facturación.
- **Resúmenes/comisiones:** se calculan en el panel admin y se guardan en `resumenes`.
- **Espejo para el vendedor** (`pedidos_vendedor`): lo escribe el admin al confirmar el pedido.
- **Reglas** versionadas en el repo (`firestore.rules`, `firebase.json`); hoy
  solo viven en la consola de Firebase.
- **Puente módulo→window** (mismo patrón que `js/firestore-catalogo.js`) para que
  el carrito, que es script clásico, pueda guardar el pedido.

## Colecciones Firestore
| Colección | Contenido | Quién lee |
|---|---|---|
| `productos` | existe (+ `destacada`) | todos |
| `costos/{codigo}` | costo de la pieza | solo admin (RNF-16) |
| `roles/{uid}` | role, sellerId, activo | admin; cada uno el suyo |
| `vendedores/{usuario}` | nombre, código, estado, alta | admin; el vendedor su propio doc |
| `pedidos/{codigo}` | piezas, cantidades, precios, subtotal, vendedor, descuento, total, estado, fechas, cliente | solo admin |
| `pedidos_vendedor/{codigo}` | solo número de pedido + monto + sellerId (RS-17) | vendedor dueño |
| `ventas/{id}` | venta en persona: piezas, descuento (5% o USD), pago, cliente opcional, estado | admin; vendedor las suyas |
| `pagos/{id}` | comisión/bono pagado: fecha, comprobante | solo admin |
| `resumenes/{sellerId_YYYY-MM}` | ventas, meta, comisión, bono | admin; vendedor el suyo |
| `config/negocio` | tramos, % código, meta, bonos (texto y monto) | lectura admin+vendedor, escritura admin |
| `config/privado` | `valoresBono` — lo que le cuesta cada bono a la casa (para el margen) | solo admin (RNF-16) |
| `codigos/{CODIGO}` | pct, activo, sellerId — lo consulta el carrito | `get` público, sin `list` |
| `avisos/{id}` | pedido nuevo / venta pendiente | solo admin |

## Estados
Pedido web: sin_confirmar → nuevo → confirmado → pagado → en_camino → entregado;
cancelado antes de entregado. Venta en persona: pendiente → confirmada (admin) →
pagada; cancelada/devuelta no comisiona (RS-08).

## Fases
0. Documentación (este paso). Dueño: `firebase login` (para desplegar reglas).
1. Infra: firebase CLI, `firebase.json`, reglas base, emulador, seed `config/negocio`.
2. Vendedores desde el admin: sección (lista, alta del doc `vendedores` + `roles`, desactivar), seed DOME/SALO/SEBAS. Cuentas Auth: a mano en la consola.
3. Login + panel vendedor (`vendedor.html`), responsive celular.
4. Pedidos web: carrito → Firestore → WhatsApp; código corto; limpieza 24 h; cupón desde Firestore; vista en admin.
5. Ventas en persona + confirmación admin + pieza a "agotado".
6. Comisiones, metas, bono, pagos, resumen mensual.
7. Avisos, exportación Excel, margen informativo (RF-20), paginación del catálogo en el panel.
8. Auditoría de reglas con emulador, verificación final y pedir visto bueno para el push.

## Riesgos
- Gestión de cuentas manual en la consola (3 vendedores: poco trabajo).
- Cada lectura de reglas con `get(roles)` cuenta como lectura extra; dentro del gratis para este volumen.
- Precios no validados en servidor hasta que el admin confirma: mitigado por la confirmación manual.
- Un error en las reglas expone datos o rompe el catálogo público: probar siempre con emulador antes de desplegar.
- `.github/workflows/pages.yml` copia archivos por lista: hay que agregar `vendedor.html` y los JS nuevos (ya falló una vez con `admin.html`).
- Credenciales de vendedores: las crea el dueño en la consola y las entrega; nunca se guardan en documentos.

## Contrato de datos que lee el panel del vendedor (definido en la Fase 3)
Las Fases 4 y 5 tienen que escribir con estos nombres de campo:
- `ventas/{id}`: `sellerId`, `fecha` (timestamp), `precioFinal`, `estado`
  (`pendiente` | `confirmada` | `pagada` | `cancelada` | `devuelta`),
  `piezas`, `descripcion` (opcional).
- `pedidos_vendedor/{codigo}`: `sellerId`, `codigo`, `monto`, `estado`,
  `fecha`. Sin datos del cliente (RS-17).
- La meta suma `precioFinal`/`monto` del mes en curso con estado `pagada`,
  `pagado`, `en_camino` o `entregado`. La comisión se calcula con
  `js/vendedor/negocio.js` (`comision`, `avanceMeta`).
