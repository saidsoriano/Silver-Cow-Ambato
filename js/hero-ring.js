// ══════════════════════════════════════════════════
// HERO — ANILLO 3D (Three.js) + VIDEO DE RESPALDO (008)
// Muestra el anillo 3D en el canvas #gl; si el video
// (assets/hero-anillo.mp4) entra en reproducción, el video
// toma el relevo y el 3D se oculta. Si no hay WebGL o video,
// queda el fondo de gradiente del CSS. Los botones de vista
// (.chip) giran el anillo a Frontal / 3-4 / Lateral / Posterior.
// ══════════════════════════════════════════════════
(function () {
  'use strict';

  const hero   = document.getElementById('hero');
  const canvas = document.getElementById('gl');
  const video  = document.getElementById('ringVideo');
  if (!hero) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Visibilidad del canvas 3D (la controla el resultado del video) ──
  let visible = false;
  let ringVis = function () {};   // se reasigna si Three.js arranca

  // ── 1. Video: si reproduce, se muestra y oculta el 3D ──
  if (video) {
    let videoListo = false;

    const conVideo = () => {
      videoListo = true;
      hero.classList.add('has-video');
      ringVis(false);
    };
    const sinVideo = () => {
      if (videoListo) return;
      ringVis(true);
    };

    video.addEventListener('playing', conVideo);
    video.addEventListener('error', sinVideo);
    video.play().catch(function () {});

    // Si en 2.5 s no empezó a reproducir, mostramos el 3D
    setTimeout(function () { if (!videoListo) ringVis(true); }, 2500);
  } else {
    // Sin video: el 3D es el protagonista (si Three.js está disponible)
    setTimeout(function () { ringVis(true); }, 0);
  }

  // ── 2. Anillo 3D con Three.js (opcional) ──
  if (typeof THREE === 'undefined' || !canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    return;   // sin WebGL: queda el video o el gradiente
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const group = new THREE.Group();
  scene.add(group);

  // Aro exterior (plata)
  const aro = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.16, 32, 200),
    new THREE.MeshStandardMaterial({ color: 0xd9dee8, metalness: 1, roughness: 0.18 })
  );
  group.add(aro);

  // Hilo entrelazado (oro)
  const hilo = new THREE.Mesh(
    new THREE.TorusGeometry(1.16, 0.055, 24, 180),
    new THREE.MeshStandardMaterial({ color: 0xC9A84C, metalness: 1, roughness: 0.28 })
  );
  hilo.rotation.x = Math.PI / 2.4;
  group.add(hilo);

  // Gema (circonia) sobre el aro
  const gema = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.26, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffffff, metalness: 0.2, roughness: 0.05,
      transparent: true, opacity: 0.9
    })
  );
  gema.position.set(0, 1.62, 0);
  group.add(gema);

  // Luces
  scene.add(new THREE.AmbientLight(0x223055, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(4, 6, 6);
  scene.add(key);
  const luzAzul = new THREE.PointLight(0x2a4fa0, 2.6, 20);
  luzAzul.position.set(-5, 2, 3);
  scene.add(luzAzul);
  const luzOro = new THREE.PointLight(0xC9A84C, 1.6, 20);
  luzOro.position.set(3, -4, 2);
  scene.add(luzOro);

  // ── Orientación por vista ──
  const objetivo = { x: 0.35, y: -0.5 };   // arranca en "giro"
  const vistas = {
    giro:      { x: 0.35, y: -0.5 },
    frontal:   { x: 0,    y: 0 },
    tres:      { x: 0.4,  y: 0.8 },
    lateral:   { x: 0,    y: 1.57 },
    posterior: { x: 0,    y: 3.14 }
  };

  const chips = hero.querySelectorAll('.chip[data-v]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('on'); });
      chip.classList.add('on');
      const v = vistas[chip.getAttribute('data-v')];
      if (v) { objetivo.x = v.x; objetivo.y = v.y; }
    });
  });

  // ── Tamaño del canvas al del hero ──
  function resize() {
    const r = hero.getBoundingClientRect();
    const w = r.width  || window.innerWidth;
    const h = r.height || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ── ringVis real: enciende/apaga el canvas ──
  ringVis = function (on) {
    visible = !!on;
    canvas.style.opacity = visible ? '1' : '0';
  };

  // Estado inicial: si hay video y no se pidió movimiento reducido,
  // arranca oculto (el video decide); en caso contrario, visible.
  ringVis(!(video && !reduce));

  // ── Solo anima cuando el hero está en pantalla ──
  let enPantalla = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      enPantalla = entries[0].isIntersecting;
    }, { threshold: 0.05 }).observe(hero);
  }

  // ── Bucle ──
  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();

    if (!reduce) objetivo.y += 0.0016;   // deriva lenta continua

    group.rotation.x += (objetivo.x - group.rotation.x) * 0.06;
    group.rotation.y += (objetivo.y - group.rotation.y) * 0.06;
    gema.rotation.y = t * 0.8;

    if (visible && enPantalla) renderer.render(scene, camera);
  }
  loop();
})();
