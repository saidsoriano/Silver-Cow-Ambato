# Especificación: Hero con video de fondo

Cambio preparado y probado por el dueño fuera del repo (sesión 040) e
integrado por Claude Code el 2026-11-10.

## Qué hace
Reemplaza el anillo 3D / video del anillo del hero por video de fondo con
los clips de la marca.
- Escritorio (≥ 821 px): 3 columnas de video reproduciéndose a la vez
  (versión final elegida por el dueño; la primera tenía 4).
- Celular: un clip a pantalla completa que cambia cada 5.5 s con fundido;
  solo descarga el siguiente.
- Pausa fuera de pantalla o con la pestaña oculta. Con movimiento reducido
  o ahorro de datos: solo el poster.
- En el hero quedan solo el h1 ("No es una joya. / Es tu distinción / hecha
  plata.") y los botones "Iniciar una adquisición" y "Ver catálogo".

## Se quitó del hero
Canvas 3D, video del anillo, rejilla, subtítulo, chips de vistas,
"Explorar" y los `<script>` de Three.js y `hero-ring.js`.

## Optimizaciones aplicadas (2026-11-10, a pedido del dueño)
- Versión liviana para celular de cada clip (`clip-N-m.mp4`, 540×960,
  H.264 CRF 30-33): 1.36 MB los 4 contra 2.39 MB. `js/hero-videos.js` elige
  `data-src` (escritorio ≥ 821 px) o `data-src-m` (celular) al cargar.
- Ningún clip trae `src` en el HTML (antes el clip 1 sí): con movimiento
  reducido o ahorro de datos no se descarga ningún video, solo los posters.
- `<link rel="preload" as="image" fetchpriority="high">` de `poster-1.jpg`.
- Borrados `js/hero-ring.js` y `assets/hero-anillo.mp4` (1.5 MB) con
  `git rm`: quedan recuperables desde el historial.
- `@keyframes fadeIn` (fuera del bloque hero, la usa `.cta-row`): sigue.

## Archivos
`js/hero-videos.js`, `assets/hero/clip-1..4.mp4` (720×1280, H.264, sin
audio, 2.4 MB en total), `assets/hero/clip-1..4-m.mp4` (540×960, 1.36 MB),
`assets/hero/poster-1..4.jpg`, bloque HERO de
`estilos.css`, `<section id="hero">` de `index.html`.

## Versión final: 3 columnas con clips de joyas (2026-11-10)
Clips de `Instagram Silver Cow Ambato/imagenes/MK`, 6.5 s cada uno:

| Columna | Archivo | Fuente | Tramo |
|---|---|---|---|
| Izquierda | `clip-1` | IMG_6475 (blusa celeste, pulsera de cerca) | 7.8–14.3 s |
| Centro | `clip-2` | IMG_7450 (cadena con cruz, pulseras) | 0–6.5 s |
| Derecha | `clip-3` | IMG_6474 (lentes, cadena con cruz) | 0–6.5 s |

- `.hero-reel` en `estilos.css`: `grid-template-columns: repeat(3, 1fr)`.
- Codificación: H.264 main, yuv420p, 30 fps, sin audio, `faststart`;
  escritorio 720×1280 CRF 28 (2.2 MB los 3), celular 540×960 CRF 32
  (0.95 MB los 3); posters 432×768.
- IMG_6475 e IMG_6474 son tomas cenitales sobre el capó: la modelo se ve de
  costado, a propósito.
- La versión de 4 columnas nunca se commiteó ni publicó; queda descrita en
  `sesiones/sesion-040.md`.
