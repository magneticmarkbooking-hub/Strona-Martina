/* Meta Pixel i zdarzenia strony.
   Zdarzenia wyzwalają tylko świadome działania: kliknięcia, otwarcie zdjęcia, start filmu, wysyłka formularza.
   Samo przewijanie strony niczego nie wysyła (poza PageView przy wejściu).
   Piksel ładuje się dopiero po zgodzie na marketing (zdarzenie 'mb:consent' z consent.js).
   Zdarzenia sprzed decyzji czekają w kolejce: po zgodzie są wysyłane, po odmowie kasowane.
   Do Meta nie trafiają dane osobowe: tylko nazwy zdarzeń, sekcji, usług i serwisów. */
(() => {
  'use strict';

  const PIXEL_ID = '1469005161262582';

  let allowed = null; /* null: brak decyzji, true: zgoda, false: odmowa */
  const queue = [];

  /* ---------- Ładowanie piksela ---------- */

  const loadPixel = () => {
    if (window.mbPixelLoaded) return;
    window.mbPixelLoaded = true;
    /* Oficjalny kod bazowy Meta Pixel. */
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    /* Bez automatycznych zdarzeń Meta (kliknięcia przycisków, metadane): wysyłamy tylko zdarzenia z tego pliku. */
    window.fbq('set', 'autoConfig', false, PIXEL_ID);
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    queue.splice(0).forEach((args) => window.fbq(...args));
  };

  const send = (method, name, params) => {
    const args = params ? [method, name, params] : [method, name];
    if (allowed === true && window.fbq) window.fbq(...args);
    else if (allowed === null) queue.push(args);
  };

  const track = (name, params) => send('track', name, params);
  const trackCustom = (name, params) => send('trackCustom', name, params);

  /* Jednorazowe zdarzenie na wizytę strony (np. obejrzenie sekcji). */
  const sentOnce = new Set();
  const once = (key, fn) => {
    if (sentOnce.has(key)) return;
    sentOnce.add(key);
    fn();
  };

  document.addEventListener('mb:consent', (e) => {
    const decision = !!(e.detail && e.detail.marketing);
    if (decision) {
      allowed = true;
      loadPixel();
    } else {
      allowed = false;
      queue.length = 0;
    }
  });

  /* ---------- Zdarzenia ---------- */

  const SOCIAL = [
    ['instagram.com', 'Instagram'],
    ['tiktok.com', 'TikTok'],
    ['facebook.com', 'Facebook'],
    ['youtube.com', 'YouTube']
  ];

  const serviceName = (href) => {
    const hit = SOCIAL.find(([domain]) => href.includes(domain));
    return hit ? hit[1] : null;
  };

  const init = () => {
    const SECTION_NAMES = { '#o-mnie': 'O mnie', '#oferta': 'Oferta', '#galeria': 'Galeria', '#koncerty': 'Social media', '#opinie': 'Opinie', '#kontakt': 'Kontakt' };

    /* Opinie: kliknięcie strzałki lub kropki (raz na wizytę). */
    document.addEventListener('click', (e) => {
      if (e.target.closest('.testimonial-arrow, .testimonial-dot')) once('opinie', () => trackCustom('PrzegladOpinii'));
    });

    /* Kliknięcia linków: oferta, menu, e-mail, profile społecznościowe. */
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';

      const offer = link.closest('.offer');
      if (offer) {
        const usluga = (offer.querySelector('h3') || {}).textContent || 'Oferta';
        trackCustom('ZapytajOTermin', { usluga: usluga.trim() });
        return;
      }
      if (link.classList.contains('hero-editorial-link')) {
        track('ViewContent', { content_name: 'Oferta', content_category: 'Oprawa muzyczna i koncerty' });
        return;
      }
      if (link.closest('#nav, .site-footer nav') && SECTION_NAMES[hash]) {
        if (hash === '#oferta') track('ViewContent', { content_name: 'Oferta', content_category: 'Oprawa muzyczna i koncerty' });
        else trackCustom('KlikMenu', { sekcja: SECTION_NAMES[hash], miejsce: link.closest('#nav') ? 'menu' : 'stopka' });
        return;
      }
      if (href.startsWith('mailto:')) {
        track('Contact', { content_name: 'E-mail' });
        return;
      }
      const serwis = serviceName(href);
      if (serwis) {
        const miejsce = link.closest('.reel-card') ? 'rolka' : link.closest('footer') ? 'stopka' : 'sekcja';
        trackCustom('KlikSocial', { serwis, miejsce });
      }
    });

    /* Formularz: pierwsze kliknięcie w pole i udana wysyłka (contact.js). */
    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('focusin', () => once('form-start', () => trackCustom('StartFormularza')));
    }
    document.addEventListener('mb:lead', (e) => {
      const rodzaj = (e.detail && e.detail.type) || 'Zapytanie';
      track('Lead', { content_name: 'Formularz kontaktowy', content_category: rodzaj });
    });

    /* Galeria: otwarcie podglądu zdjęcia (gallery.js). */
    document.addEventListener('mb:gallery-open', () => once('gallery-open', () => trackCustom('Galeria')));

    /* Filmy: kliknięcie w odtwarzacz YouTube lub rolkę Instagrama przenosi fokus do ramki,
       a okno traci fokus. Tak wykrywamy start bez dodatkowych skryptów Google i Meta. */
    window.addEventListener('blur', () => {
      window.setTimeout(() => {
        const frame = document.activeElement;
        if (!frame || frame.tagName !== 'IFRAME') return;
        if (frame.dataset.service === 'youtube') {
          once('yt-play', () => trackCustom('OdtworzenieFilmu', { film: 'Nieobiecane Dni', serwis: 'YouTube' }));
        } else if (frame.dataset.service === 'instagram') {
          once(`ig-${frame.dataset.src}`, () => trackCustom('OdtworzenieFilmu', { film: frame.title, serwis: 'Instagram' }));
        }
      }, 0);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
