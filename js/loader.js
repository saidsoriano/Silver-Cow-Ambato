// ══════════════════════════════════════════════════
// LOADER DE MARCA (feature 013) — orquesta tiempos, no dibuja.
// El dibujo y las animaciones viven en css/loader.css; acá solo se
// decide CUÁNDO mostrar la intro y CUÁNDO abrir el telón.
//
// Reglas:
//  · "Listo" = DOM + tipografías del hero + primer cuadro del primer clip del hero (o tope de 3.5 s).
//  · Si está listo antes de SHOW_AT → no se muestra intro (solo un desvanecido).
//  · Si la intro ya se mostró, dura lo mínimo para no quedar a medias (INTRO_MS).
//  · En la misma sesión (sessionStorage) no se repite la intro larga.
//  · prefers-reduced-motion: logo estático y desvanecido, sin espera mínima.
// ══════════════════════════════════════════════════
(function () {
  'use strict';

  var root = document.documentElement;
  var el   = document.getElementById('sc-loader');
  if (!el) { root.classList.remove('sc-loading'); return; }

  var SHOW_AT  = 350;    // ms desde la navegación: antes de esto, carga "instantánea"
  var INTRO_MS = 1500;   // duración mínima de la intro una vez mostrada
  var CAP      = 3500;   // tope absoluto de espera por recursos
  var EXIT_MS  = 1450;   // duración de la salida (telón) antes de quitar el nodo

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var visto = false;
  try { visto = sessionStorage.getItem('sc-intro') === '1'; } catch (e) {}
  var introMs = (reduce || visto) ? 0 : INTRO_MS;

  var listo = false, mostrado = false, mostradoEn = 0, cerrado = false;

  function liberar() { root.classList.remove('sc-loading'); }
  function quitar()  { if (cerrado) return; cerrado = true; el.remove(); }

  // ── 1. Recursos realmente necesarios ──
  function esperaVideo() {
    var v = document.getElementById('heroClip1');
    if (!v) return Promise.resolve();
    var saver = navigator.connection && navigator.connection.saveData;
    if (reduce || saver) {               // sin reproducción: basta el cuadro fijo
      return new Promise(function (ok) {
        var img = new Image();
        img.onload = img.onerror = ok;
        img.src = v.getAttribute('poster');
      });
    }
    if (v.readyState >= 2) return Promise.resolve();
    return new Promise(function (ok) {
      v.addEventListener('loadeddata', ok, { once: true });
      v.addEventListener('error', ok, { once: true });
    });
  }
  function esperaFuentes() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('300 1em "Cormorant Garamond"'),
      document.fonts.load('400 1em "Montserrat"')
    ]).catch(function () {});
  }
  function esperaLogo() {
    return new Promise(function (ok) {
      var img = new Image();
      img.onload  = ok;
      img.onerror = function () { el.classList.add('no-mark'); ok(); };
      img.crossOrigin = 'anonymous';   // mismo modo que la máscara CSS: reutiliza el precargado
      img.src = 'assets/loader-logo.png';
    });
  }

  var recursos = Promise.all([esperaFuentes(), esperaVideo()]);
  var tope = new Promise(function (ok) { setTimeout(ok, CAP); });

  // ── 2. Estados ──
  function mostrar() {
    if (mostrado || listo) return;
    mostrado = true;
    mostradoEn = performance.now();
    try { sessionStorage.setItem('sc-intro', '1'); } catch (e) {}
    esperaLogo().then(function () { el.classList.add('is-in'); });
  }

  function rapido() {                    // listo antes de que se viera nada
    el.classList.add('is-fast');
    liberar();
    setTimeout(quitar, 300);
  }

  function salir() {                     // intro mostrada → abrir el telón
    el.classList.add('is-out');
    setTimeout(liberar, reduce ? 0 : 350);   // el hero arranca con el telón abriéndose
    setTimeout(quitar, reduce ? 300 : EXIT_MS);
  }

  function alEstarListo() {
    listo = true;
    if (!mostrado) { rapido(); return; }
    var falta = Math.max(0, introMs - (performance.now() - mostradoEn));
    setTimeout(salir, falta);
  }

  // ── 3. Arranque ──
  var espera = Math.max(0, SHOW_AT - performance.now());
  setTimeout(mostrar, espera);

  var dom = document.readyState === 'loading'
    ? new Promise(function (ok) { document.addEventListener('DOMContentLoaded', ok, { once: true }); })
    : Promise.resolve();

  Promise.race([Promise.all([dom, recursos]), tope]).then(alEstarListo);
})();
