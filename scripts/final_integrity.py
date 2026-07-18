# -*- coding: utf-8 -*-
"""
final_integrity.py — финальная проверка целостности ВСЕХ .html сайта:
парсинг, ровно один <h1>, <title>, meta description, canonical,
валидность всех JSON-LD (json.loads), style.css только с ?v=8.
"""
import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
SKIP = {'yandex_593501ff17f38edf.html'}

problems = []
pages = 0
for path in sorted(ROOT.rglob('*.html')):
    if '.git' in path.parts or path.name in SKIP:
        continue
    pages += 1
    rel = str(path.relative_to(ROOT)).replace('\\', '/')
    raw = path.read_text(encoding='utf-8')
    try:
        soup = BeautifulSoup(raw, 'html.parser')
    except Exception as e:
        problems.append(f'{rel}: не парсится — {e}')
        continue

    h1s = soup.find_all('h1')
    if len(h1s) != 1:
        problems.append(f'{rel}: H1 x{len(h1s)}')

    if not (soup.title and soup.title.string and soup.title.string.strip()):
        problems.append(f'{rel}: нет <title>')

    desc = soup.find('meta', attrs={'name': 'description'})
    if not (desc and desc.get('content', '').strip()):
        problems.append(f'{rel}: нет meta description')

    if not soup.find('link', rel='canonical'):
        problems.append(f'{rel}: нет canonical')

    for i, s in enumerate(soup.find_all('script', type='application/ld+json')):
        try:
            json.loads(s.string or '')
        except Exception as e:
            problems.append(f'{rel}: JSON-LD #{i} невалиден — {e}')

    for l in soup.find_all('link', href=True):
        if '/assets/css/style.css' in l['href'] and '?v=8' not in l['href']:
            problems.append(f'{rel}: style.css без ?v=8 — {l["href"]}')

print(f'Проверено страниц: {pages}')
print(f'Проблемных файлов: {len(set(p.split(":")[0] for p in problems))}')
if problems:
    for p in problems:
        print(' -', p)
else:
    print('Все проверки пройдены. Проблем нет.')
