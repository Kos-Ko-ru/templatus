# templatus

**templatus.ru** — полностью клиентский веб-сервис для генерации документов: резюме, шаблонов документов (договоры, заявления) и презентаций. Все файлы создаются прямо в браузере пользователя, бэкенд отсутствует.

## Особенности

- 100% фронтенд, работа без сервера
- Генерация файлов в форматах DOCX, PDF, PPTX
- Автосохранение черновиков в localStorage
- Тёмная/светлая тема
- PWA-манифест
- SEO-разметка и Schema.org
- Placeholder'ы для рекламных блоков

## Стек технологий

- HTML5, CSS3, ванильный JavaScript
- [docx.js](https://unpkg.com/docx) — генерация DOCX
- [pdfmake](https://cdnjs.com/libraries/pdfmake) — генерация PDF
- [pptxgenjs](https://unpkg.com/pptxgenjs) — генерация PPTX
- [JSZip](https://cdnjs.com/libraries/jszip) — работа с DOCX как с ZIP
- [Chart.js](https://cdnjs.com/libraries/Chart.js) — графики в презентациях
- [Tailwind CSS](https://cdn.tailwindcss.com) (CDN) + собственные стили
- [Phosphor Icons](https://unpkg.com/@phosphor-icons/web) (CDN)

## Быстрый старт

```bash
# Просто откройте index.html в браузере
open index.html

# Или запустите локальный сервер
python -m http.server 8000
```

## Структура проекта

```
/
├── index.html                    # Главная / лендинг
├── 404.html                      # Страница ошибки
├── manifest.json                 # PWA-манифест
├── deploy.py                     # Деплой на сервер
├── README.md                     # Этот файл
├── GUIDE.md                      # Гайд по добавлению шаблонов
├── assets/
│   ├── css/style.css             # Общие стили
│   ├── js/                       # Общие и страничные скрипты
│   ├── templates/                # DOCX-шаблоны с placeholder'ами
│   └── images/                   # Изображения, иконки, OG
├── resume/                       # Шаблоны резюме
├── documents/                    # Шаблоны документов
├── presentations/                # Шаблоны презентаций
└── blog/                         # SEO-статьи
```

## Деплой на сервер

Убедитесь, что установлен Python и `paramiko`:

```bash
pip install paramiko
```

Затем запустите:

```bash
python deploy.py
```

Скрипт выполнит `git push`, подключится к серверу `root@158.255.4.142`, обновит код и конфигурацию Caddy.

При необходимости можно переопределить параметры через переменные окружения:

```bash
export TEMPLATUS_HOST="your-server-ip"
export TEMPLATUS_USER="your-user"
export TEMPLATUS_PASSWORD="your-password"
export TEMPLATUS_DOMAIN="templatus.ru"

python deploy.py
```

## Монетизация (РСЯ)

Сайт готов к показу рекламы из Рекламной сети Яндекса (РСЯ).

### Шаг 1. Создайте блоки в РСЯ

В партнёрском кабинете [partner.yandex.ru](https://partner.yandex.ru) создайте 4 рекламных блока типа **Баннер**:

| Слот              | Рекомендуемый размер | Где размещается                              |
|-------------------|----------------------|----------------------------------------------|
| `banner-top`      | 728×90               | Под шапкой на всех страницах                 |
| `between-steps`   | 468×60               | Между шагами формы генератора                |
| `before-download` | 300×250              | В модальном окне перед скачиванием файла     |
| `after-download`  | 728×90               | После основного контента на главной странице |

### Шаг 2. Укажите ID блоков

Откройте `assets/js/ads.js` и вставьте ID блоков (вида `R-A-XXXXXXXX-Y`) в объект `AD_CONFIG.blocks`:

```js
var AD_CONFIG = {
  enabled: true,
  blocks: {
    'banner-top': 'R-A-19533623-1',
    'between-steps': 'R-A-19533623-2',
    'before-download': 'R-A-19533623-3',
    'after-download': 'R-A-19533623-4'
  }
};
```

### Шаг 3. Задеплойте

```bash
python deploy.py
```

Рекламные блоки автоматически отрендерятся во всех местах с атрибутом `data-ad-slot`. Если ID блока не указан, на его месте останется placeholder.

## Лицензия

MIT — свободное использование и модификация.
