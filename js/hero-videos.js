// ══════════════════════════════════════════════════
// HERO — VIDEOS DE FONDO (014)
// Escritorio (≥821px): todas las columnas (hoy 3) reproducen a la vez.
// Móvil: un clip a pantalla completa; cada 5.5 s se funde al siguiente
//        y solo se descarga el clip que va a entrar (ahorra datos).
// Siempre: pausa fuera de pantalla / pestaña oculta.
// Con prefers-reduced-motion o ahorro de datos: no reproduce, queda el poster.
// Ningún clip trae src en el HTML: acá se elige la versión según la pantalla
// (escritorio: data-src 720×1280; celular: data-src-m 540×960, ~40% menos peso)
// y, con movimiento reducido o ahorro de datos, no se descarga ninguno.
// ══════════════════════════════════════════════════
(function () {
  'use strict';

  var hero = document.getElementById('hero');
  var reel = document.getElementById('heroReel');
  if (!hero || !reel) return;

  var clips = [].slice.call(reel.querySelectorAll('.clip'));
  var vids  = clips.map(function (c) { return c.querySelector('video'); });
  var N = vids.length;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saver  = navigator.connection && navigator.connection.saveData;

  var ESCRITORIO = matchMedia('(min-width: 821px)');
  var ROTA_MS = 5500;
  var actual = 0, timer = null, visible = true;

  // Versión del clip según el ancho al momento de cargarlo. Una vez cargado no
  // se cambia (si se gira el celular o se agranda la ventana, sigue el mismo).
  function cargar(v) {
    if (v.getAttribute('src') || !v.dataset.src) return;
    v.preload = 'auto';                              // con preload=none no descargaría
    v.src = (!ESCRITORIO.matches && v.dataset.srcM) ? v.dataset.srcM : v.dataset.src;
  }
  function reproducir(v) {
    v.muted = true;                                  // iOS exige muted por JS además del atributo
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  function pausar(v) { try { v.pause(); } catch (e) {} }

  if (reduce || saver) {                             // solo cuadros fijos (poster), nada se descarga
    vids.forEach(pausar);
    return;
  }

  function activos() { return ESCRITORIO.matches ? vids : [vids[actual]]; }

  function mostrar(i) {                              // móvil: funde al clip i
    var previo = actual;
    actual = i;
    clips.forEach(function (c, k) { c.classList.toggle('on', k === i); });
    cargar(vids[i]);
    if (visible) reproducir(vids[i]);
    if (previo !== i) setTimeout(function () { if (actual !== previo) pausar(vids[previo]); }, 1300);
    cargar(vids[(i + 1) % N]);                       // precarga solo el siguiente
  }

  function arrancar() {
    clearInterval(timer);
    if (ESCRITORIO.matches) {
      clips.forEach(function (c) { c.classList.remove('on'); });
      vids.forEach(function (v) { cargar(v); if (visible) reproducir(v); });
    } else {
      vids.forEach(function (v, k) { if (k !== actual) pausar(v); });
      mostrar(actual);
      timer = setInterval(function () { if (visible) mostrar((actual + 1) % N); }, ROTA_MS);
    }
  }

  function alCambiarVisibilidad() {
    visible = !document.hidden && heroEnPantalla;
    if (visible) activos().forEach(reproducir);
    else vids.forEach(pausar);
  }

  var heroEnPantalla = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      heroEnPantalla = es[0].isIntersecting;
      alCambiarVisibilidad();
    }, { threshold: 0.05 }).observe(hero);
  }
  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  (ESCRITORIO.addEventListener ? ESCRITORIO.addEventListener('change', arrancar) : ESCRITORIO.addListener(arrancar));

  arrancar();
})();
