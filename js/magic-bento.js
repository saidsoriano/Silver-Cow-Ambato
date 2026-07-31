// ══════════════════════════════════════════════════
// MAGIC BENTO — port vanilla de ReactBits (Feature 006)
// Grid con spotlight, border-glow, tilt, magnetismo,
// ripple al clic y partículas. Sin GSAP, sin build.
// Solo efectos en desktop (>=768px + mouse real).
// Respeta prefers-reduced-motion.
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqDesktop = window.matchMedia('(min-width: 768px) and (pointer: fine)');
  const tarjetas = document.querySelectorAll('.mb-card, .mb-tile');

  // ── RIPPLE AL CLIC (en todas las pantallas) ──
  tarjetas.forEach(function (t) {
    t.addEventListener('click', function (e) {
      const rect = t.getBoundingClientRect();
      const diametro = Math.max(rect.width, rect.height) * 2;
      const span = document.createElement('span');
      span.className = 'mb-ripple';
      span.style.width = span.style.height = diametro + 'px';
      span.style.left = (e.clientX - rect.left - diametro / 2) + 'px';
      span.style.top = (e.clientY - rect.top - diametro / 2) + 'px';
      t.appendChild(span);
      span.addEventListener('animationend', function () { span.remove(); });
    });
  });

  // Sin efectos si: movimiento reducido o pantalla no apta
  if (reduceMotion || !mqDesktop.matches) return;

  // ── SPOTLIGHT + BORDER-GLOW (vars CSS --mx/--my) ──
  tarjetas.forEach(function (t) {
    t.addEventListener('mousemove', function (e) {
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      t.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  // ── TILT + MAGNETISMO (rAF con lerp) ──
  const TILT_MAX = 7;   // grados máximos de rotación
  const MAG = 6;        // px máximos de atracción

  tarjetas.forEach(function (t) {
    let raf = null;
    let sx = 0, sy = 0, tx = 0, ty = 0;   // rotación
    let mx = 0, my = 0, tmx = 0, tmy = 0; // traslación

    function loop() {
      sx += (tx - sx) * 0.12;
      sy += (ty - sy) * 0.12;
      mx += (tmx - mx) * 0.16;
      my += (tmy - my) * 0.16;
      t.style.transform =
        'perspective(900px) rotateX(' + (-sy).toFixed(2) + 'deg) rotateY(' + sx.toFixed(2) + 'deg) translate3d(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px,0)';
      if (Math.abs(tx - sx) > 0.05 || Math.abs(ty - sy) > 0.05 ||
          Math.abs(tmx - mx) > 0.05 || Math.abs(tmy - my) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(loop);
    }

    t.addEventListener('mousemove', function (e) {
      const r = t.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * TILT_MAX;
      ty = py * TILT_MAX;
      tmx = px * MAG;
      tmy = py * MAG;
      start();
    });

    t.addEventListener('mouseleave', function () {
      tx = 0; ty = 0;
      tmx = 0; tmy = 0;
      start();
    });
  });

  // ── PARTÍCULAS (tarjeta destacada de #filosofia) ──
  const canvas = document.querySelector('.mb-featured .mb-particles');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let pts = [];
  let rafP = null;
  let visible = true;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const n = Math.min(55, Math.max(18, Math.floor(W * H / 14000)));
    pts = [];
    for (let i = 0; i < n; i++) {
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.6 + 0.6
      });
    }
  }

  function step() {
    if (!visible) { rafP = null; return; }
    ctx.clearRect(0, 0, W, H);

    // Líneas de conexión (oro, sutil)
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 110 * 110) {
          const a = (1 - Math.sqrt(d2) / 110) * 0.12;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = 'rgba(201,168,76,' + a.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Puntos (plata)
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      // Atracción suave hacia el cursor
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        p.x += dx / d * 0.6;
        p.y += dy / d * 0.6;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,208,220,.35)';
      ctx.fill();
    }

    rafP = requestAnimationFrame(step);
  }

  // Pausa cuando la tarjeta sale de pantalla
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !rafP) step();
    }).observe(canvas);
  }

  canvas.parentElement.addEventListener('mousemove', function (e) {
    const r = canvas.parentElement.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('mouseleave', function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener('resize', resize);
  resize();
  if (visible) step();
})();
