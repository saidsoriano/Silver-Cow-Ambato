# Silver Cow Ambato

Catálogo web de joyería de plata 925. Página estática para clientes, administrada por el dueño desde un panel propio (`admin.html`, feature `010-vista-admin`). Google Sheets fue la fuente de verdad hasta esa feature; queda congelado como referencia histórica.

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
- `spec/features/008-rediseno-premium/` — en curso, Fases 0-2 publicadas, falta Fase 3+
- `spec/features/010-vista-admin/` — completa. Panel en `admin.html` (Firebase Firestore+Auth + Supabase Storage). Google Sheets queda congelado, ya no es la fuente de verdad
- `spec/features/011-arreglos-pagina/` — cerrada. Lista viva de arreglos chicos al sitio público y al panel (no un rediseño) — ver `tasks.md` de esa carpeta
- `spec/features/012-paneles-vendedores/` — completa. Panel del vendedor (`vendedor.html`), pedidos web en Firestore, ventas en persona, comisiones/metas/bonos, pagos, Excel, margen. Plan gratis, sin Cloud Functions. Requisitos y decisiones: `spec.md` de esa carpeta

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
- Reglas de Firestore (`firestore.rules`): probar con el emulador antes de desplegar → en una carpeta aparte con `firebase-tools@13` y `@firebase/rules-unit-testing` instalados: `npx firebase emulators:exec --only firestore --project demo-sc --config <repo>/firebase.json "node test.mjs"` (copia de `scripts/test-reglas.mjs`). firebase-tools 14+ exige Java 21; acá hay Java 17
- Desplegar reglas (con visto bueno del dueño): `npx firebase-tools@13 deploy --only firestore:rules --project silver-cow-admin` desde `Paguina_joyas/` (el login lo hace el dueño en su terminal: `npx firebase-tools@13 login`)
- Comisiones: `node scripts/test-comisiones.mjs`

## Convenciones rápidas
- Imágenes: `{codigo}.jpg` en su carpeta de categoría (fotos nuevas: Supabase Storage, bucket `fotos-productos`)
- Códigos: `P-XX-NNN`, generados automático por categoría desde el panel
- Firestore (`productos/`, doc ID = código): nombre, categoria, precio, estado, esPedido, destacada, desc, img, archivado
- Feature 012 agrega: `codigos`, `vendedores`, `roles`, `pedidos`, `pedidos_vendedor`, `ventas`, `resumenes`, `pagos`, `costos`, `avisos`, `config/negocio` (lo lee el vendedor) y `config/privado` (solo admin). Contrato de campos: `spec/features/012-paneles-vendedores/plan.md`
- Gotcha: escribir el rango Unicode de acentos (`\u0300-\u036f`) con las herramientas de edición lo corrompe a caracteres literales; armarlo con Python (`chr(92)+'u0300'`) y verificar con `cat -A`
- Gotcha: `estilos.css` le da `padding: 140px 60px` a todo `<section>` — en los paneles usar `<div>`
- Variables CSS: --sapphire, --silver, --gold-accent (#C9A84C), --black-deep
- Tono luxury: evitar "oferta", "descuento barato", "buy now"

## Instrucciones generales
- Una tarea a la vez. Lee la spec primero, luego implementa.
- Registra cada sesión en `sesiones/sesion-NNN.md`.
- Lee `sesiones/` al inicio para contexto de sesiones previas.
