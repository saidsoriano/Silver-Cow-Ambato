# Silver Cow Ambato

Catálogo web de joyería de plata 925. Página estática para clientes, administrada por el dueño mediante Google Sheets + GitHub.

## Constitution
- mission → `spec/constitution/mission.md`
- tech-stack → `spec/constitution/tech-stack.md`
- roadmap → `spec/constitution/roadmap.md`

## Features
- `spec/features/001-catalogo-sheets/`
- `spec/features/002-diseno-luxury/`
- `spec/features/003-carrito-whatsapp/`
- `spec/features/004-importador-proveedor/`
- `spec/features/005-mcps-opencode/`
- `spec/features/006-reactbits-ports/` — parcial: CardNav y StaggeredMenu abortados
- `spec/features/007-correccion-bugs/`
- `spec/features/008-rediseno-premium/` — en curso, local, sin visto bueno final

## MCPs (proyecto)
Se configuran en `opencode.json` bajo la clave `mcp` (no `mcpServers`).

| MCP | Estado |
|---|---|
| `playwright` | **no disponible en el toolset actual** (confirmado sesiones 011-012). QA visual es manual: el dueño abre el navegador, no hay smoke test automatizado |
| `firecrawl` | activo — scraping de proveedores |
| `sequential-thinking` | activo |
| `github` | **`enabled: false`** — el PAT estaba revocado (401). Para activarlo: token nuevo en `.env` → `GITHUB_PERSONAL_ACCESS_TOKEN` y `"enabled": true`. Mientras tanto, `gh` CLI en la terminal |

### Secretos
Nunca en texto plano en el repo. Viven en `.env` (gitignorado) y se leen con
`{env:VARIABLE}`. Tu shell los carga al arrancar (fragmento en
`~/.config/fish/config.fish`); si cambiás el `.env`, abrí una terminal nueva.
Comprobación: `opencode mcp list`.

## Comandos
- `.venv/bin/python extraer_proveedor.py {categoria|todas}` — dependencias en `requirements.txt`
- `git add . && git commit -m "msg" && git push`
- QA local: `python3 -m http.server 8123` + smoke test con Playwright

## Convenciones rápidas
- Imágenes: `{codigo}.jpg` en su carpeta de categoría
- Códigos: `[P-XX-NNN]`
- Sheets columnas: nombre, precio, codigo, estado, esPedido, img, desc
- Variables CSS: --sapphire, --silver, --gold-accent (#C9A84C), --black-deep
- Tono luxury: evitar "oferta", "descuento barato", "buy now"

## Instrucciones generales
- Una tarea a la vez. Lee la spec primero, luego implementa.
- Registra cada sesión en `sesiones/sesion-NNN.md`.
- Lee `sesiones/` al inicio para contexto de sesiones previas.
