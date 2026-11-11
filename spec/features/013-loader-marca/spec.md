# Especificación: Loader de marca

Cambio preparado y probado por el dueño fuera del repo (sesión 039) e
integrado por Claude Code el 2026-11-10 (ver `sesiones/sesion-040.md` §
"Integración en el repo").

## Qué hace
Al entrar a la página, el logo de la vaca se revela en plata, aparece la
línea dorada con gema y la frase "Exclusividad hecha plata", y un telón en
dos mitades se abre sobre el hero.

## Reglas
- Si el sitio está listo en menos de 350 ms: sin intro, solo un desvanecido.
- Intro mostrada: dura mínimo 1.5 s; tope de espera por recursos 3.5 s.
- No repite el mínimo en la misma sesión del navegador (`sessionStorage 'sc-intro'`).
- `prefers-reduced-motion`: logo fijo, sin espera mínima.
- Mientras carga, `html.sc-loading` bloquea el scroll y pausa las animaciones
  del hero. Red de seguridad: todo se libera a los 6 s pase lo que pase.
- Sin JavaScript: `<noscript>` oculta el loader.

## Archivos
`css/loader.css` (se carga ANTES que `estilos.css`), `js/loader.js`,
`assets/loader-logo.png`, bloque en el `<head>` y `<div id="sc-loader">` en
`index.html`. No toca `admin.html` ni `vendedor.html`.
