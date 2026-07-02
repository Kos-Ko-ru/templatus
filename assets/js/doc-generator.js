/**
 * doc-generator.js — генерация документов (договоров, заявлений и т.д.)
 * в DOCX и PDF.
 */

const DocGenerator = (() => {
  function collectFields(formId) {
    const data = {};
    const form = document.getElementById(formId);
    if (!form) return data;

    form.querySelectorAll("input, textarea, select").forEach((el) => {
      if (!el.name) return;
      if (el.type === "checkbox") {
        data[el.name] = el.checked;
      } else if (el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value.trim();
      }
    });
    return data;
  }

  function formatDate(value) {
    if (!value) return value;
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : value;
  }

  function renderPreview(html, containerId = "doc-preview") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="preview-paper">${html}</div>`;
  }

  async function generateDocx(data, template, filename = "document.docx") {
    if (!window.docx) throw new Error("docx.js не загружен");
    const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;

    const children = template(data).map((block) => {
      if (typeof block === "string") {
        return new Paragraph({ text: block, spacing: { after: 120 } });
      }
      if (block.bold) {
        return new Paragraph({
          children: [new TextRun({ text: block.text, bold: true })],
          alignment: block.align || AlignmentType.LEFT,
          spacing: { after: block.after || 120 },
        });
      }
      return new Paragraph({
        text: block.text,
        alignment: block.align || AlignmentType.LEFT,
        spacing: { after: block.after || 120 },
      });
    });

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });
    const blob = await Packer.toBlob(doc);
    TemplateEngine.downloadBlob(blob, filename);
  }

  function setupCyrillicFonts() {
    if (window.pdfMake && !pdfMake.fonts) {
      pdfMake.fonts = {
        DejaVuSans: {
          normal: "DejaVuSans.ttf",
          bold: "DejaVuSans-Bold.ttf",
          italics: "DejaVuSans.ttf",
          bolditalics: "DejaVuSans-Bold.ttf",
        },
      };
    }
  }

  function generatePdf(data, template, filename = "document.pdf") {
    if (!window.pdfMake) throw new Error("pdfmake не загружен");
    setupCyrillicFonts();
    const blocks = template(data).map((block) => {
      if (typeof block === "string") return { text: block, margin: [0, 0, 0, 8] };
      return {
        text: block.text,
        bold: !!block.bold,
        alignment: block.align || "left",
        margin: [0, 0, 0, block.after ? block.after / 20 : 8],
      };
    });

    const docDefinition = {
      content: blocks,
      defaultStyle: { font: "DejaVuSans" },
      styles: {
        header: { fontSize: 16, bold: true, alignment: "center", margin: [0, 0, 0, 12] },
      },
    };
    pdfMake.createPdf(docDefinition).download(filename);
  }

  // Шаблон: договор аренды жилья
  function arendaTemplate(data) {
    const today = new Date().toLocaleDateString("ru-RU");
    return [
      { text: "ДОГОВОР АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ", bold: true, align: "center", after: 200 },
      "г. " + (data.city || "______") + " \"" + today + "\"",
      (data.landlordName || "_______________________") + ", паспорт " + (data.landlordPassport || "_______________________") + ", адрес: " + (data.landlordAddress || "_______________________") + ", именуемый в дальнейшем \"Арендодатель\", с одной стороны, и",
      (data.tenantName || "_______________________") + ", паспорт " + (data.tenantPassport || "_______________________") + ", адрес: " + (data.tenantAddress || "_______________________") + ", именуемый в дальнейшем \"Арендатор\", с другой стороны, заключили настоящий договор о нижеследующем:",
      { text: "1. Предмет договора", bold: true },
      "1.1. Арендодатель предоставляет Арендатору во временное пользование жилое помещение, расположенное по адресу: " + (data.propertyAddress || "_______________________") + ".",
      "1.2. Срок аренды: с " + (formatDate(data.dateStart) || "______") + " по " + (formatDate(data.dateEnd) || "______") + ".",
      { text: "2. Арендная плата", bold: true },
      "2.1. Арендная плата составляет " + (data.rentAmount || "______") + " рублей в месяц.",
      "2.2. Оплата производится " + (data.paymentTerms || "ежемесячно, не позднее 5 числа каждого месяца") + ".",
      ...(data.deposit
        ? [
            "2.3. Залог за сохранность имущества составляет " + (data.depositAmount || "______") + " рублей.",
          ]
        : []),
      { text: "3. Права и обязанности сторон", bold: true },
      "3.1. Арендатор обязуется своевременно вносить арендную плату, сохранять имущество Арендодателя и не производить переуступку прав по договору без письменного согласия Арендодателя.",
      "3.2. Арендодатель обязуется передать помещение в состоянии, пригодном для проживания, и не чинить препятствий в пользовании им.",
      ...(data.extraTerms
        ? [{ text: "4. Дополнительные условия", bold: true }, data.extraTerms]
        : []),
      { text: "Подписи сторон:", bold: true, after: 300 },
      "Арендодатель: _________________ / " + (data.landlordName || ""),
      "Арендатор: _________________ / " + (data.tenantName || ""),
    ];
  }

  // Шаблон: заявление на отпуск
  function otpuskTemplate(data) {
    return [
      { text: "ЗАЯВЛЕНИЕ", bold: true, align: "center", after: 200 },
      "От " + (data.fullName || "_______________________") + ",",
      "работающего(ей) в должности " + (data.position || "_______________________") + " в " + (data.company || "_______________________") + ",",
      "",
      "Прошу предоставить мне " + (data.leaveType || "ежегодный оплачиваемый отпуск") + " с " + (formatDate(data.dateStart) || "______") + " по " + (formatDate(data.dateEnd) || "______") + " включительно на основании ст. 114 Трудового кодекса РФ.",
      "",
      "Дата: " + (formatDate(data.date) || "______"),
      "Подпись: _________________ / " + (data.fullName || ""),
    ];
  }

  // Шаблон: доверенность
  function doverennostTemplate(data) {
    return [
      { text: "ДОВЕРЕННОСТЬ", bold: true, align: "center", after: 200 },
      "г. " + (data.city || "______") + " " + (formatDate(data.date) || "______"),
      "",
      "Я, " + (data.principalName || "_______________________") + ", паспорт " + (data.principalPassport || "_______________________"), 
      "проживающий(ая) по адресу: " + (data.principalAddress || "_______________________") + ",",
      "",
      "доверяю " + (data.agentName || "_______________________") + ", паспорт " + (data.agentPassport || "_______________________") + ",",
      "проживающему(ей) по адресу: " + (data.agentAddress || "_______________________") + ",",
      "",
      "представлять мои интересы в " + (data.organization || "_______________________") + " для следующих действий: " + (data.powers || "_______________________") + ".",
      "",
      "Доверенность выдана сроком на " + (data.term || "1 год") + ".",
      "",
      "Подпись доверителя: _________________ / " + (data.principalName || ""),
    ];
  }

  // Шаблон: коммерческое предложение
  function kompredlozheniyeTemplate(data) {
    return [
      { text: "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", bold: true, align: "center", after: 200 },
      "От: " + (data.companyName || "_______________________") + ",",
      "Контактное лицо: " + (data.contactName || "_______________________") + ", тел. " + (data.phone || "_______________________"),
      "",
      "Уважаемый(ая) " + (data.clientName || "_______________________") + "!",
      "",
      "Предлагаем вам рассмотреть возможность сотрудничества с нашей компанией.",
      "",
      "Предмет предложения: " + (data.subject || "_______________________") + ".",
      "Стоимость: " + (data.price || "_______________________") + ".",
      "Сроки: " + (data.terms || "_______________________") + ".",
      "",
      "Преимущества:",
      data.advantages || "— Высокое качество\n— Оперативность\n— Индивидуальный подход",
      "",
      "С уважением, " + (data.contactName || "_______________________"),
    ];
  }

  // Шаблон: заявление на увольнение
  function uvolnenieTemplate(data) {
    return [
      { text: "ЗАЯВЛЕНИЕ", bold: true, align: "center", after: 200 },
      "От " + (data.fullName || "_______________________") + ",",
      "работающего(ей) в должности " + (data.position || "_______________________") + " в " + (data.company || "_______________________") + ",",
      "",
      "Прошу уволить меня по собственному желанию с " + (formatDate(data.dismissalDate) || "______") + " в соответствии со ст. 80 Трудового кодекса РФ.",
      "",
      "Дата: " + (formatDate(data.date) || "______"),
      "Подпись: _________________ / " + (data.fullName || ""),
    ];
  }

  // Шаблон: расписка в получении денег
  function raspiskaTemplate(data) {
    return [
      { text: "РАСПИСКА", bold: true, align: "center", after: 200 },
      "Я, " + (data.borrowerName || "_______________________") + ", паспорт " + (data.borrowerPassport || "_______________________") + ",",
      "проживающий(ая) по адресу: " + (data.borrowerAddress || "_______________________") + ",",
      "",
      "получил(а) от " + (data.lenderName || "_______________________") + " сумму в размере " + (data.amount || "_______________________") + " рублей.",
      "",
      "Назначение: " + (data.purpose || "_______________________") + ".",
      "Срок возврата: " + (formatDate(data.returnDate) || "_______________________") + ".",
      "",
      "Подпись: _________________ / " + (data.borrowerName || ""),
      "Дата: " + (formatDate(data.date) || "______"),
    ];
  }

  // Шаблон: акт приёма-передачи
  function aktTemplate(data) {
    return [
      { text: "АКТ ПРИЁМА-ПЕРЕДАЧИ", bold: true, align: "center", after: 200 },
      "г. " + (data.city || "______") + " " + (formatDate(data.date) || "______"),
      "",
      "Мы, нижеподписавшиеся:",
      "Передающий: " + (data.senderName || "_______________________") + ",",
      "Принимающий: " + (data.receiverName || "_______________________") + ",",
      "",
      "составили настоящий акт о том, что передано имущество:",
      "",
      data.propertyList || "_______________________",
      "",
      "Состояние имущества: " + (data.condition || "удовлетворительное") + ".",
      "Примечание: " + (data.note || "_______________________") + ".",
      "",
      "Подписи сторон:",
      "Передал: _________________ / " + (data.senderName || ""),
      "Принял: _________________ / " + (data.receiverName || ""),
    ];
  }

  // Шаблон: договор купли-продажи
  function kupliTemplate(data) {
    return [
      { text: "ДОГОВОР КУПЛИ-ПРОДАЖИ", bold: true, align: "center", after: 200 },
      "г. " + (data.city || "______") + " " + (formatDate(data.date) || "______"),
      (data.sellerName || "_______________________") + ", паспорт " + (data.sellerPassport || "_______________________") + ", адрес: " + (data.sellerAddress || "_______________________") + ", именуемый(ая) в дальнейшем \"Продавец\", с одной стороны, и",
      (data.buyerName || "_______________________") + ", паспорт " + (data.buyerPassport || "_______________________") + ", адрес: " + (data.buyerAddress || "_______________________") + ", именуемый(ая) в дальнейшем \"Покупатель\", с другой стороны, заключили настоящий договор о нижеследующем:",
      { text: "1. Предмет договора", bold: true },
      "1.1. Продавец передаёт в собственность Покупателю следующее имущество: " + (data.itemDescription || "_______________________") + ".",
      "1.2. Имущество принадлежит Продавцу на праве собственности, не находится в залоге, аресте и не обременено правами третьих лиц.",
      { text: "2. Цена и порядок расчётов", bold: true },
      "2.1. Стоимость имущества составляет " + (data.itemPrice || "______") + " рублей.",
      "2.2. Оплата производится " + (data.paymentTerms || "наличными денежными средствами при подписании настоящего договора") + ".",
      { text: "3. Передача имущества", bold: true },
      "3.1. Имущество передаётся Покупателю в момент подписания настоящего договора и оплаты.",
      "3.2. Состояние имущества на момент передачи: " + (data.itemCondition || "удовлетворительное") + ".",
      { text: "4. Подписи сторон", bold: true, after: 300 },
      "Продавец: _________________ / " + (data.sellerName || ""),
      "Покупатель: _________________ / " + (data.buyerName || ""),
    ];
  }

  // Шаблон: договор займа
  function zaymTemplate(data) {
    return [
      { text: "ДОГОВОР ЗАЙМА", bold: true, align: "center", after: 200 },
      "г. " + (data.city || "______") + " " + (formatDate(data.date) || "______"),
      (data.lenderName || "_______________________") + ", паспорт " + (data.lenderPassport || "_______________________") + ", именуемый(ая) в дальнейшем \"Займодавец\", с одной стороны, и",
      (data.borrowerName || "_______________________") + ", паспорт " + (data.borrowerPassport || "_______________________") + ", именуемый(ая) в дальнейшем \"Заёмщик\", с другой стороны, заключили настоящий договор о нижеследующем:",
      { text: "1. Предмет договора", bold: true },
      "1.1. Займодавец предоставляет Заёмщику денежные средства в размере " + (data.amount || "______") + " рублей.",
      "1.2. Процентная ставка по договору составляет " + (data.interest || "0") + "% годовых.",
      { text: "2. Срок и порядок возврата", bold: true },
      "2.1. Заёмщик обязуется возвратить сумму займа не позднее " + (formatDate(data.returnDate) || "______") + ".",
      "2.2. Порядок погашения: " + (data.paymentTerms || "единовременно в конце срока") + ".",
      { text: "3. Подписи сторон", bold: true, after: 300 },
      "Займодавец: _________________ / " + (data.lenderName || ""),
      "Заёмщик: _________________ / " + (data.borrowerName || ""),
    ];
  }

  // Шаблон: договор оказания услуг
  function uslugTemplate(data) {
    return [
      { text: "ДОГОВОР ОКАЗАНИЯ УСЛУГ", bold: true, align: "center", after: 200 },
      "г. " + (data.city || "______") + " " + (formatDate(data.date) || "______"),
      (data.customerName || "_______________________") + ", адрес: " + (data.customerAddress || "_______________________") + ", именуемый(ое) в дальнейшем \"Заказчик\", с одной стороны, и",
      (data.executorName || "_______________________") + ", адрес: " + (data.executorAddress || "_______________________") + ", именуемый(ое) в дальнейшем \"Исполнитель\", с другой стороны, заключили настоящий договор о нижеследующем:",
      { text: "1. Предмет договора", bold: true },
      "1.1. Исполнитель обязуется оказать Заказчику следующие услуги: " + (data.serviceDescription || "_______________________") + ".",
      { text: "2. Стоимость и сроки", bold: true },
      "2.1. Стоимость услуг составляет " + (data.cost || "______") + " рублей.",
      "2.2. Услуги должны быть оказаны до " + (formatDate(data.deadline) || "______") + ".",
      "2.3. Порядок оплаты: " + (data.paymentTerms || "50% предоплата, 50% по факту выполнения") + ".",
      { text: "3. Подписи сторон", bold: true, after: 300 },
      "Заказчик: _________________ / " + (data.customerName || ""),
      "Исполнитель: _________________ / " + (data.executorName || ""),
    ];
  }

  // Шаблон: заявление на приём на работу
  function priemTemplate(data) {
    return [
      { text: "ЗАЯВЛЕНИЕ", bold: true, align: "center", after: 200 },
      "От " + (data.fullName || "_______________________") + ",",
      "проживающего(ей) по адресу: " + (data.address || "_______________________") + ",",
      "телефон: " + (data.phone || "_______________________") + ",",
      "",
      "Прошу принять меня на работу в " + (data.company || "_______________________") + " в отдел/департамент " + (data.department || "_______________________") + " на должность " + (data.position || "_______________________") + " с " + (formatDate(data.dateStart) || "______") + ".",
      "",
      "Образование: " + (data.education || "_______________________") + ".",
      "Опыт работы: " + (data.experience || "_______________________") + ".",
      "",
      "Дата: " + (formatDate(data.date) || "______"),
      "Подпись: _________________ / " + (data.fullName || ""),
    ];
  }

  // Шаблон: претензия
  function pretenziyaTemplate(data) {
    return [
      { text: "ПРЕТЕНЗИЯ", bold: true, align: "center", after: 200 },
      "От: " + (data.claimantName || "_______________________") + ", адрес: " + (data.claimantAddress || "_______________________"),
      "Кому: " + (data.respondentName || "_______________________") + ", адрес: " + (data.respondentAddress || "_______________________"),
      "",
      "Дата: " + (formatDate(data.date) || "______"),
      "",
      "Предмет претензии: " + (data.subject || "_______________________") + ".",
      "",
      "Описание ситуации:",
      data.description || "_______________________",
      "",
      "Сумма претензии: " + (data.claimAmount || "______") + " рублей.",
      "",
      "Прошу удовлетворить требования в течение " + (data.deadlineDays || "10") + " (десяти) рабочих дней с момента получения настоящей претензии. В случае отказа или неполучения ответа в указанный срок оставляю за собой право обратиться в суд.",
      "",
      "Подпись: _________________ / " + (data.claimantName || ""),
    ];
  }

  // Шаблон: расписка в получении имущества
  function propertyTemplate(data) {
    return [
      { text: "РАСПИСКА В ПОЛУЧЕНИИ ИМУЩЕСТВА", bold: true, align: "center", after: 200 },
      "Я, " + (data.borrowerName || "_______________________") + ", получил(а) от " + (data.lenderName || "_______________________") + " следующее имущество:",
      "",
      data.itemDescription || "_______________________",
      "",
      "Состояние имущества: " + (data.itemCondition || "удовлетворительное") + ".",
      "",
      "Обязуюсь вернуть имущество не позднее " + (formatDate(data.returnDate) || "______") + ".",
      "",
      "Подпись: _________________ / " + (data.borrowerName || ""),
      "Дата: " + (formatDate(data.date) || "______"),
    ];
  }

  // Шаблон: счёт на оплату
  function schetTemplate(data) {
    return [
      { text: "СЧЁТ НА ОПЛАТУ", bold: true, align: "center", after: 200 },
      "Счёт № " + (data.invoiceNumber || "______") + " от " + (formatDate(data.invoiceDate) || "______"),
      "",
      "Продавец: " + (data.sellerName || "_______________________") + ", адрес: " + (data.sellerAddress || "_______________________"),
      "Покупатель: " + (data.buyerName || "_______________________") + ", адрес: " + (data.buyerAddress || "_______________________"),
      "",
      "Предмет счета:",
      data.itemDescription || "_______________________",
      "",
      "Сумма к оплате: " + (data.amount || "______") + " рублей.",
      "",
      "Реквизиты для оплаты:",
      data.paymentDetails || "_______________________",
      "",
      "Подпись: _________________ / " + (data.sellerName || ""),
    ];
  }

  // Шаблон: накладная
  function nakladnayaTemplate(data) {
    return [
      { text: "НАКЛАДНАЯ", bold: true, align: "center", after: 200 },
      "Накладная № " + (data.waybillNumber || "______") + " от " + (formatDate(data.waybillDate) || "______"),
      "",
      "Отправитель: " + (data.senderName || "_______________________") + ", адрес: " + (data.senderAddress || "_______________________"),
      "Получатель: " + (data.receiverName || "_______________________") + ", адрес: " + (data.receiverAddress || "_______________________"),
      "",
      "Перечень груза:",
      data.cargoDescription || "_______________________",
      "",
      "Количество мест: " + (data.cargoQuantity || "______") + ".",
      "Общий вес: " + (data.cargoWeight || "______") + " кг.",
      "",
      "Груз сдал: _________________ / " + (data.senderName || ""),
      "Груз принял: _________________ / " + (data.receiverName || ""),
    ];
  }

  return {
    collectFields,
    renderPreview,
    generateDocx,
    generatePdf,
    arendaTemplate,
    otpuskTemplate,
    doverennostTemplate,
    kompredlozheniyeTemplate,
    uvolnenieTemplate,
    raspiskaTemplate,
    aktTemplate,
    kupliTemplate,
    zaymTemplate,
    uslugTemplate,
    priemTemplate,
    pretenziyaTemplate,
    propertyTemplate,
    schetTemplate,
    nakladnayaTemplate,
  };
})();

window.DocGenerator = DocGenerator;
