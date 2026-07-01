/**
 * template-engine.js — замена placeholder'ов в DOCX-шаблонах.
 * DOCX — это ZIP с XML внутри. Мы открываем base64-шаблон через JSZip,
 * заменяем текст в word/document.xml, архивируем обратно и отдаём Blob.
 */

const TemplateEngine = (() => {
  /**
   * Заменяет все вхождения placeholder'ов в строке.
   * Placeholder формата {{KEY}}.
   */
  function replacePlaceholders(text, data) {
    return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
      const value = data[key];
      if (value === undefined || value === null) return match;
      // Экранируем XML
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    });
  }

  /**
   * Обрабатывает base64-шаблон DOCX и возвращает Blob готового DOCX.
   * @param {string} base64Template — base64 ZIP DOCX
   * @param {object} data — ключи placeholder'ов
   * @returns {Promise<Blob>}
   */
  async function processDocx(base64Template, data) {
    if (!window.JSZip) {
      throw new Error("JSZip не загружен");
    }
    const zip = await JSZip.loadAsync(base64Template, { base64: true });
    const documentXml = await zip.file("word/document.xml").async("string");
    const replaced = replacePlaceholders(documentXml, data);
    zip.file("word/document.xml", replaced);

    // Заменяем в других частях документа, если они есть
    const extraFiles = ["word/header1.xml", "word/header2.xml", "word/footer1.xml", "word/footer2.xml"];
    for (const fname of extraFiles) {
      const f = zip.file(fname);
      if (f) {
        const content = await f.async("string");
        zip.file(fname, replacePlaceholders(content, data));
      }
    }

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    return blob;
  }

  /**
   * Скачивает Blob как файл.
   */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return {
    replacePlaceholders,
    processDocx,
    downloadBlob,
  };
})();

window.TemplateEngine = TemplateEngine;
