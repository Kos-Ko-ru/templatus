/**
 * resume-generator.js — генерация резюме в DOCX и PDF.
 * Зависит от docx, pdfmake, TemplateEngine, Storage.
 */

const ResumeGenerator = (() => {
  function collectData() {
    const photoPreview = document.getElementById("photo-preview");
    const data = {
      fullName: getValue("fullName"),
      phone: getValue("phone"),
      email: getValue("email"),
      city: getValue("city"),
      about: getValue("about"),
      position: getValue("position"),
      languages: getValue("languages"),
      photo: photoPreview && photoPreview.style.display !== "none" ? photoPreview.src : "",
      skills: [],
      experience: [],
      education: [],
    };

    document.querySelectorAll('input[name="skills"]:checked').forEach((cb) => {
      data.skills.push(cb.value);
    });
    const customSkills = getValue("customSkills");
    if (customSkills) {
      data.skills.push(...customSkills.split(",").map((s) => s.trim()).filter(Boolean));
    }

    document.querySelectorAll("[data-experience-item]").forEach((item) => {
      data.experience.push({
        company: item.querySelector('[name="company"]').value,
        position: item.querySelector('[name="position"]').value,
        period: item.querySelector('[name="period"]').value,
        duties: item.querySelector('[name="duties"]').value,
      });
    });

    document.querySelectorAll("[data-education-item]").forEach((item) => {
      data.education.push({
        institution: item.querySelector('[name="institution"]').value,
        specialty: item.querySelector('[name="specialty"]').value,
        year: item.querySelector('[name="year"]').value,
      });
    });

    return data;
  }

  function getValue(name) {
    const el = document.querySelector(`[name="${name}"]`);
    return el ? el.value.trim() : "";
  }

  function renderPreview(data, containerId = "resume-preview") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const photoHtml = data.photo
      ? `<img src="${escapeHtml(data.photo)}" alt="Фото" class="resume-preview-photo">`
      : "";

    const contacts = [data.city, data.phone, data.email].filter(Boolean).join(" · ");

    const expHtml = data.experience.length
      ? data.experience
          .map(
            (e) => `
          <div class="resume-preview-item">
            <strong>${escapeHtml(e.position)}</strong>, ${escapeHtml(e.company)}<br/>
            <span class="resume-preview-period">${escapeHtml(e.period)}</span>
            <p style="margin:.25rem 0 0">${nl2br(escapeHtml(e.duties))}</p>
          </div>`
          )
          .join("")
      : '<p class="resume-preview-empty">Опыт работы не указан</p>';

    const eduHtml = data.education.length
      ? data.education
          .map(
            (e) => `
          <div class="resume-preview-item">
            <strong>${escapeHtml(e.institution)}</strong><br/>
            ${escapeHtml(e.specialty)} — ${escapeHtml(e.year)}
          </div>`
          )
          .join("")
      : '<p class="resume-preview-empty">Образование не указано</p>';

    const skillsHtml = data.skills.length
      ? `<div class="resume-preview-skills">${data.skills
          .map((s) => `<span class="resume-preview-tag">${escapeHtml(s)}</span>`)
          .join("")}</div>`
      : '<p class="resume-preview-empty">Навыки не указаны</p>';

    container.innerHTML = `
      <div class="resume-preview">
        <div class="resume-preview-header">
          ${photoHtml}
          <div class="resume-preview-title">
            <h2>${escapeHtml(data.fullName || "ФИО")}</h2>
            <p class="position">${escapeHtml(data.position || "Желаемая должность")}</p>
            ${contacts ? `<p class="contacts">${escapeHtml(contacts)}</p>` : ""}
          </div>
        </div>
        ${data.about ? `<div class="resume-preview-section"><h3>О себе</h3><p>${nl2br(escapeHtml(data.about))}</p></div>` : ""}
        <div class="resume-preview-section">
          <h3>Опыт работы</h3>
          ${expHtml}
        </div>
        <div class="resume-preview-section">
          <h3>Образование</h3>
          ${eduHtml}
        </div>
        <div class="resume-preview-section">
          <h3>Навыки</h3>
          ${skillsHtml}
        </div>
        ${data.languages ? `<div class="resume-preview-section"><h3>Языки</h3><p>${escapeHtml(data.languages)}</p></div>` : ""}
      </div>
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

  function dataUrlToUint8Array(dataUrl) {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function generateDocx(data, filename = "resume.docx") {
    if (!window.docx) throw new Error("docx.js не загружен");
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = docx;

    const children = [];

    if (data.photo) {
      const imageBytes = dataUrlToUint8Array(data.photo);
      if (imageBytes) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new ImageRun({
                data: imageBytes,
                transformation: { width: 100, height: 100 },
                type: data.photo.includes("image/png") ? "png" : "jpg",
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    }

    children.push(
      new Paragraph({
        text: data.fullName || "ФИО",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.LEFT,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: data.position || "Желаемая должность", bold: true, color: "2563EB" }),
        ],
      }),
      new Paragraph({
        text: [data.city, data.phone, data.email].filter(Boolean).join(" · "),
        spacing: { after: 200 },
      })
    );

    if (data.about) {
      children.push(
        new Paragraph({ text: "О себе", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: data.about, spacing: { after: 200 } })
      );
    }

    children.push(new Paragraph({ text: "Опыт работы", heading: HeadingLevel.HEADING_2 }));
    if (data.experience.length) {
      data.experience.forEach((exp) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.position, bold: true }),
              new TextRun({ text: `, ${exp.company}` }),
            ],
          }),
          new Paragraph({ text: exp.period, color: "64748B", size: 20 }),
          new Paragraph({ text: exp.duties, spacing: { after: 150 } })
        );
      });
    } else {
      children.push(new Paragraph({ text: "Опыт работы не указан", color: "64748B" }));
    }

    children.push(new Paragraph({ text: "Образование", heading: HeadingLevel.HEADING_2 }));
    if (data.education.length) {
      data.education.forEach((edu) => {
        children.push(
          new Paragraph({ text: edu.institution, bold: true }),
          new Paragraph({ text: `${edu.specialty} — ${edu.year}`, spacing: { after: 150 } })
        );
      });
    } else {
      children.push(new Paragraph({ text: "Образование не указано", color: "64748B" }));
    }

    children.push(
      new Paragraph({ text: "Навыки", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: data.skills.join(", ") || "—", spacing: { after: 150 } })
    );

    if (data.languages) {
      children.push(
        new Paragraph({ text: "Языки", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: data.languages })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
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

  function generatePdf(data, filename = "resume.pdf") {
    if (!window.pdfMake) throw new Error("pdfmake не загружен");
    setupCyrillicFonts();

    const experienceBlocks = data.experience.length
      ? data.experience.flatMap((exp) => [
          { text: `${exp.position}, ${exp.company}`, bold: true, margin: [0, 8, 0, 0] },
          { text: exp.period, color: "#64748b", fontSize: 10 },
          { text: exp.duties, margin: [0, 0, 0, 8] },
        ])
      : [{ text: "Опыт работы не указан", color: "#64748b" }];

    const educationBlocks = data.education.length
      ? data.education.flatMap((edu) => [
          { text: edu.institution, bold: true, margin: [0, 8, 0, 0] },
          { text: `${edu.specialty} — ${edu.year}`, margin: [0, 0, 0, 8] },
        ])
      : [{ text: "Образование не указано", color: "#64748b" }];

    const headerColumn = {
      stack: [
        { text: data.fullName || "ФИО", style: "header" },
        { text: data.position || "Желаемая должность", style: "subheader" },
        { text: [data.city, data.phone, data.email].filter(Boolean).join(" · "), margin: [0, 0, 0, 12] },
      ],
      width: "*",
    };

    const content = [headerColumn];

    if (data.photo) {
      content[0] = {
        columns: [
          headerColumn,
          { image: data.photo, width: 80, height: 80, alignment: "right" },
        ],
        columnGap: 16,
        margin: [0, 0, 0, 12],
      };
    }

    if (data.about) {
      content.push({ text: "О себе", style: "section" }, { text: data.about, margin: [0, 0, 0, 12] });
    }

    content.push(
      { text: "Опыт работы", style: "section" },
      ...experienceBlocks,
      { text: "Образование", style: "section" },
      ...educationBlocks,
      { text: "Навыки", style: "section" },
      { text: data.skills.join(", ") || "—", margin: [0, 0, 0, 12] }
    );

    if (data.languages) {
      content.push({ text: "Языки", style: "section" }, { text: data.languages });
    }

    const docDefinition = {
      content,
      styles: {
        header: { fontSize: 24, bold: true, margin: [0, 0, 0, 6] },
        subheader: { fontSize: 14, bold: true, color: "#2563eb", margin: [0, 0, 0, 6] },
        section: { fontSize: 13, bold: true, margin: [0, 12, 0, 4] },
      },
      defaultStyle: { font: "DejaVuSans" },
    };

    pdfMake.createPdf(docDefinition).download(filename);
  }

  return {
    collectData,
    renderPreview,
    generateDocx,
    generatePdf,
  };
})();

window.ResumeGenerator = ResumeGenerator;
