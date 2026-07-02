/**
 * pptx-page.js — логика генератора презентаций (питч-дек).
 */

(function () {
  const PAGE_ID = document.body.dataset.pageId || "pptx";

  function init() {
    bindEvents();
    loadDraft();
    updatePreview();
  }

  function bindEvents() {
    const form = document.getElementById("pptx-form");
    form.addEventListener("input", () => {
      updatePreview();
      saveDraft();
    });
    document.getElementById("download-pptx").addEventListener("click", handleDownload);
    addShareButton();
  }

  function updatePreview() {
    const data = PptxGenerator.collectData();
    PptxGenerator.renderPreview(data);
  }

  function saveDraft() {
    const data = PptxGenerator.collectData();
    Storage.set(PAGE_ID, data);
  }

  function loadDraft() {
    const data = Storage.get(PAGE_ID);
    if (!data) return;
    if (data.title) setValue("projectTitle", data.title);
    if (data.subtitle) setValue("projectSubtitle", data.subtitle);
    if (data.theme) setValue("theme", data.theme);
    if (data.chartLabels) setValue("chartLabels", data.chartLabels.join(", "));
    if (data.chartValues) setValue("chartValues", data.chartValues.join(", "));
    if (data.slides && data.slides.length) {
      data.slides.forEach((slide) => {
        const textarea = document.querySelector(`[data-slide-title="${slide.title}"]`);
        if (textarea) textarea.value = slide.text;
      });
    }
  }

  function setValue(name, value) {
    const el = document.querySelector(`[name="${name}"]`);
    if (el && value !== undefined) el.value = value;
  }

  function resetDraft() {
    Storage.remove(PAGE_ID);
    const form = document.getElementById("pptx-form");
    if (form) form.reset();
    updatePreview();
  }

  function addShareButton() {
    const container = document.querySelector("#pptx-form .flex.gap-4.mt-4");
    if (!container || container.querySelector("[data-share-btn]")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secondary";
    btn.dataset.shareBtn = "";
    btn.innerHTML = '<i class="ph ph-share-network" aria-hidden="true"></i> Поделиться';
    btn.addEventListener("click", () => {
      const data = PptxGenerator.collectData();
      if (window.shareDraft) shareDraft(PAGE_ID, data);
    });
    container.insertBefore(btn, container.firstChild);
  }

  async function handleDownload() {
    const data = PptxGenerator.collectData();
    const filename = `pitch-deck-${transliterate(data.title || "startup").replace(/\s+/g, "-")}.pptx`;

    showDownloadModal(async () => {
      try {
        await PptxGenerator.generate(data, filename);
        bumpCounter();
        const clear = await showConfirm({
          title: 'Презентация готова',
          message: 'Очистить черновик?',
          confirmText: 'Очистить',
          cancelText: 'Оставить'
        });
        if (clear) resetDraft();
      } catch (err) {
        console.error(err);
        showToast('Ошибка при генерации презентации: ' + err.message, 'error');
      }
    });
  }

  function transliterate(str) {
    const map = {
      а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i",
      й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
      у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e",
      ю: "yu", я: "ya", " ": "-", "_": "-",
    };
    return str.toLowerCase().split("").map((c) => map[c] || c).join("").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
