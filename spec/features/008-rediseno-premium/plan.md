# Plan técnico: Rediseño premium

## Principios
1. **Vanilla, sin build.** Solo HTML/CSS/JS ES6 (IIFE). Nada entra a `_site/` salvo por la whitelist de `pages.yml` (`index.html`, `estilos.css`, `reactbits.css`, `catalogo*.js`, `js/`, `assets/`, imágenes).
2. **No romper el contrato** del motor: nombres de contenedores, clases de categoría, funciones globales, claves `localStorage`, cache-bust `?v=N`.
3. **Aprobación por fase.** Local → visto bueno del propietario → git.
4. **Efectos con salida elegante**: fallback sin WebGL/JS y respeto de `prefers-reduced-motion`.

## Fases

### Fase 0 — Fundación (tokens + tipografía)
- Ampliar `:root` en `estilos.css`: escala tipográfica fluida (`--fs-*`), ritmo vertical (`--sp-*`), radios, color de línea, oro suave.
- Unificar tratamiento de títulos de sección (serif + acento).
- Sin cambios estructurales. Bajo riesgo.

### Fase 1 — Estructura y secciones
- Navbar: buscador inline + orden de links.
- Insertar bajo el hero: fila de confianza (3) y marquee de materiales (4).
- Reordenar/limpiar secciones hacia el esquema de 13.
- Reutilizar `.reveal` (observer genérico en `index.html:927-940`).

### Fase 2 — Ports reactbits (curado)
- Nuevos `js/`: `scroll-reveal.js`, `shiny-text.js`, `spotlight-card.js`, `infinite-scroll.js`, `carousel.js`, `animated-content.js` (según necesidad real).
- Estilos en `reactbits.css`.
- Cada uno: `prefers-reduced-motion` + fallback.

### Fase 3 — Catálogo UX (motor)
- `catalogo_motor.js`: buscador client-side, toggle grid/lista, quick-view.
- Mantener orden disponibles→pedido→agotados y extracción de código.
- CSS de estados grid/lista y modal quick-view.

### Fase 4 — Prueba social y comunidad
- Testimonios (placeholder) + galería Instagram (placeholder/links reales).
- Marquee/carrusel reutilizando Fase 2.

### Fase 5 — Responsive, a11y, performance
- Breakpoints 360/768/1024/1440, foco visible, `aria-*`, reducción de canvases/rAF, medición Lighthouse.

## Riesgos y mitigación
- **Romper el motor** → cambios incrementales + smoke test por fase.
- **Caída de fluidez** → limitar efectos por viewport; pausa con IntersectionObserver.
- **Sin datos reales (IG/reseñas)** → placeholders marcados.
- **Deploy accidental** → nada se empuja sin "visto bueno"; `backups/` gitignored.

## Verificación por fase
`python3 -m http.server 8123` + Playwright: carga del catálogo, 7 categorías, carrito, consola limpia, captura desktop y móvil.
