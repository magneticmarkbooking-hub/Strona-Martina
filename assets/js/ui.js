/* Wspólne elementy wszystkich podstron: rok w stopce i pływający przycisk do góry. */
(() => {
  'use strict';

  const SHOW_AFTER_PX = 600;

  /* Wejście z innej podstrony na adres z kotwicą (np. index.html#kontakt):
     po wczytaniu fontów i zdjęć układ się zmienia, więc ustawiamy sekcję jeszcze raz pod nagłówkiem. */
  const alignHashTarget = () => {
    if (!window.location.hash) return;
    let target = null;
    try {
      target = document.querySelector(decodeURIComponent(window.location.hash));
    } catch (err) {
      return;
    }
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  window.addEventListener('load', () => {
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(alignHashTarget);
  });

  const init = () => {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Wróć na górę strony');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.append(btn);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    let ticking = false;
    const update = () => {
      btn.classList.toggle('is-visible', window.scrollY > SHOW_AFTER_PX);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
