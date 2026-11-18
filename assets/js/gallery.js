/* Galeria: podgląd zdjęcia na pełnym ekranie, strzałki, klawiatura, przesuwanie palcem. */
(() => {
  'use strict';

  const SWIPE_MIN_PX = 50;

  const init = () => {
    const lb = document.getElementById('lightbox');
    const thumbs = [...document.querySelectorAll('.gallery-grid img')];
    if (!lb || !thumbs.length) return;

    const big = lb.querySelector('.lb-img');
    const counter = lb.querySelector('.lb-count');
    const btnClose = lb.querySelector('.lb-close');
    const btnPrev = lb.querySelector('.lb-prev');
    const btnNext = lb.querySelector('.lb-next');
    let index = 0;
    let opener = null;

    const fullSrc = (img) => img.dataset.full || img.currentSrc || img.src;

    const preload = (i) => {
      const img = new Image();
      img.src = fullSrc(thumbs[(i + thumbs.length) % thumbs.length]);
    };

    const show = (i) => {
      index = (i + thumbs.length) % thumbs.length;
      const thumb = thumbs[index];
      big.src = fullSrc(thumb);
      big.alt = thumb.alt;
      counter.textContent = `${index + 1} / ${thumbs.length}`;
      preload(index + 1);
      preload(index - 1);
    };

    const open = (i, trigger) => {
      opener = trigger || null;
      show(i);
      lb.classList.add('open');
      document.documentElement.classList.add('lb-open');
      btnClose.focus({ preventScroll: true });
    };

    const close = () => {
      if (!lb.classList.contains('open')) return;
      lb.classList.remove('open');
      document.documentElement.classList.remove('lb-open');
      big.removeAttribute('src');
      if (opener) opener.focus({ preventScroll: true });
    };

    thumbs.forEach((img, i) => {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Powiększ zdjęcie: ${img.alt}`);
      img.addEventListener('click', () => open(i, img));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(i, img);
        }
      });
    });

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', () => show(index - 1));
    btnNext.addEventListener('click', () => show(index + 1));

    /* Kliknięcie w tło zamyka, kliknięcie w zdjęcie i przyciski nie. */
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lb-figure')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'Tab') {
        const items = [btnClose, btnPrev, btnNext];
        const pos = items.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey ? pos - 1 : pos + 1;
        items[(next + items.length) % items.length].focus();
      }
    });

    let startX = null;
    let startY = null;
    lb.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
      show(dx < 0 ? index + 1 : index - 1);
    }, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
