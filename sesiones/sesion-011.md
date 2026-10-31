# Sesión 011 — 008-rediseno-premium: rediseño premium (en curso)

**Fecha:** 2026-10-12
**Estado:** Cerrada — publicada el 2026-10-13 en el commit `2ddbbb4`.

> **Corrección (sesión 014, 2026-10-30):** el cuerpo de esta nota se escribió
> mientras el trabajo todavía era local, y por eso dice en varios sitios que nada
> estaba commiteado. Quedó desactualizada: el propietario dio el visto bueno y todo
> se publicó en `2ddbbb4`, commit que incluye también este mismo archivo. Se deja el
> texto original como registro de cómo estaban las cosas ese día; lo que vale hoy es
> esta corrección.

**Objetivo:** Ejecutar el rediseño premium del sitio Silver Cow Ambato por fases, en
vanilla (sin build), iterando con el propietario y **mostrando cada cambio en localhost**
antes de aprobar. Preservar el motor de datos/render y la operación "solo Google Sheets".

> Esta sesión documenta **todo lo hecho hasta ahora** en el rediseño (feature
> `008-rediseno-premium`): lo que se completó, **lo que el propietario aprobó** y
> **lo que falló o se revirtió**. Es una sesión de documentación pausada a pedido:
> no se implementa nada nuevo aquí.

---

## Contexto de arranque

- Directorio de trabajo: `/home/said/Silver Cow Ambato` (bóveda Obsidian, solo consulta);
  el sitio real vive en `Paguina_joyas/` (repo git). **Build mode activo.**
- Producción: `https://saidsoriano.github.io/Silver-Cow-Ambato/` (deploy por GitHub Actions).
- Stack: HTML5 + CSS3 + JS ES6 vanilla (IIFE), **sin framework / bundler / build / package.json**.
- Datos: Google Sheets (7 pestañas) → Apps Script → JSON por HTTP; caché en `localStorage`
  bajo `silvercow_catalogo`. **357 productos**, 7 categorías (aretes 91, anillos 81, dijes 41,
  pulseras 39, cadenas 39, juegos 36, cadenas_dijes 30). Estado: **335 pedido / 14 disponible /
  8 agotado**.
- **REGLAS DE ORO vigentes (directivas explícitas del propietario):**
  1. Nada se sube a git sin **"visto bueno"**. Flujo: local (`python3 -m http.server 8123`)
     → mostrar → aprobar → commit/push.
  2. Tras **cada cambio pedido o realizado, mostrar siempre el resultado en localhost**.
- Antes de empezar se hizo backup: `backups/backup_pre_rediseno_2026-10-12.zip` (604 KB, 79
  archivos; `backups/` gitignored). `git status` limpio; `main` al día con `origin/main`
  (último commit `49045b2`).

---

## Temas cubiertos

### A. Requerimientos y planificación
- Ronda de requerimientos cerrada con el propietario; se evaluó factibilidad de un panel
  admin y se revisaron 3 referencias web (entre ellas el carrusel Odoo).
- **Plan final aprobado** y volcado en la spec `spec/features/008-rediseno-premium/`:
  `spec.md`, `plan.md`, `tasks.md`.
- **Esquema de 13 secciones decidido:** 1 navbar sticky · 2 hero minimal · 3 fila de
  confianza · 4 marquee de materiales · 5 categorías (tiles) · 6 catálogo con buscador +
  grid/lista + quick-view · 7 carrusel de destacados · 8 testimonios · 9 proceso/pilares ·
  10 filosofía · 11 galería Instagram · 12 contacto→WhatsApp · 13 footer.
- **Fases:** 0 tokens/tipografía → 1 estructura/secciones (incl. navbar) → 2 ports reactbits
  → 3 catálogo UX (motor) → 4 testimonios+marquee+galería → 5 responsive/a11y/perf.

### B. Fase 0 — Fundación (tokens + tipografía)
- Tokens **aditivos** añadidos al `:root` de `estilos.css` (no se tocaron los originales):
  `--gold-soft`, `--line`, `--line-gold`, `--surface`, `--surface-2`, `--fs-eyebrow`,
  `--fs-body`, `--fs-h2`, `--fs-h3`, `--track-wide`, `--sp-section`, `--sp-gutter`,
  `--radius`, `--radius-lg`.
- Paleta conservada: zafiro + plata + oro (`--gold-accent #C9A84C`); tipografías
  Montserrat (body) + Cormorant Garamond (títulos). `prefers-reduced-motion` respetado.

### C. Fase 1 — Fila de confianza + marquee de materiales (parcial)
- `<section id="confianza" class="trust-row">` (3 trust-items: Plata Ley 925 / Envío seguro /
  Atención directa; grid 3→2 columnas en móvil), colocado entre el hero y `#catalogo`.
- Marquee de materiales: `.marquee-track` > 2× `.marquee-group`, cada grupo repite 5 ítems
  ×4, `animation: marqueeScroll 100s linear infinite` (100 s). Verificado: `marquee-group`=2,
  `Plata Ley 925`=8.
- **Navbar (Fase 1) NO iniciada** — pendiente (links de categorías + carrito; el buscador
  pertenece a Fase 3).

### D. Fase 2 — Ports reactbits (parcial)
- **ShinyText (solo CSS) — HECHO:** bloque `.shiny-text` + override `.section-label.shiny-text`
  + `@keyframes shinySweep` al final de `estilos.css`; el eyebrow del hero envuelto en
  `<span class="shiny-text">` y 4 `.section-label shiny-text` (líneas 245/353/381/427).
  Verificado: `shiny-text`=5, `class="section-label shiny-text"`=4. Reduced-motion lo congela.
- **Spotlight + Tilt de tarjetas (solo desktop) — HECHO:** `reactbits.css` añade
  `.joya-card{transform-style:preserve-3d}`, `:hover{will-change:transform}`, `::before`
  (radial dorado `300px circle at var(--mx,50%) var(--my,50%)`, `z-index:2`) y
  `:hover::before{opacity:1}`; reduced-motion oculta el `::before`. `js/spotlight-card.js`
  (nuevo): delegación `pointermove`/`pointerleave`/`scroll`, `--mx`/`--my`, tilt
  `perspective(900px) rotateX/Y` (MAX_TILT=3) + `translateY(-4px)`, rAF throttle, solo
  `(hover:hover) and (pointer:fine)` sin reduced-motion. Script añadido en `index.html` (1080).
- **Contraste del hero — HECHO:** `.hero-scrim` reforzado (`reactbits.css` 291), canvas de
  color-bends a `opacity:.6` (281), halos oscuros en `.hero-eyebrow` (578), `.hero-title`
  (592) y `.hero-subtitle` (633), `.btn-ghost` (678).
- **`js/color-bends.js`:** `intensity` subido a `1.0` (línea 26), verificado por curl.
- **Carrusel de destacados — base creada, luego reescrito (ver Fallos):**
  `js/carousel.js` (IIFE; `ORDEN`/`MAX=8`/`POR_CAT=2`/`MIN=5`; `esperarDatos()`, `firmaDe()`,
  `seleccionar()` en 2 pasadas, `pintar()` que reutiliza `crearTarjeta(p)`, flechas
  `.carousel-prev`/`.carousel-next`, `limitarFlechas()`). Sección `#destacados` (index.html
  320-334) y su CSS en `reactbits.css` (bloque 325+). Card `clamp(148px,15vw,176px)`
  escritorio / `clamp(128px,38vw,152px)` móvil; contenido interno compacto; `.joya-desc`
  oculto; `gap` 16px/12px.
- **Pendientes Fase 2:** `scroll-reveal.js`/`SplitText`, `animated-content.js`, `GradientText`.

### E. Análisis de la referencia Odoo (corrige una suposición errada)
- Referencia del propietario: `https://italsteeldistribuidora.odoo.com/shop/category/plata-2`,
  bloque **"Nuevos Ingresos"**. HTML+JS guardado en
  `/home/said/.local/share/opencode/tool-output/tool_1337b95420010D5UHX9Ec0D1Wt`.
- **La suposición previa quedó descartada:** NO es un marquee continuo; es un **carrusel de
  pasos discretos** (`.isd-product-carousel-section`): header "🔥 Nuevos Ingresos" +
  subtítulo; **2 tarjetas por slide en escritorio, 1 en móvil**; **dots** de navegación;
  **auto-avance cada 2 s** (`SLIDE_INTERVAL = 2000`) con scroll suave; "VER TODO" al pie;
  tarjetas con imagen cuadrada, nombre en mayúsculas (clamp 2 líneas), precio y badge "Nuevo".
- JS de referencia: `renderCarousel(products)` agrupa en pares (`i += 2`,
  `products.slice(i, i+2)`), `totalSlides = slides.length`, genera `.isd-pc-slide` >
  `.isd-pc-card` y los dots en `#isd-pc-dots`.

### F. Definición final del contrato (lo que NO se rompe)
- IDs/clases: `#catalogoContenedor`, `.cat-btn`+`.active`, `seccion-{cat}`, `grid-{cat}`,
  `vermas-{cat}`, `crearTarjeta()`, `agregarAlCarrito()`, zoom `.joya-*`/`.zoom-lens`,
  claves de `localStorage`, cache-bust `?v=N` (`catalogo.js:6`).
- **No romper** `toggleMenu()`, `cerrarMenu()`, `abrirCarrito()` ni sus IDs
  (`hamburger`, `mobileMenu`, `navbar`).

---

## Lo que el propietario APROBÓ

| # | Cambio | Estado |
|---|--------|--------|
| 1 | **Plan final del rediseño** (13 secciones, 5 fases, vanilla) | Aprobado |
| 2 | **Fase 0 — tokens aditivos en `:root`** | Aplicado |
| 3 | **Fila de confianza** (`#confianza` / `.trust-row`, 3 ítems) | **Aprobado** |
| 4 | **Marquee de materiales** (auto-scroll 100 s) | **Aprobado** |
| 5 | **ShinyText** en eyebrow + 4 section-labels | **Aprobado** |
| 6 | **Contraste del hero** (scrim + canvas .6 + halos + btn-ghost) | **Aprobado** |
| 7 | **Spotlight + Tilt** de tarjetas (008, a conservar) | Aplicado y verificado |

> "Aprobado" = el propietario vio el resultado en localhost y dio visto bueno a ese bloque.

---

## Lo que FALLÓ / se revirtió / resultó errado

1. **Playwright MCP no disponible.** `AGENTS.md` lo declara activo ("QA visual, screenshots,
   smoke test"), pero **no está en el toolset actual**. Consecuencia: **no hay verificación
   visual automatizada**; en esta sesión se verificó de forma **estructural** con `curl` +
   `grep` (conteo de clases, líneas, `node --check`). El propietario abre el navegador a mano.
   → **Deuda:** la verificación visual y el smoke test de la Fase 5 quedan manuales por ahora.

2. **MCP `github` deshabilitado.** Venía de la sesión 010: el PAT estaba revocado
   (`401 Bad credentials`), por eso `opencode.json` lo tiene en `"enabled": false`. En esta
   sesión se usa `gh` CLI (que sí está autenticado) — y de todos modos nada se ha pusheado.

3. **Primera interpretación ERRADA del carrusel.** Se implementó como **auto-scroll continuo**
   (`VEL_AUTO=0.5` px/frame vía rAF). La referencia real Odoo es **pasos discretos**.
   → Corregido: ver punto 4.

4. **Reversión del propietario sobre el carrusel de destacados.** Primero pidió **eliminar**
   la sección; luego **revirtió** y decidió **rehacerla** tomando como referencia "Nuevos
   Ingresos" de Odoo. La sección se mantiene (no se borra).

5. **Carrusel reescrito a pasos discretos (recién, sin revisar).** `js/carousel.js` pasa de
   rAF continuo a `setInterval(autoPaso, 4000)` ("poco a poco"): avanza **una tarjeta cada
   4 s** con scroll suave, **vuelve al inicio** al llegar al final, **pausa** con
   puntero/foco/toque encima y respeta `prefers-reduced-motion`. `node --check` OK; servido
   en localhost. **Pendiente:** el propietario aún NO ha visto/aprobado este reescrito, y
   quedó **sin los dots** y **sin** los elementos "baratos" del Odoo (badge "Nuevo",
   "VER TODO", 🔥) por chocar con la misión luxury.

6. **Ruido de infraestructura (menor).** El servidor local no sobrevive con `nohup … &`;
   hubo que usar `setsid`. Recordatorio operativo: abrir con
   `setsid xdg-open http://127.0.0.1:8123/index.html` y **Ctrl+Shift+R** para saltar caché.

---

## Decisiones clave

| Decisión | Opción tomada | Alternativa |
|---|---|---|
| Ruta técnica | Rediseño vanilla sin build | Framework/bundler |
| Paleta | Mantener zafiro + plata + oro (solo refinar) | Cambiar identidad |
| Motor `catalogo_motor.js` | Ampliar con cuidado (Fase 3) | Rehacerlo |
| Carrusel de destacados | **Rehacer** estilo "Nuevos Ingresos" | Eliminarlo (descartado) |
| Auto-avance del carrusel | Pasos discretos lentos (4 s) + wrap | Scroll continuo (descartado) |
| Dots / badge / "VER TODO" | **No** añadirlos (chocan con luxury); a decidir | Copiarlos tal cual |
| Testimonios / galería IG | Placeholder (Fase 4) | Contenido real |
| Admin / login | Solo roadmap ("Próximamente") | Implementarlo ya |
| Descartado | blog, newsletter, countdown, % descuento, checkout/login | — |

---

## Archivos tocados (publicados en `2ddbbb4`)

```
Paguina_joyas/  (git status: M = modificado, ?? = nuevo sin trackear)
├── estilos.css                (M)  tokens Fase 0 + trust-row + marquee + shiny-text
├── index.html                 (M)  #confianza, .marquee, #destacados, scripts, shiny-text
├── reactbits.css              (M)  spotlight/tilt + carrusel de destacados + contraste hero
├── js/color-bends.js          (M)  intensity → 1.0
├── js/carousel.js             (??) NUEVO — carrusel destacados (reescrito a pasos discretos)
├── js/spotlight-card.js       (??) NUEVO — spotlight + tilt de tarjetas
└── spec/features/008-rediseno-premium/  (??) NUEVO — spec.md / plan.md / tasks.md

backups/backup_pre_rediseno_2026-10-12.zip   (gitignored)
sesiones/sesion-011.md                        (este archivo)
```

- Último commit: `49045b2` (Sesión 010). Publicado después en `2ddbbb4` (sesión 012).
- Nota: `spec/features/008-rediseno-premium/tasks.md` sigue con las casillas `[ ]`; no se
  marcaron porque el trabajo aún no tiene visto bueno.

---

## Pendientes

**Del propietario (para cerrar esta iteración):**
- Ver el carrusel reescrito en localhost y decidir si va **con dots** o solo con flechas.
- Dar visto bueno (o ajustes) a: carrusel de destacados, y si aplica, al spotlight/tilt.

**Técnicos (continúa la sesión 011 cuando se reanude):**
- Fase 1 — **navbar** (links de categorías + carrito).
- Fase 2 — `scroll-reveal.js`/`SplitText`, `animated-content.js`, `GradientText`.
- Fase 3 — catálogo UX en `catalogo_motor.js` (buscador, toggle grid/lista, quick-view),
  respetando el contrato (orden disponibles→pedido→agotados y extracción de código).
- Fase 4 — testimonios (placeholder) + galería Instagram (placeholder).
- Fase 5 — responsive 360/768/1024/1440, foco visible + `aria-*`, poda de efectos,
  smoke test final (**manual**, al no haber Playwright).
- Actualizar `tasks.md` al cerrar y escribir la entrada final de sesión.

**Infra / documentación:**
- Corregir `AGENTS.md`: Playwright MCP figura activo pero no está disponible en el toolset.
- `spec/constitution/roadmap.md`: registrar 008 en curso y 009 = admin "Próximamente".

---

## Nota de deploy

**Publicado.** En el momento de escribir esta nota el trabajo era 100 % local, y así
se dejó constancia. El propietario dio el visto bueno y se subió el 2026-10-13 en el
commit `2ddbbb4`, que GitHub Actions desplegó a GitHub Pages. Lo de las Fases 0-2
está hoy en la página pública.
