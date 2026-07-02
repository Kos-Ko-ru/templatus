from pathlib import Path
from datetime import datetime, timezone
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
DOMAIN = 'https://templatus.ru'

EXCLUDED = {
    '404.html',
    'yandex_593501ff17f38edf.html',
}


def page_url(path: Path) -> str:
    parts = list(path.relative_to(ROOT).parts)
    if parts[-1] == 'index.html':
        parts[-1] = ''
        url = '/'.join(parts).rstrip('/')
        if not url:
            url = '/'
    else:
        url = '/'.join(parts)
        url = __import__('re').sub(r'\.html$', '', url)
    return f'{DOMAIN}/{url}' if url != '/' else f'{DOMAIN}/'


def priority(path: Path) -> str:
    rel = path.relative_to(ROOT)
    parts = rel.parts
    name = rel.name
    if name == 'index.html' and len(parts) == 1:
        return '1.0'
    if name == 'index.html' and len(parts) == 2:
        return '0.9'
    if 'blog' in parts:
        return '0.7'
    if name.endswith('.html') and len(parts) == 2:
        return '0.8'
    if name in {'about.html', 'contacts.html', 'reviews.html'}:
        return '0.6'
    if name == 'privacy.html':
        return '0.4'
    return '0.5'


def main():
    urlset = ET.Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    urls = []
    for path in sorted(ROOT.rglob('*.html')):
        rel = path.relative_to(ROOT)
        if rel.name in EXCLUDED or rel.name.startswith('yandex_'):
            continue
        urls.append(path)

    for path in urls:
        url_elem = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url_elem, 'loc')
        loc.text = page_url(path)
        lastmod = ET.SubElement(url_elem, 'lastmod')
        mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
        lastmod.text = mtime.strftime('%Y-%m-%d')
        priority_elem = ET.SubElement(url_elem, 'priority')
        priority_elem.text = priority(path)

    tree = ET.ElementTree(urlset)
    ET.indent(tree, space='  ')
    sitemap_path = ROOT / 'sitemap.xml'
    tree.write(sitemap_path, encoding='utf-8', xml_declaration=True)
    print(f'generated {sitemap_path} with {len(urls)} urls')


if __name__ == '__main__':
    main()
