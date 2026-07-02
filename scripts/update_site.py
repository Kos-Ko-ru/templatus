#!/usr/bin/env python3
"""Batch update templatus HTML files."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

LOGO_RE = re.compile(
    r'(<a href="/" class="logo"(?: aria-label="[^"]*")?>)(.*?)(</a>)',
    re.S,
)
LOGO_REPL = (
    r'<div class="header-brand">\1\2\3'
    r'<a href="https://kos-ko.ru" target="_blank" rel="noopener noreferrer" '
    r'class="kosko-badge" aria-label="Продукт kos-ko.ru">'
    r'<img src="/assets/images/kos-ko-logo.png" alt="kos-ko.ru" class="kosko-logo-light">'
    r'<img src="/assets/images/kos-ko-logo-dark.png" alt="kos-ko.ru" class="kosko-logo-dark">'
    r'<span class="kosko-label">продукт kos-ko.ru</span>'
    r'</a></div>'
)

FOOTER_RE = re.compile(r'(<div class="footer-bottom">)(.*?)(</div>)', re.S)
FOOTER_REPL = (
    r'<div class="footer-bottom"><span>\2</span>'
    r'<a href="https://kos-ko.ru" target="_blank" rel="noopener noreferrer" '
    r'class="kosko-footer" aria-label="Разработано компанией kos-ko.ru">'
    r'<span>Разработано компанией</span>'
    r'<img src="/assets/images/kos-ko-logo.png" alt="kos-ko.ru" class="kosko-logo-light">'
    r'<img src="/assets/images/kos-ko-logo-dark.png" alt="kos-ko.ru" class="kosko-logo-dark">'
    r'</a></div>'
)

ABS_HTML_RE = re.compile(r'https://templatus\.ru/([^"\'\s<>]*)\.html')
HREF_HTML_RE = re.compile(r'href="([^":]*)\.html"')
SEARCH_WRAP_RE = re.compile(r'class="template-search-wrap"')
GRID_RE = re.compile(
    r'<div id="(resume-grid|documents-grid|presentations-grid)" '
    r'class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">'
)
CARD_RE = re.compile(r'<article class="card" data-category=')


def main() -> None:
    for path in sorted(ROOT.rglob('*.html')):
        text = path.read_text(encoding='utf-8')
        original = text

        text = LOGO_RE.sub(LOGO_REPL, text)
        text = FOOTER_RE.sub(FOOTER_REPL, text)
        text = ABS_HTML_RE.sub(r'https://templatus.ru/\1', text)
        text = HREF_HTML_RE.sub(r'href="\1"', text)
        text = SEARCH_WRAP_RE.sub('class="shadcn-input-wrap"', text)
        text = GRID_RE.sub(r'<div id="\1" class="template-grid">', text)
        text = CARD_RE.sub('<article class="card card-template" data-category=', text)

        if text != original:
            path.write_text(text, encoding='utf-8')
            print(f'updated {path.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
