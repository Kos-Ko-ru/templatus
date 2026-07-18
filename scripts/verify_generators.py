# -*- coding: utf-8 -*-
"""verify_generators.py — целостность генераторов, рекламы, Метрики, темы после правок."""
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
issues = []

GENERATORS = {
    'resume/it-specialist.html': ['resume-form', 'resume-preview', 'next-step', 'download-docx', 'download-pdf', 'step-1'],
    'documents/dogovor-arendy.html': ['doc-form'],
    'presentations/pitch-deck.html': ['pptx-form', 'pptx-preview'],
}

for rel, ids in GENERATORS.items():
    p = ROOT / rel
    soup = BeautifulSoup(p.read_text(encoding='utf-8'), 'html.parser')
    for i in ids:
        if not soup.find(id=i):
            issues.append(f'{rel}: нет #{i}')
    # формы и поля
    forms = soup.find_all('form')
    if not forms:
        issues.append(f'{rel}: нет <form>')
    inputs = soup.find_all(['input', 'textarea', 'select'])
    if len(inputs) < 3:
        issues.append(f'{rel}: подозрительно мало полей ({len(inputs)})')

# все страницы: реклама, метрика, тема, скрипты генераторов
for p in sorted(ROOT.rglob('*.html')):
    if '.git' in p.parts or p.name == 'yandex_593501ff17f38edf.html':
        continue
    rel = str(p.relative_to(ROOT))
    html = p.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    if rel != '404.html':
        if 'mc.yandex.ru/metrika' not in html:
            issues.append(f'{rel}: нет Яндекс.Метрики')
    if 'data-theme-toggle' not in html and rel != '404.html':
        issues.append(f'{rel}: нет переключателя темы')
    # рекламные плейсхолдеры не должны быть пустыми-испорченными
    for slot in soup.find_all(attrs={'data-ad-slot': True}):
        if not slot.get('data-ad-slot'):
            issues.append(f'{rel}: пустой data-ad-slot')
    # все локальные скрипты с ?v=8
    for s in soup.find_all('script', src=True):
        src = s['src']
        if src.startswith('/assets/') and '?v=8' not in src:
            issues.append(f'{rel}: скрипт без ?v=8 — {src}')
    for l in soup.find_all('link', href=True):
        href = l['href']
        if href.startswith('/assets/css/') and '?v=8' not in href:
            issues.append(f'{rel}: css без ?v=8 — {href}')
    # генераторные js на своих страницах
    if rel.startswith('resume/') and rel != 'resume/index.html':
        if 'resume-generator.js' not in html or 'resume-page.js' not in html:
            issues.append(f'{rel}: потеряны generator/page js')
    if rel.startswith('documents/') and rel != 'documents/index.html':
        if 'doc-generator.js' not in html or 'doc-page.js' not in html:
            issues.append(f'{rel}: потеряны generator/page js')
    if rel.startswith('presentations/') and rel != 'presentations/index.html':
        if 'pptx-generator.js' not in html or 'pptx-page.js' not in html:
            issues.append(f'{rel}: потеряны generator/page js')
    # перелинковка на генераторах и статьях
    parts = rel.replace('\\', '/').split('/')
    if (len(parts) == 2 and parts[1] != 'index.html'
            and parts[0] in ('resume', 'documents', 'presentations', 'blog')):
        if 'related-section' not in html:
            issues.append(f'{rel}: нет блока перелинковки')

print(f'Проблем целостности: {len(issues)}')
for i in issues:
    print(' -', i)
