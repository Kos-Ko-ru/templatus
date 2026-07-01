# Гайд по работе с templatus

## Как добавить новый шаблон резюме

1. Создайте HTML-файл в папке `resume/`, например `sales-manager.html`.
2. Скопируйте структуру из `resume/it-specialist.html`.
3. Измените заголовок, описание, SEO-теги и поля формы.
4. При необходимости добавьте собственную логику в `assets/js/resume-generator.js` или создайте отдельный `assets/js/resume-sales-page.js`.
5. Добавьте ссылку на новый шаблон в `resume/index.html` и в футер на главной.

## Как создать DOCX-шаблон с placeholder'ами

DOCX — это ZIP-архив. Внутри главный файл — `word/document.xml`. Placeholder'ы записываются как обычный текст в формате `{{FULL_NAME}}`.

### Пример минимального шаблона

Создайте ZIP со следующими файлами:

- `[Content_Types].xml`
- `_rels/.rels`
- `word/document.xml`
- `word/_rels/document.xml.rels`

Содержимое `word/document.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>{{FULL_NAME}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{{PHONE}} · {{EMAIL}}</w:t></w:r></w:p>
  </w:body>
</w:document>
```

### Использование шаблона

```javascript
const base64Template = "..."; // base64 ZIP-шаблона
const data = { FULL_NAME: "Иван Иванов", PHONE: "+79990000000", EMAIL: "ivan@example.com" };
const blob = await TemplateEngine.processDocx(base64Template, data);
TemplateEngine.downloadBlob(blob, "document.docx");
```

> В текущей реализации MVP документы генерируются с помощью `docx.js` напрямую. Шаблон `assets/templates/resume/it-template.docx` приведён как пример и может быть использован через `TemplateEngine`.

## Чек-лист SEO для каждой страницы

- [ ] Уникальный `<title>` (до 60 символов)
- [ ] Уникальный `<meta name="description">` (120–160 символов)
- [ ] `<meta name="keywords">` с релевантными ключами
- [ ] `<link rel="canonical">` с абсолютным URL
- [ ] Open Graph: `og:title`, `og:description`, `og:image`, `og:url`
- [ ] Schema.org JSON-LD (WebApplication, Article, CollectionPage и т.д.)
- [ ] Один H1 на страницу
- [ ] Человекопонятный URL
- [ ] Alt-тексты для изображений
- [ ] Внутренние ссылки на смежные страницы

## Placeholder'ы рекламных блоков

Все рекламные места помечены CSS-классами:

| Класс | Размер | Расположение |
|---|---|---|
| `.ad-banner-top` | 728×90 | Под шапкой |
| `.ad-sidebar` | 300×250 | Боковая панель (можно добавить в layout) |
| `.ad-between-steps` | 468×60 | Между шагами формы |
| `.ad-before-download` | 300×250 | Внутри модального окна перед скачиванием |
| `.ad-after-download` | 728×90 | После скачивания / в конце контента |
| `.ad-footer` | 728×90 | В футере |

Чтобы подключить реальную рекламу, замените содержимое блока на код рекламной сети, сохранив CSS-класс.

## Доступность (a11y)

- Все интерактивные элементы имеют `aria-label` или видимую подпись
- Цвета выбраны с контрастом не ниже 4.5:1
- Навигация работает с клавиатуры (Tab, Enter, Escape)
- Модальные окна имеют `role="dialog"` и `aria-modal="true"`
