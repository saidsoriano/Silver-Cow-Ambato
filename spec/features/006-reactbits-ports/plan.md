# Plan — 006-reactbits-ports

1. Backup del código actual → `backups/backup_reactbits_2026-07-31.zip` ✅
2. Esqueleto: spec, GSAP CDN en `<head>`, `reactbits.css`.
3. PixelCard → hero (CTA "Iniciar una adquisición").
4. CardNav → reemplaza `#navbar` (carrito + scrolled conservados).
5. StaggeredMenu → reemplaza `#mobileMenu`.
6. MagicBento → `#filosofia` (6 tarjetas) y `#catalogo` (7 tarjetas).
7. Limpieza de legado: script inline `scrolled`, `#navbar`/`#mobileMenu` viejos.
8. QA local (server + Playwright) antes de git; si algo falla → pausar y reportar.
9. `sesiones/sesion-004.md`.
10. git add/commit/push SOLO tras validación local y confirmación del usuario.
