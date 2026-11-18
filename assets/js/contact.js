/* Formularz kontaktowy.
   Z FORMSPREE_ID wysyła zapytanie bezpośrednio na e-mail Martiny (Formspree), bez otwierania poczty.
   Bez FORMSPREE_ID otwiera program pocztowy z gotową wiadomością (mailto), jak wcześniej.
   Po udanej wysyłce strona wysyła zdarzenie 'mb:lead' (dla piksela Meta, bez danych osobowych). */
(() => {
  'use strict';

  const FORMSPREE_ID = 'xnpdvoqj'; /* formularz Martiny, np. 'xyzabcde' z adresu https://formspree.io/f/xyzabcde */
  const EMAIL = 'martinabernacka.collab@gmail.com';

  const TEXT = {
    sending: 'Wysyłanie…',
    send: 'Wyślij zapytanie',
    ok: 'Odezwę się najszybciej, jak to możliwe, na adres e-mail podany w formularzu.',
    error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie albo napisz bezpośrednio na ',
    noteMail: 'Po kliknięciu otworzy się wiadomość w Twojej poczcie. Wysyłka następuje dopiero po jej zatwierdzeniu.',
    noteDirect: 'Wiadomość trafi bezpośrednio na mój adres e-mail. Odpowiem na adres, który podasz.'
  };

  const init = () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const button = form.querySelector('button[type="submit"]');
    const note = form.querySelector('.form-note');
    const status = form.querySelector('.form-status');
    const useFormspree = FORMSPREE_ID.trim() !== '';

    if (note) note.textContent = useFormspree ? TEXT.noteDirect : TEXT.noteMail;

    const fields = () => {
      const f = new FormData(form);
      return {
        name: (f.get('name') || '').trim(),
        email: (f.get('email') || '').trim(),
        type: f.get('type') || '',
        date: f.get('date') || 'Do ustalenia',
        location: (f.get('location') || '').trim() || 'Do ustalenia',
        message: (f.get('message') || '').trim(),
        honeypot: f.get('_gotcha') || ''
      };
    };

    const showStatus = (kind, text, withEmail) => {
      status.className = `form-status is-${kind}`;
      status.textContent = '';
      if (kind === 'ok') {
        const eyebrow = document.createElement('span');
        eyebrow.className = 'eyebrow';
        eyebrow.textContent = 'Wiadomość wysłana';
        const title = document.createElement('p');
        title.className = 'form-thanks-title';
        title.textContent = 'Dziękuję za wiadomość!';
        const body = document.createElement('p');
        body.className = 'form-thanks-text';
        body.textContent = text;
        status.append(eyebrow, title, body);
      } else {
        const body = document.createElement('p');
        body.className = 'form-thanks-text';
        body.textContent = text;
        if (withEmail) {
          const link = document.createElement('a');
          link.href = `mailto:${EMAIL}`;
          link.textContent = EMAIL;
          body.append(link, '.');
        }
        status.append(body);
      }
      const r = status.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      status.focus({ preventScroll: true });
    };

    const resetEventType = () => {
      const first = document.querySelector('#event-menu button');
      if (first) first.click();
    };

    const sendMailto = (d) => {
      const subject = `Zapytanie o oprawę muzyczną – ${d.type}`;
      const body = `Dzień dobry, chcę zapytać o termin.\nImię i nazwisko: ${d.name}\nE-mail: ${d.email}\nRodzaj wydarzenia: ${d.type}\nData: ${d.date}\nMiejsce: ${d.location}\n\n${d.message}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      document.dispatchEvent(new CustomEvent('mb:lead', { detail: { type: d.type, method: 'mailto' } }));
    };

    const sendFormspree = async (d) => {
      button.disabled = true;
      button.textContent = TEXT.sending;
      status.className = 'form-status';
      status.textContent = '';
      try {
        const res = await fetch(`https://formspree.io/f/${encodeURIComponent(FORMSPREE_ID)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: `Zapytanie ze strony: ${d.type}`,
            name: d.name,
            email: d.email,
            rodzaj_wydarzenia: d.type,
            data_wydarzenia: d.date,
            miejsce: d.location,
            message: d.message,
            _gotcha: d.honeypot
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showStatus('ok', TEXT.ok, false);
        form.reset();
        resetEventType();
        document.dispatchEvent(new CustomEvent('mb:lead', { detail: { type: d.type, method: 'formspree' } }));
      } catch (err) {
        showStatus('error', TEXT.error, true);
      } finally {
        button.disabled = false;
        button.textContent = TEXT.send;
      }
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = fields();
      if (d.honeypot) return; /* pole-pułapka wypełniają tylko boty */
      if (useFormspree) sendFormspree(d);
      else sendMailto(d);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
