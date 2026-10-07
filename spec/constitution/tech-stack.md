# Tech Stack

## Lenguajes
- HTML5, CSS3, JavaScript (vanilla, sin frameworks ni bundlers)
- Python 3 (solo para script local de importación de proveedor)

## Frameworks y librerías
- Google Fonts: Cormorant Garamond + Montserrat
- Sin frameworks JavaScript ni CSS

## Base de datos
- Google Sheets (multi-sheet: una hoja por categoría, 7 en total)
- Google Apps Script para servir datos como JSON via HTTP GET
- localStorage en el navegador para caché del catálogo

## Hosting y despliegue
- GitHub Pages, orquestado por **GitHub Actions** (`.github/workflows/pages.yml`)
- Despliegue: `git push` a rama `main` → workflow → Pages (también `workflow_dispatch` para relanzar a mano)
- El workflow **no** publica la raíz: stagea en `_site/` una lista blanca de archivos
  (`index.html`, `catalogo.js`, `catalogo_motor.js`, `estilos.css`, `reactbits.css`,
  `favicon.ico`, `.nojekyll`, `js/`, `assets/` y las 7 carpetas de imágenes).
  `csv/`, `spec/`, `sesiones/`, `backups/`, `AGENTS.md`, `manual-del-conductor.html`
  y `extraer_proveedor.py` quedan **fuera del sitio publicado**.

## Control de versiones
- Git + GitHub
- Repositorio: `https://github.com/saidsoriano/Silver-Cow-Ambato.git`
- Rama única: `main`

## Herramientas de desarrollo
- IDE: OpenCode
- MCPs configurados (proyecto, en `opencode.json`):
  - `playwright` — screenshots y pruebas visuales con navegador headless
  - `firecrawl` — scraping web para proveedores (key en `.env`)
  - `sequential-thinking` — razonamiento estructurado paso a paso
  - `github` — gestión del repositorio. **`enabled: false`** desde la sesión 010:
    el PAT estaba revocado (401). Se habilita exportando `GITHUB_PERSONAL_ACCESS_TOKEN`
    y poniendo `"enabled": true`. Mientras tanto, la terminal con `gh` cubre esa tarea.
- Las claves viven en `.env` (gitignorado), cargado por el shell; `opencode.json`
  las referencia con `{env:VARIABLE}` — nunca en texto plano.
- Skills:
  - `omarchy` — personalización de escritorio Linux (desarrollo local)

## Proveedores externos
- ItalSteel Odoo — proveedor **anterior** del catálogo (scrapeado via Python).
  Pendiente la migración: feature `008-cambio-proveedor` en el roadmap.
- WhatsApp API — envío de pedidos (enlace directo `wa.me`)
- Instagram — perfil de marca (`@Silver_Cow_Ambato`)
