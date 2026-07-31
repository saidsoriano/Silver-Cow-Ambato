/* ══════════════════════════════════════════════════
   STAGGERED MENU — port de ReactBits (006) con GSAP
   Menú overlay a pantalla completa con capas de color
   escalonadas y wave de letras en los items.
   Se usa como menú móvil (desktop usa CardNav).
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  function splitLetters(el) {
    const text = el.textContent.trim();
    if (!text) return;
    el.textContent = '';
    text.split('').forEach((ch, i) => {
      const wrap = document.createElement('span');
      wrap.className = 'sm-item-letterWrap';
      wrap.style.zIndex = String(text.length - i);
      const letter = document.createElement('span');
      letter.className = 'sm-item-letter';
      letter.textContent = ch === ' ' ? '\u00A0' : ch;
      wrap.appendChild(letter);
      el.appendChild(wrap);
    });
  }

  function init() {
    const wrapper = document.getElementById('staggeredMenu');
    if (!wrapper || typeof gsap === 'undefined') return;

    const menuPanel = document.getElementById('smPanel');
    const prelayers = wrapper.querySelectorAll('.sm-prelayer');
    const toggle = document.getElementById('smToggle');
    const logo = wrapper.querySelector('.sm-logo');
    const headerActions = wrapper.querySelector('.sm-header-actions');
    const menuItemWraps = wrapper.querySelectorAll('.sm-panel-itemWrap');
    const socials = wrapper.querySelector('.sm-socials');
    if (!menuPanel || !toggle) return;

    menuItemWraps.forEach(wrap => {
      const label = wrap.querySelector('.sm-panel-itemLabel');
      if (label) splitLetters(label);
    });

    const numItems = menuItemWraps.length;
    const halfItems = Math.ceil(numItems / 2);

    // Reset del transform CSS: GSAP debe ser dueño absoluto del transform,
    // si no, absorbe el translateX(%) del CSS y lo duplica (bug de offset).
    menuPanel.style.transform = 'none';
    prelayers.forEach(p => { p.style.transform = 'none'; });

    gsap.set(menuPanel, { xPercent: 100 });
    gsap.set(prelayers, { xPercent: -100 });
    gsap.set(socials, { opacity: 0, y: 10 });

    const letterWraps = wrapper.querySelectorAll('.sm-item-letterWrap');
    gsap.set(letterWraps, { yPercent: 100 });

    const tl = gsap.timeline({ paused: true });
    tl.to(prelayers, { xPercent: 0, duration: 0.4, ease: 'power2.inOut', stagger: 0.08 })
      .set(menuPanel, { xPercent: 0 })
      .to(menuPanel, { xPercent: 0, duration: 0.4, ease: 'power2.inOut' }, '<0.06')
      .to([logo, headerActions], { opacity: 0, duration: 0.3, ease: 'power2.inOut' }, '<+0.5')
      .to(menuItemWraps, { y: 0, duration: 0.7, ease: 'power4.out', stagger: 0.08 }, '<')
      .to(letterWraps, { yPercent: 0, duration: 0.4, ease: 'power4.out', stagger: 0.02 }, '<+0.1')
      .to(socials, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '<+0.2')
      .to(menuPanel, { height: 0, duration: 0.5, ease: 'power2.inOut' }, '<0.06')
      .to(menuPanel, { height: '100%', duration: 0.5, ease: 'power2.inOut' }, '>-0.2')
      .to(menuPanel, { height: 0, duration: 0.5, ease: 'power2.inOut' }, '<')
      .to(menuPanel, { height: '100%', duration: 0.5, ease: 'power2.inOut' }, '<')
      .set(menuPanel, { height: 'auto' });

    gsap.set(menuItemWraps, { y: 80 });

    let isOpen = false;

    function setAria(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-open', open);
      menuPanel.setAttribute('aria-hidden', String(!open));
    }

    function toggleMenu() {
      isOpen = !isOpen;
      setAria(isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      if (isOpen) {
        tl.timeScale(1);
        tl.play();
      } else {
        tl.timeScale(1.2);
        tl.reverse();
      }
    }

    toggle.addEventListener('click', toggleMenu);
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });

    wrapper.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (isOpen) toggleMenu();
      });
    });

    if (window.scrollY > 60) wrapper.classList.add('scrolled');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
