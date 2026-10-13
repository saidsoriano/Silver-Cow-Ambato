// ══════════════════════════════════════════════════
// SPOTLIGHT + TILT EN TARJETAS DE PRODUCTO (ReactBits 008)
// El brillo dorado sigue al cursor (--mx / --my) y la tarjeta
// se inclina levemente. Funciona con las tarjetas que crea el
// motor (catalogo_motor.js) sin modificarlo: usa delegación de
// eventos sobre el documento.
// Solo desktop con puntero fino y sin "movimiento reducido".
// ══════════════════════════════════════════════════
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce || !fine) return;

  const MAX_TILT = 3;          // inclinación máxima en grados
  let current = null;          // tarjeta activa
  let raf = false;             // evita recalcular más de una vez por frame
  let lastX = 0, lastY = 0;    // última posición del cursor

  function pintar() {
    raf = false;
    if (!current) return;

    const rect = current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = Math.min(Math.max((lastX - rect.left) / rect.width, 0), 1);  // 0..1
    const py = Math.min(Math.max((lastY - rect.top) / rect.height, 0), 1);  // 0..1

    current.style.setProperty('--mx', (px * 100).toFixed(2) + '%');
    current.style.setProperty('--my', (py * 100).toFixed(2) + '%');

    const ry = (px - 0.5) * (MAX_TILT * 2);  // rotateY según X
    const rx = (0.5 - py) * (MAX_TILT * 2);  // rotateX según Y

    current.style.transform =
      'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' +
      ry.toFixed(2) + 'deg) translateY(-4px)';
  }

  function reposar() {
    if (!current) return;
    current.style.transform = '';
    current.style.transition = '';
    current = null;
  }

  function mover(e) {
    const card = e.target && e.target.closest ? e.target.closest('.joya-card') : null;

    if (!card) { reposar(); return; }

    if (card !== current) {
      reposar();
      current = card;
      // Movimiento más corto mientras se sigue el cursor
      current.style.transition = 'transform .15s ease-out';
    }

    lastX = e.clientX;
    lastY = e.clientY;

    if (!raf) { raf = true; requestAnimationFrame(pintar); }
  }

  document.addEventListener('pointermove', mover, { passive: true });
  document.addEventListener('pointerleave', reposar, { passive: true });
  window.addEventListener('scroll', reposar, { passive: true });
})();
