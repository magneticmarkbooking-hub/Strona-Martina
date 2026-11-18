"""Wstawia style strony głównej bezpośrednio do index.html (szybsze pierwsze wyświetlenie).

Uruchom po każdej zmianie w assets/css/fonts.css, style.css albo consent.css:
    python narzedzia/wstaw-css.py
Podstrony z dokumentami nadal ładują te pliki jako zwykłe <link>.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START, END = '<!-- css:start -->', '<!-- css:end -->'
FILES = ['fonts.css', 'style.css', 'consent.css']


def build_css() -> str:
    parts = []
    for name in FILES:
        css = (ROOT / 'assets' / 'css' / name).read_text(encoding='utf-8')
        # ścieżki fontów są względem assets/css, a w index.html względem katalogu głównego
        css = css.replace('url(../fonts/', 'url(assets/fonts/')
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)  # komentarze
        css = re.sub(r'\s*\n\s*', '', css)                 # znaki nowej linii i wcięcia
        parts.append(css.strip())
    return ''.join(parts)


def main() -> None:
    index = ROOT / 'index.html'
    html = index.read_text(encoding='utf-8')
    if START not in html or END not in html:
        raise SystemExit('Brak znaczników css:start / css:end w index.html')
    head, rest = html.split(START, 1)
    _, tail = rest.split(END, 1)
    block = f'{START}<style>\n{build_css()}\n</style>{END}'
    index.write_text(head + block + tail, encoding='utf-8')
    print(f'Wstawiono {len(build_css()) // 1024} KB stylów do index.html')


if __name__ == '__main__':
    main()
