# Plan técnico: Arreglos de la página

## Principios
1. **Sin plan técnico único** — cada ítem es chico y se resuelve en el
   archivo que corresponda (`estilos.css`, `index.html`, `catalogo_motor.js`,
   etc.), sin arquitectura nueva.
2. **Diagnóstico antes que arreglo.** Para cada ítem: leer el CSS/HTML/JS real
   que produce el problema antes de tocar nada — no asumir la causa por cómo
   se ve en la captura.
3. **El cambio más chico que resuelve el problema de verdad**, no una
   reescritura de la sección.
4. **Verificar siempre con el motor de datos real** (localhost con el
   catálogo cargando de Firestore) — nunca con datos de prueba inventados.
5. **No romper el contrato** del motor público: `crearTarjeta()`,
   `.joya-card`, `agregarAlCarrito()`, IDs de navbar/carrito/menú — igual que
   en toda feature anterior.

## Historial de ítems resueltos

### Ítem 1 — Hueco en la fila de confianza en celular
**Problema:** `.trust-row` tiene 3 tarjetas (Plata Ley 925 / Envío seguro /
Atención directa). En escritorio son 3 columnas, calzan perfecto. En celular
(`@media max-width:900px`) bajaban a 2 columnas — con 3 elementos, el tercero
queda solo en la última fila, dejando un hueco vacío al lado.

**Causa:** `estilos.css`, regla `.trust-row { grid-template-columns: repeat(2,
1fr); }` dentro del media query móvil.

**Arreglo:** una sola columna en celular (`grid-template-columns: 1fr`) — los
3 ítems se apilan, sin huecos. Mismo contenido, mismo diseño, solo cambia
cuántos entran por fila.

**Verificado:** captura en 390px de ancho, los 3 apilados llenando el ancho.

Ver `sesiones/sesion-025.md`.

### Ítem 2 — Flecha derecha del carrusel no vuelve al inicio
**Problema:** en "Piezas destacadas", la flecha derecha se deshabilitaba al
llegar a la última tarjeta en vez de volver al inicio (el auto-avance sí
volvía solo, el clic manual no).

**Causa:** `js/carousel.js` — `mover(dir)` (clic manual) solo hacía
`track.scrollBy()`, sin el chequeo de "llegó al final" que ya tenía
`autoPaso()`. Además `limitarFlechas()` ponía `next.disabled = true` al
llegar al final, así que aunque se arreglara `mover()`, el botón quedaba
inútil (descubierto al verificar con clic simulado real, no alcanzaba con
leer el código).

**Arreglo:** `mover(1)` ahora detecta si ya está al final (mismo umbral que
`autoPaso`) y hace `scrollTo({left:0})` en vez de `scrollBy`.
`limitarFlechas()` ya no deshabilita "adelante" por llegar al final —
solo se deshabilita si no hay nada que desplazar (una sola tarjeta visible).

**Verificado:** headless, escritorio — se fuerza scroll casi al final, clic
en "adelante", `scrollLeft` vuelve a `0`. Sin errores de consola.

### Ítem 3 — Fotos del carrusel muy pequeñas
**Problema:** las tarjetas del carrusel eran notablemente más chicas que
las del catálogo principal; el dueño reportó que la foto es difícil de ver.

**Causa:** `reactbits.css` — `.carousel-track .joya-card` fijaba
`width: clamp(148px, 15vw, 176px)` en escritorio y
`clamp(128px, 38vw, 152px)` en celular. La foto es cuadrada y escala con el
ancho de la tarjeta, así que achicar la tarjeta achicaba la foto.

**Arreglo:** ancho subido a `clamp(190px, 19vw, 230px)` en escritorio y
`clamp(155px, 44vw, 185px)` en celular (~+30%), sin tocar el resto del
layout del carrusel (flechas, paddings, tipografía siguen igual).

**Verificado:** headless, escritorio (1400px) y celular (390px) — ancho de
tarjeta medido en el DOM: 230px y 171.6px respectivamente, dentro del rango
esperado. Sin errores de consola.

### Ítem 4 — Posible desalineación en el carrusel (sin confirmar)
**Reportado:** el dueño señaló una captura donde algo se ve "más arriba" y
otro elemento "más abajo" dentro del carrusel.

**Verificación hecha:** se midió la posición de cada tarjeta (altura total,
alto del bloque de info, posición del botón "Agregar") para las 8 tarjetas
visibles — las 8 dan exactamente los mismos valores (`cardHeight: 372`,
`btnTop: 724`, etc.), sin variación. No hay una causa de desalineación
real en el CSS de la grilla del carrusel.

**Pendiente:** se le pidió al dueño precisar qué parte exacta ve descalzada
(texto, botón, foto, flecha) — sin esa confirmación no se toca nada más,
para no arreglar algo que no está roto.

### Ítem 5 — Control manual de "Piezas destacadas" desde el panel
**Pedido:** agregar, junto a Disponible/Agotado/Bajo pedido en el panel
admin, algo para marcar una pieza como "destacada".

**Decisión (confirmada con el dueño):**
- Campo independiente del estado — un checkbox, no una 4ta opción del
  mismo select. Una pieza puede ser disponible + destacada, o agotado +
  destacada; no son excluyentes.
- Reemplaza la selección automática del carrusel (antes: hasta 2 piezas
  disponibles por categoría, con relleno automático si faltaban). Ahora el
  carrusel muestra únicamente lo marcado como destacada desde el panel.

**Arreglo:**
- Firestore: nuevo campo `destacada` (boolean) en `productos/{codigo}`.
- `js/admin/productos.js`: checkbox "Destacada" junto al select de Estado;
  se guarda con el mismo botón "Guardar" de la fila.
- `js/firestore-catalogo.js`: el campo se suma a los que ya se pasaban del
  doc de Firestore al objeto que usa el sitio público.
- `js/carousel.js`: `seleccionar()` reescrito — ya no arma una mezcla
  automática (se quitaron `POR_CAT`, `MIN`, el dedup por `clave()`), ahora
  solo toma piezas con `destacada === true`, en el orden de `ORDEN`, hasta
  `MAX` (8).

**Efecto esperado:** hasta que el dueño marque piezas desde el panel, la
sección "Piezas destacadas" queda vacía y se oculta sola (mismo
comportamiento de `pintar()` que ya existía para el caso sin resultados).

**Verificado:** headless — con 0 piezas marcadas `destacada` en la base
real, `#destacados` queda `hidden`, sin errores de consola.
`node --check` sobre los 3 archivos JS tocados.

**Seguimiento — pestaña "★ Destacadas" en el panel:** el dueño pidió un
lugar para ver de un vistazo qué piezas tienen el casillero activado, sin
recorrer categoría por categoría. Se agregó una pestaña especial
`TAB_DESTACADAS` en `js/admin/productos.js`, fuera de `CATEGORIAS`, que
consulta `where("destacada", "==", true)` sin filtro de categoría (un solo
filtro de igualdad, sin `orderBy` — no necesita índice compuesto nuevo,
mismo criterio que `firestore-catalogo.js`). Reutiliza `filaProducto()` tal
cual, así que desde ahí también se puede desmarcar/editar directamente. Si
se desmarca y se guarda estando en esa pestaña, la fila se saca sola de la
lista (ya no pertenece a la vista).

**Verificado:** `node --check` sobre `js/admin/productos.js`. El panel
requiere login con Google (cuenta del dueño) — igual que el resto de
`010-vista-admin`, la verificación visual final queda para que él la haga
en su navegador, no es automatizable desde acá.

### Ítem 6 — Filtros de estado en el panel admin
**Pedido:** poder filtrar la lista por estado (ej. "solo bajo pedido",
"solo disponibles") desde el panel, junto al buscador.

**Arreglo:**
- `admin.html`: fila de 3 botones ("Disponible" / "Bajo pedido" /
  "Agotado") entre el buscador y la lista, con `data-estado` por botón.
- `css/admin.css`: `.admin-filtro` / `.admin-filtro.activo` — mismo estilo
  de píldora que las pestañas de categoría, pero más chico (es un filtro
  secundario, no navegación).
- `js/admin/productos.js`: los botones se alternan (toggle, combinables
  entre sí — ej. "Disponible" + "Agotado" a la vez muestra ambos). Ninguno
  activo = se ve todo (estado por defecto). `filtrarLista()` ahora combina
  el filtro de texto que ya existía con el de estado — una fila se
  muestra solo si pasa los dos. El filtro se arma sobre lo ya cargado en
  pantalla (igual que el buscador), no hace una consulta nueva a
  Firestore. Se mantiene activo al cambiar de pestaña (categoría o
  "★ Destacadas"), para no tener que reactivarlo cada vez.

**Verificado:** `node --check` sobre el archivo tocado. QA visual: pendiente
del dueño (requiere login real, no automatizable).

### Ítem 7 — Bug real: panel en blanco (ni tabs ni lista)
**Reportado:** el dueño mandó una captura — el panel cargaba (logueado,
"Catálogo" + "Cerrar sesión" visibles) pero sin ninguna pestaña de
categoría ni ningún producto en la lista. Los botones de filtro (HTML
estático del Ítem 6) sí se veían.

**Diagnóstico:** se reprodujo cargando `admin.html` con navegador headless
contra el mismo `localhost:8123`. `armarTabs()` y `cargarCategoria()` nunca
corrían — sin ningún error visible en pantalla. Revisando el log de red se
encontró la causa real: `js/admin/fotos.js` importaba
`supabase-config.js`, que a su vez carga el SDK de Supabase desde
`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm` — un `import`
**estático**, al tope del archivo. `productos.js` importa `subirFoto` de
`fotos.js`. En JS, si un módulo importado de forma estática falla al
cargar (red, DNS, firewall, bloqueo del navegador), **todo el módulo que
lo importa queda sin ejecutarse** — ni siquiera el código que no tiene
nada que ver con fotos. Por eso ni las pestañas (100% sincrónicas, sin
tocar Firestore) ni la lista aparecían: el archivo entero nunca llegó a
correr. Nada de esto tiene que ver con los ítems 5/6 de hoy — es un
problema de arquitectura que ya existía desde `010-vista-admin`, recién
visible ahora porque ese CDN dejó de responder en algún momento.

**Arreglo:** `fotos.js` ya no importa `supabase-config.js` al tope del
archivo — lo importa de forma dinámica (`await import(...)`) adentro de
`subirFoto()`, es decir, solo en el momento real en que se sube una foto.
Así, si el CDN de Supabase falla, lo único que se rompe es "subir foto"
(con su propio mensaje de error ya existente), y el resto del panel
(tabs, lista, buscador, filtros, destacada, archivar) sigue funcionando
normal.

**Verificado:** se repitió la misma carga headless con ese CDN bloqueado a
propósito (mismo escenario del bug real) — antes del arreglo: 0 pestañas
cargadas; después: 8 (las 7 categorías + "★ Destacadas"), sin errores de
consola. `node --check` sobre `fotos.js`.

### Ítem 8 — Buscador en el catálogo público
**Pedido:** agregar al catálogo del sitio público un buscador parecido al
del panel admin.

**Requisitos acordados con el dueño antes de implementar** (el catálogo
público es distinto al panel: muestra una sola categoría a la vez, con
tiles arriba y paginación "Ver más" — el patrón del admin no se podía
copiar literal sin definir esto primero):
1. **Alcance:** busca en TODAS las categorías a la vez, sin importar qué
   tile esté activo — no solo dentro de la categoría que se está viendo.
2. **Ubicación:** arriba de los tiles de categoría, en el encabezado de la
   sección catálogo.
3. **Campos:** nombre, código y descripción (no solo nombre+código como el
   admin).

**Arreglo:**
- `index.html`: `<input id="buscadorCatalogo">` dentro de
  `.catalogo-header`, antes de los tiles. Script nuevo agregado al final,
  después de `carousel.js`.
- `js/buscador-catalogo.js` (nuevo, mismo patrón que `carousel.js`: script
  clásico, `DOMContentLoaded`, sin depender de que `catalogo_motor.js` /
  `catalogo.js` carguen en un orden exacto). Busca sobre el objeto
  `CATALOGO` global (ya lo usa `carousel.js` también) recorriendo las 7
  categorías, sin filtrar por la categoría activa. La descripción
  (`p.desc`) ya trae el código entre corchetes al principio
  (`[P-AR-238] ...`), así que buscar ahí cubre nombre+código+descripción
  con un solo `indexOf`, sin necesitar una regex aparte para el código.
  Mínimo 2 caracteres para buscar (con 1 letra, el resultado sería "casi
  todo el catálogo" — guardia agregada, no pedida explícitamente, para que
  el buscador sea útil desde el primer toque).
  Reemplaza `#catalogoContenedor` por una sección de resultados (mismas
  clases `.cat-section`/`.joyas-grid` que ya usa `cargarCategoria()`, para
  no inventar un estilo nuevo), reusando `crearTarjeta()` tal cual — cero
  cambios en `catalogo_motor.js`.
  Al borrar el texto (o bajar de 2 caracteres), vuelve a mostrar la
  categoría que estaba activa en los tiles, leyendo el nombre de categoría
  del `onclick` del tile activo y llamando a la misma `cargarCategoria()`
  que ya usan los tiles — sin duplicar esa lógica de renderizado.
  Un clic en cualquier tile de categoría limpia el buscador (si no, el
  texto se quedaría ahí pisando la navegación normal de categorías).
- `estilos.css`: `.catalogo-buscador` — mismo lenguaje visual del sitio
  (bordes sutiles, foco en dorado), centrado, `max-width: 420px`.

**Cuidado aplicado (bug ya conocido del proyecto):** la normalización de
texto usa el rango Unicode de acentos combinados
(`̀`-`ͯ`) escrito como escape explícito, no como el carácter
literal — escribirlo literal se corrompe al guardar con las herramientas
de edición (ya pasó una vez en `js/admin/productos.js`, sesión 027). Se
escribió con un script de Python para asegurar los bytes exactos, y se
verificó con `grep`/`cat -A` que quedó como el escape, no el carácter.

**Verificado con datos reales** (headless, catálogo cargado de Firestore,
357 piezas):
- Buscar "topo" → 39 resultados, de varias categorías (aretes topo,
  "Totopo", etc.), no solo la categoría activa.
- Buscar un código exacto (`P-AR-238`) → 1 resultado, la pieza correcta.
- Buscar algo que no existe → mensaje "No encontramos piezas para...".
- Borrar el texto → vuelve a la categoría que estaba activa (`Pulseras`),
  sin quedar en un estado raro.
- Captura en 390px (celular): el buscador se ve centrado, mismo estilo del
  resto de la página.
- Sin errores de consola en ningún caso. `node --check` sobre el archivo
  nuevo.

**Ajuste de ubicación (mismo ítem, pedido aparte del dueño):** primero se
puso arriba de los tiles (dentro de `.catalogo-header`). El dueño pidió
bajarlo: entre los tiles de categoría y el listado de productos — el mismo
lugar donde arranca la sección de la categoría activa (ej. "Pulseras").
`index.html`: el `<input>` se movió fuera de `.catalogo-header`, justo
antes de `#catalogoContenedor`. `estilos.css`: `margin` del
`.catalogo-buscador` ajustado (`0 auto 48px` en vez de `28px auto 0`), ya
que ahora el espacio de arriba lo da el `margin-bottom: 72px` que ya tenía
`.catalogo-bento`. Nada de `js/buscador-catalogo.js` cambió — no depende
de dónde esté el input en el documento. Verificado con captura en
escritorio y celular: el buscador queda justo entre la última fila de
tiles y el encabezado de la categoría cargada.

**Segundo ajuste (mismo ítem):** el dueño lo quería pegado a la izquierda,
arriba del título de la categoría, no centrado. `estilos.css`:
`max-width: 340px`, `margin: 0 0 28px` (sin `auto`), `text-align: left`.
Verificado con captura: el input queda alineado con el borde izquierdo de
"Pulseras".

### Ítem 9 — Sacar 2 textos del hero
**Pedido:** quitar el tag "PLATA LEY 925 · BAJO PEDIDO" (arriba del
título del hero) y la leyenda "ANILLO SOLITARIO ENTRELAZADO · PLATA DE LEY
925" (sobre los chips de vista del anillo 3D).

**Chequeo antes de tocar:** se revisó `js/hero-ring.js` para confirmar que
ninguno de los dos elementos (`.tag`, `.views p`) estaba referenciado por
JS — solo usa `.chip[data-v]` para los botones de vista (Giro 360° /
Frontal / 3/4 / Lateral / Posterior). Sacarlos no rompe nada del anillo 3D
ni de los chips.

**Arreglo:** `index.html` — se borraron los dos elementos (`<div
class="tag">...</div>` y `<p>ANILLO SOLITARIO...</p>`). Nada en CSS ni JS
los referenciaba aparte de eso, así que no hizo falta tocar más archivos.

**Verificado:** headless — ninguno de los dos elementos existe en el DOM
tras el cambio, los 5 chips de vista siguen presentes y funcionando, sin
errores de consola. Captura del hero completo, se ve limpio.

### Ítem 10 — Hero opaco, perdió el brillo
**Reportado:** el dueño mandó una captura del hero viéndose apagado/
opaco, pidiendo que "vuelva el brillo". Pidió además, al aclarar qué
quería, que quedara igual a una imagen de referencia que mandó (hero con
fondo oscuro nítido, estrellas bien visibles, botón dorado vivo).

**Primer intento — descartado.** El hero tiene dos formas de mostrar el
anillo: un video grabado (`assets/hero-anillo.mp4`) y un anillo 3D
animado con Three.js (luces propias, reflejos que se mueven), armados
como una carrera en `js/hero-ring.js`: el que "gane" (video si reproduce
a tiempo, si no el 3D) se queda, el otro se oculta. La hipótesis inicial
fue que el video (una toma fija) se ve más plano que el 3D animado, y que
a veces ganaba uno y a veces el otro — "a veces se ve brillante, a veces
opaco". Se probó sacar el video del todo y dejar solo el 3D
(`js/hero-ring.js`, `index.html`, `estilos.css`).

Al verificar con capturas reales aparecieron dos problemas que tumbaron la
hipótesis:
1. El anillo 3D tiene un bug real de tamaño/cámara: sale gigante, tapa el
   título entero. Nunca se había visto porque, en la práctica, el video
   gana la carrera.
2. Se repitió la carga 5 veces seguidas contra el servidor local: el
   video ganó las 5 — no hay tal carrera variable en este entorno, así
   que esa no era la causa de la queja.

**Se revirtió el intento completo** (`js/hero-ring.js` con `git checkout`,
ya que su diff completo era solo este cambio; `index.html` y
`estilos.css` a mano, línea por línea, porque esos archivos tenían además
el resto del trabajo acumulado de esta feature sin subir — no se podía
usar `git checkout` ahí sin perder todo lo demás). Verificado después de
revertir: `git diff` sobre `ringVideo`/`has-video` da vacío, igual que
antes de tocar nada.

**Causa real, encontrada después:** se extrajo un cuadro del video con
`ffmpeg` y se midieron los píxeles de fondo con Python/Pillow — el
"negro" del video no es negro puro, ronda `rgb(10-20, 10-20, 10-20)`
(típico de la compresión). `#ringVideo` usa `mix-blend-mode: screen` para
que el fondo del video se funda con el fondo del hero y solo quede
flotando el anillo — pero con `screen`, hasta un gris casi-negro aclara
un poco toda esa zona (no es verdadero cero), lavando el contraste del
campo de estrellas (`#hero::after`) justo detrás del video.

**Arreglo real:** una línea en `estilos.css` — `filter: contrast(1.6)` en
`#ringVideo`. El filtro se aplica antes del blend, así que empuja esos
grises casi-negros mucho más cerca de 0 (se funden del todo con `screen`)
sin aplastar los brillos reales de la joya. No se tocó
`js/hero-ring.js` ni la lógica de video/3D — es un arreglo de un atributo
CSS.

**Verificado:** se tomaron capturas antes/después y se compararon
píxeles con Python en la misma zona (dentro del círculo del video, fuera
del anillo): de 1296 puntos muestreados, 1204 cambiaron, todos más
oscuros — ej. `rgb(33,48,81)` → `rgb(17,33,69)` en el mismo punto. Captura
en celular también revisada. Sin errores de consola en ningún paso.

### Ítem 11 — Auditoría de usabilidad (Nielsen): sitio público
**Pedido:** aplicar "los justos y necesarios" principios de Jakob Nielsen
en el sitio público y en el panel admin — primero una auditoría, el dueño
aprueba ítem por ítem, recién ahí se implementa.

**Cómo se hizo:** un subagente (fork, solo lectura — sin tocar código)
revisó archivo por archivo contra los 10 principios y devolvió solo los
hallazgos donde de verdad aplicaba uno, con propuesta de arreglo mínima.
El dueño aprobó los 7 — 3 del sitio público, 4 del panel.

**11a — El carrito funde 2 piezas distintas con el mismo nombre.**
*Heurística 5 (prevención de errores).* `index.html`: `agregarAlCarrito` /
`cambiarCantidad` / `eliminarDelCarrito` identificaban cada línea del
carrito por `p.nombre`. El catálogo real tiene nombres repetidos con
código distinto (confirmado en la sesión 031 al buscar "topo": "Topo
ortopédico rosca de seguridad circón cuadrado" aparece 2 veces con
códigos distintos). Agregar las dos al carrito las fusionaba en una sola
línea — el pedido final por WhatsApp podía llevar el código equivocado.

**Arreglo:** identidad por `codigo || nombre` (fallback a nombre solo si
el producto no tiene código, caso raro de datos). Se tocaron las 3
funciones más la plantilla de `actualizarCarrito()` (los `onclick` que
arma para +/-/eliminar). **Verificado** (headless, con datos simulados):
2 piezas de mismo nombre y código distinto quedan en 2 líneas; agregar la
misma otra vez suma cantidad en la línea correcta; clic en "+" de una no
toca a la otra.

**11b — Límite de cantidad inconsistente.** *Heurística 4 (consistencia).*
El botón "Agregar" topaba en 3 unidades; los +/- del carrito, en 5 — dos
reglas distintas para lo mismo. **Arreglo:** un solo número,
`CONFIG.LIMITE_UNIDADES = 3`, usado en los dos lugares (y en los 2
mensajes de alerta, que antes tenían el número c en el texto). Verificado:
se bloquea en 3 por cualquiera de los dos caminos.

**11c — Foco de teclado sin el anillo dorado en el buscador.** *Heurística
4 (consistencia) + accesibilidad.* El sitio ya tiene un estándar global
(`estilos.css` líneas 77-86: `:focus-visible { outline: 2px solid
var(--gold-accent) }`), pero `.catalogo-buscador:focus` (sesión 031) tenía
su propio `outline: none`, rompiéndolo ahí. **Arreglo:** se sacó esa
línea — el estándar global ya se aplica solo.

*Verificación encontró un falso positivo, no se tocó:* el audit también
señaló `.cupon-input` por el mismo motivo (tiene `outline: none` en su
regla base). Se midió la especificidad CSS real: `input:focus-visible`
(0,0,1,1) le gana a `.cupon-input` (0,0,1,0) en la propiedad `outline`,
así que el anillo dorado ya se aplica ahí aunque el código "parezca" el
mismo problema — confirmado con `getComputedStyle` en un foco real
(`outlineStyle: "solid", outlineColor: rgb(201,168,76)` tras el fix en el
buscador; en `.cupon-input` la medición automatizada dio inconclusa por
cómo el harness de pruebas simula el foco, pero la aritmética de
especificidad CSS es determinística y no depende del navegador). No se
tocó ese archivo — tocar código que no está roto solo agrega riesgo.

**Impresión general (sitio):** sólido. El 11a es el único con impacto real
en un pedido (dinero/código equivocado); 11b y 11c son pulido.

### Ítem 12 — Auditoría de usabilidad (Nielsen): panel admin

**12a — "Importar desde Sheets" sin confirmar, pisando curación.**
*Heurística 5 — el más serio de los 7.* `js/admin/migracion.js`: sin
`confirm()` antes de correr `migrar()`. Peor: `batch.set()` sin merge
reemplaza el documento entero de cada producto, así que corría la
migración con el campo `destacada` (curado a mano en las sesiones 027-030
para "Piezas destacadas") y `archivado` (forzado a `false` siempre, sin
importar el valor real). Un clic de más en "Herramientas" podía deshacer
curación real.

**Arreglo:** `confirm()` con texto explicando qué va a pasar antes de
correr; `batch.set(ref, datos, { merge: true })` y se sacaron `destacada`
y `archivado` del objeto escrito — con merge, un campo que no se incluye
no se toca, así que lo curado a mano queda intacto en productos
existentes, y en productos nuevos simplemente queda sin definir (que ya
se trata como "no" en todo el sitio: `!p.archivado`, `if (p.destacada)`).

**QA real pendiente:** no se corrió una migración de verdad contra los
357 productos reales (sería arriesgado solo para probar). `node --check`
sobre el archivo sí pasa. Recomendado: la primera vez que se use después
de este cambio, revisar con cuidado el resultado.

**12b — Cambiar de pestaña con ediciones sin guardar las descarta en
silencio.** *Heurística 5.* `js/admin/productos.js`: el clic en cualquier
pestaña (categoría o "★ Destacadas") llamaba a `cargarCategoria()` de
una, reconstruyendo toda la lista — si había 3-4 campos editados sin
guardar en alguna fila visible, se perdían sin aviso.

**Arreglo:** cada fila expone `fila.tieneCambiosSinGuardar()` (compara los
inputs vivos contra `p`, los últimos valores guardados). Antes de cambiar
de pestaña, `hayCambiosSinGuardar()` revisa todas las filas visibles; si
alguna está "sucia", pide confirmación. De paso se encontró y arregló un
bug chico relacionado: después de un "Guardar" exitoso, `p` nunca se
actualizaba con los valores nuevos — así que una fila recién guardada
quedaba marcada como "con cambios" para siempre (hasta recargar la
categoría). Ahora `p` se sincroniza justo después del `updateDoc` exitoso.

**Verificado:** `node --check`. El flujo completo (editar, cambiar de
pestaña, ver el `confirm`) necesita datos reales de Firestore — login
pendiente del dueño, igual que el resto del panel.

**12c — Filtros y pestañas no anuncian su estado a lectores de
pantalla.** *Heurística 10 / accesibilidad.* `.admin-filtro` y
`.admin-tab` cambiaban de color con una clase, sin `aria-pressed` ni
`aria-selected`. **Arreglo:** se alternan junto con la clase visual, en
el mismo punto del código. **Verificado** (headless, sin necesitar
login — es DOM puro): clic en "Disponible" pone `aria-pressed="true"` ahí
y dejó los otros dos en `"false"`; las pestañas arrancan con
`aria-selected="true"` solo en la activa.

**12d — (Menor) Cancelar el alta de pieza sin avisar si ya escribiste
algo.** *Heurística 5, mismo patrón que 12b pero de menor impacto — es un
formulario corto.* `js/admin/alta.js`: `cerrarFormulario()` hacía
`form.reset()` sin preguntar. **Arreglo:** confirma solo si
nombre/precio/descripción/foto tienen contenido; vacío, cierra directo —
no afecta el cierre automático después de guardar con éxito (el form ya
quedó vacío en ese punto, por el `form.reset()` que ya corría ahí).
**Verificado** con clics simulados: con contenido y el `confirm` rechazado
(el harness de pruebas rechaza diálogos por diseño), el form sigue
abierto con el texto intacto; vacío, cierra sin pedir nada.

**Impresión general (panel):** el flujo de guardado por fila y el alta de
pieza ya estaban bien pensados — estos 4 puntos eran reales pero
puntuales, el 12a es el que más importaba.
