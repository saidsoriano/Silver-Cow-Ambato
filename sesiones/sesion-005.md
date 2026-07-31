# Sesión 005 — MagicBento (ReactBits port)

**Fecha:** 2026-07-31
**Objetivo:** Portar MagicBento (grid bento con partículas, spotlight, border-glow, tilt, magnetismo y ripple) a `#filosofia` y `#catalogo`.

## Contexto
- Tras el aborto de CardNav/StaggeredMenu (sesión 004), el único componente pendiente de la feature 006 era MagicBento.
- El sitio quedó sin GSAP (se removió en el revert). MagicBento se portó 100% vanilla: cero dependencias externas.
- Discrepancia con la spec: `#filosofia` tiene 3 pilares, no 6. El dueño decidió: **usar los 3 pilares actuales** (1 destacada + 2 normales), sin inventar contenido.

## Decisiones del dueño
1. `#filosofia`: 3 pilares actuales en grid bento (featured 2×2 con partículas + 2 normales).
2. `#catalogo`: 7 tiles bento con foto de producto representativo de cada categoría + nombre.

## Implementación
- `index.html`:
  - `#catFiltros` (7 botones) → `.magic-bento.catalogo-bento` con 7 `.mb-tile.cat-btn` (foto + overlay + número + nombre). Se conserva la clase `.cat-btn` y los `onclick` → **cero cambios en `catalogo_motor.js`** (contrato de 'active' intacto).
  - `.pilares-grid` (3 `.pilar`) → `.magic-bento.filosofia-bento` con 3 `.mb-card`; la primera `.mb-featured` lleva `<canvas class="mb-particles">`.
  - `<script src="js/magic-bento.js" defer>` al final del body.
- `reactbits.css`: sección MagicBento (grids responsive, spotlight `--mx/--my`, border-glow con mask, ripple, tiles con imagen, active state, móvil <768px sin efectos, prefers-reduced-motion).
- `estilos.css`: eliminado CSS muerto (`.pilares-grid`, `.pilar*`, `.cat-filters`, `.cat-btn` viejos + sus media queries) — el bento vive en `reactbits.css`.
- `js/magic-bento.js` (vanilla, sin GSAP):
  - Ripple al clic (todas las pantallas).
  - Spotlight + border-glow via CSS vars.
  - Tilt (7°) + magnetismo (6px) con rAF lerp.
  - Partículas canvas en la featured (líneas doradas + puntos plata + atracción al cursor, pausa con IntersectionObserver).
  - Guards: `prefers-reduced-motion` o `<768px` o `pointer:coarse` → solo ripple.

## QA (Playwright, localhost:8000)
- Desktop 1360×900: 7 tiles (grid 4 col, primero span 2, active=Pulseras), 3 cards (featured span 2 en grid 3 col, canvas dimensionado), hover → `perspective(900px) rotateX(1.36deg) rotateY(1.33deg) translate3d(1.2px,-1.2px,0px)` + `--mx/--my` seteados, clic en tile "Aretes" → carga 5 productos, título y active correctos, ripple visible. Cero errores de consola.
- Móvil 390×844: grid 1 col (filosofia) / 2 col (catálogo), sin errores, ripple activo.
- Screenshots: `/tmp/opencode/pwtest/mb-filosofia.png`, `mb-catalogo.png`, `mb-tile-hover.png` (revisión visual pendiente del dueño).
- Nota: con `scroll-behavior: smooth` los scrollIntoView de Playwright necesitan >1.5s de espera.

## Pendiente
- Revisión visual del dueño (screenshots o navegador en localhost:8000).
- git add/commit/push SOLO tras confirmación del dueño.
