/* ══════════════════════════════════════════════════
   PIXEL CARD — Port vanilla de ReactBits (006)
   Efecto de píxeles que brillan al pasar el mouse.
   Canvas único + requestAnimationFrame.
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initPixelCard(wrapper) {
    const gap = parseFloat(wrapper.dataset.gap) || 20;
    const speed = parseFloat(wrapper.dataset.speed) || 0.15;
    const colors = (wrapper.dataset.colors || '#C9A84C,#C8D0DC,#2A4FA0').split(',');

    const canvas = document.createElement('canvas');
    canvas.className = 'pixel-card-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let pixels = [];
    let rafId = null;
    let size = 1;

    function fit() {
      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      size = w / 60;
      build(w, h);
    }

    function build(w, h) {
      const spacing = size + gap;
      const cols = Math.max(1, Math.floor(w / spacing));
      const rows = Math.max(1, Math.floor(h / spacing));
      pixels = [];
      for (let i = 0; i < cols * rows; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        pixels.push({
          x: col * spacing,
          y: row * spacing,
          size,
          life: 1,
          direction: 1,
          delay: Math.random() * 2000,
          timer: 0,
          color: colors[i % colors.length],
          opacity: 0
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        if (p.opacity > 0) {
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;
    }

    function update() {
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        p.timer += speed;
        if (p.timer < p.delay) continue;
        p.life += p.direction * speed;
        p.opacity = Math.max(0, Math.min(1, p.life));
        if (p.life <= 0) {
          p.direction = 1;
          p.life = 1;
          p.timer = 0;
          p.delay = Math.random() * 1000;
        } else if (p.life >= 1) {
          p.direction = -1;
          p.timer = 0;
          p.delay = Math.random() * 2000;
        }
      }
      draw();
    }

    function loop() {
      update();
      rafId = requestAnimationFrame(loop);
    }

    function handleMove(e) {
      const rect = wrapper.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const radius = 90;
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        const dx = p.x + p.size / 2 - mx;
        const dy = p.y + p.size / 2 - my;
        if (Math.sqrt(dx * dx + dy * dy) < radius) {
          p.life = 1;
          p.direction = -1;
          p.delay = 0;
          p.timer = 0;
        }
      }
    }

    wrapper.appendChild(canvas);
    wrapper.addEventListener('mousemove', handleMove);

    if (!REDUCE_MOTION) {
      fit();
      rafId = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      fit();
    });
    ro.observe(wrapper);

    return function destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      wrapper.removeEventListener('mousemove', handleMove);
      ro.disconnect();
      canvas.remove();
    };
  }

  const wrappers = document.querySelectorAll('[data-pixel-card]');
  const cleanups = [];
  wrappers.forEach(w => cleanups.push(initPixelCard(w)));

  window.addEventListener('unload', () => {
    cleanups.forEach(fn => fn && fn());
  });
})();
