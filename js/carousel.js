// ══════════════════════════════════════════════════
// CARRUSEL DE DESTACADOS — Silver Cow Ambato
// Vitrina horizontal curada (ReactBits 008, port vanilla).
// Reutiliza crearTarjeta() del motor y los datos de CATALOGO.
// Selección automática: hasta 2 piezas disponibles por categoría.
// Si hay pocas disponibles, completa con piezas bajo pedido.
//
// Comportamiento de auto-avance: pasos discretos "poco a poco"
// (como el bloque "Nuevos Ingresos" de la referencia Odoo), no un
// desplazamiento continuo. Cada INTERVALO avanza una tarjeta con
// scroll suave; al llegar al final vuelve al inicio. Se pausa con
// el puntero/foco encima o al tocar, y respeta movimiento reducido.
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  var ORDEN = ['pulseras', 'anillos', 'aretes', 'juegos', 'dijes', 'cadenas', 'cadenas_dijes'];
  var MAX = 8;      // tope de piezas en la vitrina (control manual desde el panel)

  var INTERVALO = 4000;  // ms entre cada paso automático (lento, "poco a poco")

  var seccion, track, prev, next, carrusel;
  var firma = '';
  var timer = null;
  var pausado = false;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    seccion = document.getElementById('destacados');
    track = document.getElementById('destacadosTrack');
    if (!seccion || !track) return;

    prev = seccion.querySelector('.carousel-prev');
    next = seccion.querySelector('.carousel-next');

    if (prev) prev.addEventListener('click', function () { mover(-1); });
    if (next) next.addEventListener('click', function () { mover(1); });
    track.addEventListener('scroll', limitarFlechas, { passive: true });
    window.addEventListener('resize', limitarFlechas);

    // Pausa el auto-avance mientras el visitante interactúa con la vitrina
    carrusel = seccion.querySelector('.carousel');
    if (carrusel) {
      carrusel.addEventListener('pointerenter', function () { pausado = true; });
      carrusel.addEventListener('pointerleave', function () { pausado = false; });
      carrusel.addEventListener('focusin', function () { pausado = true; });
      carrusel.addEventListener('focusout', function () { pausado = false; });
      carrusel.addEventListener('touchstart', function () { pausado = true; }, { passive: true });
      carrusel.addEventListener('touchend', function () { pausado = false; }, { passive: true });
    }

    esperarDatos(0);
  }

  // Sondea hasta que CATALOGO tenga datos y el motor esté listo.
  // Se re-renderiza si la firma de los datos cambia (el fetch corre en
  // segundo plano y puede reemplazar CATALOGO tras la primera pintura).
  function esperarDatos(intentos) {
    var hayDatos = (typeof CATALOGO !== 'undefined') && CATALOGO && Object.keys(CATALOGO).length > 0;
    var hayMotor = typeof crearTarjeta === 'function';

    if (hayDatos && hayMotor) {
      var nueva = firmaDe(CATALOGO);
      if (nueva !== firma) { firma = nueva; pintar(); }
      limitarFlechas();
    }

    if (intentos < 40) {
      setTimeout(function () { esperarDatos(intentos + 1); }, 400);
    }
  }

  // Firma barata para detectar cambios sin comparar todo el árbol.
  function firmaDe(datos) {
    var total = 0, disp = 0, k, i, arr;
    for (k in datos) {
      if (!Object.prototype.hasOwnProperty.call(datos, k)) continue;
      arr = datos[k] || [];
      total += arr.length;
      for (i = 0; i < arr.length; i++) {
        if (arr[i].estado === 'disponible') disp++;
      }
    }
    return Object.keys(datos).length + ':' + total + ':' + disp;
  }

  // Selección manual: solo piezas marcadas "destacada" desde el panel
  // admin (checkbox en js/admin/productos.js), en el orden de categorías
  // de ORDEN. Sin eso marcado, la sección queda vacía y se oculta.
  function seleccionar() {
    var sel = [], i, j, arr;
    for (i = 0; i < ORDEN.length && sel.length < MAX; i++) {
      arr = CATALOGO[ORDEN[i]] || [];
      for (j = 0; j < arr.length && sel.length < MAX; j++) {
        if (arr[j].destacada) sel.push(arr[j]);
      }
    }
    return sel;
  }

  function pintar() {
    var piezas = seleccionar();
    track.innerHTML = '';

    if (!piezas.length) { seccion.hidden = true; return; }

    for (var i = 0; i < piezas.length; i++) {
      var card = crearTarjeta(piezas[i]);
      card.setAttribute('role', 'listitem');
      track.appendChild(card);
    }

    seccion.hidden = false;

    // Si la sección ya está a la vista al mostrarce, revela sus bloques
    // (el observer global de .reveal solo dispara al cambiar la intersección).
    var rev = seccion.querySelectorAll('.reveal');
    for (var r = 0; r < rev.length; r++) {
      if (rev[r].getBoundingClientRect().top < window.innerHeight) {
        rev[r].classList.add('visible');
      }
    }

    setTimeout(limitarFlechas, 60);

    // Auto-avance sólo si hay más de una pieza y el usuario no pidió
    // menos movimiento. Si ya había uno en marcha, se reinicia.
    pararAuto();
    if (piezas.length > 1 && !prefiereQuieto()) iniciarAuto();
  }

  // Ancho de un paso: una tarjeta + el gap del track (16px)
  function anchoPaso() {
    var card = track.querySelector('.joya-card');
    return card ? (card.getBoundingClientRect().width + 16) : track.clientWidth * 0.8;
  }

  // Flecha "atrás": se detiene al llegar al inicio (no envuelve).
  // Flecha "adelante": al llegar al final, el siguiente clic vuelve al
  // inicio — pedido del propietario, mismo criterio que el auto-avance.
  function mover(dir) {
    var reduce = prefiereQuieto();
    if (dir > 0) {
      var max = track.scrollWidth - track.clientWidth;
      if (max > 2 && track.scrollLeft >= max - 2) {
        track.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
        return;
      }
    }
    track.scrollBy({ left: dir * anchoPaso(), behavior: reduce ? 'auto' : 'smooth' });
  }

  // Un paso del auto-avance: avanza una tarjeta con scroll suave y,
  // al llegar al final, vuelve al inicio (como la referencia Odoo).
  function autoPaso() {
    if (pausado || document.hidden || seccion.hidden) return;
    var max = track.scrollWidth - track.clientWidth;
    if (max <= 2) return;  // nada que desplazar
    if (track.scrollLeft >= max - 2) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: anchoPaso(), behavior: 'smooth' });
    }
  }

  // Habilita/deshabilita flechas según la posición del scroll.
  // "Atrás" se deshabilita al inicio (no envuelve). "Adelante" nunca
  // se deshabilita por llegar al final: ese clic vuelve al inicio (mover()).
  function limitarFlechas() {
    if (!track || !prev || !next) return;
    var max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = max <= 2;  // sin nada para desplazar: ambas flechas sin uso
  }

  function prefiereQuieto() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function iniciarAuto() {
    if (timer || prefiereQuieto()) return;
    timer = setInterval(autoPaso, INTERVALO);
  }

  function pararAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }
})();
