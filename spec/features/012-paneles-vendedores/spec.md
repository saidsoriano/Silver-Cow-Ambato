# Especificación: Paneles de vendedores + pedidos en Firestore

Fuente de requisitos del dueño: `Requerimientos — Paneles de vendedores y
admin.md` (en la raíz de la bóveda, 2026-11-09). Este documento recoge lo que
se decidió sobre ese borrador; donde difieren, **gana este archivo**.

## Historia de usuario
> Como propietario, quiero que 3 vendedores (DOME, SALO, SEBAS) vendan
> piezas con comisión, cada uno con su panel, su meta mensual y su código de
> 5% de descuento, y que los pedidos de la web y las ventas en persona queden
> registrados — para controlar ventas, pagos de comisiones y stock sin llevar
> todo por WhatsApp.

## Roles
| Rol | Entrada | Puede |
|---|---|---|
| Cliente | Sin cuenta | Leer catálogo, crear pedidos desde su carrito |
| Vendedor | Usuario + contraseña | Ver su meta, ventas, código; registrar ventas en persona; consultar catálogo/stock |
| Admin | Cuenta Google (existente) | Todo |

## Decisiones sobre el doc de requerimientos (2026-11-09)
1. **Plan gratis (Spark), sin Blaze ni Cloud Functions.** (Se marcó Blaze
   por error el 2026-11-09 y se corrigió el 2026-11-10.) Consecuencias:
   - Las cuentas de vendedor y los reseteos de contraseña los hace el dueño
     a mano en la consola de Firebase (Authentication). El panel admin no
     puede crear cuentas ni cambiar contraseñas (RF-11 queda manual).
   - El rol de cada vendedor vive en `roles/{uid}`, que escribe el admin
     desde el panel; las reglas lo leen (no hay custom claims).
   - Los pedidos sin confirmar los borra el **panel admin al abrirse** (los
     que ya pasaron su `expira` de 24 h). La política TTL de Firestore no se
     puede usar: Google la exige con facturación activa (comprobado el
     2026-11-10, "billing disabled").
   - Comisiones y resúmenes se calculan en el panel al abrirlo y el admin
     los guarda; no hay cálculo automático en el servidor.
2. **Validación de precios al confirmar el admin**, no con reglas de
   Firestore (las reglas no tienen bucles, no pueden revisar un carrito pieza
   por pieza). Las reglas validan forma y campos; el admin confirma contra el
   catálogo antes de procesar el pedido. Reemplaza RF-02/RNF-05 del doc.
3. **Número de pedido: código único corto** (ej. `SC-K7M2QX`), no
   consecutivo. Se genera en el navegador; la creación falla si el código ya
   existe y se reintenta. Reemplaza el `SC-0001` del doc (RF-01, RS-12).
4. **RS-02 eliminada** (no acumular con cupones VIP): los cupones VIP ya no
   existen. Hoy los únicos códigos son los de vendedor.
5. **El código de vendedor aplica a cualquier monto.** Se ignora el mínimo de
   $10 del doc (RS-01, RF-02), tanto en la web como en venta en persona.
6. **Tramos de comisión:** el límite pertenece al tramo de abajo.
   - menos de $10: sin comisión (suma a la meta)
   - $10 a $15 (incluido $15): $2 fijos
   - más de $15 hasta $40: 10%
   - más de $40 hasta $90: 8%
   - más de $90: 6%
7. **Usuarios:** `dome`, `salo`, `sebas`. Mismo nombre = usuario de login =
   código de descuento = código de vendedor. Internamente son
   `dome@silvercow.app`, etc.; el vendedor escribe solo `dome`.

8. **Stock al vender en persona (2026-11-10):** el vendedor registra la venta
   como pendiente; la pieza pasa a "agotado" en la página **cuando el admin
   confirma** el pago, no antes (RS-15). Evita sacar piezas por ventas que
   no se cerraron.

## Hecho ya (antes de esta feature)
`index.html`: los 3 cupones VIP viejos se reemplazaron por `DOME`, `SALO`,
`SEBAS`, 5% cada uno, hardcodeados en el JS. La Fase 4 los pasa a Firestore.

## Reglas del sistema (vigentes, del doc, ajustadas)
Se mantienen RS-03 a RS-20 del doc original con estos ajustes: RS-05 usa los
tramos de arriba; RS-12 usa código corto; RS-01 sin mínimo de $10; RS-02
eliminada. Principio general: la casa siempre gana (todo se diseña para que
Silver Cow conserve margen).

## Fuera de alcance
- Pasarela de pago, WhatsApp automático (solo avisos dentro del panel admin).
- Rediseño visual del sitio público.
- Pagar comisiones desde el sistema (el pago es manual; el panel solo lo registra).

## Criterios de éxito
- Cada vendedor entra con su usuario y solo ve lo suyo (verificado con
  emulador de reglas por rol).
- Un pedido web queda guardado en Firestore antes de abrir WhatsApp.
- Comisiones calculadas correctamente: ejemplos del doc ($25 con 5% → $2.38;
  $25 con descuento de $5 → $2.00) y bordes ($10, $15, $40, $90).
- Pedidos sin confirmar se borran a las 24 h.
- El dueño lo ve en localhost fase por fase y da el visto bueno final antes
  del push.
