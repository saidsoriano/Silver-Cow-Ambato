# Plan: Importador de Proveedor (ItalSteel Odoo)

## Enfoque técnico
Script Python que usa requests para obtener el HTML de cada categoría del Odoo, beautifulsoup4 para parsear y extraer datos, y genera CSV + descarga imágenes. Las imágenes se guardan en carpetas por categoría.

## Archivos involucrados
- `extraer_proveedor.py` — script principal (excluido de git)
- `.venv/` — entorno virtual Python (excluido de git)

## Archivos generados
- `csv/{categoria}.csv` — CSV para importar a Google Sheets
- `{categoria}/{codigo}.jpg` — imágenes de productos

## Datos involucrados
- Categorías: pulseras, anillos, aretes, cadenas, cadenas_dijes, dijes, juegos
- Formato código: `[P-XX-NNN]`
- Nombres: generados cortos automáticamente desde el título del producto

## Orden de implementación
1. Crear entorno virtual e instalar dependencias
2. Implementar scraper por categoría
3. Implementar generación de CSV
4. Implementar descarga de imágenes
5. Probar con cada categoría
