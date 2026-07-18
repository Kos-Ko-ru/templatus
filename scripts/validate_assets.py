# -*- coding: utf-8 -*-
"""validate_assets.py — синтаксис app.js (через node) и баланс скобок style.css."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

css = (ROOT / 'assets/css/style.css').read_text(encoding='utf-8')
o, c = css.count('{'), css.count('}')
print(f'CSS braces: open={o} close={c} ->', 'OK' if o == c else 'MISMATCH')

try:
    r = subprocess.run(['node', '--check', str(ROOT / 'assets/js/app.js')],
                       capture_output=True, text=True, timeout=30)
    print('app.js syntax:', 'OK' if r.returncode == 0 else f'ERROR\n{r.stderr[:500]}')
except FileNotFoundError:
    print('app.js syntax: node недоступен — пропуск')
