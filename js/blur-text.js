/* BlurText — port vanilla del componente ReactBits (https://reactbits.dev/text-animations/blur-text)
   Sin dependencias: cada palabra (o unidad) entra borrosa y resuelve a nítida con stagger.
   Uso: <h1 data-blur-text>...</h1> — los nodos de texto se parten por palabras; el <em> se
   trata como UNA unidad para preservar el degradado continuo del background-clip. */
(() => {
  'use strict';

  const CONFIG = {
    animateBy: 'words',   // 'words' | 'letters' (con el <em> siempre como unidad)
    direction: 'top',     // 'top' | 'bottom'
    delay: 200,           // ms entre unidades
    startDelay: 400,      // ms antes de la primera unidad (coordina con el eyebrow del hero)
    duration: 800,        // ms por unidad
    threshold: 0.1,
    rootMargin: '0px',
    easing: [0.25, 0.1, 0.25, 1],
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const px = 50; // desplazamiento inicial del texto (blur + translate)

  const fromTop = CONFIG.direction === 'top';

  const targets = document.querySelectorAll('[data-blur-text]');
  if (!targets.length) return;

  targets.forEach((container) => {
    container.classList.add('blur-ready');

    if (reducedMotion) return; // estado final directo

    const units = [];
    const splitWords = (text) => text.split(/\s+/).filter(Boolean);

    // Recorre el contenido: nodos de texto → palabras; <em> → 1 unidad; <br> se conserva.
    // replaceChild mantiene el orden original del título.
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const frag = document.createDocumentFragment();
        splitWords(node.textContent).forEach((word, i, arr) => {
          const span = document.createElement('span');
          span.className = 'blur-text-element';
          span.textContent = word;
          frag.appendChild(span);
          if (i < arr.length - 1) frag.appendChild(document.createTextNode('\u00A0'));
        });
        container.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'EM') {
        const span = document.createElement('span');
        span.className = 'blur-text-element';
        node.parentNode.replaceChild(span, node);
        span.appendChild(node); // el <em> entero como unidad (preserva el degradado)
      }
    });

    units.push(...container.querySelectorAll('.blur-text-element'));

    units.forEach((span, index) => {
      const delay = (CONFIG.startDelay + index * CONFIG.delay) / 1000;
      const duration = CONFIG.duration / 1000;
      const y0 = fromTop ? -px : px;
      const yMid = fromTop ? 5 : -5;
      span.style.opacity = '0';
      span.style.filter = 'blur(10px)';
      span.style.transform = `translate3d(0, ${y0}px, 0)`;
      span.style.animation = `blur-text-in ${duration}s cubic-bezier(${CONFIG.easing.join(',')}) ${delay}s both`;
      span.dataset.animated = 'false';
    });

    // Dispara la animación al entrar en viewport (el hero ya está visible al cargar)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              container.querySelectorAll('.blur-text-element').forEach((el) => {
                if (el.dataset.animated === 'false') {
                  el.classList.add('animate-in');
                  el.dataset.animated = 'true';
                }
              });
              observer.unobserve(container);
            }
          });
        },
        { threshold: CONFIG.threshold, rootMargin: CONFIG.rootMargin }
      );
      observer.observe(container);
    } else {
      // Fallback: animar de inmediato
      container.querySelectorAll('.blur-text-element').forEach((el) => el.classList.add('animate-in'));
    }
  });
})();
