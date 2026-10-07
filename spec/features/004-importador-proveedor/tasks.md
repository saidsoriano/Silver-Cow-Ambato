# Tasks — 004-importador-proveedor

Verificado contra `extraer_proveedor.py`, `.gitignore` y `csv/` en la sesión 010 (2026-10-07).

- [x] Crear .venv e instalar requests + beautifulsoup4 — `requests-2.34.2`, `beautifulsoup4-4.15.0` (fijados en `requirements.txt` desde la sesión 010)
- [x] Implementar scraper que navegue cada categoría de ItalSteel Odoo — `CATEGORIAS`, `procesar_categoria()`
- [x] Extraer: nombre, precio, código, URL de imagen — `extraer_productos()`, `extraer_codigo()`
- [x] Generar CSV con columnas correctas — `csv.DictWriter` con las 7 columnas del Sheet
- [x] Descargar imágenes a carpeta de categoría — `descargar_imagen()`, salta las que ya existen
- [x] Agregar extraer_proveedor.py a .gitignore
- [x] Probar: .venv/bin/python extraer_proveedor.py pulseras — evidencia: `csv/csv_pulseras.csv` (2026-07-09)
- [x] Probar: .venv/bin/python extraer_proveedor.py todas — evidencia: los 7 `csv_*.csv` generados el mismo día

> Nota sesión 010: el proveedor ItalSteel Odoo es el proveedor **anterior**. La
> feature `008-cambio-proveedor` está planeada precisamente para migrar esto.
