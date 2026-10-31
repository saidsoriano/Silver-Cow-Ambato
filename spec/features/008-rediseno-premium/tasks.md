# Tareas: Rediseño premium

> **Verificado el 2026-10-30 (sesión 014) contra el código publicado** (commit
> `2ddbbb4`). Se tachó solo lo que se pudo comprobar en `index.html`, `estilos.css`,
> `reactbits.css`, `catalogo_motor.js` y `js/`. Lo que sigue sin tachar es **lo que
> falta hacer**, no un olvido. Hecho: 14 de 26.

## Fase 0 — Fundación (tokens + tipografía)
- [x] `:root` ampliado: `--fs-*`, `--sp-*`, `--radius*`, `--line`, `--line-gold`, `--gold-soft`, `--surface*`
- [x] Tratamiento unificado de títulos de sección — `.section-title` + `.section-label`
- [x] Smoke test: página carga igual, consola limpia — 7 categorías, 13 tarjetas, 0 errores

## Fase 1 — Estructura y secciones
- [ ] Navbar con buscador inline — **sin empezar**
- [x] Fila de confianza bajo el hero (3)
- [x] Marquee de materiales (4)
- [ ] Esquema de 13 secciones ordenado — **hay 8 de 13**: hero, confianza, destacados, catálogo, nosotros, filosofía, proceso, contacto. Faltan las de las Fases 3-4

## Fase 2 — Ports reactbits
- [ ] `scroll-reveal.js` / `animated-content.js` — **ninguno de los dos existe**
- [x] `shiny-text.js` (títulos/acentos) — resuelto solo con CSS (`.shiny-text`), sin archivo JS
- [x] `spotlight-card.js` / tilt de tarjetas de producto
- [x] `infinite-scroll.js` (marquee) — resuelto solo con CSS (`@keyframes marqueeScroll`), sin archivo JS
- [x] `carousel.js` (destacados)
- [x] Estilos en `reactbits.css`

## Fase 3 — Catálogo UX (motor)
- [ ] Buscador client-side (nombre/código/categoría) — **sin empezar**
- [ ] Toggle grid/lista — **sin empezar**
- [ ] Quick-view de producto (modal) — **sin empezar**
- [x] Contrato del motor intacto — verificados `catalogoContenedor`, `.cat-btn`, `crearTarjeta()`, `agregarAlCarrito()`, `toggleMenu()`, `cerrarMenu()`, `abrirCarrito()`, `.zoom-lens`

## Fase 4 — Prueba social y comunidad
- [ ] Testimonios (placeholder) — **sin empezar**
- [ ] Galería Instagram (placeholder) — **sin empezar**

## Fase 5 — Responsive, a11y, performance
- [ ] Breakpoints 360/768/1024/1440 — **no son los pactados**: hoy hay 420/500/560/640/820/860/900/1100
- [ ] Foco visible + `aria-*` — **a medias**: 12 atributos `aria-*` puestos, pero **0 reglas `:focus-visible`**, así que no hay foco visible para teclado
- [ ] Poda de efectos / medición Lighthouse — **sin evidencia de que se haya medido**
- [ ] Smoke test final (desktop + móvil) — pendiente; sigue siendo **manual** (no hay Playwright, ver `AGENTS.md`)

## Cierre
- [x] `sesiones/sesion-011.md` escrito
- [x] Roadmap: admin registrado como pendiente — renumerado a `010-vista-admin` en la sesión 013
- [x] **Visto bueno del propietario → commit/push** — publicado en `2ddbbb4` el 2026-10-13
