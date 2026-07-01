/**
 * resume-generator.js — генерация резюме в DOCX и PDF.
 * Зависит от docx, pdfmake, TemplateEngine, Storage.
 */

const ResumeGenerator = (() => {
  function collectData() {
    const data = {
      fullName: getValue("fullName"),
      phone: getValue("phone"),
      email: getValue("email"),
      city: getValue("city"),
      about: getValue("about"),
      position: getValue("position"),
      languages: getValue("languages"),
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

    const expHtml = data.experience.length
      ? data.experience
          .map(
            (e) => `
          <div style="margin-bottom:1rem">
            <strong>${escapeHtml(e.position)}</strong>, ${escapeHtml(e.company)}<br/>
            <span style="color:#64748b">${escapeHtml(e.period)}</span>
            <p style="margin:.25rem 0 0">${nl2br(escapeHtml(e.duties))}</p>
          </div>`
          )
          .join("")
      : "<p style=\"color:#64748b\">Опыт работы не указан</p>";

    const eduHtml = data.education.length
      ? data.education
          .map(
            (e) => `
          <div style="margin-bottom:1rem">
            <strong>${escapeHtml(e.institution)}</strong><br/>
            ${escapeHtml(e.specialty)} — ${escapeHtml(e.year)}
          </div>`
          )
          .join("")
      : "<p style=\"color:#64748b\">Образование не указано</p>";

    container.innerHTML = `
      <div style="border-bottom:2px solid #2563eb; padding-bottom:1rem; margin-bottom:1.5rem">
        <h2 style="margin:0 0 .25rem; font-size:1.75rem">${escapeHtml(data.fullName || "ФИО")}</h2>
        <p style="margin:0; font-size:1.1rem; color:#2563eb; font-weight:600">${escapeHtml(data.position || "Желаемая должность")}</p>
        <p style="margin:.5rem 0 0; color:#64748b; font-size:.9rem">
          ${escapeHtml(data.city)} · ${escapeHtml(data.phone)} · ${escapeHtml(data.email)}
        </p>
      </div>
      ${data.about ? `<h3 style="margin:1rem 0 .5rem">О себе</h3><p>${nl2br(escapeHtml(data.about))}</p>` : ""}
      <h3 style="margin:1.5rem 0 .5rem">Опыт работы</h3>
      ${expHtml}
      <h3 style="margin:1.5rem 0 .5rem">Образование</h3>
      ${eduHtml}
      <h3 style="margin:1.5rem 0 .5rem">Навыки</h3>
      <p>${escapeHtml(data.skills.join(", "))}</p>
      ${data.languages ? `<h3 style="margin:1.5rem 0 .5rem">Языки</h3><p>${escapeHtml(data.languages)}</p>` : ""}
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

  async function generateDocx(data, filename = "resume.docx") {
    if (!window.docx) throw new Error("docx.js не загружен");
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

    const children = [
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
      }),
    ];

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

    const content = [
      { text: data.fullName || "ФИО", style: "header" },
      { text: data.position || "Желаемая должность", style: "subheader" },
      { text: [data.city, data.phone, data.email].filter(Boolean).join(" · "), margin: [0, 0, 0, 12] },
    ];

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
