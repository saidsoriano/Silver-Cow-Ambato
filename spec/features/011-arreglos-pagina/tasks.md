# Tareas: Arreglos de la página

> **Feature cerrada** en la sesión 036 (2026-11-04). Lista viva — se fue
> sumando un ítem por cada pedido del propietario, sin un número total fijo
> de tareas a diferencia de las otras features.

> **Pendiente fuera de esta lista:** el dueño preguntó por portar el
> "Circular Carousel" de reactbits.dev a "Piezas destacadas". Se le explicó
> que no encaja acá (es rediseño visual, no un arreglo chico, y la misma
> complejidad de interacción que ya hizo abortar CardNav/StaggeredMenu en
> `006-reactbits-ports`). Decisión: queda fuera de `011`, abrir aparte si
> se quiere — **avisar al dueño cuando esta feature se cierre**, se lo
> pidió explícitamente.

- [x] **1. Hueco en la fila de confianza en celular** — `.trust-row` a una
      columna en el media query móvil. Verificado con captura (390px, los 3
      ítems apilados sin huecos). Ver `plan.md` § Ítem 1, `sesiones/sesion-025.md`.
- [x] **2. Flecha derecha del carrusel no vuelve al inicio** — `mover(1)` en
      `js/carousel.js` ahora vuelve a `scrollLeft:0` al llegar al final;
      `limitarFlechas()` ya no deshabilita "adelante" por eso. Verificado con
      clic simulado real (headless). Ver `plan.md` § Ítem 2.
- [x] **3. Fotos del carrusel muy pequeñas** — ancho de `.carousel-track
      .joya-card` subido ~30% en `reactbits.css` (escritorio y celular).
      Verificado con medición de ancho real en el DOM. Ver `plan.md` § Ítem 3.
- [ ] **4. Posible desalineación en el carrusel** — medí las 8 tarjetas
      visibles y están perfectamente alineadas (mismo alto, mismo botón).
      El dueño nunca llegó a precisar qué veía descalzado, y el carrusel
      cambió bastante desde entonces (ítems 3, 5, 10 de esta misma lista).
      **Cerrado sin resolver al cerrar la feature** — si se nota algo
      todavía, abrir de nuevo como ítem nuevo con una captura actual.
      Ver `plan.md` § Ítem 4.
- [x] **5. Control manual de "Piezas destacadas" desde el panel** —
      checkbox "Destacada" en el panel admin (independiente del estado);
      el carrusel ahora muestra solo lo marcado ahí, nada de selección
      automática. Suma pestaña "★ Destacadas" para ver todas las marcadas
      de cualquier categoría en un solo lugar. Verificado: sección pública
      se oculta sola sin piezas marcadas, sin errores de consola,
      `node --check` en el panel. QA visual del panel: pendiente de que el
      dueño entre con su cuenta (no automatizable). Ver `plan.md` § Ítem 5.
- [x] **6. Filtros de estado en el panel admin** — botones "Disponible" /
      "Bajo pedido" / "Agotado" junto al buscador, combinables entre sí y
      con el texto buscado. `node --check` ok. QA visual: pendiente del
      dueño (login real). Ver `plan.md` § Ítem 6.
- [x] **7. Bug real: panel quedaba en blanco (tabs y lista vacías)** —
      causa: `fotos.js` importaba Supabase desde `cdn.jsdelivr.net` de
      forma estática; si esa carga fallaba, reventaba todo `productos.js`
      sin mostrar ningún error. Arreglo: import perezoso, solo al subir
      una foto de verdad. Reproducido y verificado el arreglo con el CDN
      bloqueado a propósito (antes: 0 pestañas, después: 8). Ver `plan.md`
      § Ítem 7.
- [x] **8. Buscador en el catálogo público** — input arriba de los tiles
      de categoría, busca en TODAS las categorías a la vez (nombre, código
      y descripción). Requisitos acordados con el dueño antes de
      implementar. Verificado con datos reales (39 resultados para "topo",
      1 para un código exacto, mensaje de "sin resultados", vuelve a la
      categoría activa al borrar). Sin errores de consola. Reubicado
      luego: pegado a la izquierda, arriba del título de la categoría (en
      vez de centrado arriba de los tiles). Ver `plan.md` § Ítem 8.
- [x] **9. Sacar 2 textos del hero** — el tag "PLATA LEY 925 · BAJO
      PEDIDO" arriba del título, y la leyenda "ANILLO SOLITARIO
      ENTRELAZADO · PLATA DE LEY 925" sobre los chips de vista. Verificado:
      los chips de vista (Giro 360° / Frontal / etc.) siguen funcionando
      igual, sin errores de consola. Ver `plan.md` § Ítem 9.
- [x] **10. Hero opaco, perdió el brillo** — causa real: el "negro" del
      video comprimido no es negro puro (ronda rgb(10-20)), y con
      `mix-blend-mode: screen` eso lavaba el fondo estrellado alrededor
      del anillo. Arreglo: `filter: contrast(1.6)` en `#ringVideo`, sin
      tocar la lógica de video/3D. **Intento previo descartado:** probé
      sacar el video y dejar solo el 3D de Three.js — se reveló un bug
      real ahí (el anillo sale gigante, tapa el título), y encima
      confirmé que el video gana la carrera el 100% de las veces en local
      (no es una carrera real en la práctica). Revertido antes de seguir.
      Ver `plan.md` § Ítem 10.

> **Auditoría de usabilidad (Nielsen), sitio + panel:** el dueño pidió
> aplicar "los justos y necesarios" principios de Jakob Nielsen en ambas
> superficies, con una auditoría primero para que él apruebe ítem por
> ítem. Se hizo con un subagente (solo lectura, sin tocar código) y el
> dueño aprobó los 7 hallazgos — ítems 11 a 17 abajo. Ver `plan.md` § Ítem 11.

- [x] **11. Carrito funde 2 piezas distintas con el mismo nombre** — bug
      real, no solo UX: el carrito identificaba cada línea por `nombre`,
      y el catálogo real tiene nombres repetidos con código distinto (ej.
      "Topo ortopédico rosca de seguridad circón cuadrado" × 2). Arreglo:
      identidad por código (`codigo || nombre` como clave), en
      `agregarAlCarrito`, `cambiarCantidad`, `eliminarDelCarrito` y los
      `onclick` que arma `actualizarCarrito()`. Verificado: 2 piezas con
      mismo nombre y código distinto quedan en 2 líneas separadas; agregar
      la misma 2 veces suma cantidad en la misma línea; clic en "+" de una
      no afecta a la otra. Ver `plan.md` § Ítem 11.
- [x] **12. Límite de cantidad inconsistente** — "Agregar" topaba en 3,
      los +/- del carrito en 5. Unificado a `CONFIG.LIMITE_UNIDADES = 3`,
      un solo número editable. Verificado: se bloquea en 3 por los dos
      caminos. Ver `plan.md` § Ítem 11 (11b).
- [x] **13. Foco de teclado sin el anillo dorado en el buscador del
      catálogo** — `.catalogo-buscador:focus` tenía `outline:none` propio,
      rompiendo el estándar global del sitio. Sacado. Verificado con
      `:focus-visible` real: ahora sale el anillo dorado de 2px. (El
      `.cupon-input` que señalaba el mismo hallazgo resultó ser falso
      positivo al verificar la especificidad CSS real — no se tocó). Ver
      `plan.md` § Ítem 11 (11c).
- [x] **14. "Importar desde Sheets" sin confirmar y pisando curación** — el
      más serio del panel. Sin `confirm()` antes de correr, y la
      escritura (`batch.set` sin merge) borraba `destacada`/forzaba
      `archivado:false` en todo. Arreglo: `confirm()` con texto claro +
      `{merge:true}` + esos 2 campos ya no se escriben (se respeta lo que
      haya). `node --check` ok. **QA real pendiente:** no se pudo correr
      una migración de verdad sin pisar los 357 productos reales — revisar
      con cuidado la primera vez que se use. Ver `plan.md` § Ítem 12 (12a).
- [x] **15. Cambiar de pestaña con ediciones sin guardar las descarta
      en silencio** — `armarTabs()` ahora chequea `hayCambiosSinGuardar()`
      (compara los inputs de cada fila visible contra los últimos valores
      guardados) y pide confirmación antes de reconstruir la lista. De
      paso: `p` se actualiza tras un "Guardar" exitoso (si no, la fila
      quedaba "sucia" para siempre). `node --check` ok. QA visual:
      pendiente del dueño (requiere login real + datos reales). Ver
      `plan.md` § Ítem 12 (12b).
- [x] **16. Filtros y pestañas no anuncian su estado a lectores de
      pantalla** — `aria-pressed` en los botones de filtro,
      `aria-selected` en las pestañas de categoría, alternados junto con
      la clase visual. Verificado con clics simulados (headless, sin
      necesitar login). Ver `plan.md` § Ítem 12 (12c).
- [x] **17. Cancelar el alta de pieza sin avisar si ya escribiste algo**
      — `cerrarFormulario()` en `alta.js` ahora confirma solo si algún
      campo (nombre/precio/descripción/foto) tiene contenido; vacío,
      cierra directo. No afecta el cierre automático tras guardar (el
      form ya está vacío en ese punto). Verificado con clics simulados.
      Ver `plan.md` § Ítem 12 (12d).
