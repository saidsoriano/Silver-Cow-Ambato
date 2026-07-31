# Plan: Catálogo desde Google Sheets

## Enfoque técnico
Google Sheets almacena los productos en 7 hojas (una por categoría). Un Google Apps Script con `doGet` recibe peticiones HTTP y devuelve JSON. El frontend (JS vanilla) hace fetch al script, cachea en localStorage y renderiza con el motor de catálogo.

## Archivos involucrados
- `scripts/google_apps_script.js` — Apps Script: `doGet`, `setupSheets`, `colorByStatus`
- `catalogo.js` — fetch desde Google Sheets + caché localStorage + indicador "Actualizando..."
- `catalogo_motor.js` — renderizado del grid, paginación (5/bloque), zoom, lazy loading

## Datos involucrados
- Columnas en Sheets: `nombre`, `precio`, `codigo`, `estado`, `esPedido`, `img`, `desc`
- `estado`: `disponible` | `pedido` | `agotado`
- `esPedido`: `FALSE` (stock directo) | `TRUE` (bajo pedido/consulta)
- Caché: localStorage key `silvercow_catalogo`
- Cache-busting: `?v=N` en URL del script

## Orden de implementación
1. Crear Google Sheets con 7 hojas y columnas definidas
2. Escribir y desplegar Google Apps Script
3. Implementar `catalogo.js` con fetch + caché
4. Implementar `catalogo_motor.js` con grid, paginación y zoom
5. Probar carga inicial, caché, actualización en background
