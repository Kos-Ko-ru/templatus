#!/usr/bin/env python3
"""Генератор новых шаблонов документов."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "documents"
BASE_FILE = DOCS_DIR / "dogovor-arendy.html"
INDEX_FILE = DOCS_DIR / "index.html"


def field_text(name, label, placeholder="", required=False, col=None):
    attrs = ' required' if required else ''
    ph = f' placeholder="{placeholder}"' if placeholder else ''
    html = f'''<div class="form-group">
                <label class="form-label" for="{name}">{label}{' *' if required else ''}</label>
                <input type="text" id="{name}" name="{name}"{ph}{attrs}>
              </div>'''
    if col:
        return f'<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">{html}</div>'
    return html


def field_date(name, label, col=None):
    html = f'''<div class="form-group">
                <label class="form-label" for="{name}">{label}</label>
                <input type="date" id="{name}" name="{name}">
              </div>'''
    if col:
        return f'<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">{html}</div>'
    return html


def field_textarea(name, label, placeholder="", rows=3):
    return f'''<div class="form-group">
                <label class="form-label" for="{name}">{label}</label>
                <textarea id="{name}" name="{name}" rows="{rows}" placeholder="{placeholder}"></textarea>
              </div>'''


def field_number(name, label, placeholder=""):
    return f'''<div class="form-group">
                <label class="form-label" for="{name}">{label}</label>
                <input type="number" id="{name}" name="{name}" placeholder="{placeholder}">
              </div>'''


TEMPLATES = [
    {
        "page_id": "doc-kupli",
        "template": "kupli",
        "slug": "dogovor-kupli-prodazhi",
        "title": "Договор купли-продажи",
        "short_title": "Договор купли-продажи",
        "category": "legal",
        "icon": "ph-shopping-cart",
        "description": "Для продажи и покупки имущества между физическими лицами.",
        "btn": "Создать договор",
        "keywords": "договор купли продажи, шаблон договора купли продажи, скачать договор, docx, pdf",
        "fields": [
            field_text("city", "Город составления", "Москва"),
            field_date("date", "Дата составления"),
            field_text("sellerName", "ФИО продавца", "Иванов Иван Иванович", required=True),
            field_text("sellerPassport", "Паспортные данные продавца", "45 00 123456, выдан ..."),
            field_text("sellerAddress", "Адрес продавца", "г. Москва, ул. Примерная, д. 1"),
            field_text("buyerName", "ФИО покупателя", "Петров Пётр Петрович", required=True),
            field_text("buyerPassport", "Паспортные данные покупателя", "45 00 654321, выдан ..."),
            field_text("buyerAddress", "Адрес покупателя", "г. Москва, ул. Успешная, д. 10"),
            field_textarea("itemDescription", "Описание имущества", "Ноутбук Lenovo ThinkPad, серийный номер ..."),
            field_number("itemPrice", "Стоимость имущества (руб.)", "50000"),
            field_text("itemCondition", "Состояние имущества", "удовлетворительное"),
            field_text("paymentTerms", "Порядок оплаты", "наличными при подписании договора"),
        ],
    },
    {
        "page_id": "doc-zaym",
        "template": "zaym",
        "slug": "dogovor-zayma",
        "title": "Договор займа",
        "short_title": "Договор займа",
        "category": "legal",
        "icon": "ph-hand-coins",
        "description": "Оформление займа денежных средств между физическими лицами.",
        "btn": "Создать договор",
        "keywords": "договор займа, шаблон договора займа, расписка в займе, docx, pdf",
        "fields": [
            field_text("city", "Город составления", "Москва"),
            field_date("date", "Дата составления"),
            field_text("lenderName", "ФИО займодавца", "Иванов Иван Иванович", required=True),
            field_text("lenderPassport", "Паспортные данные займодавца", "45 00 123456, выдан ..."),
            field_text("borrowerName", "ФИО заёмщика", "Петров Пётр Петрович", required=True),
            field_text("borrowerPassport", "Паспортные данные заёмщика", "45 00 654321, выдан ..."),
            field_number("amount", "Сумма займа (руб.)", "100000"),
            field_number("interest", "Процентная ставка (% годовых)", "0"),
            field_date("returnDate", "Дата возврата"),
            field_text("paymentTerms", "Порядок погашения", "единовременно в конце срока"),
        ],
    },
    {
        "page_id": "doc-uslug",
        "template": "uslug",
        "slug": "dogovor-uslug",
        "title": "Договор оказания услуг",
        "short_title": "Договор оказания услуг",
        "category": "legal",
        "icon": "ph-handshake",
        "description": "Договор между заказчиком и исполнителем на оказание услуг.",
        "btn": "Создать договор",
        "keywords": "договор оказания услуг, шаблон договора услуг, docx, pdf",
        "fields": [
            field_text("city", "Город составления", "Москва"),
            field_date("date", "Дата составления"),
            field_text("customerName", "Наименование заказчика", "ООО «Ромашка»", required=True),
            field_text("customerAddress", "Адрес заказчика", "г. Москва, ул. Центральная, д. 5"),
            field_text("executorName", "Наименование исполнителя", "Иванов Иван Иванович", required=True),
            field_text("executorAddress", "Адрес исполнителя", "г. Москва, ул. Примерная, д. 1"),
            field_textarea("serviceDescription", "Описание услуг", "Разработка landing page, дизайн, вёрстка"),
            field_number("cost", "Стоимость услуг (руб.)", "50000"),
            field_date("deadline", "Срок оказания услуг"),
            field_text("paymentTerms", "Порядок оплаты", "50% предоплата, 50% по факту выполнения"),
        ],
    },
    {
        "page_id": "doc-priem",
        "template": "priem",
        "slug": "zayavlenie-priem",
        "title": "Заявление на приём на работу",
        "short_title": "Заявление на приём",
        "category": "hr",
        "icon": "ph-user-plus",
        "description": "Заявление для приёма на работу по форме кадровой службы.",
        "btn": "Создать заявление",
        "keywords": "заявление на прием на работу, шаблон заявления на прием, docx, pdf",
        "fields": [
            field_text("fullName", "ФИО *", "Иванов Иван Иванович", required=True),
            field_text("position", "Желаемая должность", "Менеджер по продажам"),
            field_text("company", "Название компании", "ООО «Ромашка»"),
            field_text("department", "Отдел/департамент", "Отдел продаж"),
            field_date("dateStart", "Дата выхода на работу"),
            field_text("salary", "Желаемая зарплата", "80000"),
            field_text("education", "Образование", "Высшее, Московский государственный университет"),
            field_text("experience", "Опыт работы", "5 лет в продажах"),
            field_text("address", "Адрес", "г. Москва, ул. Примерная, д. 1"),
            field_text("phone", "Телефон", "+7 (999) 000-00-00"),
            field_date("date", "Дата составления"),
        ],
    },
    {
        "page_id": "doc-pretenziya",
        "template": "pretenziya",
        "slug": "pretenziya",
        "title": "Претензия",
        "short_title": "Претензия",
        "category": "legal",
        "icon": "ph-warning",
        "description": "Досудебная претензия к продавцу или исполнителю услуг.",
        "btn": "Создать претензию",
        "keywords": "претензия, шаблон претензии, досудебная претензия, docx, pdf",
        "fields": [
            field_text("claimantName", "ФИО заявителя", "Иванов Иван Иванович", required=True),
            field_text("claimantAddress", "Адрес заявителя", "г. Москва, ул. Примерная, д. 1"),
            field_text("respondentName", "Название ответчика", "ООО «Ромашка»", required=True),
            field_text("respondentAddress", "Адрес ответчика", "г. Москва, ул. Центральная, д. 5"),
            field_date("date", "Дата составления"),
            field_text("subject", "Предмет претензии", "Некачественный товар"),
            field_textarea("description", "Описание ситуации", "Товар оказался бракованным, не соответствует заявленным характеристикам..."),
            field_number("claimAmount", "Сумма претензии (руб.)", "50000"),
            field_text("deadlineDays", "Срок для ответа (дней)", "10"),
        ],
    },
    {
        "page_id": "doc-property",
        "template": "property",
        "slug": "raspiska-imushchestvo",
        "title": "Расписка в получении имущества",
        "short_title": "Расписка в получении имущества",
        "category": "legal",
        "icon": "ph-archive-box",
        "description": "Подтверждение передачи имущества во временное пользование.",
        "btn": "Создать расписку",
        "keywords": "расписка в получении имущества, шаблон расписки имущество, docx, pdf",
        "fields": [
            field_text("borrowerName", "ФИО получателя", "Петров Пётр Петрович", required=True),
            field_text("lenderName", "ФИО передающего", "Иванов Иван Иванович", required=True),
            field_textarea("itemDescription", "Описание имущества", "Электродрель Bosch, серийный номер ..."),
            field_text("itemCondition", "Состояние имущества", "удовлетворительное"),
            field_date("returnDate", "Дата возврата"),
            field_date("date", "Дата составления"),
        ],
    },
    {
        "page_id": "doc-schet",
        "template": "schet",
        "slug": "schet",
        "title": "Счёт на оплату",
        "short_title": "Счёт на оплату",
        "category": "sales",
        "icon": "ph-receipt",
        "description": "Счёт для юридических и физических лиц с реквизитами.",
        "btn": "Создать счёт",
        "keywords": "счет на оплату, шаблон счета, бланк счета, docx, pdf",
        "fields": [
            field_text("invoiceNumber", "Номер счёта", "001"),
            field_date("invoiceDate", "Дата счёта"),
            field_text("sellerName", "Продавец", "ООО «Ромашка»", required=True),
            field_text("sellerAddress", "Адрес продавца", "г. Москва, ул. Центральная, д. 5"),
            field_text("buyerName", "Покупатель", "Иванов Иван Иванович", required=True),
            field_text("buyerAddress", "Адрес покупателя", "г. Москва, ул. Примерная, д. 1"),
            field_textarea("itemDescription", "Предмет счёта", "Разработка сайта, хостинг на 1 год"),
            field_number("amount", "Сумма к оплате (руб.)", "50000"),
            field_textarea("paymentDetails", "Реквизиты для оплаты", "Р/с 40802810100000001234 в ПАО СБЕРБАНК, БИК 044525225"),
        ],
    },
    {
        "page_id": "doc-nakladnaya",
        "template": "nakladnaya",
        "slug": "nakladnaya",
        "title": "Накладная",
        "short_title": "Накладная",
        "category": "sales",
        "icon": "ph-truck",
        "description": "Документ на передачу груза от отправителя к получателю.",
        "btn": "Создать накладную",
        "keywords": "накладная, шаблон накладной, товарная накладная, docx, pdf",
        "fields": [
            field_text("waybillNumber", "Номер накладной", "001"),
            field_date("waybillDate", "Дата накладной"),
            field_text("senderName", "Отправитель", "ООО «Ромашка»", required=True),
            field_text("senderAddress", "Адрес отправителя", "г. Москва, ул. Центральная, д. 5"),
            field_text("receiverName", "Получатель", "Иванов Иван Иванович", required=True),
            field_text("receiverAddress", "Адрес получателя", "г. Москва, ул. Примерная, д. 1"),
            field_textarea("cargoDescription", "Описание груза", "Коробки с канцтоварами, 5 шт."),
            field_text("cargoQuantity", "Количество мест", "5"),
            field_text("cargoWeight", "Общий вес (кг)", "12"),
        ],
    },
]


def build_form(fields):
    return "\n".join(fields)


def generate_html(base_html: str, t: dict) -> str:
    html = base_html
    title_full = f"{t['title']} — бесплатный шаблон | templatus"
    html = re.sub(r"<title>.*?</title>", f"<title>{title_full}</title>", html)
    html = re.sub(
        r'<meta name="description" content=".*?">',
        f'<meta name="description" content="Составьте {t["title"].lower()} онлайн. Бесплатный шаблон, заполнение за 5 минут. Скачайте готовый документ в DOCX или PDF.">',
        html,
    )
    html = re.sub(
        r'<meta name="keywords" content=".*?">',
        f'<meta name="keywords" content="{t["keywords"]}">',
        html,
    )
    html = re.sub(
        r'<link rel="canonical" href="https://templatus\.ru/documents/[^"]+">',
        f'<link rel="canonical" href="https://templatus.ru/documents/{t["slug"]}">',
        html,
    )
    html = re.sub(
        r'<meta property="og:title" content=".*?">',
        f'<meta property="og:title" content="{title_full}">',
        html,
    )
    html = re.sub(
        r'<meta property="og:description" content=".*?">',
        f'<meta property="og:description" content="Заполните форму и получите готовый {t["title"].lower()} в DOCX или PDF.">',
        html,
    )
    schema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": f"Генератор {t['title'].lower()}",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "RUB"},
        "url": f"https://templatus.ru/documents/{t['slug']}",
    }
    html = re.sub(
        r"<script type=\"application/ld\+json\">.*?</script>",
        f'<script type="application/ld+json">\n  {json.dumps(schema, ensure_ascii=False, indent=2)}\n  </script>',
        html,
        flags=re.DOTALL,
    )
    html = re.sub(
        r'<body data-page-id="[^"]+" data-doc-template="[^"]+">',
        f'<body data-page-id="{t["page_id"]}" data-doc-template="{t["template"]}">',
        html,
    )
    html = re.sub(
        r'<h1 class="section-title">.*?</h1>',
        f'<h1 class="section-title">{t["title"]}</h1>',
        html,
    )
    # Replace form fields block from first form-group to before ad-between-steps
    form_start = html.find('<form id="doc-form" novalidate>')
    ad_marker = '              <div class="ad-between-steps"'
    form_end = html.find(ad_marker)
    if form_start == -1 or form_end == -1:
        raise RuntimeError(f"Could not locate form block in {t['slug']}")
    new_form = '            <form id="doc-form" novalidate>\n' + build_form(t["fields"]) + '\n'
    html = html[:form_start] + new_form + html[form_end:]
    return html


def build_card(t: dict) -> str:
    return f'''          <article class="card card-template" data-category="{t["category"]}">
          <div class="template-preview">
            <div class="tp-document">
              <div class="tp-line highlight"></div>
              <div class="tp-line"></div>
              <div class="tp-line"></div>
              <div class="tp-line short"></div>
              <div class="tp-line"></div>
              <div class="tp-line short"></div>
            </div>
          </div>
          <div class="card-icon"><i class="ph {t["icon"]}" aria-hidden="true"></i></div>
            <h3>{t["short_title"]}</h3>
            <p>{t["description"]}</p>
            <a href="{t["slug"]}" class="btn btn-primary btn-sm">{t["btn"]}</a>
          </article>'''


def update_index(templates):
    text = INDEX_FILE.read_text(encoding="utf-8")
    cards = "\n".join(build_card(t) for t in templates)
    text = re.sub(
        r"(          </article>\s*)(\n        </div>\s*\n      </div>\s*\n    </section>)",
        rf"\1\n{cards}\2",
        text,
        flags=re.DOTALL,
    )
    INDEX_FILE.write_text(text, encoding="utf-8")


def main():
    base_html = BASE_FILE.read_text(encoding="utf-8")
    for t in TEMPLATES:
        html = generate_html(base_html, t)
        out_path = DOCS_DIR / f"{t['slug']}.html"
        out_path.write_text(html, encoding="utf-8")
        print(f"Generated {out_path}")
    update_index(TEMPLATES)
    print(f"Updated {INDEX_FILE}")


if __name__ == "__main__":
    main()
