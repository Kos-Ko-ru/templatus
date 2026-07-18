# -*- coding: utf-8 -*-
"""deploy_step1.py — git add/commit/push (шаг 1 деплоя, запущен по явной команде владельца)."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def run(args):
    print('$', ' '.join(args))
    r = subprocess.run(args, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.stdout:
        print(r.stdout.strip())
    if r.stderr:
        print(r.stderr.strip(), file=sys.stderr)
    return r.returncode

rc = run(['git', 'add', '-A'])
if rc: sys.exit(rc)
rc = run(['git', 'commit', '-m', 'redesign: UX clarity, SEO package (structured data, breadcrumbs, interlinking, sitemap)'])
if rc: sys.exit(rc)
rc = run(['git', 'push', 'origin', 'main'])
if rc: sys.exit(rc)
run(['git', 'log', '--oneline', '-1'])
run(['git', 'rev-parse', 'HEAD'])
