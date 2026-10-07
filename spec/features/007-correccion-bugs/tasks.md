# Tareas: Corrección de bugs y deuda documental

## Fase 1 — Estructura
- [ ] Crear `spec/features/007-correccion-bugs/{spec,plan,tasks}.md`
- [ ] Renumerar roadmap: `008-cambio-proveedor`, `009-vista-admin`

## Fase 2A — Credenciales
- [ ] Mover `FIRECRAWL_API_KEY` y `GITHUB_PERSONAL_ACCESS_TOKEN` a `.env` (gitignorado)
- [ ] `opencode.json` → `{env:FIRECRAWL_API_KEY}` y `{env:GITHUB_PERSONAL_ACCESS_TOKEN}`
- [ ] Resolver MCP `github` (401 verificado): token nuevo o entrada eliminada
- [ ] Verificar con `opencode mcp list`

## Fase 2B — Manual
- [ ] `manual-del-conductor.html:253`: `API_URL` → `SHEETS_URL`
- [ ] Barrido del resto del manual por variables/rutas inexistentes

## Fase 2C — Marketing
- [ ] `agente-marketing-silver-cow.md:37`: 179 → 357 productos
- [ ] Barrido de números viejos en `Agente en Marketing/` y `03-Marketing.md`

## Fase 2D — tasks.md
- [ ] Verificar y tildar `001-catalogo-sheets/tasks.md` (10 tareas)
- [ ] Verificar y tildar `002-diseno-luxury/tasks.md` (11 tareas)
- [ ] Verificar y tildar `003-carrito-whatsapp/tasks.md` (9 tareas)
- [ ] Verificar y tildar `004-importador-proveedor/tasks.md` (8 tareas)
- [ ] Verificar y tildar `005-mcps-opencode/tasks.md` (10 tareas)
- [ ] Ajustar `006-reactbits-ports/tasks.md` (task de GSAP obsoleto)

## Fase 2E — Código muerto
- [ ] `git rm js/card-nav.js js/staggered-menu.js`
- [ ] Confirmar 0 referencias residuales

## Fase 2F — Infra documental
- [ ] `tech-stack.md`: deploy real con GitHub Actions y whitelist
- [ ] `requirements.txt` con versiones del `.venv`
- [ ] `AGENTS.md`: sección MCPs + `.env` + features 006/007

## Fase 3 — Reporte (solo lectura)
- [ ] `05-Reporte-Datos-Sheets.md` con 8 códigos inválidos y 2 precios en 0
- [ ] Confirmar que el Sheet no fue modificado

## Fase 4 — Verificación
- [ ] `git diff` revisado: ningún artefacto desplegado alterado
- [ ] Smoke test local con Playwright (catálogo, 7 categorías, carrito, consola)
- [ ] Actualizar `01-Estado-Actual.md`, `00-Indice.md`, `02-Web.md`
- [ ] Escribir `sesiones/sesion-010.md`
- [ ] git add/commit/push
