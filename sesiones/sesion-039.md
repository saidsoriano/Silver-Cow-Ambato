# Sesión 039 — Loader de marca "Plata que se pule" (2026-11-10)

**Estado:** Implementado y probado en headless (sin desplegar)
**Objetivo:** Reemplazar la carga inicial por una intro de marca, sin tocar funciones del sitio.

## Qué se hizo
- `css/loader.css` (nuevo) — dibujo y animaciones: logo como máscara con relleno de plata, barrido de brillo, línea dorada con gema, telón en dos mitades que se abre sobre el hero.
- `js/loader.js` (nuevo) — solo tiempos. "Listo" = DOM + tipografías + primer cuadro de `ringVideo` (tope 3.5 s).
- `assets/loader-logo.png` (nuevo, 45 KB) — logo recortado, solo canal alfa, usado como máscara.
- `index.html` — `<link>` de loader.css + preload del logo + script de red de seguridad (6 s) + `<div id="sc-loader">` al inicio del body + `<script src="js/loader.js" defer>`.

## Reglas de comportamiento
- Listo antes de 350 ms → sin intro, solo desvanecido de 250 ms.
- Intro mostrada → dura mínimo 1.5 s para no cortarse a medias; si el sitio tarda, espera.
- Misma sesión (`sessionStorage 'sc-intro'`) → no repite el mínimo de 1.5 s.
- `prefers-reduced-motion` → logo estático, sin espera mínima, desvanecido.
- Mientras carga: `html.sc-loading` bloquea scroll y pausa las animaciones del hero; se libera 350 ms después de empezar a abrirse el telón, así el h1 sube justo al revelarse.
- Sin JS: `<noscript>` oculta el loader.

## Pruebas (Chrome headless, CDN externos bloqueados)
Carga lenta (video +1.8 s) escritorio y móvil 390×844, carga rápida, movimiento reducido. Sin errores propios en consola.
Pendiente: QA en iPhone real (Safari: `-webkit-mask` y `100svh`).

## Notas
- El workflow de Pages ya copia `css/`, `js/` y `assets/`: no hizo falta tocar `pages.yml`.
- Solo afecta `index.html`; `admin.html` y `vendedor.html` no cambian.
