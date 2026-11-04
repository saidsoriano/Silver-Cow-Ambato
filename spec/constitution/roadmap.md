# Roadmap

## Features implementadas
| Feature | Estado | Sesión |
|---|---|---|
| 001-catalogo-sheets | ✅ Completa | sesion-001 |
| 002-diseno-luxury | ✅ Completa | sesion-001 |
| 003-carrito-whatsapp | ✅ Completa | sesion-001 |
| 004-importador-proveedor | ✅ Completa | sesion-001 |
| 005-mcps-opencode | ✅ Completa | sesion-002 |
| 006-reactbits-ports | ✅ Parcial (PixelCard + MagicBento + ColorBends + BlurText; CardNav y StaggeredMenu abortados por decisión del dueño) | sesion-004, sesion-005, sesion-006, sesion-007 |
| 007-correccion-bugs | ✅ Completa | sesion-010 |
| 008-rediseno-premium | 🔄 En curso (Fases 0-2 publicadas en `2ddbbb4`; 15/26 tareas hechas — ver tasks.md) | sesion-011, sesion-012, sesion-013 a 016 |
| 010-vista-admin | ✅ Completa (Firebase Firestore+Auth + Supabase Storage; Google Sheets congelado desde esta feature) | sesion-017 a 023 |
| 011-arreglos-pagina | 🔄 En curso — lista viva de arreglos chicos a la página pública, sin rediseño. Ítems 1-3 y 5 resueltos (hueco fila confianza, loop flecha carrusel, fotos carrusel, "destacada" manual desde el panel); ítem 4 (desalineación) esperando confirmación del dueño | sesion-025 a 027 |

## Features planeadas (priorizadas)
- [ ] **[Alta] 009-cambio-proveedor** — migrar importación de ItalSteel Odoo a posible nuevo proveedor con catálogo en Google Drive

> Renumeradas en la sesión 010 (006→007 por choque con `006-reactbits-ports`) y en
> la sesión 013 (008→009, 009→010): el número `008` lo tomó `008-rediseno-premium`,
> abierta en la sesión 011 sin que el roadmap se actualizara en su momento.
> `cambio-proveedor` sigue vigente, solo corrida un número.

## Descartadas
| Feature | Motivo |
|---|---|
| Pasarela de pago | El modelo de negocio es consulta por WhatsApp, no venta directa online |
| Login de usuarios | Sin backend, no hay dónde almacenar sesiones |
