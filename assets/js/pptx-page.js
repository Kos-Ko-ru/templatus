/**
 * pptx-page.js — логика генератора презентаций (питч-дек).
 */

(function () {
  const PAGE_ID = "pptx-pitch";

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

  function handleDownload() {
    const data = PptxGenerator.collectData();
    const filename = `pitch-deck-${transliterate(data.title || "startup").replace(/\s+/g, "-")}.pptx`;

    showDownloadModal(async () => {
      try {
        await PptxGenerator.generate(data, filename);
        bumpCounter();
        if (confirm("Презентация готова. Очистить черновик?")) {
          Storage.remove(PAGE_ID);
        }
      } catch (err) {
        console.error(err);
        alert("Ошибка при генерации презентации: " + err.message);
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
