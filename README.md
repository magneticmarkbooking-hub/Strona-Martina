# Martina Bernacka, strona wokalistki

Statyczna strona: HTML, CSS i JavaScript bez frameworka i bez budowania. Wystarczy wgrać zawartość folderu na dowolny hosting (FTP lub panel hostingu) tak, żeby `index.html` był w katalogu głównym domeny.

## Struktura

```
index.html                 strona główna
regulamin.html             regulamin strony (art. 8 ustawy o świadczeniu usług drogą elektroniczną)
polityka-prywatnosci.html  pełna informacja o przetwarzaniu danych (RODO)
rodo.html                  skrócona klauzula informacyjna RODO
polityka-cookies.html      polityka cookies
favicon.svg, robots.txt
assets/css/   style.css (wygląd strony i stopki), fonts.css, legal.css (dokumenty), consent.css (cookies, przycisk do góry)
assets/js/    main.js (menu, formularz, opinie), gallery.js (podgląd zdjęć ze strzałkami, klawiaturą i przesuwaniem palcem), ui.js (przycisk do góry, rok), consent.js (zgoda na filmy)
assets/fonts/ DM Sans, Cormorant Garamond, Italiana (woff2, licencja SIL OFL 1.1, pliki OFL-*.txt)
assets/img/   zdjęcia webp w kilku szerokościach (srcset)
```

## Prywatność

- Czcionki są na serwerze strony, strona nie łączy się z Google Fonts.
- Strona nie ma analityki ani pikseli reklamowych.
- Filmy z Instagrama i YouTube (`iframe.consent-embed` z `data-src` i `data-service`) wczytują się dopiero po zgodzie. Zgodę można dać na każdy serwis osobno.
- Przy pierwszej wizycie pasek na całą szerokość na dole: „Akceptuję wszystkie”, „Tylko niezbędne”, „Ustawienia”. W ustawieniach przełączniki Instagram i YouTube są domyślnie włączone.
- Decyzja jest w localStorage pod kluczem `mb-consent-v3`, ważna rok. Okrągły przycisk w lewym dolnym rogu i link „Ustawienia cookies” w stopce otwierają ustawienia ponownie. Wycofanie zgody przeładowuje stronę i usuwa filmy.
- Film na YouTube: „Nieobiecane Dni (Official Video)”, id `71Kitdyg4pE`.
- Formularz kontaktowy otwiera program pocztowy (`mailto:`), nie wysyła danych na serwer.

## Przed publikacją

1. Uzupełnij adres do korespondencji (żółte pole `<mark class="todo">` w regulaminie, polityce prywatności i klauzuli RODO), potem usuń znacznik. Martina występuje jako osoba fizyczna bez działalności gospodarczej, więc bez NIP i biura rachunkowego.
2. Domena: `martinabernacka.com`. Canonical, Open Graph (`assets/img/og-image.jpg` 1200×630), dane strukturalne Person, `sitemap.xml` i `robots.txt` już wskazują na tę domenę.

## Podgląd lokalny

```
python -m http.server 8000
```
i otwórz http://localhost:8000

Nie otwieraj `index.html` dwuklikiem z dysku (`file:///`). YouTube blokuje wtedy osadzony film (błąd 153), bo przeglądarka nie podaje adresu strony. Pod `http://` i na hostingu film działa.

## Publikacja na GitHub Pages

1. Repozytorium: Settings, Pages, Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
2. Strona będzie pod `https://magneticmarkbooking-hub.github.io/Strona-Martina/`. Plik `.nojekyll` wyłącza przetwarzanie przez Jekyll.
3. Podpięcie `martinabernacka.com`: najpierw DNS u rejestratora (rekordy A dla `@` na 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 oraz CNAME `www` na `magneticmarkbooking-hub.github.io`), potem w Settings, Pages, Custom domain wpisz `martinabernacka.com` (GitHub doda plik `CNAME`), a po wystawieniu certyfikatu zaznacz „Enforce HTTPS”. Pliku `CNAME` nie dodawaj wcześniej, bo adres github.io zacznie przekierowywać na domenę, która jeszcze nie działa.
4. Jeśli strona trafi na GitHub Pages, w polityce prywatności hostingiem jest GitHub, Inc.
