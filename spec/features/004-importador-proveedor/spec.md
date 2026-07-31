# Especificación: Importador de Proveedor (ItalSteel Odoo)

## Historia de usuario
> Como dueño, quiero extraer productos del catálogo del proveedor (ItalSteel Odoo) para importarlos a Google Sheets sin copiar a mano.

## Descripción
Script en Python que scrapea el catálogo público de ItalSteel Odoo. Navega las 7 categorías, extrae código, nombre, precio e imagen de cada producto, genera un CSV listo para importar a Google Sheets y descarga las imágenes a las carpetas correspondientes.

## Criterios de aceptación
- [ ] El script recibe un argumento: nombre de categoría o "todas"
- [ ] Extrae nombre, precio, código, imagen de cada producto
- [ ] Genera CSV con columnas: nombre, precio, codigo, estado, esPedido, img, desc
- [ ] Descarga imágenes como `{codigo}.jpg` en la carpeta de la categoría
- [ ] Funciona para las 7 categorías: pulseras, anillos, aretes, cadenas, cadenas_dijes, dijes, juegos
- [ ] El script está en .gitignore y no se sube a GitHub
- [ ] Usa entorno virtual `.venv/` con requests + beautifulsoup4
- [ ] Si la imagen ya existe en la carpeta de categoría, la salta y pasa a la siguiente

## Dependencias
- Python 3
- requests + beautifulsoup4 (en `.venv/`)
- URL base: `https://italsteeldistribuidora.odoo.com`
- Archivo: `extraer_proveedor.py`
