# Especificación: Catálogo desde Google Sheets

## Historia de usuario
> Como dueño de la joyería, quiero que los productos se carguen desde Google Sheets para poder actualizar el catálogo sin tocar código.

## Descripción
El sitio obtiene los productos desde Google Sheets a través de un Google Apps Script que expone los datos como JSON. Usa 7 hojas (una por categoría) y un script con `doGet` que recibe el parámetro `categoria` para filtrar. Implementa caché en localStorage para mostrar datos al instante en visitas repetidas, con actualización en background.

## Criterios de aceptación
- [ ] El sitio carga los productos desde Google Sheets al abrir la página
- [ ] Cada categoría se sirve desde su propia hoja en Sheets
- [ ] Los datos se cachean en localStorage con clave `silvercow_catalogo`
- [ ] En visitas repetidas, se muestra la caché al instante y se refresca en background
- [ ] Un indicador "Actualizando..." aparece durante la recarga en background
- [ ] El cache-busting usa `?v=N` manual (no `Date.now()`)
- [ ] Si la red falla, se muestra el catálogo desde caché con un aviso
- [ ] Las columnas de Sheets son: `nombre`, `precio`, `codigo`, `estado`, `esPedido`, `img`, `desc`
- [ ] La URL del script tiene un parámetro `v` para invalidar caché manualmente

## Dependencias
- Google Sheets con 7 hojas creadas (una por categoría)
- Google Apps Script desplegado como web app
- Archivo: `scripts/google_apps_script.js`
- Archivo: `catalogo.js` (fetch + caché)
- Archivo: `catalogo_motor.js` (renderizado)
