/**
 * doc-page.js — универсальная логика генератора документов.
 * Выбирает шаблон по data-doc-template на <body>.
 */

(function () {
  const body = document.body;
  const PAGE_ID = body.dataset.pageId;
  const TEMPLATE_NAME = body.dataset.docTemplate || "arenda";

  const TEMPLATES = {
    arenda: DocGenerator.arendaTemplate,
    otpusk: DocGenerator.otpuskTemplate,
    doverennost: DocGenerator.doverennostTemplate,
    kompredlozheniye: DocGenerator.kompredlozheniyeTemplate,
    uvolnenie: DocGenerator.uvolnenieTemplate,
    raspiska: DocGenerator.raspiskaTemplate,
    akt: DocGenerator.aktTemplate,
  };

  const template = TEMPLATES[TEMPLATE_NAME];

  function init() {
    if (!template) {
      console.error("Unknown doc template:", TEMPLATE_NAME);
      return;
    }
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
      toggleConditionalFields();
      updatePreview();
      saveDraft();
    });
    document.getElementById("download-docx").addEventListener("click", () => handleDownload("docx"));
    document.getElementById("download-pdf").addEventListener("click", () => handleDownload("pdf"));
    addShareButton();
  }

  function addShareButton() {
    const container = document.querySelector("#doc-form .flex.gap-4.mt-4");
    if (!container || container.querySelector("[data-share-btn]")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secondary";
    btn.dataset.shareBtn = "";
    btn.innerHTML = '<i class="ph ph-share-network" aria-hidden="true"></i> Поделиться';
    btn.addEventListener("click", () => {
      const data = DocGenerator.collectFields("doc-form");
      if (window.shareDraft) shareDraft(PAGE_ID, data);
    });
    container.insertBefore(btn, container.firstChild);
  }

  function toggleConditionalFields() {
    const deposit = document.getElementById("deposit");
    if (deposit) {
      const group = document.getElementById("deposit-group");
      if (group) group.style.display = deposit.checked ? "block" : "none";
    }
  }

  function updatePreview() {
    const data = DocGenerator.collectFields("doc-form");
    const html = template(data)
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
    toggleConditionalFields();
  }

  function handleDownload(format) {
    const data = DocGenerator.collectFields("doc-form");
    const filename = `${TEMPLATE_NAME}.${format}`;

    showDownloadModal(async () => {
      try {
        if (format === "docx") await DocGenerator.generateDocx(data, template, filename);
        else DocGenerator.generatePdf(data, template, filename);
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
