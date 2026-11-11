# Sesión 040 — Hero con video de fondo (2026-11-10)

**Estado:** Implementado y probado en headless (sin desplegar)
**Objetivo:** Reemplazar el anillo 3D/video del hero por video de fondo tipo Nike, con los clips de la marca; solo título + dos botones centrados.

## Qué se hizo
- `assets/hero/clip-1..4.mp4` (nuevos, 2.4 MB en total) — 4 clips verticales 720×1280, H.264 sin audio, ≤6.5 s, `faststart`. El clip 1 venía con rotación mezclada; se corrigió y se recortó a vertical.
- `assets/hero/poster-1..4.jpg` — cuadro fijo de cada clip (se ve mientras carga y con movimiento reducido).
- `js/hero-videos.js` (nuevo) — escritorio: 4 columnas reproduciendo a la vez; móvil: un clip a pantalla completa con fundido cada 5.5 s, descargando solo el siguiente. Pausa fuera de pantalla o con la pestaña oculta. Con `prefers-reduced-motion` o ahorro de datos: solo poster.
- `index.html` — hero nuevo (reel de videos + h1 + botones). Se quitaron el canvas 3D, el video del anillo, la rejilla, el subtítulo, los chips de vistas, "Explorar" y los `<script>` de Three.js y `hero-ring.js`.
- `estilos.css` — bloque HERO reescrito (centrado, velo de legibilidad, columnas/fundido).
- `js/loader.js` — ahora espera el primer cuadro de `heroClip1` (o el poster con movimiento reducido).

## Sin borrar (quedan sin uso)
`js/hero-ring.js`, `assets/hero-anillo.mp4`. Se pueden eliminar cuando se confirme el cambio.

## Pruebas
Chrome headless: escritorio 1440×810, móvil 390×844 (rotación de clips verificada), movimiento reducido. Sin errores propios en consola. Descarga en móvil al entrar: 1 clip (~0.9 MB) + posters.
Pendiente: QA en iPhone real (autoplay en Modo de bajo consumo cae al poster).

## Integración en el repo (Claude Code, 2026-11-10)
- Los cambios 013 y 014 llegaron en `silver-cow-cambios.zip`, armados sobre el
  commit `7029409`. Se revisó con git: después de ese commit solo hubo
  `1cded1e` (docs y `.gitignore`), así que `index.html` y `estilos.css` del
  repo eran idénticos a la base del zip → se reemplazaron completos, **sin
  conflictos**. Antes de copiar se comparó línea por línea: `index.html`
  cambia solo el `<head>` (loader), el `<div id="sc-loader">`, la `<section
  id="hero">` y los scripts del hero; `estilos.css` cambia solo dentro del
  bloque "HERO — SECCIÓN PRINCIPAL". El JS nuevo solo usa archivos locales.
- Copiados: `index.html`, `estilos.css`, `css/loader.css`, `js/loader.js`,
  `js/hero-videos.js`, `assets/loader-logo.png`, `assets/hero/*`, sesiones
  039 y 040. **No** se borraron `js/hero-ring.js` ni `assets/hero-anillo.mp4`.
- Comprobado: `loader.css` carga antes que `estilos.css`; `pages.yml` copia
  `assets/` con `cp -r` (incluye `assets/hero/`); la animación `fadeIn` que
  usa `.cta-row` sigue en `estilos.css`.
- Verificado en headless contra `localhost:8123`: escritorio 1440×810 (loader
  visible, liberado antes de 4 s, los 4 videos reproduciendo, catálogo con 364
  piezas, h1 y los 2 botones); celular 390×844 (un clip a la vez, a los 8 s
  ya rotó al 2, el 4 todavía sin descargar); movimiento reducido (loader sale
  enseguida, videos quietos con poster). Sin errores de consola en los tres.
- Observación: los clips 2 y 3 son tomas desde arriba con las modelos
  recostadas sobre el capó (se ven de lado/de cabeza). No hay metadata de
  rotación (los 4 son 720×1280) y el capó también sale de lado: parece
  intencional. Confirmar con el dueño.
- Docs: `spec/features/013-loader-marca/`, `spec/features/014-hero-video/`,
  roadmap, AGENTS, índice de la bóveda. **Sin push**: esperando el OK.

## Optimizaciones (Claude Code, 2026-11-10, a pedido del dueño: "aplica los 5")
1. **Clips livianos para celular:** `assets/hero/clip-N-m.mp4`, 540×960,
   H.264 sin audio, `faststart` (clip 1 con CRF 33 porque a CRF 30 pesaba
   591 KB; comparado contra el original a la misma escala: diferencia casi
   imperceptible). Pesos: 423 + 405 + 349 + 184 KB = 1.36 MB (antes 2.39 MB).
   `js/hero-videos.js` elige `data-src-m` en celular y `data-src` en
   escritorio al momento de cargar cada clip.
2. **`poster-1.jpg` precargado** con `fetchpriority="high"` en el `<head>`.
3. **Clip 1 sin `src` en el HTML** (pasó a `data-src` como los demás): con
   movimiento reducido o ahorro de datos ya no se descarga ningún video.
   `js/loader.js` sigue funcionando igual (espera el `loadeddata` del clip 1,
   o el poster con movimiento reducido).
4. **Borrados** `js/hero-ring.js` y `assets/hero-anillo.mp4` (1.5 MB) con
   `git rm`, después de comprobar que nada más los referenciaba.
5. **`@keyframes fadeIn`** sigue en `estilos.css` (línea 1196, la usa
   `.cta-row`): nada que hacer.

Verificado en headless con el registro de red: escritorio descarga los 4
clips completos y los reproduce; celular descarga solo versiones `-m` (a los
8 s: clips 1-3, el 4 todavía no); movimiento reducido descarga solo los 4
posters, ningún video. Loader liberado, catálogo con 364 piezas, sin errores
de consola en los tres casos.

**Videos de `Instagram Silver Cow Ambato/imagenes/MK`:** 19 `.MOV` HEVC
1920×1080 con rotación por metadata (±90°). Los clips 2 y 3 del hero salen
de `IMG_6475` e `IMG_6474`, que incluso rotados como los muestra el celular
son tomas de las modelos recostadas sobre el capó: no es un error de
rotación. Sobre columnas: los clips son 9:16; en 1440×810, 4 columnas
(360×810) recortan ~21% de los costados de cada video y 3 columnas (480×810)
solo ~5% — 3 columnas encaja mejor.

## Prueba: 3 columnas con clips de joyas (elegida, ver cierre)
El dueño pidió probarlo ("si no me gusta lo dejamos como está"), sin subir
nada hasta que él lo diga.
- **Copia exacta de la versión de 4 columnas** antes de tocar nada:
  `backups/hero-4columnas-2026-11-10/` (`index.html`, `estilos.css`,
  `js/hero-videos.js` y los 12 archivos de `assets/hero/`). `backups/` no se
  publica (no está en `pages.yml`), pero tampoco está en `.gitignore`: **sacar
  esa carpeta antes de cualquier commit** (pesa ~4 MB).
- Clips nuevos, tomados de `Instagram Silver Cow Ambato/imagenes/MK` (HEVC
  con rotación por metadata; `ffmpeg` la aplica al convertir), elegidos
  revisando un cuadro cada 1.5 s de cada video:
  1. `IMG_7450` 0–6.5 s — cadena con cruz de cerca y pulseras.
  2. `IMG_6442` 1–7.5 s — blusa celeste de frente, mano en el collar.
  3. `IMG_6454` 0.5–6.5 s — pulsera en primer plano.
  Descartados: `IMG_8457` (reel ya editado, termina con el logo),
  `IMG_7445` (la cámara se da vuelta desde el segundo 3).
  Formato igual que antes: 720×1280 (escritorio, CRF 26-30) y 540×960
  (celular, CRF 31-34), H.264, 30 fps, sin audio, `faststart`; posters
  432×768. Pesos: escritorio 2.67 MB los 3 (columnas más anchas), celular
  1.00 MB (antes 1.36).
- `estilos.css`: `.hero-reel` → `repeat(3, 1fr)`. `index.html`: sin el 4.º
  clip. `js/hero-videos.js` ya funcionaba con cualquier cantidad de clips.
- Verificado headless: escritorio 3 columnas de 478 px reproduciendo; celular
  solo versiones `-m` rotando; movimiento reducido solo posters. Catálogo con
  364 piezas, sin errores de consola.
- **Para volver a las 4 columnas** (si el dueño prefiere la versión anterior):
  ```
  B=backups/hero-4columnas-2026-11-10
  cp $B/index.html $B/estilos.css . && cp $B/js/hero-videos.js js/
  rm assets/hero/* && cp $B/assets/hero/* assets/hero/
  ```
  y después borrar `backups/hero-4columnas-2026-11-10/`.

### Cambio de clips (3 columnas, segunda versión)

A pedido del dueño: IMG_6454 → IMG_6474, IMG_7450 al centro, IMG_6442 → IMG_6475.

| Columna | Archivo | Fuente | Tramo | Escritorio | Celular |
|---|---|---|---|---|---|
| 1 (izq.) | `clip-1` | IMG_6475 (blusa celeste, pulsera en primer plano) | 7.8–14.3 s | 703 KB | 303 KB |
| 2 (centro) | `clip-2` | IMG_7450 (cadena con cruz, pulseras) | 0–6.5 s | 839 KB | 359 KB |
| 3 (der.) | `clip-3` | IMG_6474 (lentes, cadena con cruz) | 0–6.5 s | 703 KB | 305 KB |

Misma codificación (crf 28 escritorio, 32 celular, posters 432×768). Se eligió el tramo
de IMG_6475 donde la pulsera se ve de cerca. 6475 y 6474 son tomas cenitales sobre el
capó: la modelo aparece de costado, a propósito. Prueba headless: escritorio con 3 columnas de 478px
reproduciéndose, celular rota con los `-m`, movimiento reducido descarga solo posters, sin
errores de consola, catálogo con 364 piezas.

## Cierre
- El dueño aprobó la versión de 3 columnas ("está perfecto") y pidió documentar y subir.
- Se quitó `backups/hero-4columnas-2026-11-10/` del repo antes del commit (movida fuera
  del repo; nunca se commiteó). Los comandos de vuelta a 4 columnas de arriba ya no aplican.
- Publicado en un solo commit: 013 (loader) + 014 (hero con video) + docs.
- QA del dueño en iPhone real (autoplay, Modo de bajo consumo, `-webkit-mask`, `100svh`): OK.
  Features 013 y 014 cerradas.
