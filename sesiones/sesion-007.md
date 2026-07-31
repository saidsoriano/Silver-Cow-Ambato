# Sesión 007 — BlurText (ReactBits port)

**Fecha:** 2026-07-31
**Objetivo:** Animar el título del hero ("No es una joya. / Es tu distinción / hecha plata.") con el efecto BlurText de ReactBits, portado a vanilla JS.

## Contexto
- El dueño pidió texto animado para el título del hero, indicando exactamente el diseño: https://reactbits.dev/text-animations/blur-text
- Decisión del dueño: el `<em>` ("Es tu distinción") entra como **UNA unidad** para preservar el degradado continuo; ritmo **pausado (delay 200ms)**.

## Componente fuente
- BlurText de ReactBits: cada palabra empieza `blur(10px)` + opacidad 0 + `translateY(-50px)` y resuelve a nítida con paso intermedio (opacidad .5, blur 5px, Y 5px), stagger por índice, disparado por `IntersectionObserver` (threshold 0.1).
- Extraído el source real (versión CSS-transitions) para replicar keyframes y easing `cubic-bezier(.25,.1,.25,1)`.

## Implementación
- `js/blur-text.js` (NUEVO, vanilla puro):
  - `CONFIG`: direction 'top', delay 200ms, startDelay 400ms (coordina con el eyebrow), duration 800ms, threshold 0.1, easing.
  - Procesa `[data-blur-text]`: nodos de texto → palabras en `<span class="blur-text-element">`; `<em>` → unidad completa (wrap con replaceChild para mantener orden); `<br>` se conserva.
  - Estilos inline de estado inicial + `animation: blur-text-in ... both` con delay por índice.
  - `IntersectionObserver` añade `.animate-in`; fallback si no hay IO: anima directo.
  - `prefers-reduced-motion` → sin split, título visible directo.
- `estilos.css`:
  - `.hero-title`: quitado `opacity:0` + `fadeUp` (ahora lo anima BlurText).
  - Anti-flash: `.hero-title[data-blur-text]:not(.blur-ready){opacity:0}`.
  - `.blur-text-element` (inline-block, will-change) + `@keyframes blur-text-in` (3 pasos fiel al original) + bloque reduced-motion.
- `index.html`: `data-blur-text` en el h1 + `<script src="js/blur-text.js" defer>`.

## Bugs corregidos en QA
- Primera versión usaba `insertBefore(span, null)` → las palabras del primer text node se añadían AL FINAL del h1, rompiendo el orden ("Es tu distinción" aparecía primero). Fix: `replaceChild(frag, node)` mantiene el orden original.
- Palabras pegadas ("Noesunajoya."): los spans `inline-block` no tenían espacio entre ellos. Fix: `\u00A0` (nbsp) entre palabras, como hace el componente ReactBits original.

## QA (Playwright, localhost:8000)
- Desktop y móvil: 7 unidades en orden correcto (No/es/una/joya. / em / hecha/plata.), 2 `<br>` conservados.
- A los 300ms: primera palabra en el paso 50% del keyframe (opacity .5, blur 5px, Y 5px, delay 0.4s) → animación corriendo.
- A los 3.7s: todas las unidades resueltas (opacity 1, blur 0), degradado del em intacto, 0 errores de consola.
- Reduced-motion: título visible sin animación (sin spans), h1 opacity 1.

## Pendiente
- Validación visual del dueño en `http://localhost:8000` (ajustar delay/duration si quiere más rápido/lento).
- git add/commit/push (bloqueado hasta confirmación explícita).
