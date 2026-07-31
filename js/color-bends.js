// ══════════════════════════════════════════════════
// COLOR BENDS — port vanilla de ReactBits (Feature 006)
// Fondo animado WebGL (ondas de color con influencia del
// mouse) para el hero. Sin THREE, sin build: WebGL puro.
// Fallback silencioso: si no hay WebGL, el div queda
// vacío y se ve el fondo CSS original (hero-bg).
// Pausa al salir del viewport. Respeta reduced-motion.
// Paleta editable en CONFIG (solo se usan colores de la marca).
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  // ── CONFIG — edita aquí la apariencia ──
  const CONFIG = {
    colors: ['#0F2557', '#2a4fa0', '#C9A84C', '#081840'], // zafiro, zafiro claro, oro, zafiro profundo
    rotation: 90,
    speed: 0.2,
    scale: 1,
    frequency: 1,
    warpStrength: 1,
    mouseInfluence: 1,
    parallax: 0.5,
    noise: 0.15,
    iterations: 1,
    intensity: 1.5,
    bandWidth: 6,
    transparent: true,
    autoRotate: 0,
    maxPixelRatio: 2,
    maxPixelRatioMobile: 1.5
  };

  const MAX_COLORS = 8;

  const VERT = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

  const FRAG = `
#define MAX_COLORS ${MAX_COLORS}
precision highp float;
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer; // in NDC [-1,1]
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

  for (int j = 0; j < 5; j++) {
    if (j >= uIterations - 1) break;
    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q += (rr - q) * 0.15;
  }

  vec3 col = vec3(0.0);
  float a = 1.0;

  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3); // strong response across 0..1
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0); // allow >1 to amplify displacement
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  } else {
    vec2 s = q;
    for (int k = 0; k < 3; ++k) {
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float m = mix(m0, m1, kMix);
      col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
    }
    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
  }

  col *= uIntensity;

  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }

  vec3 rgb = (uTransparent > 0) ? col * a : col;
  gl_FragColor = vec4(rgb, a);
}
`;

  const container = document.getElementById('colorBends');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── CONTEXTO WEBGL (con fallback silencioso) ──
  let gl = null;
  try {
    gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
  } catch (e) { gl = null; }
  if (!gl) {
    try { gl = canvas.getContext('experimental-webgl'); } catch (e) { gl = null; }
  }
  if (!gl) return; // sin WebGL → se ve el hero-bg original

  function crearShader(tipo, src) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[color-bends] error compilando shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = crearShader(gl.VERTEX_SHADER, VERT);
  const fs = crearShader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const programa = gl.createProgram();
  gl.attachShader(programa, vs);
  gl.attachShader(programa, fs);
  gl.linkProgram(programa);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
    console.warn('[color-bends] error enlazando programa:', gl.getProgramInfoLog(programa));
    return;
  }
  gl.useProgram(programa);

  // ── QUAD FULLSCREEN (2 triángulos) ──
  const posAttr = gl.getAttribLocation(programa, 'position');
  const uvAttr = gl.getAttribLocation(programa, 'uv');

  const bufPos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufPos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 0,   1, -1, 0,   1, 1, 0,   -1, 1, 0
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posAttr);
  gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);

  const bufUv = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufUv);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,   1, 0,   1, 1,   0, 1
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(uvAttr);
  gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);

  const bufIdx = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIdx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

  // ── UNIFORMS ──
  const U = {};
  ['uCanvas', 'uTime', 'uSpeed', 'uRot', 'uColorCount', 'uTransparent',
   'uScale', 'uFrequency', 'uWarpStrength', 'uPointer', 'uMouseInfluence',
   'uParallax', 'uNoise', 'uIterations', 'uIntensity', 'uBandWidth']
    .forEach(function (n) { U[n] = gl.getUniformLocation(programa, n); });

  U.uColors = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    U.uColors.push(gl.getUniformLocation(programa, 'uColors[' + i + ']'));
  }

  function toVec3(hex) {
    const h = hex.replace('#', '').trim();
    const v = h.length === 3
      ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    return [v[0] / 255, v[1] / 255, v[2] / 255];
  }

  const colores = CONFIG.colors.filter(Boolean).slice(0, MAX_COLORS).map(toVec3);
  gl.uniform1i(U.uColorCount, colores.length);
  for (let i = 0; i < MAX_COLORS; i++) {
    if (i < colores.length) gl.uniform3f(U.uColors[i], colores[i][0], colores[i][1], colores[i][2]);
    else gl.uniform3f(U.uColors[i], 0, 0, 0);
  }

  gl.uniform1i(U.uTransparent, CONFIG.transparent ? 1 : 0);
  gl.uniform1f(U.uSpeed, CONFIG.speed);
  gl.uniform1f(U.uScale, CONFIG.scale);
  gl.uniform1f(U.uFrequency, CONFIG.frequency);
  gl.uniform1f(U.uWarpStrength, CONFIG.warpStrength);
  gl.uniform1f(U.uMouseInfluence, CONFIG.mouseInfluence);
  gl.uniform1f(U.uParallax, CONFIG.parallax);
  gl.uniform1f(U.uNoise, CONFIG.noise);
  gl.uniform1i(U.uIterations, CONFIG.iterations);
  gl.uniform1f(U.uIntensity, CONFIG.intensity);
  gl.uniform1f(U.uBandWidth, CONFIG.bandWidth);

  // ── POINTER (escuchado en window, canvas no captura eventos) ──
  const target = new Float32Array([0, 0]);
  const current = new Float32Array([0, 0]);
  const lerp = function (a, b, t) { return a + (b - a) * t; };

  window.addEventListener('pointermove', function (e) {
    const r = container.getBoundingClientRect();
    target[0] = ((e.clientX - r.left) / (r.width || 1)) * 2 - 1;
    target[1] = -(((e.clientY - r.top) / (r.height || 1)) * 2 - 1);
  });

  // ── RESIZE ──
  const esMovil = window.matchMedia('(max-width: 767px)').matches;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, esMovil ? CONFIG.maxPixelRatioMobile : CONFIG.maxPixelRatio);

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    canvas.width = Math.round(w * pixelRatio);
    canvas.height = Math.round(h * pixelRatio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uCanvas, w, h);
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);
  else window.addEventListener('resize', resize);

  // ── PAUSA FUERA DE PANTALLA ──
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(container);
  }

  // ── LOOP ──
  gl.clearColor(0, 0, 0, CONFIG.transparent ? 0 : 1);
  const t0 = performance.now();
  let last = t0;
  let elapsed = 0;

  function render(dt) {
    const t = elapsed;
    gl.uniform1f(U.uTime, t);
    const deg = (CONFIG.rotation % 360) + CONFIG.autoRotate * t;
    const rad = deg * Math.PI / 180;
    gl.uniform2f(U.uRot, Math.cos(rad), Math.sin(rad));
    const amt = Math.min(1, dt * 8);
    current[0] = lerp(current[0], target[0], amt);
    current[1] = lerp(current[1], target[1], amt);
    gl.uniform2f(U.uPointer, current[0], current[1]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (visible) {
      if (!reduceMotion) elapsed += dt;
      render(dt);
      if (reduceMotion) return; // 1 frame estático y fin
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
