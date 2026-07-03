import json
import re
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
DOMAIN = 'https://templatus.ru'
OG_IMAGE = f'{DOMAIN}/assets/images/og-image.jpg'

SECTIONS = {
    'resume': 'Резюме',
    'documents': 'Документы',
    'presentations': 'Презентации',
    'blog': 'Блог',
    'about': 'О нас',
    'contacts': 'Контакты',
    'reviews': 'Отзывы',
    'privacy': 'Политика конфиденциальности',
    'my-documents': 'Мои документы',
    'share': 'Поделиться',
}


def page_url_from_path(path: Path) -> str:
    rel = path.relative_to(ROOT)
    parts = list(rel.parts)
    if parts[-1] == 'index.html':
        parts[-1] = ''
        url = '/'.join(parts).rstrip('/')
        if not url:
            url = '/'
    else:
        url = '/'.join(parts)
        url = re.sub(r'\.html$', '', url)
    return f'{DOMAIN}/{url}' if url != '/' else f'{DOMAIN}/'


def clean_title(title: str) -> str:
    return re.sub(r'\s*[—|]\s*templatus.*$', '', title, flags=re.I).strip()


def clean_text(html: str) -> str:
    return re.sub(r'<[^>]+>', '', html).replace('\n', ' ').strip()


def build_breadcrumbs(path: Path, h1: str):
    rel = path.relative_to(ROOT)
    parts = list(rel.parts)
    if not parts or (parts[-1] == 'index.html' and len(parts) == 1):
        return None  # home page
    items = [{'name': 'Главная', 'item': f'{DOMAIN}/'}]
    if len(parts) >= 1 and parts[0] in SECTIONS:
        items.append({'name': SECTIONS[parts[0]], 'item': f'{DOMAIN}/{parts[0]}/'})
    if len(parts) >= 2 and parts[-1] != 'index.html':
        title = clean_title(h1) or clean_title(path.stem.replace('-', ' ').title())
        items.append({'name': title, 'item': page_url_from_path(path)})
    if len(items) <= 1:
        return None
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, **it}
            for i, it in enumerate(items)
        ],
    }


def remove_existing_breadcrumb(text: str) -> str:
    return remove_schema(text, 'BreadcrumbList')


def organization_schema():
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'templatus',
        'url': f'{DOMAIN}/',
        'logo': f'{DOMAIN}/assets/images/logo-with-name.png',
        'sameAs': ['https://kos-ko.ru'],
    }


def website_schema():
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'templatus',
        'url': f'{DOMAIN}/',
        'potentialAction': {
            '@type': 'SearchAction',
            'target': f'{DOMAIN}/?q={{search_term_string}}',
            'query-input': 'required name=search_term_string',
        },
    }


def add_missing_tags(text: str, url: str, title: str, description: str, og_type: str):
    tags = []
    # robots
    if '<meta name="robots"' not in text:
        tags.append('<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">')
    # theme-color
    if '<meta name="theme-color"' not in text:
        tags.append('<meta name="theme-color" content="#2563eb">')
    # Open Graph
    og_keys = {
        'og:title': title,
        'og:description': description,
        'og:type': og_type,
        'og:url': url,
        'og:image': OG_IMAGE,
        'og:locale': 'ru_RU',
        'og:site_name': 'templatus',
    }
    for key, value in og_keys.items():
        if f'property="{key}"' not in text:
            tags.append(f'<meta property="{key}" content="{value}">')
    # Twitter
    tw_keys = {
        'twitter:card': 'summary_large_image',
        'twitter:title': title,
        'twitter:description': description,
        'twitter:image': OG_IMAGE,
    }
    for key, value in tw_keys.items():
        if f'name="{key}"' not in text:
            tags.append(f'<meta name="{key}" content="{value}">')
    return tags


def remove_schema(text: str, type_name: str) -> str:
    return re.sub(
        rf'<script type="application/ld\+json">[^<]*"@type":"{re.escape(type_name)}"[^<]*</script>\s*',
        '',
        text,
    )


def inject_jsonld(text: str, data: dict) -> str:
    script = f'<script type="application/ld+json">{json.dumps(data, ensure_ascii=False, separators=(",", ":"))}</script>'
    return text.replace('</head>', script + '\n</head>')


def update_branding(text: str) -> str:
    favicon_old = '  <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">'
    favicon_new = '''  <link rel="shortcut icon" href="/assets/images/favicon.ico" type="image/x-icon">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">'''
    if favicon_old in text:
        text = text.replace(favicon_old, favicon_new)
    elif '<link rel="icon"' not in text and '<link rel="shortcut icon"' not in text:
        text = text.replace('</head>', favicon_new + '\n</head>')
    logo_old = '<a href="/" class="logo"><i class="ph ph-files" aria-hidden="true"></i> <span class="logo-text">Templatus</span></a>'
    logo_new = '<a href="/" class="logo"><img src="/assets/images/logo-with-name.png" alt="templatus" width="160" height="80" loading="eager"></a>'
    text = text.replace(logo_old, logo_new)
    text = text.replace('https://templatus.ru/assets/images/favicon.svg', 'https://templatus.ru/assets/images/logo-with-name.png')
    return text


def process_file(path: Path):
    text = path.read_text(encoding='utf-8')
    text = update_branding(text)
    title_m = re.search(r'<title>(.*?)</title>', text, re.S)
    if not title_m:
        return False
    title = clean_title(title_m.group(1).strip())
    desc_m = re.search(r'<meta name="description" content="([^"]*)"', text, re.I)
    description = desc_m.group(1).strip() if desc_m else title
    canon_m = re.search(r'<link rel="canonical" href="([^"]+)"', text)
    url = canon_m.group(1) if canon_m else page_url_from_path(path)
    h1_m = re.search(r'<h1[^>]*>(.*?)</h1>', text, re.S | re.I)
    h1 = clean_text(h1_m.group(1)) if h1_m else title

    og_type = 'article' if 'blog' in path.parts else 'website'

    tags = add_missing_tags(text, url, title, description, og_type)
    if tags:
        tag_block = '\n  ' + '\n  '.join(tags)
        # Insert before </head>, but after existing meta tags near top
        text = text.replace('</head>', tag_block + '\n</head>')

    # Structured data
    text = remove_schema(text, 'Organization')
    text = inject_jsonld(text, organization_schema())
    text = remove_schema(text, 'WebSite')
    text = inject_jsonld(text, website_schema())
    breadcrumbs = build_breadcrumbs(path, h1)
    if breadcrumbs:
        text = remove_existing_breadcrumb(text)
        text = inject_jsonld(text, breadcrumbs)

    # Image dimensions for Kos-Ko badge/footer logos
    text = text.replace(
        '<img src="/assets/images/kos-ko-logo.png" alt="Kos-Ko" class="kosko-logo-light">',
        '<img src="/assets/images/kos-ko-logo.png" alt="Kos-Ko" class="kosko-logo-light" width="274" height="201" loading="lazy">'
    )
    text = text.replace(
        '<img src="/assets/images/kos-ko-logo-dark.png" alt="Kos-Ko" class="kosko-logo-dark">',
        '<img src="/assets/images/kos-ko-logo-dark.png" alt="Kos-Ko" class="kosko-logo-dark" width="274" height="201" loading="lazy">'
    )

    path.write_text(text, encoding='utf-8')
    return True


def main():
    count = 0
    for path in ROOT.rglob('*.html'):
        rel = path.relative_to(ROOT)
        if rel.name.startswith('yandex_'):
            continue
        if process_file(path):
            count += 1
            print('updated', rel)
    print('total', count)


if __name__ == '__main__':
    main()
