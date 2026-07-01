/**
 * doc-page.js — логика генератора документов (договор аренды).
 */

(function () {
  const PAGE_ID = "doc-arenda";

  function init() {
    bindEvents();
    loadDraft();
    updatePreview();
  }

  function bindEvents() {
    const form = document.getElementById("doc-form");
    form.addEventListener("input", () => {
      updatePreview();
      saveDraft();
    });
    form.addEventListener("change", () => {
      toggleDeposit();
      updatePreview();
      saveDraft();
    });
    document.getElementById("download-docx").addEventListener("click", () => handleDownload("docx"));
    document.getElementById("download-pdf").addEventListener("click", () => handleDownload("pdf"));
  }

  function toggleDeposit() {
    const deposit = document.getElementById("deposit").checked;
    document.getElementById("deposit-group").style.display = deposit ? "block" : "none";
  }

  function updatePreview() {
    const data = DocGenerator.collectFields("doc-form");
    const html = DocGenerator.arendaTemplate(data)
      .map((block) => {
        if (typeof block === "string") return `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`;
        const tag = block.bold ? "strong" : "span";
        const align = block.align === "center" ? "text-align:center;display:block" : "";
        return `<p style="${align}"><${tag}>${escapeHtml(block.text)}</${tag}></p>`;
      })
      .join("");
    DocGenerator.renderPreview(html);
  }

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function saveDraft() {
    const data = DocGenerator.collectFields("doc-form");
    Storage.set(PAGE_ID, data);
  }

  function loadDraft() {
    const data = Storage.get(PAGE_ID);
    if (!data) return;
    Object.entries(data).forEach(([name, value]) => {
      const el = document.querySelector(`[name="${name}"]`);
      if (!el) return;
      if (el.type === "checkbox") el.checked = !!value;
      else el.value = value === undefined ? "" : value;
    });
    toggleDeposit();
  }

  function handleDownload(format) {
    const data = DocGenerator.collectFields("doc-form");
    const filename = `dogovor-arendy.${format}`;

    showDownloadModal(async () => {
      try {
        if (format === "docx") await DocGenerator.generateDocx(data, DocGenerator.arendaTemplate, filename);
        else DocGenerator.generatePdf(data, DocGenerator.arendaTemplate, filename);
        bumpCounter();
        if (confirm("Документ готов. Очистить черновик?")) {
          Storage.remove(PAGE_ID);
        }
      } catch (err) {
        console.error(err);
        alert("Ошибка при генерации файла: " + err.message);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
