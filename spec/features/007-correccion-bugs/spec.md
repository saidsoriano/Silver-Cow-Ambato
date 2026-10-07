# Especificación: Corrección de bugs y deuda documental

## Historia de usuario
> Como desarrollador, quiero dejar el proyecto sin errores conocidos ni fuentes de verdad en conflicto, para que la siguiente feature (vista admin) arranque sobre una base limpia.

## Descripción
Corrección de los 6 bugs listados en `01-Estado-Actual.md` § "Bugs y problemas conocidos", más la generación de un reporte de los datos sucios del Google Sheets. Es una sesión de mantenimiento: **ningún artefacto desplegado cambia de comportamiento**.

La whitelist de `.github/workflows/pages.yml` publica `index.html`, `catalogo.js`, `catalogo_motor.js`, `estilos.css`, `reactbits.css`, `js/`, `assets/`, `favicon.ico` y las carpetas de imágenes. Todo lo tocado en esta feature vive fuera de esa lista, salvo la eliminación de dos archivos de `js/` que no están referenciados.

## Criterios de aceptación

### A — Credenciales
- [ ] `opencode.json` no contiene valores literales de secretos; usan `{env:GITHUB_PERSONAL_ACCESS_TOKEN}` y `{env:FIRECRAWL_API_KEY}`
- [ ] `.env` (gitignorado) guarda ambos valores y está documentado cómo cargarlo
- [ ] El MCP `github`, que daba `401`, queda resuelto (token nuevo) o eliminado del config
- [ ] `opencode mcp list` no reporta errores de autenticación

### B — Manual del conductor
- [ ] `manual-del-conductor.html` usa `SHEETS_URL`, el nombre real de la variable (`catalogo.js:6`)
- [ ] Barrido completo del manual: no quedan otras referencias a variables o rutas inexistentes

### C — Marketing
- [ ] El agente de marketing declara **357 productos en 7 categorías**, no 179
- [ ] Barrido de números de catálogo obsoletos en `Agente en Marketing/` y `03-Marketing.md`

### D — Fuentes de verdad en conflicto
- [ ] `tasks.md` de 001–005 verificado tarea por tarea contra el código y tildado
- [ ] Salvedades marcadas con `[~]` y una nota, no silenciadas
- [ ] `tasks.md` de 006 ajustado: el task "GSAP CDN en index.html" quedó obsoleto tras la reversión de la sesión 004

### E — Código muerto
- [ ] `js/card-nav.js` y `js/staggered-menu.js` eliminados del repo
- [ ] 0 referencias residuales en `index.html`, `estilos.css`, `reactbits.css`

### F — Infraestructura documental
- [ ] `tech-stack.md` describe el deploy real (GitHub Actions + whitelist de publicación)
- [ ] `requirements.txt` con las versiones instaladas en `.venv`
- [ ] `AGENTS.md` documenta los MCPs, el manejo de `.env` y las features 006/007

### G — Reporte (solo lectura)
- [ ] `05-Reporte-Datos-Sheets.md` en la bóveda con los 8 códigos inválidos y los 2 precios en 0
- [ ] El Google Sheets **no** fue modificado

### H — Verificación
- [ ] `git diff` confirma que ningún artefacto desplegado cambió salvo la eliminación de los dos JS huérfanos
- [ ] Smoke test local (Playwright): catálogo carga, 7 categorías, carrito, consola sin errores nuevos
- [ ] `sesiones/sesion-010.md` escrito y bóveda actualizada

## Fuera de alcance
- Corregir los datos del Google Sheets (el dueño lo hace a mano con el reporte de la fase G)
- Desconectar Vercel y agregar tag `canonical` (pendiente aparte)
- Cualquier cambio de comportamiento visible en la página

## Dependencias
- `gh` autenticado (ya verificado: `gho_…`, scopes `repo` + `workflow`)
- Playwright MCP + Chromium instalados (ya verificado)
- Acceso del dueño a github.com para rotar el PAT si decide hacerlo
