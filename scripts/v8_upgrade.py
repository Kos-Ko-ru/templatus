# -*- coding: utf-8 -*-
"""
v8 upgrade: массовый SEO/UX-пакет для templatus.ru
- bump ?v=7 -> ?v=8 для /assets/*.css|js
- canonical / og / twitter на всех страницах
- BreadcrumbList JSON-LD + видимые хлебные крошки на внутренних страницах
- Article JSON-LD (dateModified 2026-07-18) на статьях блога
- SoftwareApplication JSON-LD на главной
- alt для <img> без alt
- бейджи форматов + «Популярное» на индексах разделов
- блоки «Похожие шаблоны» / «Читайте также»
- sitemap.xml (lastmod 2026-07-18)
Идемпотентно. Не трогает рекламу, Метрику и JS-логику.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOMAIN = 'https://templatus.ru'
OG_IMAGE = f'{DOMAIN}/assets/images/og-image.jpg'
LASTMOD = '2026-07-18'

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

SKIP_SEO = {'yandex_593501ff17f38edf.html', '404.html'}

stats = {'version': 0, 'canonical': 0, 'og': 0, 'breadcrumb_ld': 0, 'breadcrumb_ui': 0,
         'article_ld': 0, 'software_ld': 0, 'alt': 0, 'badges': 0, 'related': 0, 'titles': 0}


def rel_url(path: Path) -> str:
    parts = list(path.relative_to(ROOT).parts)
    if parts[-1] == 'index.html':
        parts = parts[:-1]
    else:
        parts[-1] = re.sub(r'\.html$', '', parts[-1])
    return '/'.join(parts)


def page_url(path: Path) -> str:
    u = rel_url(path)
    return f'{DOMAIN}/{u}' if u else f'{DOMAIN}/'


def breadcrumb_items(path: Path, h1: str):
    parts = list(path.relative_to(ROOT).parts)
    if parts == ['index.html']:
        return None
    items = [('Главная', f'{DOMAIN}/')]
    if parts[0] in SECTIONS and len(parts) > 1:
        items.append((SECTIONS[parts[0]], f'{DOMAIN}/{parts[0]}/'))
    elif parts[0] in SECTIONS and parts[0] != 'index.html':
        pass
    if len(parts) >= 2 and parts[-1] != 'index.html':
        items.append((h1.strip(), page_url(path)))
    if len(items) < 2:
        return None
    return items


def get_h1(html: str) -> str:
    m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    if not m:
        return ''
    return re.sub(r'<[^>]+>', '', m.group(1)).replace('&amp;', '&').strip()


def get_title(html: str) -> str:
    m = re.search(r'<title>(.*?)</title>', html, re.S)
    return m.group(1).strip() if m else ''


def get_desc(html: str) -> str:
    m = re.search(r'<meta name="description" content="([^"]*)"', html)
    return m.group(1).strip() if m else ''


def bump_version(html: str) -> tuple:
    new, n = re.subn(r'(/assets/(?:css|js)/[^\'"\s]+?\.(?:css|js))\?v=\d+', r'\1?v=8', html)
    return new, n


def ensure_canonical(html: str, url: str) -> tuple:
    if 'rel="canonical"' in html:
        # нормализуем существующий
        new = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', html)
        return new, 0
    ins = f'  <link rel="canonical" href="{url}">\n'
    m = re.search(r'(<meta name="description"[^>]*>\n)', html)
    if m:
        return html.replace(m.group(1), m.group(1) + ins, 1), 1
    return html.replace('</head>', ins + '</head>', 1), 1


def ensure_og_twitter(html: str, url: str, title: str, desc: str, otype: str) -> tuple:
    added = 0
    def add_meta(marker, tag):
        nonlocal html, added
        if marker not in html:
            html = html.replace('</head>', '  ' + tag + '\n</head>', 1)
            added += 1
    add_meta('property="og:title"', f'<meta property="og:title" content="{title}">')
    add_meta('property="og:description"', f'<meta property="og:description" content="{desc}">')
    add_meta('property="og:type"', f'<meta property="og:type" content="{otype}">')
    add_meta('property="og:url"', f'<meta property="og:url" content="{url}">')
    add_meta('property="og:image"', f'<meta property="og:image" content="{OG_IMAGE}">')
    add_meta('property="og:locale"', '<meta property="og:locale" content="ru_RU">')
    add_meta('property="og:site_name"', '<meta property="og:site_name" content="templatus">')
    add_meta('name="twitter:card"', '<meta name="twitter:card" content="summary_large_image">')
    add_meta('name="twitter:title"', f'<meta name="twitter:title" content="{title}">')
    add_meta('name="twitter:description"', f'<meta name="twitter:description" content="{desc}">')
    add_meta('name="twitter:image"', f'<meta name="twitter:image" content="{OG_IMAGE}">')
    return html, added


def ensure_breadcrumb_ld(html: str, items) -> tuple:
    if not items or '"@type":"BreadcrumbList"' in html or '"@type": "BreadcrumbList"' in html:
        return html, 0
    data = {'@context': 'https://schema.org', '@type': 'BreadcrumbList',
            'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u}
                                for i, (n, u) in enumerate(items)]}
    tag = '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>\n'
    return html.replace('</head>', tag + '</head>', 1), 1


def ensure_breadcrumb_ui(html: str, items) -> tuple:
    if not items or 'aria-label="Хлебные крошки"' in html:
        return html, 0
    lis = []
    for i, (n, u) in enumerate(items):
        if i < len(items) - 1:
            lis.append(f'<li><a href="{u.replace(DOMAIN, "") or "/"}">{n}</a></li>')
        else:
            lis.append(f'<li aria-current="page">{n}</li>')
    nav = ('<nav class="breadcrumbs" aria-label="Хлебные крошки"><ol>' +
           ''.join(lis) + '</ol></nav>')
    # вставка: в page-header после <div class="container">, либо перед первым <h1
    m = re.search(r'(<section class="page-header">\s*<div class="container">)', html)
    if m:
        return html.replace(m.group(1), m.group(1) + '\n        ' + nav, 1), 1
    m = re.search(r'(\n\s*<h1)', html)
    if m and '<main' in html[:m.start()]:
        return html.replace(m.group(1), '\n        ' + nav + m.group(1), 1), 1
    return html, 0


def ensure_article_ld(html: str, url: str, h1: str, desc: str) -> tuple:
    data = None
    pat = re.compile(r'<script type="application/ld\+json">\s*(\{.*?"@type"\s*:\s*"Article".*?\})\s*</script>', re.S)
    m = pat.search(html)
    if m:
        try:
            data = json.loads(m.group(1))
        except Exception:
            data = None
    if data is None and '"Article"' in html:
        return html, 0  # есть, но не распарсили — не трогаем
    if data is None:
        data = {'@context': 'https://schema.org', '@type': 'Article'}
        data['headline'] = h1
        data['author'] = {'@type': 'Organization', 'name': 'templatus', 'url': f'{DOMAIN}/'}
        data['publisher'] = {'@type': 'Organization', 'name': 'templatus',
                             'logo': {'@type': 'ImageObject', 'url': f'{DOMAIN}/assets/images/icon-192.png'}}
        data['datePublished'] = '2026-01-15'
        data['mainEntityOfPage'] = {'@type': 'WebPage', '@id': url}
        data['description'] = desc
    data.setdefault('headline', h1)
    data['author'] = {'@type': 'Organization', 'name': 'templatus', 'url': f'{DOMAIN}/'}
    data['dateModified'] = LASTMOD
    data.setdefault('datePublished', '2026-01-15')
    data['image'] = OG_IMAGE
    data['mainEntityOfPage'] = {'@type': 'WebPage', '@id': url}
    tag = '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>'
    if m:
        return html[:m.start()] + tag + html[m.end():], 1
    return html.replace('</head>', tag + '\n</head>', 1), 1


def ensure_software_ld(html: str) -> tuple:
    if '"SoftwareApplication"' in html or '"WebApplication"' in html:
        return html, 0
    data = {'@context': 'https://schema.org', '@type': 'SoftwareApplication',
            'name': 'templatus — генератор резюме, документов и презентаций',
            'url': f'{DOMAIN}/', 'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Any', 'browserRequirements': 'Requires JavaScript',
            'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'RUB'}}
    tag = '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>\n'
    return html.replace('</head>', tag + '</head>', 1), 1


def fix_alts(html: str, h1: str) -> tuple:
    n = 0
    def repl(m):
        nonlocal n
        tag = m.group(0)
        if 'alt=' in tag or 'aria-hidden' in tag:
            return tag
        src = re.search(r'src="([^"]*)"', tag)
        name = Path(src.group(1)).stem if src else ''
        alt = h1 or ('templatus — иллюстрация' if not name else name.replace('-', ' '))
        n += 1
        return tag.replace('<img', f'<img alt="{alt}"', 1)
    new = re.sub(r'<img\b[^>]*>', repl, html)
    return new, n


def add_format_badges(html: str, formats) -> tuple:
    badges = '<div class="format-badges">' + ''.join(
        f'<span class="format-badge">{f}</span>' for f in formats) + '</div>'
    new, n = re.subn(r'(<a href="[^"]+" class="btn btn-primary btn-sm">(?:Создать|Заполнить))',
                     badges + r'\1', html)
    return new, n


def add_popular_badges(html: str, count: int) -> tuple:
    n = 0
    def repl(m):
        nonlocal n
        if n >= count:
            return m.group(0)
        n += 1
        return m.group(0) + '<span class="badge-popular"><i class="ph ph-fire" aria-hidden="true"></i>Популярное</span>'
    new = re.sub(r'<div class="template-preview">', repl, html)
    return new, n


def build_related_block(title: str, links) -> str:
    items = ''.join(
        f'<a class="related-link" href="{u}"><i class="ph ph-arrow-right" aria-hidden="true"></i><span>{t}</span></a>'
        for t, u in links)
    return (f'\n    <section class="section related-section" aria-label="{title}">\n'
            f'      <div class="container">\n'
            f'        <h2 class="related-title">{title}</h2>\n'
            f'        <div class="related-links">{items}</div>\n'
            f'      </div>\n    </section>\n  </main>')


def add_related(html: str, title: str, links) -> tuple:
    if 'related-section' in html or not links:
        return html, 0
    block = build_related_block(title, links)
    if '</main>' not in html:
        return html, 0
    return html.replace('</main>', block, 1), 1


def collect_cards(index_path: Path, section: str):
    """Парсим карточки индекса раздела -> [(title, url)]."""
    html = index_path.read_text(encoding='utf-8')
    out = []
    for m in re.finditer(r'<h3>(.*?)</h3>\s*<p>.*?</p>\s*<a href="([^"]+)"', html, re.S):
        t = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        u = m.group(2)
        if u.startswith('http'):
            continue
        if not u.startswith('/'):
            u = f'/{section}/{u}'
        out.append((t, u))
    return out


def collect_blog(index_path: Path):
    html = index_path.read_text(encoding='utf-8')
    out = []
    for m in re.finditer(r'<article class="card"[^>]*>.*?<a href="([^"]+)"[^>]*>.*?</a>.*?<h3>(.*?)</h3>', html, re.S):
        u, t = m.group(1), re.sub(r'<[^>]+>', '', m.group(2)).strip()
        if not u.startswith('/'):
            u = f'/blog/{u}'
        out.append((t, u))
    if not out:  # fallback: h3 -> a
        for m in re.finditer(r'<h3>(.*?)</h3>.*?<a href="([^"]+)"', html, re.S):
            t = re.sub(r'<[^>]+>', '', m.group(1)).strip()
            u = m.group(2)
            if not u.startswith('/'):
                u = f'/blog/{u}'
            out.append((t, u))
    return out


# релевантный шаблон для статей блога
BLOG_TEMPLATE_MAP = {
    'kak-sostavit-rezume': ('Резюме IT-специалиста', '/resume/it-specialist'),
    'rezume-bez-opyta-raboty': ('Резюме без опыта', '/resume/no-experience'),
    'rezume-buhgaltera': ('Резюме бухгалтера', '/resume/accountant'),
    'rezume-kassira': ('Резюме кассира', '/resume/cashier'),
    'rezume-medsestry': ('Резюме медсестры', '/resume/nurse'),
    'rezume-ohrannika': ('Резюме охранника', '/resume/security'),
    'rezume-povara': ('Резюме повара', '/resume/cook'),
    'rezume-voditelya': ('Резюме водителя', '/resume/driver'),
    'top-oshibok-v-rezume': ('Все шаблоны резюме', '/resume/'),
    'podgotovka-k-sobesedovaniyu': ('Резюме менеджера по продажам', '/resume/sales-manager'),
    'kak-napisat-soprovoditelnoye-pismo': ('Все шаблоны резюме', '/resume/'),
    'dogovor-arendy-kvartiry': ('Договор аренды квартиры', '/documents/dogovor-arendy'),
    'raspiska-dengi': ('Расписка о получении денег', '/documents/raspiska-dengi'),
    'doverennost-oformleniye': ('Доверенность', '/documents/doverennost'),
    'akt-priemki-imushchestva': ('Акт приёма-передачи', '/documents/akt-priemki'),
    'kommercheskoye-predlozheniye': ('Коммерческое предложение', '/documents/kommercheskoye-predlozheniye'),
    'zayavleniye-otpusk': ('Заявление на отпуск', '/documents/zayavlenie-otpusk'),
    'zayavleniye-uvolnenie': ('Заявление на увольнение', '/documents/zayavlenie-uvolnenie'),
    'biznes-plan': ('Презентация бизнес-плана', '/presentations/business-plan'),
    'pitch-dek-startapa': ('Питч-дек стартапа', '/presentations/pitch-deck'),
    'prezentatsiya-dlya-investorov': ('Питч-дек стартапа', '/presentations/pitch-deck'),
    'kvartalnyy-otchet': ('Квартальный отчёт', '/presentations/quarterly-report'),
    'marketingovaya-strategiya': ('Маркетинговая стратегия', '/presentations/marketing-strategy'),
    'avtomatizaciya-dokumentov': ('Все шаблоны документов', '/documents/'),
    'docx-pdf-pptx': ('Все шаблоны документов', '/documents/'),
    'zashchita-dannyh': ('Все шаблоны документов', '/documents/'),
}


def main():
    html_files = sorted(p for p in ROOT.rglob('*.html')
                        if '.git' not in p.parts and 'node_modules' not in p.parts)

    # собираем карточки разделов для перелинковки
    cards = {
        'resume': collect_cards(ROOT / 'resume' / 'index.html', 'resume'),
        'documents': collect_cards(ROOT / 'documents' / 'index.html', 'documents'),
        'presentations': collect_cards(ROOT / 'presentations' / 'index.html', 'presentations'),
    }
    blog_cards = collect_blog(ROOT / 'blog' / 'index.html')

    for path in html_files:
        html = path.read_text(encoding='utf-8')
        url = page_url(path)
        rel = rel_url(path)
        parts = rel.split('/') if rel else []
        is_home = (path.name == 'index.html' and len(parts) == 0)
        is_blog_article = len(parts) == 2 and parts[0] == 'blog'
        is_blog_index = rel == 'blog'
        is_section_index = path.name == 'index.html' and len(parts) == 1
        is_template = len(parts) == 2 and parts[0] in ('resume', 'documents', 'presentations')
        h1 = get_h1(html) or 'templatus'
        title = get_title(html)
        desc = get_desc(html)

        html, n = bump_version(html); stats['version'] += n

        if path.name not in SKIP_SEO:
            html, n = ensure_canonical(html, url); stats['canonical'] += n
            otype = 'article' if is_blog_article else 'website'
            html, n = ensure_og_twitter(html, url, title or h1, desc, otype); stats['og'] += n
            items = breadcrumb_items(path, h1)
            html, n = ensure_breadcrumb_ld(html, items); stats['breadcrumb_ld'] += n
            html, n = ensure_breadcrumb_ui(html, items); stats['breadcrumb_ui'] += n
            if is_blog_article:
                html, n = ensure_article_ld(html, url, h1, desc); stats['article_ld'] += n
            if is_home:
                html, n = ensure_software_ld(html); stats['software_ld'] += n
            html, n = fix_alts(html, h1); stats['alt'] += n

        # бейджи форматов на индексах разделов
        if rel == 'resume':
            html, n = add_format_badges(html, ['DOCX', 'PDF']); stats['badges'] += n
            html, n = add_popular_badges(html, 3); stats['badges'] += n
        elif rel == 'documents':
            html, n = add_format_badges(html, ['DOCX', 'PDF']); stats['badges'] += n
            html, n = add_popular_badges(html, 2); stats['badges'] += n
        elif rel == 'presentations':
            html, n = add_format_badges(html, ['PPTX']); stats['badges'] += n
            html, n = add_popular_badges(html, 1); stats['badges'] += n

        # перелинковка
        if is_template:
            sec = parts[0]
            self_url = '/' + rel
            links = [(t, u) for t, u in cards[sec] if u.rstrip('/') != self_url][:3]
            links.append((f'Все шаблоны: {SECTIONS[sec].lower()}', f'/{sec}/'))
            html, n = add_related(html, 'Похожие шаблоны', links); stats['related'] += n
        elif is_blog_article:
            slug = parts[1]
            others = [(t, u) for t, u in blog_cards if not u.endswith('/' + slug)][:2]
            tpl = BLOG_TEMPLATE_MAP.get(slug, ('Все шаблоны', '/resume/'))
            links = others + [tpl]
            html, n = add_related(html, 'Читайте также', links); stats['related'] += n

        path.write_text(html, encoding='utf-8')

    # sitemap.xml
    write_sitemap(html_files)

    print(json.dumps(stats, ensure_ascii=False, indent=1))


def write_sitemap(html_files):
    def prio_changefreq(rel: str):
        if rel == '':
            return '1.0', 'weekly'
        parts = rel.split('/')
        if len(parts) == 1:
            if parts[0] in ('resume', 'documents', 'presentations', 'blog'):
                return '0.9', 'weekly'
            if parts[0] == 'privacy':
                return '0.3', 'yearly'
            return '0.5', 'monthly'
        if parts[0] == 'blog':
            return '0.7', 'monthly'
        return '0.8', 'monthly'

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in html_files:
        if path.name in SKIP_SEO:
            continue
        rel = rel_url(path)
        p, c = prio_changefreq(rel)
        loc = f'{DOMAIN}/{rel}' if rel else f'{DOMAIN}/'
        lines.append('  <url>')
        lines.append(f'    <loc>{loc}</loc>')
        lines.append(f'    <lastmod>{LASTMOD}</lastmod>')
        lines.append(f'    <changefreq>{c}</changefreq>')
        lines.append(f'    <priority>{p}</priority>')
        lines.append('  </url>')
    lines.append('</urlset>')
    (ROOT / 'sitemap.xml').write_text('\n'.join(lines) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
