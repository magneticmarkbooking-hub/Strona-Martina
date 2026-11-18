/* Zgoda na treści zewnętrzne (Instagram, YouTube).
   Pasek na całą szerokość przy pierwszej wizycie, okno ustawień i pływający przycisk cookies w lewym dolnym rogu.
   Filmy wczytują się dopiero po kliknięciu, czyli po decyzji odwiedzającego. */
(() => {
  'use strict';

  const STORAGE_KEY = 'mb-consent-v3';
  const SERVICES = ['instagram', 'youtube'];
  const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; /* po roku pytamy ponownie */
  const DEFAULT_ON = true; /* przełączniki w ustawieniach domyślnie włączone (decyzja Marka) */

  const readConsent = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!SERVICES.every((s) => typeof data[s] === 'boolean')) return null;
      const age = Date.now() - Date.parse(data.ts);
      return Number.isFinite(age) && age < MAX_AGE_MS ? data : null;
    } catch (err) {
      return null;
    }
  };

  const writeConsent = (choice) => {
    const data = { instagram: !!choice.instagram, youtube: !!choice.youtube, ts: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      /* Brak pamięci przeglądarki: decyzja działa tylko do przeładowania strony. */
    }
    return data;
  };

  const all = (value) => SERVICES.reduce((acc, s) => ({ ...acc, [s]: value }), {});

  let current = readConsent();

  /* ---------- Osadzone filmy ---------- */

  const embedsOf = (service) => document.querySelectorAll(`iframe.consent-embed[data-service="${service}"]`);

  const loadEmbeds = (service) => {
    embedsOf(service).forEach((frame) => {
      if (frame.getAttribute('src') || !frame.dataset.src) return;
      frame.setAttribute('src', frame.dataset.src);
      const wrap = frame.closest('.embed-wrap');
      if (wrap) wrap.classList.add('is-loaded');
    });
  };

  const isLoaded = (service) => [...embedsOf(service)].some((f) => f.getAttribute('src'));

  /* ---------- Szablony ---------- */

  const COOKIE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 1 0 9 9 3.5 3.5 0 0 1-3.6-3.4A3.5 3.5 0 0 1 14 5.2 2.4 2.4 0 0 1 12 3Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="8.5" cy="10" r="1.1" fill="currentColor"/><circle cx="10.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor"/></svg>';

  const BANNER_HTML = `
    <div class="cc-bar-inner">
      <div class="cc-bar-text">
        <p class="cc-eyebrow">Prywatność</p>
        <h2 class="cc-bar-title" id="cc-bar-title">Pliki cookies</h2>
        <p>Strona sama nie śledzi odwiedzających. Rolki z Instagrama i film z YouTube zapisują pliki cookies tych serwisów. Wybierz, czy je pokazać. Szczegóły w <a href="polityka-cookies.html">polityce cookies</a>.</p>
      </div>
      <div class="cc-bar-actions">
        <button type="button" class="cc-btn cc-btn-solid" data-cc="accept">Akceptuję wszystkie</button>
        <button type="button" class="cc-btn" data-cc="reject">Tylko niezbędne</button>
        <button type="button" class="cc-link-btn" data-cc="settings">Ustawienia</button>
      </div>
    </div>`;

  const MODAL_HTML = `
    <div class="cc-modal-panel" role="dialog" aria-modal="true" aria-labelledby="cc-modal-title">
      <button type="button" class="cc-close" data-cc="close" aria-label="Zamknij ustawienia">×</button>
      <p class="cc-eyebrow">Prywatność</p>
      <h2 class="cc-title" id="cc-modal-title">Ustawienia cookies</h2>
      <p class="cc-text">Możesz włączyć lub wyłączyć każdy serwis osobno. Zmianę zapiszesz przyciskiem poniżej i możesz ją cofnąć w każdej chwili przyciskiem cookies w lewym dolnym rogu.</p>
      <div class="cc-options">
        <label class="cc-option"><span><strong>Niezbędne</strong><small>Zapamiętanie Twojego wyboru. Zawsze włączone.</small></span><input type="checkbox" checked disabled/><i aria-hidden="true"></i></label>
        <label class="cc-option"><span><strong>Instagram</strong><small>Rolki w sekcji „Zobacz i posłuchaj”. Pliki cookies Meta.</small></span><input type="checkbox" data-cc-service="instagram"/><i aria-hidden="true"></i></label>
        <label class="cc-option"><span><strong>YouTube</strong><small>Teledysk na dole sekcji. Pliki cookies Google.</small></span><input type="checkbox" data-cc-service="youtube"/><i aria-hidden="true"></i></label>
      </div>
      <div class="cc-actions">
        <button type="button" class="cc-btn" data-cc="save">Zapisz wybór</button>
        <button type="button" class="cc-btn cc-btn-solid" data-cc="accept">Akceptuję wszystkie</button>
      </div>
      <p class="cc-links"><a href="polityka-cookies.html">Polityka cookies</a><a href="polityka-prywatnosci.html">Polityka prywatności</a></p>
    </div>`;

  /* ---------- Interfejs ---------- */

  let fab = null;
  let bar = null;
  let modal = null;
  let lastFocus = null;

  const showBar = () => {
    if (bar) return;
    bar = document.createElement('section');
    bar.className = 'cc-bar';
    bar.setAttribute('aria-labelledby', 'cc-bar-title');
    bar.innerHTML = BANNER_HTML;
    document.body.append(bar);
    document.documentElement.classList.add('cc-bar-open');
    const el = bar;
    window.requestAnimationFrame(() => el.classList.add('is-visible'));
  };

  const hideBar = () => {
    if (!bar) return;
    const el = bar;
    bar = null;
    document.documentElement.classList.remove('cc-bar-open');
    el.classList.remove('is-visible');
    window.setTimeout(() => el.remove(), 320);
  };

  const syncToggles = () => {
    modal.querySelectorAll('[data-cc-service]').forEach((box) => {
      box.checked = current ? !!current[box.dataset.ccService] : DEFAULT_ON;
    });
  };

  /* Jedno okienko naraz: pasek chowa się na czas ustawień. */
  const openModal = () => {
    lastFocus = bar && bar.contains(document.activeElement) ? fab : document.activeElement;
    hideBar();
    syncToggles();
    modal.hidden = false;
    document.documentElement.classList.add('cc-modal-open');
    fab.setAttribute('aria-expanded', 'true');
    modal.querySelector('.cc-close').focus();
  };

  const closeModal = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.documentElement.classList.remove('cc-modal-open');
    fab.setAttribute('aria-expanded', 'false');
    if (!current) {
      /* Zamknięte bez wyboru: pasek wraca, filmy dalej zablokowane. */
      showBar();
      return;
    }
    const target = lastFocus && document.contains(lastFocus) ? lastFocus : fab;
    target.focus({ preventScroll: true });
  };

  const apply = (choice) => {
    const before = current;
    current = writeConsent(choice);
    hideBar();
    const revoked = SERVICES.some((s) => before && before[s] && !current[s] && isLoaded(s));
    if (revoked) {
      window.location.reload();
      return;
    }
    SERVICES.forEach((s) => { if (current[s]) loadEmbeds(s); });
  };

  const choiceFromToggles = () => {
    const choice = {};
    modal.querySelectorAll('[data-cc-service]').forEach((box) => { choice[box.dataset.ccService] = box.checked; });
    return choice;
  };

  const handleAction = (action) => {
    if (action === 'accept') { apply(all(true)); closeModal(); }
    if (action === 'reject') { apply(all(false)); closeModal(); }
    if (action === 'save') { apply(choiceFromToggles()); closeModal(); }
    if (action === 'settings') openModal();
    if (action === 'close') closeModal();
  };

  /* Tab nie wychodzi poza otwarte okno ustawień. */
  const trapFocus = (e) => {
    const items = [...modal.querySelectorAll('button, a[href], input:not([disabled])')];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const buildUi = () => {
    fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'cc-fab';
    fab.setAttribute('aria-label', 'Ustawienia cookies');
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = COOKIE_ICON;

    modal = document.createElement('div');
    modal.className = 'cc-modal';
    modal.hidden = true;
    modal.innerHTML = MODAL_HTML;

    document.body.append(modal, fab);

    fab.addEventListener('click', openModal);

    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-cc]');
      if (action && (modal.contains(action) || (bar && bar.contains(action)))) {
        handleAction(action.dataset.cc);
        return;
      }
      if (!modal.hidden && e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (modal.hidden) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab') trapFocus(e);
    });
  };

  /* ---------- Start ---------- */

  const init = () => {
    buildUi();

    document.querySelectorAll('[data-consent-open]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    document.querySelectorAll('[data-consent-accept]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const service = btn.dataset.consentAccept;
        if (!SERVICES.includes(service)) return;
        const wrap = btn.closest('.embed-wrap');
        apply({ ...(current || all(false)), [service]: true });
        if (wrap) {
          wrap.setAttribute('tabindex', '-1');
          wrap.focus({ preventScroll: true });
        }
      });
    });

    if (current) {
      SERVICES.forEach((s) => { if (current[s]) loadEmbeds(s); });
    } else {
      showBar();
    }
  };

  window.mbConsent = { open: () => openModal(), reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* brak pamięci */ } } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
