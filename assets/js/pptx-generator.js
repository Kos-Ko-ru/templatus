/**
 * pptx-generator.js — генерация презентаций через pptxgenjs.
 */

const PptxGenerator = (() => {
  function collectData() {
    return {
      title: getValue("projectTitle"),
      subtitle: getValue("projectSubtitle"),
      slides: Array.from(document.querySelectorAll("[data-slide-textarea]")).map((el) => ({
        title: el.dataset.slideTitle,
        text: el.value.trim(),
      })),
      chartLabels: getValue("chartLabels").split(",").map((s) => s.trim()).filter(Boolean),
      chartValues: getValue("chartValues")
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n)),
      theme: getValue("theme") || "blue",
    };
  }

  function getValue(name) {
    const el = document.querySelector(`[name="${name}"]`);
    return el ? el.value.trim() : "";
  }

  function getThemeColors(theme) {
    const themes = {
      blue: { bg: "F8FAFC", primary: "2563EB", text: "0F172A", accent: "1D4ED8" },
      green: { bg: "F0FDF4", primary: "059669", text: "0F172A", accent: "047857" },
      purple: { bg: "FAF5FF", primary: "7C3AED", text: "0F172A", accent: "6D28D9" },
      dark: { bg: "0F172A", primary: "60A5FA", text: "F1F5F9", accent: "93C5FD" },
      orange: { bg: "FFF7ED", primary: "EA580C", text: "0F172A", accent: "C2410C" },
    };
    return themes[theme] || themes.blue;
  }

  function renderPreview(data) {
    const container = document.getElementById("pptx-preview");
    if (!container) return;
    const c = getThemeColors(data.theme);
    const slidesHtml = data.slides
      .map(
        (slide, i) => `
      <div style="background:#${c.bg}; color:#${c.text}; border:1px solid #e2e8f0; border-radius:10px; padding:1.25rem; margin-bottom:1rem; min-height:120px">
        <span style="display:inline-block; background:#${c.primary}; color:#fff; border-radius:999px; padding:.125rem .5rem; font-size:.75rem; margin-bottom:.5rem">Слайд ${i + 1}</span>
        <h4 style="margin:0 0 .5rem; color:#${c.primary}">${escapeHtml(slide.title)}</h4>
        <p style="margin:0; font-size:.9rem">${nl2br(escapeHtml(slide.text))}</p>
      </div>`
      )
      .join("");

    container.innerHTML = `
      <div style="background:#${c.bg}; color:#${c.text}; border-radius:10px; padding:1.5rem; margin-bottom:1rem">
        <h3 style="margin:0 0 .25rem; color:#${c.primary}">${escapeHtml(data.title || "Название проекта")}</h3>
        <p style="margin:0">${escapeHtml(data.subtitle || "Краткое описание")}</p>
      </div>
      ${slidesHtml}
    `;
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

  function nl2br(text) {
    return text.replace(/\n/g, "<br/>");
  }

  async function generate(data, filename = "presentation.pptx") {
    if (!window.PptxGenJS) throw new Error("pptxgenjs не загружен");
    const pptx = new PptxGenJS();
    const c = getThemeColors(data.theme);

    pptx.layout = "LAYOUT_16x9";
    pptx.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: c.bg },
      objects: [],
    });

    // Титульный слайд
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: c.bg };
    titleSlide.addText(data.title || "Название проекта", {
      x: 1, y: 2, w: "80%", fontSize: 36, bold: true, color: c.primary, align: "center",
    });
    titleSlide.addText(data.subtitle || "", {
      x: 1, y: 3.2, w: "80%", fontSize: 18, color: c.text, align: "center",
    });

    // Контентные слайды
    data.slides.forEach((slide) => {
      const s = pptx.addSlide();
      s.background = { color: c.bg };
      s.addText(slide.title, { x: 0.5, y: 0.5, w: "90%", fontSize: 24, bold: true, color: c.primary });
      const lines = slide.text.split("\n").filter(Boolean);
      const bullets = lines.length ? lines : [slide.text];
      s.addText(bullets.map((t) => ({ text: t, options: { bullet: true } })), {
        x: 0.5, y: 1.3, w: "90%", fontSize: 16, color: c.text,
      });
    });

    // Слайд с графиком
    if (data.chartLabels.length && data.chartValues.length) {
      const chartSlide = pptx.addSlide();
      chartSlide.background = { color: c.bg };
      chartSlide.addText("Ключевые показатели", {
        x: 0.5, y: 0.5, w: "90%", fontSize: 24, bold: true, color: c.primary,
      });
      chartSlide.addChart(pptx.ChartType.bar, [
        {
          name: "Показатели",
          labels: data.chartLabels,
          values: data.chartValues,
        },
      ], {
        x: 0.5, y: 1.3, w: "90%", h: 4.5,
        chartColors: [c.primary],
      });
    }

    // Финальный слайд
    const finalSlide = pptx.addSlide();
    finalSlide.background = { color: c.primary };
    finalSlide.addText("Спасибо за внимание!", {
      x: 1, y: 2.5, w: "80%", fontSize: 32, bold: true, color: "FFFFFF", align: "center",
    });

    await pptx.writeFile({ fileName: filename });
  }

  return {
    collectData,
    renderPreview,
    generate,
  };
})();

window.PptxGenerator = PptxGenerator;
