# Tech Stack

## Lenguajes
- HTML5, CSS3, JavaScript (vanilla, sin frameworks ni bundlers)
- Python 3 (solo para script local de importación de proveedor)

## Frameworks y librerías
- Google Fonts: Cormorant Garamond + Montserrat
- Sin frameworks JavaScript ni CSS

## Base de datos
- **Firestore** (Firebase, proyecto `silver-cow-admin`, plan Spark) — fuente de
  verdad del catálogo desde la feature `010-vista-admin` (sesiones 017-023).
  Colección `productos/`, doc ID = código de la pieza
- **Supabase Storage** (proyecto `silver-cow-storage`, plan Free, bucket
  `fotos-productos`) — fotos subidas desde el panel. Las fotos de los 357
  productos originales siguen sirviéndose desde el repo (GitHub Pages), no se
  migraron
- **Feature `012-paneles-vendedores`:** sigue en plan gratis (Spark), sin
  Cloud Functions. Roles por documento `roles/{uid}`, borrado de pedidos con
  TTL de Firestore, cuentas de vendedor a mano en la consola. Reglas de
  Firestore versionadas en el repo (`firestore.rules`), probadas con el
  emulador (`scripts/test-reglas.mjs`). La política TTL se probó y **exige
  facturación**: los pedidos vencidos los borra el panel admin al abrirse
- **SheetJS 0.20.3** (`cdn.sheetjs.com`, oficial) para exportar a Excel desde
  el panel admin. Se importa recién al exportar (si el CDN falla, solo falla
  eso). No usar la 0.18.5 de npm: tiene fallas de seguridad conocidas
- Herramientas de desarrollo (no se publican): `firebase-tools@13` vía `npx`
  (deploy y emulador de reglas; la 14+ pide Java 21) y Node para
  `scripts/test-reglas.mjs` / `scripts/test-comisiones.mjs`
- localStorage en el navegador para caché del catálogo (sin cambios)
- Google Sheets (multi-sheet, 7 hojas) + Apps Script: **histórico**, congelado,
  ya no se lee ni se escribe desde ningún lado

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
  Pendiente la migración: feature `009-cambio-proveedor` en el roadmap
  (renumerada en la sesión 013, esta nota nunca se actualizó hasta ahora).
- WhatsApp API — envío de pedidos (enlace directo `wa.me`)
- Instagram — perfil de marca (`@Silver_Cow_Ambato`)
