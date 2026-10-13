# Especificación: Rediseño premium (Fase de estudio de diseño)

## Historia de usuario
> Como propietario de Silver Cow Ambato, quiero que el sitio se sienta como una casa de joyería de lujo —elegante, sobria, exclusiva— con descubrimiento de producto ágil, para transmitir valor y aumentar las consultas por WhatsApp, sin romper el flujo "solo Google Sheets".

## Descripción
Rediseño integral del front-end (`index.html`, `estilos.css`, `reactbits.css`, nuevos módulos en `js/`), manteniendo el stack **vanilla sin build** y el contrato del motor de datos/render. Se toma *layout e interacción* de las referencias del usuario (NiceShop, dark-minimal, MiniStore, reactbits.dev) — **nunca su código**.

Decisiones cerradas con el propietario:
- Paleta **zafiro + plata + oro**, solo refinando proporciones/contraste.
- `catalogo_motor.js` **se amplía con cuidado** (ya no "intocable") para habilitar buscador, vista grid/lista y quick-view, respetando su contrato.
- Se **descarta a propósito**: blog, newsletter, countdown/flash sale, % de descuento, checkout/login.
- Testimonios con **placeholder** hasta recibir reseñas reales.
- Panel admin/login queda **fuera de alcance** (roadmap interno, "Próximamente").

## Criterios de aceptación

### A — Fundación visual
- [ ] Tokens de diseño ampliados en `:root` (escala tipográfica fluida, ritmo vertical, radios, líneas) sin eliminar los existentes
- [ ] Tipografía jerarquizada y consistente; títulos con tratamiento premium (serif + acento oro sutil)
- [ ] Contraste AA en textos sobre fondos oscuros y sobre ColorBends

### B — Estructura de secciones (13)
- [ ] 1 navbar sticky con categorías + buscador + carrito
- [ ] 2 hero minimal (ColorBends + BlurText)
- [ ] 3 fila de confianza (plata 925 / garantía / envío / pago / WhatsApp)
- [ ] 4 marquee de materiales
- [ ] 5 categorías (tiles) — **conserva** `.cat-btn` + `.active`
- [ ] 6 catálogo con buscador + vista grid/lista + quick-view
- [ ] 7 carrusel de destacados
- [ ] 8 testimonios (placeholder)
- [ ] 9 proceso/pilares
- [ ] 10 filosofía
- [ ] 11 galería Instagram
- [ ] 12 contacto → WhatsApp
- [ ] 13 footer con columnas

### C — Catálogo (motor)
- [ ] Buscador client-side filtra por nombre/código/categoría
- [ ] Toggle grid/lista funcional
- [ ] Quick-view de producto (modal) con datos reales de la tarjeta
- [ ] **No** se rompe: `#catalogoContenedor`, `.cat-btn`/`.active`, `seccion-{cat}`, `grid-{cat}`, `vermas-{cat}`, `crearTarjeta()`, `agregarAlCarrito()`, claves de `localStorage`, cache-bust `?v=N` (`catalogo.js:6`)

### D — Ports reactbits (vanilla, curado)
- [ ] ScrollReveal/SplitText, ShinyText/GradientText, SpotlightCard/TiltCard, InfiniteScroll, Carousel, AnimatedContent
- [ ] Cada efecto respeta `prefers-reduced-motion` y tiene fallback sin JS/WebGL
- [ ] Sin degradar fluidez (máx. razonable de canvases/rAF simultáneos)

### E — Contenido y tono
- [ ] Copys en tono luxury: sin "oferta", "descuento", "buy now"
- [ ] Precio siempre visible; CTA principal a WhatsApp

### F — Responsive, a11y y rendimiento
- [ ] Correcto en 360 / 768 / 1024 / 1440 px
- [ ] Navegación por teclado y foco visible; `aria-*` en controles nuevos
- [ ] Sin errores de consola nuevos; Lighthouse sin regresiones graves

### G — Proceso y verificación
- [ ] Cada fase mostrada en local al propietario; **commit/push solo con su visto bueno**
- [ ] Smoke test Playwright por fase (catálogo carga, 7 categorías, carrito, consola limpia)
- [ ] `sesiones/` actualizado; roadmap con 009 = admin "Próximamente"

## Fuera de alcance
- Panel admin/login, migración del catálogo fuera de Sheets, backend
- Framework, bundler, build, `package.json`
- Publicar el nuevo código sin la aprobación explícita del propietario

## Dependencias
- Backup previo: `backups/backup_pre_rediseno_2026-10-12.zip`
- Google Sheets + Apps Script operativos (datos vivos)
- Playwright MCP + Chromium; `python3 -m http.server 8123` para QA local
- Galería Instagram y testimonios: datos reales pendientes del propietario (no bloquean)
