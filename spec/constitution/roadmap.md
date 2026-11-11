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
| 011-arreglos-pagina | ✅ Cerrada — lista viva de arreglos chicos al sitio público y al panel, sin rediseño. 16 de 17 ítems resueltos (carrusel curado a mano, buscador del catálogo, hotfix OAuth, bug real de Supabase en el panel, hero, auditoría de usabilidad Nielsen); ítem 4 (desalineación en el carrusel) cerrado sin resolver, el dueño nunca lo precisó | sesion-025 a 036 |
| 012-paneles-vendedores | ✅ Completa — 3 vendedores (DOME, SALO, SEBAS) con panel propio, pedidos web en Firestore, ventas en persona, comisiones/metas/bonos/pagos, avisos, Excel con historial, margen (solo admin). Plan gratis, sin Cloud Functions. Reglas versionadas y probadas (80 casos) | sesion-037, sesion-038 |
| 013-loader-marca | ✅ Completa — publicada y revisada por el dueño en iPhone | sesion-039, sesion-040 |
| 014-hero-video | ✅ Completa — 3 columnas con clips de joyas (IMG_6475, IMG_7450, IMG_6474), clips livianos para celular. `hero-ring.js` y `hero-anillo.mp4` borrados. Revisada por el dueño en iPhone | sesion-040 |

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
