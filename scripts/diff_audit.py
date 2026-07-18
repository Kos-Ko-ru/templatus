# -*- coding: utf-8 -*-
"""diff_audit.py — сверка git diff: реклама/Метрика/формы/скрипты не удалены."""
import subprocess
from collections import Counter

out = subprocess.run(['git', 'diff', 'HEAD', '--unified=0'], capture_output=True,
                     text=True, encoding='utf-8', cwd=__file__ + '/../..').stdout
removed = [l[1:] for l in out.splitlines() if l.startswith('-') and not l.startswith('---')]
added = [l[1:] for l in out.splitlines() if l.startswith('+') and not l.startswith('+++')]

CHECKS = ['data-ad-slot', 'mc.yandex', 'yandex.ru/ads', '<form', '<input', '<textarea',
          '<select', 'data-theme-toggle', 'resume-generator.js', 'doc-generator.js',
          'pptx-generator.js', 'download-docx', 'download-pdf', 'step-indicator',
          'application/ld+json']
print(f'строк удалено: {len(removed)}, добавлено: {len(added)}')
ok = True
for c in CHECKS:
    r = sum(1 for l in removed if c in l)
    a = sum(1 for l in added if c in l)
    flag = ''
    if c in ('data-ad-slot', 'mc.yandex', 'yandex.ru/ads', '<form', '<input', '<textarea',
             'data-theme-toggle', 'resume-generator.js', 'doc-generator.js', 'pptx-generator.js',
             'download-docx', 'download-pdf', 'step-indicator') and r > a:
        flag = ' <-- ПОТЕРЯ!'
        ok = False
    print(f'{c:25s} -{r:3d} +{a:3d}{flag}')
print('ИТОГ:', 'OK — ничего критичного не удалено' if ok else 'ЕСТЬ ПОТЕРИ')
