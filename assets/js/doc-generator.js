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
      "1.2. Срок аренды: с " + (data.dateStart || "______") + " по " + (data.dateEnd || "______") + ".",
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
      "Прошу предоставить мне " + (data.leaveType || "ежегодный оплачиваемый") + " отпуск с " + (data.dateStart || "______") + " по " + (data.dateEnd || "______") + " включительно на основании ст. 114 Трудового кодекса РФ.",
      "",
      "Дата: " + (data.date || "______"),
      "Подпись: _________________ / " + (data.fullName || ""),
    ];
  }

  // Шаблон: доверенность
  function doverennostTemplate(data) {
    return [
      { text: "ДОВЕРЕННОСТЬ", bold: true, align: "center", after: 200 },
      "г. " + (data.city || "______") + " " + (data.date || "______"),
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

  return {
    collectFields,
    renderPreview,
    generateDocx,
    generatePdf,
    arendaTemplate,
    otpuskTemplate,
    doverennostTemplate,
    kompredlozheniyeTemplate,
  };
})();

window.DocGenerator = DocGenerator;
