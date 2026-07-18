# -*- coding: utf-8 -*-
"""Показать diff одного файла (только +/- строки)."""
import subprocess
import sys

f = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
out = subprocess.run(['git', 'diff', 'HEAD', '--', f], capture_output=True,
                     text=True, encoding='utf-8').stdout
lines = [l for l in out.splitlines() if (l.startswith('+') or l.startswith('-'))
         and not l.startswith('+++') and not l.startswith('---')]
print(f'{f}: +{sum(1 for l in lines if l.startswith("+"))} -{sum(1 for l in lines if l.startswith("-"))}')
for l in lines[:60]:
    print(l[:200])
