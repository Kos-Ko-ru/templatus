#!/usr/bin/env python3
"""Генератор новых шаблонов резюме."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESUME_DIR = ROOT / "resume"
BASE_FILE = RESUME_DIR / "it-specialist.html"
INDEX_FILE = RESUME_DIR / "index.html"
MY_DOCS_FILE = ROOT / "assets" / "js" / "my-documents.js"
SHARE_FILE = ROOT / "assets" / "js" / "share.js"

TEMPLATES = [
    {
        "page_id": "resume-psychologist",
        "slug": "psychologist",
        "profession_genitive": "психолога",
        "title": "Резюме психолога",
        "h1": "Резюме психолога",
        "position_placeholder": "Психолог",
        "category": "medical",
        "icon": "ph-brain",
        "keywords": "резюме психолога, шаблон резюме психолога, скачать резюме психолога, docx, pdf",
        "skills": [
            "Психологическое консультирование",
            "Когнитивно-поведенческая терапия (КПТ)",
            "Гештальт-терапия",
            "Психодиагностика",
            "Работа с кризисными состояниями",
            "Семейная психология",
            "Детская психология",
            "Групповая терапия",
            "Эмпатия и активное слушание",
            "Составление психологических заключений",
            "Документация",
            "Этика и конфиденциальность",
        ],
    },
    {
        "page_id": "resume-teacher",
        "slug": "teacher",
        "profession_genitive": "учителя",
        "title": "Резюме учителя",
        "h1": "Резюме учителя",
        "position_placeholder": "Учитель начальных классов",
        "category": "education",
        "icon": "ph-chalkboard-teacher",
        "keywords": "резюме учителя, шаблон резюме педагога, скачать резюме учителя, docx, pdf",
        "skills": [
            "Планирование уроков",
            "Разработка учебных программ",
            "Дифференцированное обучение",
            "Работа с детьми",
            "Воспитательная работа",
            "Подготовка к ОГЭ/ЕГЭ",
            "ИКТ в образовании",
            "Классное руководство",
            "Проведение мероприятий",
            "Работа с родителями",
            "Оценка знаний",
            "Педагогическое сопровождение",
        ],
    },
    {
        "page_id": "resume-engineer",
        "slug": "engineer",
        "profession_genitive": "инженера",
        "title": "Резюме инженера",
        "h1": "Резюме инженера",
        "position_placeholder": "Инженер-конструктор",
        "category": "it",
        "icon": "ph-gear",
        "keywords": "резюме инженера, шаблон резюме инженера, скачать резюме инженера, docx, pdf",
        "skills": [
            "Проектирование и моделирование",
            "AutoCAD / Компас-3D",
            "Техническая документация",
            "Чтение чертежей",
            "Расчет конструкций",
            "Подбор материалов",
            "Прототипирование",
            "Контроль качества",
            "Взаимодействие с производством",
            "Нормоконтроль",
            "Технический английский",
            "Работа в multidisciplinary команде",
        ],
    },
    {
        "page_id": "resume-economist",
        "slug": "economist",
        "profession_genitive": "экономиста",
        "title": "Резюме экономиста",
        "h1": "Резюме экономиста",
        "position_placeholder": "Экономист",
        "category": "finance",
        "icon": "ph-coins",
        "keywords": "резюме экономиста, шаблон резюме экономиста, скачать резюме экономиста, docx, pdf",
        "skills": [
            "Экономический анализ",
            "Бюджетирование",
            "Финансовое планирование",
            "Управленческий учет",
            "1С",
            "Excel (сводные таблицы, VBA)",
            "Расчет себестоимости",
            "Инвестиционный анализ",
            "Рыночный анализ",
            "Отчетность",
            "Контроль затрат",
            "Прогнозирование",
        ],
    },
    {
        "page_id": "resume-logistician",
        "slug": "logistician",
        "profession_genitive": "логиста",
        "title": "Резюме логиста",
        "h1": "Резюме логиста",
        "position_placeholder": "Логист",
        "category": "management",
        "icon": "ph-truck",
        "keywords": "резюме логиста, шаблон резюме логиста, скачать резюме логиста, docx, pdf",
        "skills": [
            "Организация перевозок",
            "Работа с транспортными компаниями",
            "Складской учет",
            "Маршрутизация",
            "1С",
            "Документооборот",
            "ВЭД (импорт/экспорт)",
            "Переговоры с поставщиками",
            "Оптимизация логистических затрат",
            "Контроль сроков поставок",
            "Работа с таможней",
            "Анализ логистических процессов",
        ],
    },
    {
        "page_id": "resume-cosmetologist",
        "slug": "cosmetologist",
        "profession_genitive": "косметолога",
        "title": "Резюме косметолога",
        "h1": "Резюме косметолога",
        "position_placeholder": "Косметолог-эстетист",
        "category": "service",
        "icon": "ph-sparkle",
        "keywords": "резюме косметолога, шаблон резюме косметолога, скачать резюме косметолога, docx, pdf",
        "skills": [
            "Аппаратная косметология",
            "Инъекционные методики",
            "Уходовые процедуры",
            "Пилинги",
            "Массаж лица",
            "Подбор косметики",
            "Консультирование клиентов",
            "Стерилизация и дезинфекция",
            "Знание анатомии лица",
            "Работа с документацией клиента",
            "Продажа косметических услуг",
            "Художественное оформление бровей",
        ],
    },
    {
        "page_id": "resume-journalist",
        "slug": "journalist",
        "profession_genitive": "журналиста",
        "title": "Резюме журналиста",
        "h1": "Резюме журналиста",
        "position_placeholder": "Журналист",
        "category": "creative",
        "icon": "ph-newspaper",
        "keywords": "резюме журналиста, шаблон резюме журналиста, скачать резюме журналиста, docx, pdf",
        "skills": [
            "Написание статей",
            "Редактура",
            "Интервьюирование",
            "Работа с источниками",
            "SEO-копирайтинг",
            "SMM",
            "Создание контента",
            "Работа в CMS (WordPress, Tilda)",
            "Фоторепортаж",
            "Видеосъемка и монтаж",
            "Аналитика медиа",
            "Соблюдение дедлайнов",
        ],
    },
    {
        "page_id": "resume-photographer",
        "slug": "photographer",
        "profession_genitive": "фотографа",
        "title": "Резюме фотографа",
        "h1": "Резюме фотографа",
        "position_placeholder": "Фотограф",
        "category": "creative",
        "icon": "ph-camera",
        "keywords": "резюме фотографа, шаблон резюме фотографа, скачать резюме фотографа, docx, pdf",
        "skills": [
            "Портретная съемка",
            "Рекламная фотография",
            "Ретушь (Lightroom, Photoshop)",
            "Работа со светом",
            "Композиция",
            "Съемка мероприятий",
            "Предметная съемка",
            "Видеосъемка",
            "Работа с заказчиком",
            "Управление съемочным процессом",
            "Арт-дирекшн",
            "Ведение портфолио",
        ],
    },
    {
        "page_id": "resume-waiter",
        "slug": "waiter",
        "profession_genitive": "официанта",
        "title": "Резюме официанта",
        "h1": "Резюме официанта",
        "position_placeholder": "Официант",
        "category": "service",
        "icon": "ph-coffee",
        "keywords": "резюме официанта, шаблон резюме официанта, скачать резюме официанта, docx, pdf",
        "skills": [
            "Обслуживание гостей",
            "Знание меню",
            "Работа с POS-терминалом",
            "Прием заказов",
            "Сервировка стола",
            "Консультирование по напиткам",
            "Работа в команде",
            "Стрессоустойчивость",
            "Знание этикета",
            "Работа с кассой",
            "Быстрое обучение",
            "Клиентоориентированность",
        ],
    },
    {
        "page_id": "resume-tourism",
        "slug": "tourism-manager",
        "profession_genitive": "менеджера по туризму",
        "title": "Резюме менеджера по туризму",
        "h1": "Резюме менеджера по туризму",
        "position_placeholder": "Менеджер по туризму",
        "category": "sales",
        "icon": "ph-airplane-tilt",
        "keywords": "резюме менеджера по туризму, шаблон резюме туризм, скачать резюме туризм, docx, pdf",
        "skills": [
            "Продажа туров",
            "Консультирование клиентов",
            "Бронирование отелей и авиабилетов",
            "Знание туристических направлений",
            "Работа с поставщиками",
            "Оформление документов",
            "Страхование путешественников",
            "Работа с жалобами",
            "Туристическое законодательство",
            "Активные продажи",
            "Ведение клиентской базы",
            "Онлайн-сервисы бронирования",
        ],
    },
]


def build_skills_block(skills):
    labels = "\n".join(
        f'                    <label class="checkbox-row"><input type="checkbox" name="skills" value="{skill}"> {skill}</label>'
        for skill in skills
    )
    return f'                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">\n{labels}\n                  </div>'


def generate_html(base_html: str, t: dict) -> str:
    html = base_html
    prof = t["profession_genitive"]
    title_full = f"{t['title']} — бесплатный генератор | templatus"

    # Title
    html = re.sub(r"<title>.*?</title>", f"<title>{title_full}</title>", html)
    # Meta description
    html = re.sub(
        r'<meta name="description" content=".*?">',
        f'<meta name="description" content="Составьте резюме {prof} онлайн. Бесплатно, без регистрации. Скачайте готовое резюме в DOCX или PDF.">',
        html,
    )
    # Meta keywords
    html = re.sub(
        r'<meta name="keywords" content=".*?">',
        f'<meta name="keywords" content="{t["keywords"]}">',
        html,
    )
    # Canonical and schema URL
    html = re.sub(
        r'<link rel="canonical" href="https://templatus\.ru/resume/[^"]+">',
        f'<link rel="canonical" href="https://templatus.ru/resume/{t["slug"]}">',
        html,
    )
    # OG title
    html = re.sub(
        r'<meta property="og:title" content=".*?">',
        f'<meta property="og:title" content="{title_full}">',
        html,
    )
    # OG description
    html = re.sub(
        r'<meta property="og:description" content=".*?">',
        f'<meta property="og:description" content="Создайте профессиональное резюме {prof} за несколько минут. DOCX и PDF бесплатно.">',
        html,
    )
    # Schema JSON
    schema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": f"Генератор резюме {prof.title()}",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "RUB"},
        "url": f"https://templatus.ru/resume/{t['slug']}",
    }
    html = re.sub(
        r"<script type=\"application/ld\+json\">.*?</script>",
        f'<script type="application/ld+json">\n  {json.dumps(schema, ensure_ascii=False, indent=2)}\n  </script>',
        html,
        flags=re.DOTALL,
    )
    # Body data-page-id
    html = re.sub(
        r'<body data-page-id="[^"]+">',
        f'<body data-page-id="{t["page_id"]}">',
        html,
    )
    # H1
    html = re.sub(
        r'<h1 class="section-title">.*?</h1>',
        f'<h1 class="section-title">{t["h1"]}</h1>',
        html,
    )
    # Position placeholder
    html = re.sub(
        r'(<input type="text" id="position" name="position" placeholder=")([^"]+)(" required>)',
        rf'\g<1>{t["position_placeholder"]}\g<3>',
        html,
    )
    # Skills block
    skills_block = build_skills_block(t["skills"])
    html = re.sub(
        r'<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">\s*(<label class="checkbox-row">.*?</label>\s*)+\s*</div>',
        skills_block,
        html,
        flags=re.DOTALL,
    )
    return html


def build_card(t: dict) -> str:
    return f'''          <article class="card card-template" data-category="{t["category"]}">
          <div class="template-preview">
            <div class="tp-resume">
              <div class="tp-resume-photo"></div>
              <div class="tp-resume-col">
                <div class="tp-line highlight"></div>
                <div class="tp-line short"></div>
                <div class="tp-line"></div>
                <div class="tp-line"></div>
              </div>
            </div>
          </div>
          <div class="card-icon"><i class="ph {t["icon"]}" aria-hidden="true"></i></div>
            <h3>{t["title"]}</h3>
            <p>Готовый шаблон резюме для профессии {t["profession_genitive"]}.</p>
            <a href="{t["slug"]}" class="btn btn-primary btn-sm">Создать резюме</a>
          </article>'''


def update_index(templates):
    text = INDEX_FILE.read_text(encoding="utf-8")
    # Add education filter button after medical filter
    text = text.replace(
        '<button type="button" class="template-filter" data-filter="medical" aria-pressed="false">Медицина</button>',
        '<button type="button" class="template-filter" data-filter="medical" aria-pressed="false">Медицина</button>\n            <button type="button" class="template-filter" data-filter="education" aria-pressed="false">Образование</button>',
    )
    # Insert new cards before the closing </div> of #resume-grid
    cards = "\n".join(build_card(t) for t in templates)
    text = re.sub(
        r"(          </article>\s*)(\n        </div>\s*\n      </div>\s*\n    </section>)",
        rf"\1\n{cards}\2",
        text,
        flags=re.DOTALL,
    )
    INDEX_FILE.write_text(text, encoding="utf-8")


def update_registry(path, templates):
    text = path.read_text(encoding="utf-8")
    insert_after = "    'resume-nurse': { title: 'Резюме медсестры', url: '/resume/nurse', type: 'resume', icon: 'ph-heartbeat' },"
    new_lines = "\n".join(
        f"    '{t['page_id']}': {{ title: '{t['title']}', url: '/resume/{t['slug']}', type: 'resume', icon: '{t['icon']}' }},"
        for t in templates
    )
    if insert_after not in text:
        raise RuntimeError(f"Anchor not found in {path}")
    text = text.replace(insert_after, insert_after + "\n" + new_lines)
    path.write_text(text, encoding="utf-8")


def main():
    base_html = BASE_FILE.read_text(encoding="utf-8")
    for t in TEMPLATES:
        html = generate_html(base_html, t)
        out_path = RESUME_DIR / f"{t['slug']}.html"
        out_path.write_text(html, encoding="utf-8")
        print(f"Generated {out_path}")

    update_index(TEMPLATES)
    print(f"Updated {INDEX_FILE}")

    update_registry(MY_DOCS_FILE, TEMPLATES)
    print(f"Updated {MY_DOCS_FILE}")

    update_registry(SHARE_FILE, TEMPLATES)
    print(f"Updated {SHARE_FILE}")


if __name__ == "__main__":
    main()
