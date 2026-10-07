# Sesión 010 — 007-correccion-bugs: cerrar la deuda técnica

**Fecha:** 2026-10-07
**Objetivo:** Corregir los 6 bugs de ``01-Estado-Actual.md § Bugs`` que 005-009 dejaron
sin resolver, unificar las fuentes de verdad (`tasks.md` vs roadmap), dejar el repo y
el manual sin errores, y generar el reporte de datos sucios del Sheet — **sin alterar
ningún artefacto desplegado**.

## Contexto

- El dueño prefirió esta sesión de mantenimiento antes de arrancar la feature de vista admin.
- Regla autoimpuesta: ninguna de las 7 carpetas de la whitelist de `pages.yml`
  (`index.html`, `catalogo.js`, `catalogo_motor.js`, `estilos.css`, `reactbits.css`,
  `js/`, `assets/`, imágenes) cambia de comportamiento.
- Metodología seguida: spec → plan → tasks → implementar → verificar → registrar.

## Temas cubiertos

### A. Credenciales
- `opencode.json` tenía `FIRECRAWL_API_KEY` y un PAT de GitHub **en texto plano**.
  El PAT se probó contra la API → **401 (revocado)**, consistente con la sesión 009.
- Verificación de que **nunca se commiteó**: `opencode.json` está en `.gitignore`,
  `git log --all -- opencode.json` está vacío y el historial solo tiene el placeholder
  ya redactado `ghp_…`.
- Se creó `.env` (gitignorado) y el config ahora lee `{env:VARIABLE}`.
  - **Prueba de interpolación real:** un MCP de juguete con `"environment": { "X": "{env:TEST}" }`
    confirmó que la expansión ocurre (y que una variable ausente queda vacía, sin fuga).
- El MCP `github` quedó `"enabled": false`: no hay token válido. Mientras tanto `gh` CLI
  (autenticado `gho_…`, scopes repo+workflow, helper de git configurado) cubre la tarea.
- El `.env` se carga en **fish** — el shell del dueño — desde `~/.config/fish/config.fish`.
- `opencode mcp list` final: playwright ✓, firecrawl ✓, sequential-thinking ✓, github ● disabled.

### B. Manual del conductor
- Bug reportado: `API_URL` vs `SHEETS_URL`. De paso se corrigieron **7 errores más**,
  todos verificables por diff:
  - `cd ~/Documentos/Programacion/...` → `cd "$HOME/Silver Cow Ambato/Paguina_joyas"` (×2)
  - "221 productos" → 357
  - "los cambios se ven al instante" → se ven al recargar la página
  - `mcpServers` → la clave se llama `mcp`
  - Features del GPS sin 006/007; ejemplo de feature `006-` → `NNN-`
  - MCP de GitHub ahora deshabilitado (token revocado); se documenta el cómo-reactívalo
- El manual **no se despliega** (fuera de la whitelist): riesgo cero.

### C. Marketing
- `agente-marketing-silver-cow.md`: "179 productos" → **357** (verificado contra el
  endpoint el 2026-10-07).
- Hallazgo extra (no corregido, es decisión de marca): el agente afirma "100% bajo
  pedido" pero hay 335 pedido / 14 disponible / 8 agotado → pasó al reporte.

### D. Fuentes de verdad (tasks.md 001-006)
- 48 tareas de 001-005 estaban **sin marcar** aunque el roadmap decía "Completa".
  Se verifica cada una contra el código antes de tildar:
  - 47 `[x]` (con la evidencia en la propia línea), 1 `[ ]` (imagen Docker del MCP
    de GitHub nunca bajada — por eso agotaba los 30s del `mcp list`), 3 `[~]` con nota.
  - `003` carrito: el envío real a WhatsApp no se automatiza → `[~]`.
  - `004` scraper: las pruebas se evidencian en los 7 `csv_*.csv` de 2026-07-09.
  - `005`: "Documentar MCPs en AGENTS.md" quedó pendiente de la fase F → ya se hizo.
- `006`: el task "GSAP CDN" quedó obsoleto por la reversión de la sesión 004 → `[~]` con nota
  (los 4 componentes portados no usan GSAP; el CDN se quitó). CardNav/StaggeredMenu:
  nota de que sus archivos se eliminan ahora.

### E. Código muerto
- `git rm js/card-nav.js js/staggered-menu.js` (192 líneas). Grep previo:
  **0 referencias** en `index.html`, `estilos.css`, `reactbits.css`, otros JS y el workflow.
- El deploy copia `js/` entero a `_site/`, así que solo quedan los 4 módulos vivos.

### F. Infra documental
- `tech-stack.md`: describe hoy el deploy real (GitHub Actions + whitelist) y el estado
  de cada MCP; proveedor ItalSteel marcado como "anterior" (feature 008 pendiente).
- `requirements.txt` con las versiones del `.venv`: `requests==2.34.2`, `beautifulsoup4==4.15.0`.
- `AGENTS.md`: sección MCPs con tabla de estados + sección Secretos (`{env:…}`, `.env`,
  recarga de terminal) + features 006/007 + QA local.

### G. Reporte de datos sucios (solo lectura)
- Se **re-verificó el endpoint en vivo** (no se confió en la nota del 05-10): los 8
  códigos inválidos y los 2 precios 0 siguen ahí ("Cadena con Dije corazón" con
  `codigo` vacío es el único con efecto funcional real). Documentados en
  `05-Reporte-Datos-Sheets.md` en la bóveda. **El Sheet no se tocó.**

### H. Verificación
- `git diff`/`git status`: ningún artefacto desplegado modificado; solo la
  eliminación `D` de los dos `js/` huérfanos.
- Smoke test Playwright local (servidor `python3 -m http.server`) contra `js/` ya
  sin los archivos muertos:
  - **18/18 checks OK**: caché/357/7 categorías/render por categoría (5 tarjetas),
    carrito (contador + total), recarga con caché, consola sin errores, sin 4xx/5xx,
    y **render correcto con `script.google.com` abortado** (escenario offline).

## Decisiones clave

| Decisión | Opción tomada | Alternativa |
|---|---|---|
| Número de la feature | `007-correccion-bugs` (renumerando planeadas a 008/009) | Sesión sin carpeta de feature |
| Secretos | `.env` gitignorado + `{env:…}` | Los dejaba en texto plano |
| MCP de GitHub | `enabled: false` hasta tener PAT válido | Borrarlo del config |
| MCP con token revocado | Se quita el PAT muerto del `.env` (comentado) | Dejarlo en `.env` |
| tasks.md 001-005 | Verificar y marcar (47 [x], 1 [ ], 3 [~]) | Tildar a ciegas por "el roadmap dice Completa" |
| JS huérfanos | `git rm` | Dejarlos como recordatorio |
| Datos del Sheet | Solo reporte | Corregirlos directo |
| Shell del dueño | fish → se carga `.env` desde `config.fish` | Pedir recarga manual |

## Archivos tocados

```
Paguina_joyas/
├── AGENTS.md                       (+, sección MCPs + Secretos + features 006/007)
├── opencode.json                   (gitignored: {env:…}, github disabled)
├── .env                            (gitignored: creado)
├── requirements.txt                (+) creado
├── manual-del-conductor.html       (+, 8 correcciones)
├── js/card-nav.js                  (D) eliminado
├── js/staggered-menu.js            (D) eliminado
├── spec/constitution/roadmap.md    (+, 007 en curso, planeadas 008/009)
├── spec/constitution/tech-stack.md (+, deploy real + MCPs + proveedor anterior)
├── spec/features/001..006/tasks.md (~, marcadas y verificadas)
└── spec/features/007-correccion-bugs/  (+) spec/plan/tasks

bóveda/ (workspace, fuera del repo)
├── 05-Reporte-Datos-Sheets.md      (+) creado
├── 01-Estado-Actual.md             (~, bugs resueltos + pendientes nuevos)
├── 00-Indice.md                    (~, notas, enrutamiento, regla 5)
├── 02-Web.md                       (~, features, módulos js, bitácora 10)
└── 03-Marketing.md                 (~, 179→357, observación 100%)
```

## Pendientes

- **Dueño:** corregir en el Sheet los 8 códigos y los 2 precios 0 ([[05-Reporte-Datos-Sheets]]).
- **Dueño (cuenta GitHub):** reactivar Vercel no cierra nada funcional, pero decidir sobre
  el contenido duplicado (disconnect en vercel.com y/o tag `canonical` en `index.html`).
- **Dueño:** decidir si generar un PAT para reactivar el MCP `github` o borrar la entrada.
- **Dueño (fuera del repo):** mover `GEMINI_API_KEY` del `opencode.json` global a `{env:…}`.
- **Próxima feature:** `008-cambio-proveedor` (Alta) o `009-vista-admin` (Media).

## Nota de deploy

El push de esta sesión NO cambia la página pública: la whitelist del workflow solo
ve la desaparición de 2 archivos en `js/` que nadie referenciaba. Smoke test 18/18.