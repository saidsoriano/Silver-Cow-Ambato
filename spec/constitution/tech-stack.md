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
- GitHub Pages (auto-deploy en push a main)
- Despliegue: `git push` a rama `main`

## Control de versiones
- Git + GitHub
- Repositorio: `https://github.com/saidsoriano/Silver-Cow-Ambato.git`
- Rama única: `main`

## Herramientas de desarrollo
- IDE: OpenCode
- MCPs configurados (proyecto):
  - `playwright` — screenshots y pruebas visuales con navegador headless
  - `firecrawl` — scraping web para proveedores
  - `sequential-thinking` — razonamiento estructurado paso a paso
  - `github` — gestión del repositorio (issues, PRs, Actions)
- Skills:
  - `omarchy` — personalización de escritorio Linux (desarrollo local)

## Proveedores externos
- ItalSteel Odoo — proveedor actual de catálogo (scrapeado via Python)
- WhatsApp API — envío de pedidos (enlace directo `wa.me`)
- Instagram — perfil de marca (`@Silver_Cow_Ambato`)
