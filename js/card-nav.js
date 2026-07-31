/* ══════════════════════════════════════════════════
   CARD NAV — port de ReactBits (006) con GSAP
   Navbar flotante que expande tarjetas al hacer hover.
   Conserva: carrito, contador y efecto "scrolled".
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  function init() {
    const nav = document.getElementById('cardNav');
    if (!nav || typeof gsap === 'undefined') return;

    const content = document.getElementById('cardNavContent');
    const hamburger = document.getElementById('cardNavHamburger');
    const cards = content.querySelectorAll('.nav-card');

    // Reset del transform CSS del nav para que GSAP lo controle desde cero
    nav.style.transform = 'none';
    gsap.set(cards, { scaleX: 0, transformOrigin: 'center center' });
    gsap.set(content, { opacity: 0, visibility: 'hidden' });

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'expo.inOut' },
      onReverseComplete: () => {
        gsap.set(content, { visibility: 'hidden' });
      }
    });

    tl.to(content, {
      opacity: 1,
      duration: 0.15,
      onStart: () => gsap.set(content, { visibility: 'visible' })
    })
      .to(cards, { scaleX: 1, duration: 0.8, stagger: 0.06 }, '<')
      .to(nav, { y: 0, duration: 0.8 }, '<');

    gsap.set(nav, { y: -24 });

    let isOpen = false;

    function setAria(open) {
      hamburger.setAttribute('aria-expanded', String(open));
      content.setAttribute('aria-hidden', String(!open));
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      setAria(true);
      tl.timeScale(1);
      tl.play();
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      setAria(false);
      tl.timeScale(1.6);
      tl.reverse();
    }

    nav.addEventListener('mouseenter', open);
    nav.addEventListener('mouseleave', close);

    hamburger.addEventListener('click', () => (isOpen ? close() : open()));
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isOpen ? close() : open();
      }
    });

    nav.classList.toggle('scrolled', window.scrollY > 60);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
