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

## Монетизация

- Рекламные блоки размещены в разметке как placeholder'ы с классами `.ad-*`.
- Для подключения рекламы замените содержимое placeholder'ов на код рекламной сети.

## Лицензия

MIT — свободное использование и модификация.
