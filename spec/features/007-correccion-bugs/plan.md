# Plan: Corrección de bugs y deuda documental

## Enfoque técnico
Sesión de mantenimiento sin framework ni build. Cada corrección es un archivo puntual, verificable por diff. La estrategia de seguridad es el **alcance**: todo lo que se toca está fuera de la whitelist de publicación de `pages.yml`, salvo `js/card-nav.js` y `js/staggered-menu.js`, cuya eliminación no tiene efecto porque nadie los carga.

## Archivos involucrados

| Archivo | Fase | Desplegado |
|---|---|---|
| `spec/features/007-correccion-bugs/*` | 1 | No |
| `spec/constitution/roadmap.md` | 1 | No |
| `opencode.json` · `.env` | 2A | No |
| `manual-del-conductor.html` | 2B | No |
| `Agente en Marketing/agente-marketing-silver-cow.md` · `../03-Marketing.md` | 2C | No |
| `spec/features/001..006/tasks.md` | 2D | No |
| `js/card-nav.js` · `js/staggered-menu.js` | 2E | **Sí** (sin referencias) |
| `spec/constitution/tech-stack.md` · `requirements.txt` · `AGENTS.md` | 2F | No |
| `05-Reporte-Datos-Sheets.md` (bóveda) | 3 | No |
| `01-Estado-Actual.md` · `00-Indice.md` · `02-Web.md` · `sesiones/sesion-010.md` | 4 | No |

## Datos sensibles
- `GITHUB_PERSONAL_ACCESS_TOKEN` — estaba en texto plano en `opencode.json`. Verificado: da **401** (revocado). Se mueve a `.env`.
- `FIRECRAWL_API_KEY` — mismo tratamiento.
- Ninguno de los dos fue commiteado: `opencode.json` está en `.gitignore` y `git log --all -- opencode.json` está vacío. El historial de git está limpio (solo aparecen placeholders `ghp_…` ya redactados).

## Orden de implementación
1. Crear la carpeta de la feature y renumerar el roadmap (`008-cambio-proveedor`, `009-vista-admin`)
2. **A** credenciales → `.env` + `{env:…}` en `opencode.json` (con la skill `customize-opencode`), resolver el MCP `github`
3. **B** `API_URL` → `SHEETS_URL` y barrido del manual
4. **C** 179 → 357 y barrido de números viejos
5. **D** verificar y tildar `tasks.md` 001–006
6. **E** `git rm js/card-nav.js js/staggered-menu.js`
7. **F** `tech-stack.md`, `requirements.txt`, `AGENTS.md`
8. **G** reporte de datos sucios (solo lectura del Sheet)
9. **H** verificación: diff, smoke test Playwright, actualización de bóveda, `sesion-010.md`
10. Commit + push

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Romper la página publicada | Ningún artefacto desplegado se edita; solo se eliminan 2 JS sin referencias (grep verificado: 0 matches en `index.html`, `estilos.css`, `reactbits.css`) |
| El `{env:…}` no se expande en `opencode.json` y los MCPs dejan de andar | Se verifica con `opencode mcp list` antes de cerrar; si la expansión no soporta `environment`, se documenta el fallback y se revierte |
| Tildar tasks que en realidad no están hechas | Cada tarea se contrasta con el código antes de marcarla; lo dudoso va `[~]` con nota |
| Tocar datos de producción del Sheet | Fase G es de solo lectura; el Sheet no se modifica |

## Criterio de éxito
`git status` limpio tras el push, smoke test en verde, y `01-Estado-Actual.md` sin ninguna fila en "Corrección pendiente".
