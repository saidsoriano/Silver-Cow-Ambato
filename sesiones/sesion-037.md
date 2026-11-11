# Sesión 037 — Cupones por vendedor + apertura de 012-paneles-vendedores (2026-11-09)

**Fecha:** 2026-11-09
**Estado:** Cerrada — publicado en el commit `5eecc59` (2026-11-10, junto con la sesión 038). Cubre la Fase 0 a la 4 de `012-paneles-vendedores` + avisos; sigue en `sesion-038.md`
**Objetivo:** Reemplazar los cupones VIP por los 3 vendedores y abrir la
feature de paneles de vendedores a partir del doc de requerimientos.

---

## Resumen
El dueño pidió (1) cambiar los cupones VIP por `DOME`, `SALO`, `SEBAS` al 5%
y (2) leer su doc de requerimientos para una feature nueva de paneles de
vendedores. Se hicieron los dos. Del doc salieron 6 preguntas (cosas que el
plan gratis no permite o que se contradecían); el dueño respondió todas y se
armó el plan.

## Temas cubiertos
### A. Cupones
`index.html`: `CUPONES` ahora es `DOME`, `SALO`, `SEBAS`, 5% cada uno. Los 3
`SILVERVIP*` ya no existen. Comentarios viejos (1.5/2.2/3.0%) limpiados.
Siguen hardcodeados; la Fase 4 los pasa a Firestore.

### B. Preguntas y respuestas sobre el doc
| Tema | Decisión |
|---|---|
| Reset de contraseñas sin servidor | ~~Blaze~~ → corregido: plan gratis, a mano en la consola |
| Validar precios con reglas (no hay bucles) | Valida el admin al confirmar el pedido |
| Número SC-0001 consecutivo | Código único corto (`SC-K7M2QX`) |
| RS-02 (VIP no acumula) | Se borra |
| Mínimo de $10 para el código | Se ignora, aplica a cualquier monto |
| Límite de tramos ($15, $40, $90) | Pertenece al tramo de abajo |
| Usuarios | `dome`, `salo`, `sebas` (= código) |

### C. Documentación de la feature
`spec/features/012-paneles-vendedores/{spec,plan,tasks}.md` + roadmap,
AGENTS.md y tech-stack.md actualizados.

### D. Fase 1 (parcial, local)
Reglas escritas en `firestore.rules` (productos, costos, codigos, vendedores,
pedidos, pedidos_vendedor, ventas, pagos, avisos, resumenes, config) +
`firebase.json`, `.firebaserc`, `firestore.indexes.json`. 28 pruebas con el
emulador (cliente/vendedor/admin: lectura, escritura, pedido inválido,
vendedor sin acceso a costos ni a datos de otro) → 28 ok / 0 fallos.
Script en `scripts/test-reglas.mjs` (necesita `firebase-tools@13` por Java 17
y `@firebase/rules-unit-testing`). **No se desplegaron las reglas.**

### E. Corrección: sin Blaze (2026-11-10)
El dueño aclaró que no quiere Blaze (había marcado esa opción por error).
Se rehízo el diseño en plan gratis: roles por `roles/{uid}` en vez de custom
claims, TTL para el borrado de 24 h, cuentas a mano en la consola,
resúmenes calculados en el panel. Reglas ajustadas y pruebas ampliadas:
**39 ok / 0 fallos** (incluye vendedor desactivado e intento de
autoasignarse rol). Nada cambió en la cuenta de Firebase.

### F. Login de Firebase y comparación con producción (2026-11-10)
El dueño hizo `npx firebase-tools@13 login` en su terminal (el `!` de Claude
no sirve: el login necesita modo interactivo). Con ese login se descargaron
**solo para leer** las reglas actuales de producción (API de Firebase Rules,
ruleset del 2026-11-03): hoy solo existe la regla de `productos` (leer todos,
escribir `jhetro2005@gmail.com`). Las reglas nuevas conservan eso y agregan
`email_verified` (siempre verdadero en cuentas Google) más las colecciones
nuevas. **No se desplegó nada.**

### G. Flujo de trabajo retomado
El dueño pidió volver al flujo de siempre: al terminar cada fase, él la
revisa en localhost antes de seguir. Fase 0 y Fase 1 quedan esperando su
revisión.

### H. Visto bueno del dueño (2026-11-10)
Probó en localhost los 3 cupones (`DOME`, `SALO`, `SEBAS`): los 3 aplican
5%. Fases 0 y 1 aprobadas; sigue la Fase 2.

### I. Fase 2 — sección Vendedores en el panel admin (local)
- `admin.html`: selector de sección **Catálogo | Vendedores** debajo del
  encabezado. El catálogo se oculta, no se destruye (no se pierden
  ediciones sin guardar al cambiar de sección).
- `js/admin/vendedores.js` (nuevo): alta de vendedor con código generado
  del nombre (sin acentos, A-Z/0-9, máx. 12; si existe, `DOME2`...), UID
  opcional; lista con estado, alta, cuenta vinculada o no; vincular/cambiar
  UID (borra el `roles` de la cuenta vieja); desactivar/reactivar con
  confirmación (RS-20). Cada acción escribe `vendedores` + `codigos` +
  `roles` en un solo batch.
- `css/admin.css`: estilos de la sección.
- **Bug evitado de nuevo:** el rango de acentos de la regex quedó como
  caracteres literales al escribir el archivo (mismo problema de la sesión
  027). Corregido con Python armando el escape y probado:
  "Doménica Ñ" → `DOMENICAN`.
- **Bug de diseño encontrado:** `estilos.css` le da `padding: 140px 60px` a
  todo `<section>`, lo que dejaba un hueco grande. Las secciones nuevas
  usan `<div>`.
- Verificado headless sin login: cambio de sección, vista previa, UID
  inválido rechazado, sin errores de consola, en 1400 px y 390 px. Las
  escrituras reales necesitan las reglas desplegadas.

### J. Reglas desplegadas en producción (2026-11-10)
El dueño intentó `deploy` desde `~` (falló: ahí no hay `firebase.json`).
Con su intento como visto bueno, se desplegó desde `Paguina_joyas/`:
`npx firebase-tools@13 deploy --only firestore:rules --project silver-cow-admin`
→ compiló y quedó liberado. Verificado después: el catálogo público carga
igual desde Firestore (7 categorías, 364 piezas, destacados visibles, sin
errores de consola). Reglas anteriores (solo `productos`) quedan en el
historial de la consola de Firebase por si hay que volver.

### K. Ajustes de la Fase 2 tras la revisión del dueño
- El dueño pegó el correo en el campo UID: la etiqueta ahora dice "no es el
  correo" y el panel lo detecta con un mensaje claro.
- Al escribir "Dome pico" el código salía `DOMEPICO` (se armaba con el
  nombre completo). Ahora hay un campo **Código** aparte: se autocompleta
  con la primera palabra del nombre ("Doménica Pico" → `DOMENICA`), se puede
  editar (solo A-Z/0-9 en mayúsculas), y si el elegido ya existe pregunta
  antes de usar `DOME2` en vez de cambiarlo en silencio.
- Verificado headless: autocompletado, edición manual respetada al seguir
  escribiendo el nombre, limpieza ("sé-bas 1" → `SEBAS1`), aviso de correo
  como UID. Sin errores de consola.

### L. Códigos de descuento desde Firestore (adelantado de la Fase 4)
A pedido del dueño: que agregar/desactivar un vendedor en el panel active o
apague su código en la página sin tocar código.
- `index.html`: se quitó la lista `CUPONES` escrita a mano. `aplicarCupon()`
  ahora es asíncrona: muestra "Verificando código...", consulta
  `window.consultarCodigoDescuento` y guarda también `cuponSeller` (para
  atribuir el pedido al vendedor en la Fase 4). Distingue "código no válido"
  de "no se pudo verificar" (sin conexión).
- `js/firestore-catalogo.js`: nueva `consultarCodigoDescuento(codigo)` —
  lee `codigos/{CODIGO}` (solo `get`, las reglas no dejan listar); valida
  el formato antes de consultar (A-Z/0-9, máx. 12) para no armar IDs raros.
- Verificado headless contra producción: con la colección vacía, `DOME`,
  `SALO`, `SEBAS`, `SILVERVIP` y `x/y` dan "Código no válido" (la consulta
  responde, no hay error de permisos). El caso positivo se prueba cuando el
  dueño cargue los vendedores.
- **Importante para el push:** desde este cambio, los códigos solo
  funcionan si existen en el panel. Antes de subir a producción hay que
  tener DOME/SALO/SEBAS cargados, o los clientes pierden el descuento.

### M. Visto bueno de la Fase 2 (2026-11-10)
El dueño cargó los vendedores desde el panel, probó el código en el carrito
(5%) y que al desactivar deja de valer: "funciona perfecto". Falta vincular
los UID cuando cree las cuentas (necesario para la Fase 3).

### N. Cuentas de vendedor creadas y verificadas (2026-11-10)
El dueño habilitó Correo/contraseña en Authentication, creó
`dome@`, `salo@` y `sebas@silvercow.app` y vinculó los UID desde el panel.
Verificado por API (solo lectura): los 3 `vendedores`, sus `codigos` (5%,
activos) y sus `roles` existen y los UID coinciden con las cuentas de
Authentication. Notas: nombre "Salo Cmpaña" (posible error de tipeo —
falta poder editar el nombre desde el panel); existe una cuenta Google
extra del dueño sin rol (sin acceso, inofensiva).

### O. Fase 3 — panel del vendedor (local)
- `vendedor.html` + `js/vendedor/panel.js` + `css/vendedor.css`: login con
  usuario y contraseña (agrega `@silvercow.app` por dentro, acepta "Dome" o
  "dome@silvercow.app"), mensajes de error en español, pantalla de "sin
  acceso" si la cuenta no tiene rol o está desactivada. Panel: código con
  botón copiar, meta del mes con barra y texto del bono, tabla de ventas con
  comisión (pendiente hasta que esté pagada), catálogo y stock solo lectura
  con buscador, filtros de estado y "Ver más" de a 20 (RNF-06).
- `js/vendedor/negocio.js`: tramos, meta y bono como datos (RNF-13), con
  valores por defecto de las decisiones del dueño; los pisa `config/negocio`
  cuando exista. `scripts/test-comisiones.mjs`: **16 ok / 0 fallos**
  (ejemplos del doc: $23.75 → $2.38, $20 → $2.00; bordes $10/$15/$40/$90).
- Reglas: 6 pruebas nuevas de las consultas del panel (lista sus ventas y
  espejos, no los de otro, no todo, inactivo no) → **45 ok / 0 fallos**.
- `pages.yml`: `vendedor.html` agregado a la lista de archivos (el error de
  `admin.html` de la sesión 023 no se repite).
- Headless (celular): login visible, validación de campos vacíos, error
  "Usuario o contraseña incorrectos" con una cuenta inexistente, sin errores
  de consola. Arreglados: etiquetas centradas y error sin color rojo (lo
  pisaba `.admin-card p`).
- Panel admin: "Editar nombre" en cada vendedor (pedido para corregir
  "Salo Cmpaña").
- **No probado:** el panel ya logueado (hace falta una contraseña real).

### P. Visto bueno de la Fase 3 (2026-11-10)
El dueño probó el panel del vendedor: "todo está bien". Pidió que los
vendedores marquen las joyas vendidas y que la página se actualice sola —
ya está previsto en la Fase 5 (RS-15); se le preguntó cuándo cambia el stock.

### Q. Fase 4 — pedidos web en Firestore (local)
Decisión previa del dueño: en ventas en persona, la pieza pasa a "agotado"
cuando el admin confirma, no antes (anotado en spec, punto 8).
- `js/pedidos-web.js` (nuevo): `window.guardarPedidoWeb()` guarda en
  `pedidos/{SC-XXXXXX}` con `estado: sin_confirmar` y `expira` = +24 h. El
  código usa `crypto.getRandomValues` y un alfabeto sin 0/O/1/I/L; si
  existiera, las reglas rechazan sobrescribir y se reintenta (3 veces).
- `index.html`: `enviarPedidoWhatsApp()` abre la pestaña dentro del clic
  (si no, el navegador la bloquea al terminar de guardar), guarda el
  pedido, pone `Pedido: *SC-...*` en el mensaje y muestra el aviso de 24 h.
  Mismo carrito reenviado = mismo código (no duplica). Si falla el
  guardado, el WhatsApp sale igual, sin código.
- Panel admin, pestaña **Pedidos**: filtros, "Cargar más", revisión de
  precios/subtotal contra `productos`, cambio de estado (confirmación al
  cancelar o si hay diferencias), historial `{estado, fecha, por}`, borra
  `expira` al salir de "sin confirmar", espejo `pedidos_vendedor` (solo
  número, monto, estado, fecha).
- Arreglo visual: el panel admin quedaba flotando a media pantalla cuando
  la sección tenía poco contenido (`:has()` en `css/admin.css`).
- Verificado: pedido real de prueba `SC-QT2XGK` con DOME — leído por la API
  con todos los campos correctos (sellerId dome, $20 − $1 = $19, expira
  +24 h, un solo documento tras reenviar) y **borrado** después. Pestaña
  Pedidos sin errores de consola.
- **Pendiente:** la política TTL (sin ella, los pedidos sin confirmar no
  se borran solos) — necesita permiso del dueño porque es un cambio de
  configuración en producción.

### R. Visto bueno de la Fase 4 (2026-11-10)
El dueño hizo un pedido real `SC-2MMFSS` (Aretes Topo N° 5, $7 − 5% DOME =
$6.65): el código salió en el WhatsApp, el pedido apareció en admin →
Pedidos y en el panel de Dome. En el texto que pegó, 🐄 y ✅ se veían como
"�"; se revisaron los bytes en `index.html` y son idénticos a la versión
publicada (no es regresión: probablemente el copiado a la terminal).

### S. TTL no disponible + avisos en el panel admin
- El dueño autorizó activar la política TTL. Se intentó por la API de
  Firestore y Google respondió `403 billing disabled`: el TTL exige
  facturación (plan Blaze). **No se activó nada.** Reemplazo sin costo: el
  panel admin, al abrirse, borra los pedidos `sin_confirmar` cuyo `expira`
  ya pasó. Se borran cuando el admin entra, no exactamente a las 24 h;
  mientras tanto solo el admin los puede ver.
- A pedido del dueño, avisos al entrar al panel (adelantado de la Fase 7,
  RF-18), `js/admin/avisos.js`:
  - Banner: pedidos nuevos desde la última visita (hasta 5 listados) +
    cuántos siguen sin confirmar + cuántos vencidos se borraron. Botones
    "Ver pedidos" y "Marcar como visto" (`avisos/estado.visto`).
  - En vivo (`onSnapshot` de los últimos 20): aviso flotante por pedido
    nuevo o cambio de estado hecho desde otro lado (ignora los cambios
    hechos en esta misma pestaña), contador en la pestaña "Pedidos (n)" y
    en el título de la ventana.
  - El título de sección no muestra el contador ("Pedidos", no "Pedidos (2)").
- Reglas: +6 pruebas (consultas de vencidos y de nuevos, borrar, guardar
  `avisos/estado`, vendedor y cliente sin acceso) → **51 ok / 0 fallos**.
  Panel sin errores de consola.

### T. Visto bueno de los avisos (2026-11-10) y cierre de la sesión
El dueño probó banner, aviso en vivo y "Marcar como visto": "funciona
perfecto". La Fase 5 sigue en la sesión 038.

## Archivos tocados
```
Paguina_joyas/
├── index.html                                   (M) — códigos desde Firestore (antes: cupones DOME/SALO/SEBAS escritos)
├── js/firestore-catalogo.js                      (M) — consultarCodigoDescuento()
├── js/pedidos-web.js, js/admin/pedidos.js        (??) NUEVO — Fase 4
├── vendedor.html, js/vendedor/, css/vendedor.css (??) NUEVO — Fase 3
├── scripts/test-comisiones.mjs                   (??) NUEVO
├── .github/workflows/pages.yml                   (M) — vendedor.html
├── admin.html, css/admin.css                     (M) — sección Vendedores
├── js/admin/vendedores.js                        (??) NUEVO
├── firestore.rules, firebase.json, .firebaserc, firestore.indexes.json (??) NUEVO
├── scripts/test-reglas.mjs                       (??) NUEVO
├── AGENTS.md, spec/constitution/{roadmap,tech-stack}.md  (M)
├── spec/features/012-paneles-vendedores/        (??) NUEVO
└── sesiones/sesion-037.md                        (??) NUEVO
```

## Pendientes
- Dueño: `firebase login` para desplegar reglas (antes, comparar con las de la consola).
- Seguir con Fase 2.
- Sin subir: cupones + docs, esperando visto bueno.
