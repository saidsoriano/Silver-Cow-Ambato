# Sesión 012 — 008-rediseno-premium: fusión del prototipo (Ajustes 1–6)

**Fecha:** 2026-10-13
**Estado:** Abierta — trabajo local, **sin commit/push** (falta visto bueno del propietario)
**Objetivo:** Portar el rediseño del prototipo
`/home/said/Silver Cow Ambato/Silver Cow Ambato — Prototipo de rediseño.html` al sitio real
(`Paguina_joyas/`), fusionándolo con la feature `008-rediseno-premium`, **sin romper el motor
de catálogo** (Google Sheets + GitHub). Ejecución por fases, mostrando cada cambio en
localhost antes de aprobar, con **nada a git sin "visto bueno"**.

> Continuación directa de la sesión 011 (que dejó cerrado el plan y las Fases 0–2 parciales).
> Esta sesión ejecuta el **plan de fusión del prototipo** aplicando los 6 ajustes que pidió
> el propietario, y registra lo verificado, lo decidido y lo que falta revisar.

---

## Contexto de arranque

- Directorio de trabajo: `/home/said/Silver Cow Ambato`; el sitio real vive en `Paguina_joyas/`
  (repo git). **Build mode activo.**
- Producción: `https://saidsoriano.github.io/Silver-Cow-Ambato/` (deploy por GitHub Actions).
- Stack: HTML5 + CSS3 + JS ES6 vanilla (IIFE), **sin framework / bundler / build / package.json**.
- Datos: Google Sheets (7 pestañas) → Apps Script → JSON; caché `localStorage`
  `silvercow_catalogo`. **357 productos**, 7 categorías. Estado: 335 pedido / 14 disponible /
  8 agotado.
- **REGLAS DE ORO vigentes:** (1) nada a git sin "visto bueno" (local → mostrar → aprobar →
  commit/push); (2) tras cada cambio, mostrar siempre en localhost.
- Backup previo: `backups/backup_estado_008_2026-10-13.zip` (Fase 0 de esta sesión).

### Servidores locales usados
- Sitio: `setsid -f python3 -m http.server 8123` (workdir `Paguina_joyas/`) → `http://localhost:8123/`
- Prototipo: `setsid -f python3 -m http.server 8124` (workdir carpeta padre) → para comparar.

---

## Temas cubiertos

### A. Fusión prototipo → sitio: plan y tokens
- Tokens del prototipo mapeados a los tokens existentes de `estilos.css`
  (`--bg`→`--black-deep`, `--bg2`→`--surface`, `--gold`→`--gold-accent`, `--gold-s`→`--gold-soft`,
  `--silver-b`→`--silver-bright`, `--muted`→`--text-muted`, `--sapphire-l`→`--sapphire-light`).
- **No** se tocaron tokens originales; se mantuvo la paleta zafiro + plata + oro.
- `estilos.css` conserva indentación de 2 espacios y **no** usa `@layer`.

### B. Ajustes 1 + 2 — responsive y hero móvil
- **Ajuste 1:** eliminado un `</div>` huérfano que producía el hueco gris sobre el marquee.
- **Ajuste 2:** el hero en móvil (`@media max-width:820px`) pasa a **dos columnas**
  (`1fr 1fr`): texto a la izquierda, anillo 3D / video a la derecha; `.views` a ancho completo,
  `.scroll-hint` oculto.

### C. Ajuste 3 — Proceso (timeline vertical con scroll)
- `estilos.css`: `.proceso-steps` (relativo, `max-width:860px`, `padding-left:clamp(60px,9vw,110px)`),
  riel `::before`, línea dorada `.fill` (`transform: scaleY(var(--p))`), `.step` + `.dot` romano
  + `.step.on`.
- `index.html`: 5 pasos I–V dentro de `#procesoSteps` con `<div class="fill" id="fill">`.
- JS inline (índice `index.html` ~1064): escala `--p` y togglea `.on` cuando el top del paso
  cruza el 60% del viewport; respeta `prefers-reduced-motion`.
- Se **eliminaron dos líneas obsoletas** del media query móvil (`grid-template-columns:1fr 1fr`
  y `::before{display:none}` del layout horizontal viejo). La timeline vertical ya es responsive.

### D. Ajuste 4 — Piezas destacadas arriba del catálogo
- `#destacados` movido **antes** de `<section id="catalogo">`. Orden verificado:
  hero → confianza → destacados → catalogo → nosotros → filosofia → proceso → contacto.

### E. Ajuste 5 — Nosotros ("925" gigante) + Filosofía
- `index.html`: titular `Ambato,<br><em>nuestra historia</em>`; el "925" con clases
  `nosotros-stat-num big count-up` + label `nosotros-stat-label big-l`.
- `estilos.css`: nuevas reglas `.nosotros-stat-num.big` (degradado plata→oro, `clamp(96px,14vw,190px)`)
  y `.nosotros-stat-label.big-l` (oro, letter-spacing .2em).
- **Filosofía:** tras comparar prototipo (`.../#filosofia`) y sitio, el propietario **decidió
  mantener el magic-bento** de ReactBits (no se portó `.pillars`/`.pillar`). **No se tocó
  `reactbits.css`.**

### F. Ajuste 6 — Fondo estrellas solo en el hero
- `estilos.css`: `#hero::after` con campo de estrellas (radial-gradients repetidos) +
  `@keyframes twinkle`; añadido a `animation:none` en `prefers-reduced-motion`.

### G. Bug real corregido
- `index.html` línea 1113: el tag de cierre del script inline principal estaba **malformado**
  (`</script` **sin `>`**). Corregido a `</script>`. Era un defecto real (podía romper el cierre
  del inline y el parseo posterior).

---

## Lo que el propietario DECIDIÓ

| # | Punto | Decisión |
|---|-------|----------|
| 1 | Fondo estrellas/espacio | Solo en el hero |
| 2 | Hero móvil | Anillo/video al lado del texto (lado a lado) |
| 3 | Filosofía (3 pilares) | **Mantener el magic-bento** actual (no portar `.pillars`) |

> Estas son **decisiones**, no aprobación visual: el propietario todavía **no ha visto en
> localhost** los cambios de esta sesión.

---

## Verificación (sin Playwright)

Playwright MCP sigue **no disponible** en el toolset → verificación **estructural**, no visual.
El propietario abre el navegador a mano.

- **Balance de llaves:** `estilos.css` **310 / 310**, `index.html` **94 / 94**.
- **JS inline:** extraídos los 2 bloques `<script>` sin `src` → ambos pasan `node --check`.
- **HTTP:** `curl` **200** en `/`, `/estilos.css`, `/js/hero-ring.js`, `/assets/hero-anillo.mp4`.
- **Sin restos** del layout horizontal de Proceso (`step-circle`/`step-num`): 0 coincidencias.

---

## Archivos tocados (sin commitear)

```
Paguina_joyas/  (git status: M = modificado, ?? = nuevo sin trackear)
├── estilos.css                (M)  tokens, hero, hero móvil lado a lado, estrellas,
│                                   timeline Proceso, .nosotros-*-big, fixes media query
├── index.html                 (M)  hero, fix </div>, #destacados reordenado, timeline Proceso
│                                   + JS scroll, nosotros (925 big/big-l), fix </script>
├── reactbits.css              (M)  (de la sesión 011; Ajuste 5 NO lo tocó)
├── js/color-bends.js          (M)  (de la sesión 011)
├── assets/hero-anillo.mp4     (??) NUEVO — video del hero (1.5 MB, h264 1280×720)
├── js/hero-ring.js            (??) NUEVO — anillo 3D (Three.js) + video + fallback
├── js/carousel.js             (??) NUEVO — carrusel destacados (sesión 011)
├── js/spotlight-card.js       (??) NUEVO — spotlight + tilt (sesión 011)
└── spec/features/008-rediseno-premium/  (??) NUEVO — spec.md / plan.md / tasks.md

backups/backup_estado_008_2026-10-13.zip   (gitignored)
sesiones/sesion-012.md                      (este archivo)
```

- Último commit: `49045b2` (Sesión 010). **Nada de las sesiones 011–012 está commiteado.**

---

## Pendientes

**Del propietario (para cerrar esta iteración):**
- Revisar en localhost (`http://localhost:8123/`) los Ajustes 1–6 y dar visto bueno o ajustes:
  1. sin hueco gris sobre el marquee; 2. hero móvil lado a lado; 3. timeline vertical de Proceso
  animada con el scroll; 4. destacados antes del catálogo; 5. "925" gigante + titular italic;
  6. estrellas solo en hero.
- Decidir si el carrusel reescrito (sesión 011) va con dots o solo flechas (pendiente heredado).

**Técnicos (al reanudar):**
- Fase 3 — catálogo UX en `catalogo_motor.js` (buscador, grid/lista, quick-view), respetando el
  contrato (IDs/clases, orden disponibles→pedido→agotados, extracción de código).
- Fase 4 — testimonios + galería Instagram (placeholder).
- Fase 5 — responsive 360/768/1024/1440, foco visible + `aria-*`, poda de efectos, smoke test
  final (**manual**, sin Playwright).
- Marcar `spec/features/008-rediseno-premium/tasks.md` al cerrar con visto bueno.

**Infra / documentación:**
- Corregir `AGENTS.md`: Playwright MCP figura activo pero no está disponible.
- Registrar 008 en curso (y 009 = admin "Próximamente") en `spec/constitution/roadmap.md`.

---

## Nota de deploy

**No hubo deploy.** Todo (sesiones 011–012 de la 008) es **100 % local**. La página pública
sigue igual que el último deploy de la sesión 010. Cuando el propietario dé el visto bueno:
commit → push a `main` → GitHub Actions publica. **Hasta entonces, nada se sube.**
