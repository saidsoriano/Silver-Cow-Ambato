# Silver Cow Ambato

Catálogo web de joyería de plata 925. Página estática para clientes, administrada por el dueño mediante Google Sheets + GitHub.

## Stack
- Lenguaje: JavaScript (vanilla, sin frameworks ni bundlers)
- Hosting: GitHub Pages (auto-deploy en push a main)
- Datos: Google Sheets → Google Apps Script → JSON
- Script auxiliar: Python 3 + requests + beautifulsoup4 (en `.venv/`, solo local)
- Control de versiones: Git + GitHub

## Comandos
- `.venv/bin/python extraer_proveedor.py pulseras` — extrae una categoría del proveedor (CSV + imágenes)
- `.venv/bin/python extraer_proveedor.py todas` — extrae las 7 categorías
- `git add . && git commit -m "msg" && git push` — despliega en GitHub Pages (~1-2 min)
- (No hay test, lint, ni build — es HTML/JS plano)

## Estructura del proyecto
- `index.html` — entrada única del sitio (~918 líneas, HTML + carrito JS inline + cupones + count-up)
- `catalogo.js` — fetch desde Google Sheets + caché en localStorage (`silvercow_catalogo`)
- `catalogo_motor.js` — renderizado del grid, paginación (5/bloque), zoom, lazy loading
- `estilos.css` — todos los estilos (~1342 líneas), variables CSS de marca
- `extraer_proveedor.py` — script local para importar productos del proveedor (excluido de git)
- `assets/` — logos (`logo.png`, `logo_ig_transparente.png`)
- `csv/` — CSVs para importar a Google Sheets
- `scripts/` — `google_apps_script.js`
- `documentacion/` — notas de sesión históricas (`sesion-NNN.md`)
- `backups/` — snapshots de seguridad (`.zip`)
- `pulseras/`, `anillos/`, `aretes/`, `cadenas/`, `cadenas_dijes/`, `dijes/`, `juegos/` — imágenes por categoría
- `AGENTS.md` — este archivo

## Convenciones
- Imágenes: `{codigo}.jpg` dentro de su categoría (ej: `pulseras/P-PL-296.jpg`)
- Códigos: formato `[P-XX-NNN]`
- Google Sheets columnas: `nombre`, `precio`, `codigo`, `estado`, `esPedido`, `img`, `desc`
  - `estado`: `disponible` | `pedido` | `agotado`
  - `esPedido`: `FALSE` (stock directo) | `TRUE` (bajo pedido/consulta)
- `desc` combina código + texto (frontend extrae código con regex `\[[^\]]+\]`)
- CONFIG inline en index.html: `WHATSAPP_NUM`, `INSTAGRAM_HANDLE`, `PLATA_LEY`, `ENVIO_AMBATO`, `ENVIO_OTRA`
- Variables CSS: `--sapphire`, `--silver`, `--gold-accent` (`#C9A84C`), `--black-deep`
- Marca de lujo — evitar "oferta", "descuento barato", "buy now"
- Todo pricing/descuentos/cupones es 100% client-side
- Scripts cargan: CONFIG inline → `catalogo.js` → `catalogo_motor.js` → carrito+cupones inline

## No hagas
- No instalar npm/frameworks — vanilla JS
- No tocar `.venv/` (entorno Python local)
- No cambiar columnas de Sheets sin actualizar `scripts/google_apps_script.js` y `catalogo_motor.js`
- No subir `extraer_proveedor.py` ni `.venv/` a GitHub
- No `--force` push ni modificar historial de git

## Flujo de trabajo
- Propón plan antes de implementar cambios no triviales.
- Una tarea a la vez. Al terminar, resume cambios.
- Registra cada sesión en `documentacion/sesion-NNN.md`.
- Lee `documentacion/` al inicio para contexto de sesiones previas.
