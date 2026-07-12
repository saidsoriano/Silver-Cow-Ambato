# Silver Cow Ambato — AGENTS.md

## Architecture
- Static HTML/CSS/JS site hosted on GitHub Pages (no build tools, no server)
- Script load order in `index.html`: CONFIG inline → `catalogo.js` → `catalogo_motor.js` → inline carrito+cupones JS
- Data from Google Sheets via Apps Script; images in local category folders (`pulseras/`, `anillos/`, etc.)
- `catalogo_importar.csv` = master product list (221 products, original import)

## Google Sheets <> Site Data Flow
- Apps Script `doGet()` reads all sheet headers dynamically, serves per-sheet JSON
- Frontend expects per-product fields: `nombre`, `precio`, `codigo`, `estado`, `esPedido`, `img`, `desc`
  - `desc` combines codigo + description text (frontend extracts code via `\[[^\]]+\]`)
  - `estado`: `disponible` | `pedido` | `agotado`
  - `esPedido`: boolean — `FALSE` (in stock) | `TRUE` (bajo pedido/consulta)
- Apps Script line 40-41: builds `desc` = codigo + desc from sheet columns
- Cache-busting: manual `?v=N` in `SHEETS_URL` (increment when products change)
- localStorage cache key: `silvercow_catalogo`
- First Apps Script request after inactivity: ~5-10s cold start

## Key Commands
```bash
.venv/bin/python extraer_proveedor.py pulseras   # single category
.venv/bin/python extraer_proveedor.py todas       # all 7 categories
git add . && git commit -m "msg" && git push      # deploy to GitHub Pages
```

## Conventions
- Luxury brand — avoid "oferta", "descuento barato", "buy now"
- All pricing, discounts, and coupons are client-side only (no backend)
- Image naming: `{codigo}.jpg` (e.g., `P-PL-296.jpg`) in category folders
- Product code format: `[P-XX-NNN]` (e.g., `[P-PL-296]`)
- CONFIG object (inline in index.html): `WHATSAPP_NUM`, `INSTAGRAM_HANDLE`, `PLATA_LEY`, `ENVIO_*`
- `.gitignore`: `*.zip`, `.DS_Store`, `.env`, `.venv`, `extraer_proveedor.py`

## Quirks
- Apps Script `setupSheets()` uses header `desc` — CSV must match
- Changing column names requires updating BOTH Apps Script AND `catalogo_motor.js`
- `extraer_proveedor.py` only runs locally (excluded from git)
- GitHub Pages auto-deploys on push to main (~1-2 min delay)
