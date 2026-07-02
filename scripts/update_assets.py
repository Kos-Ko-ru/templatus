import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PATTERN = re.compile(r'(?<=[\'"])(/assets/[^\'"\s]+?\.(css|js))(?!\?|#)(?=[\'"\s])')

for path in ROOT.rglob('*.html'):
    text = path.read_text(encoding='utf-8')
    new_text = PATTERN.sub(r'\1?v=4', text)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        print('updated', path.relative_to(ROOT))
