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
| 008-rediseno-premium | 🔄 En curso (local, sin visto bueno final; Fases 0-2 parciales + fusión de prototipo) | sesion-011, sesion-012 |

## Features planeadas (priorizadas)
- [ ] **[Alta] 009-cambio-proveedor** — migrar importación de ItalSteel Odoo a posible nuevo proveedor con catálogo en Google Drive
- [ ] **[Media] 010-vista-admin** — panel simple para que el dueño vea pedidos o gestione inventario sin tocar Sheets directamente

> Renumeradas en la sesión 010 (006→007 por choque con `006-reactbits-ports`) y en
> la sesión 013 (008→009, 009→010): el número `008` lo tomó `008-rediseno-premium`,
> abierta en la sesión 011 sin que el roadmap se actualizara en su momento.
> `cambio-proveedor` sigue vigente, solo corrida un número.

## Descartadas
| Feature | Motivo |
|---|---|
| Pasarela de pago | El modelo de negocio es consulta por WhatsApp, no venta directa online |
| Login de usuarios | Sin backend, no hay dónde almacenar sesiones |
