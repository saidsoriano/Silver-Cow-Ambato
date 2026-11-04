# Misión

## Nombre del proyecto
Silver Cow Ambato

## Descripción
Catálogo web de joyería de plata 925. Página estática para clientes finales, administrada por el dueño desde un panel propio (feature `010-vista-admin`, ver abajo). El cliente consulta productos, arma un carrito y envía el pedido por WhatsApp.

## Audiencia objetivo
Clientes directos en Ambato y envíos nacionales (Ecuador). Personas que buscan joyería de plata con calidad y exclusividad.

## Tono y estilo
Lujo, elegancia, exclusividad. Evitar "oferta", "descuento barato", "buy now". El precio es un dato necesario, no una promoción.

## Objetivos clave
- Mostrar el catálogo completo de productos con imágenes, precios y disponibilidad
- Permitir al cliente armar un carrito y enviar el pedido por WhatsApp
- Ser fácil de actualizar para el dueño (sin código, solo el panel de administración — ver abajo)
- Cargar rápido y funcionar sin backend (GitHub Pages)

## Alcance

**Incluye:**
- Catálogo con 7 categorías desde Firestore (hasta sesión 023: Google Sheets vía Apps Script)
- Caché en localStorage con actualización en background
- Carrito client-side con cálculo de envío, cupones y resumen
- Envío del pedido completo por WhatsApp
- Diseño responsive con estética luxury

**No incluye:**
- Pasarela de pago (todo es consulta por WhatsApp)
- Usuarios, login o registro **de clientes** (el panel de administración del
  propietario sí tiene login — ver abajo)

**Panel de administración (feature `010-vista-admin`, sesiones 017-023):**
- El propietario edita precio, stock y fotos del catálogo, y agrega o archiva
  piezas, desde `admin.html` — sin tocar Google Sheets. Login restringido a una
  sola cuenta de Google. **Firestore es la fuente de verdad del catálogo**;
  Google Sheets quedó congelado como respaldo histórico, sin leerse ni
  escribirse desde ningún lado. Ver `spec/features/010-vista-admin/spec.md`.

## Criterios de éxito
- El sitio carga en menos de 3 segundos en conexión móvil
- El dueño puede actualizar productos desde Sheets sin tocar código
- El cliente puede armar un pedido y enviarlo en menos de 1 minuto
