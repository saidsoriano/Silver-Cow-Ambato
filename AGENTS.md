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
- `index.html` — entrada única del sitio (~918 líneas, todo el HTML + carrito JS inline + cupones + count-up)
- `catalogo.js` — fetch desde Google Sheets + caché en localStorage
- `catalogo_motor.js` — renderizado del grid, paginación (5 por bloque), zoom, lazy loading
- `estilos.css` — todos los estilos (~1342 líneas), colores de marca en variables CSS
- `extraer_proveedor.py` — script local para importar productos del proveedor (excluido de git)
- `assets/` — logos (`logo.png`, `logo_ig_transparente.png`)
- `csv/` — CSVs para importar a Google Sheets (`csv_pulseras.csv`, `csv_anillos.csv`, ...)
- `scripts/` — `google_apps_script.js` (código que va pegado en Extensiones → Apps Script)
- `backups/` — snapshots de seguridad (`.zip`)
- `pulseras/`, `anillos/`, `aretes/`, `cadenas/`, `cadenas_dijes/`, `dijes/`, `juegos/` — imágenes por categoría
- `AGENTS.md` — este archivo

## Convenciones
- Imágenes: `{codigo}.jpg` dentro de la carpeta de su categoría (ej: `pulseras/P-PL-296.jpg`)
- Códigos de producto: formato `[P-XX-NNN]` (ej: `[P-PL-296]`)
- Productos en Google Sheets: columnas `nombre`, `precio`, `codigo`, `estado`, `esPedido`, `img`, `desc`
  - `estado`: `disponible` | `pedido` | `agotado`
  - `esPedido`: `FALSE` (stock directo) | `TRUE` (bajo pedido/consulta)
- `desc` en sheets combina el código + texto de descripción (el frontend extrae el código con regex `\[[^\]]+\]`)
- CONFIG global (inline en index.html): `WHATSAPP_NUM`, `INSTAGRAM_HANDLE`, `PLATA_LEY`, `ENVIO_AMBATO`, `ENVIO_OTRA`
- Variables CSS de marca: `--sapphire`, `--silver`, `--gold-accent` (`#C9A84C`), `--black-deep`, etc.
- Marca de lujo — evitar "oferta", "descuento barato", "buy now"
- Todo pricing, descuentos y cupones es 100% client-side (sin backend)
- Scripts cargan en orden: CONFIG inline → `catalogo.js` → `catalogo_motor.js` → carrito+cupones inline

## No hagas
- No instalar dependencias npm ni frameworks — el sitio es vanilla JS
- No tocar los archivos dentro de `.venv/` (entorno virtual de Python, solo local)
- No cambiar nombres de columnas en Google Sheets sin actualizar TAMBIÉN `scripts/google_apps_script.js` y `catalogo_motor.js`
- No subir `extraer_proveedor.py` ni `.venv/` a GitHub (están en `.gitignore`)
- No forzar push con `--force` ni modificar el historial de git
- No subir archivos `.env*` al repositorio

## Flujo de trabajo
- Para cambios no triviales, propón un plan antes de implementar.
- Una tarea a la vez. Al terminar, resume qué cambiaste.
- Si no estás seguro al 80%, pregunta antes de actuar.

## Documentación
- Google Sheets integración: `scripts/google_apps_script.js` (contiene `doGet`, `setupSheets`, `colorByStatus`)
- Script de importación de proveedor: `extraer_proveedor.py` (usa `.venv/bin/python`)
- Cache de datos: localStorage key `silvercow_catalogo`; cache-busting con `?v=N` en `SHEETS_URL`
- Count-up: clase `.count-up` + `data-target="N"` anima el número al hacer scroll (inline en index.html)
- Animaciones: `.reveal` usa `cubic-bezier(.25,.1,.25,1)` para transiciones más premium
- `prefers-reduced-motion`: respetado globalmente en CSS
- Tiempo de carga: primer request al Apps Script tras inactividad = 5-10s (cold start)
- GitHub Pages: auto-deploy en push a `main`, URL pública se actualiza en ~1-2 min
- Favicon generado desde `assets/logo_ig_transparente.png` (archivo `favicon.ico`)
