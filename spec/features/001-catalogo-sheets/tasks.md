# Tasks — 001-catalogo-sheets

Verificado contra el código y el endpoint vivo en la sesión 010 (2026-10-07).

- [x] Crear Google Sheets con 7 hojas (pulseras, anillos, aretes, cadenas, cadenas_dijes, dijes, juegos) — el endpoint devuelve exactamente esas 7 categorías
- [x] Definir columnas: nombre, precio, codigo, estado, esPedido, img, desc — `scripts/google_apps_script.js` y el Sheet coinciden
- [x] Escribir Google Apps Script con doGet, setupSheets, colorByStatus — `scripts/google_apps_script.js:6,61,132`
- [x] Desplegar como web app y obtener URL — responde 302 → JSON (seguir con `-L`)
- [x] Implementar fetch en catalogo.js con ?v=N — `catalogo.js:6,114`
- [x] Implementar localStorage cache con silvercow_catalogo — `catalogo.js:7`
- [x] Implementar indicador "Actualizando..." — `catalogo.js:18`
- [x] Implementar catalogo_motor.js con grid, paginación 5/bloque, zoom, lazy loading — `LIMITE = 5`, `.zoom-lens`, `loading="lazy"`
- [x] Importar CSVs con productos a cada hoja — 357 productos vivos en el Sheet
- [x] Probar: carga inicial, caché, refresco background, fallo de red — smoke test de la sesión 010: 18/18 checks, incluye render con `script.google.com` abortado
