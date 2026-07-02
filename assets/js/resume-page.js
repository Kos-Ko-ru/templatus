/**
 * resume-page.js — логика страницы генератора резюме.
 */

(function () {
  const PAGE_ID = document.body.dataset.pageId || "resume";
  const TOTAL_STEPS = 4;
  let currentStep = 1;

  function init() {
    renderDynamicTemplates();
    bindEvents();
    loadDraft();
    updateUI();
    updatePreview();
  }

  function bindEvents() {
    document.getElementById("next-step").addEventListener("click", nextStep);
    document.getElementById("prev-step").addEventListener("click", prevStep);
    document.getElementById("add-experience").addEventListener("click", () => addExperience());
    document.getElementById("add-education").addEventListener("click", () => addEducation());
    document.getElementById("download-docx").addEventListener("click", () => handleDownload("docx"));
    document.getElementById("download-pdf").addEventListener("click", () => handleDownload("pdf"));
    addShareButton();

    document.getElementById("resume-form").addEventListener("input", () => {
      updatePreview();
      saveDraft();
    });

    document.getElementById("resume-form").addEventListener("change", (e) => {
      if (e.target && e.target.id === "photo") {
        handlePhotoUpload(e.target);
      }
      updatePreview();
      saveDraft();
    });
  }

  function handlePhotoUpload(input) {
    const file = input.files && input.files[0];
    const preview = document.getElementById("photo-preview");
    if (!file || !preview) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.add("visible");
      preview.style.display = "block";
      updatePreview();
      saveDraft();
    };
    reader.readAsDataURL(file);
  }

  function renderDynamicTemplates() {
    // шаблоны уже отрисованы при первом addExperience/addEducation
    addExperience(true);
    addEducation(true);
  }

  function addExperience(silent = false) {
    const list = document.getElementById("experience-list");
    const index = list.children.length + 1;
    const div = document.createElement("div");
    div.className = "dynamic-item";
    div.dataset.experienceItem = "";
    div.innerHTML = `
      <div class="dynamic-item-header">
        <strong>Место работы #${index}</strong>
        <button type="button" class="btn btn-secondary btn-sm" data-remove>Удалить</button>
      </div>
      <div class="form-group">
        <label class="form-label">Компания</label>
        <input type="text" name="company" placeholder="ООО «Ромашка»">
      </div>
      <div class="form-group">
        <label class="form-label">Должность</label>
        <input type="text" name="position" placeholder="Frontend-разработчик">
      </div>
      <div class="form-group">
        <label class="form-label">Период</label>
        <input type="text" name="period" placeholder="январь 2021 — по настоящее время">
      </div>
      <div class="form-group">
        <label class="form-label">Обязанности и достижения</label>
        <textarea name="duties" rows="3" placeholder="Разработка интерфейсов, оптимизация производительности..."></textarea>
      </div>
    `;
    div.querySelector("[data-remove]").addEventListener("click", () => {
      div.remove();
      reindex(list);
      updatePreview();
      saveDraft();
    });
    list.appendChild(div);
    if (!silent) {
      updatePreview();
      saveDraft();
    }
  }

  function addEducation(silent = false) {
    const list = document.getElementById("education-list");
    const index = list.children.length + 1;
    const div = document.createElement("div");
    div.className = "dynamic-item";
    div.dataset.educationItem = "";
    div.innerHTML = `
      <div class="dynamic-item-header">
        <strong>Образование #${index}</strong>
        <button type="button" class="btn btn-secondary btn-sm" data-remove>Удалить</button>
      </div>
      <div class="form-group">
        <label class="form-label">Учебное заведение</label>
        <input type="text" name="institution" placeholder="МГУ им. Ломоносова">
      </div>
      <div class="form-group">
        <label class="form-label">Специальность</label>
        <input type="text" name="specialty" placeholder="Прикладная информатика">
      </div>
      <div class="form-group">
        <label class="form-label">Год окончания</label>
        <input type="text" name="year" placeholder="2020">
      </div>
    `;
    div.querySelector("[data-remove]").addEventListener("click", () => {
      div.remove();
      reindex(list);
      updatePreview();
      saveDraft();
    });
    list.appendChild(div);
    if (!silent) {
      updatePreview();
      saveDraft();
    }
  }

  function reindex(list) {
    Array.from(list.children).forEach((item, i) => {
      item.querySelector("strong").textContent = item.closest("#experience-list")
        ? `Место работы #${i + 1}`
        : `Образование #${i + 1}`;
    });
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      updateUI();
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      updateUI();
    }
  }

  function validateCurrentStep() {
    const panel = document.getElementById(`step-${currentStep}`);
    const required = panel.querySelectorAll("[required]");
    let valid = true;
    required.forEach((el) => {
      if (!el.value.trim()) {
        el.setAttribute("aria-invalid", "true");
        valid = false;
      } else {
        el.removeAttribute("aria-invalid");
      }
    });
    return valid;
  }

  function updateUI() {
    document.querySelectorAll(".step-panel").forEach((panel) => panel.classList.add("hidden"));
    document.getElementById(`step-${currentStep}`).classList.remove("hidden");

    document.querySelectorAll(".step").forEach((step) => {
      const n = parseInt(step.dataset.step, 10);
      step.classList.remove("active", "completed");
      if (n === currentStep) step.classList.add("active");
      else if (n < currentStep) step.classList.add("completed");
    });

    document.getElementById("prev-step").disabled = currentStep === 1;
    const nextBtn = document.getElementById("next-step");
    const downloadActions = document.getElementById("download-actions");

    if (currentStep === TOTAL_STEPS) {
      nextBtn.style.display = "none";
      downloadActions.style.display = "flex";
    } else {
      nextBtn.style.display = "inline-flex";
      nextBtn.textContent = "Далее";
      downloadActions.style.display = "none";
    }
  }

  function updatePreview() {
    const data = ResumeGenerator.collectData();
    ResumeGenerator.renderPreview(data);
  }

  function saveDraft() {
    const data = ResumeGenerator.collectData();
    Storage.set(PAGE_ID, data);
  }

  function loadDraft() {
    const data = Storage.get(PAGE_ID);
    if (!data) return;

    setValue("fullName", data.fullName);
    setValue("position", data.position);
    setValue("city", data.city);
    setValue("phone", data.phone);
    setValue("email", data.email);
    setValue("about", data.about);
    setValue("customSkills", data.customSkills);
    setValue("languages", data.languages);

    const photoPreview = document.getElementById("photo-preview");
    if (photoPreview && data.photo) {
      photoPreview.src = data.photo;
      photoPreview.classList.add("visible");
      photoPreview.style.display = "block";
    }

    document.querySelectorAll('input[name="skills"]').forEach((cb) => {
      cb.checked = data.skills && data.skills.includes(cb.value);
    });

    document.getElementById("experience-list").innerHTML = "";
    if (data.experience && data.experience.length) {
      data.experience.forEach((exp) => {
        addExperience(true);
        const item = document.getElementById("experience-list").lastElementChild;
        item.querySelector('[name="company"]').value = exp.company || "";
        item.querySelector('[name="position"]').value = exp.position || "";
        item.querySelector('[name="period"]').value = exp.period || "";
        item.querySelector('[name="duties"]').value = exp.duties || "";
      });
    } else {
      addExperience(true);
    }

    document.getElementById("education-list").innerHTML = "";
    if (data.education && data.education.length) {
      data.education.forEach((edu) => {
        addEducation(true);
        const item = document.getElementById("education-list").lastElementChild;
        item.querySelector('[name="institution"]').value = edu.institution || "";
        item.querySelector('[name="specialty"]').value = edu.specialty || "";
        item.querySelector('[name="year"]').value = edu.year || "";
      });
    } else {
      addEducation(true);
    }
  }

  function setValue(name, value) {
    const el = document.querySelector(`[name="${name}"]`);
    if (el && value !== undefined) el.value = value;
  }

  function addShareButton() {
    const container = document.getElementById("download-actions");
    if (!container || container.querySelector("[data-share-btn]")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secondary";
    btn.dataset.shareBtn = "";
    btn.innerHTML = '<i class="ph ph-share-network" aria-hidden="true"></i> Поделиться';
    btn.addEventListener("click", () => {
      const data = ResumeGenerator.collectData();
      if (window.shareDraft) shareDraft(PAGE_ID, data);
    });
    container.insertBefore(btn, container.firstChild);
  }

  async function handleDownload(format) {
    if (!validateCurrentStep()) return;
    const data = ResumeGenerator.collectData();
    const filename = `resume-${ transliterate(data.fullName || "it-specialist").replace(/\s+/g, "-") }.${format}`;

    showDownloadModal(async () => {
      try {
        if (format === "docx") await ResumeGenerator.generateDocx(data, filename);
        else ResumeGenerator.generatePdf(data, filename);
        bumpCounter();
        const clear = await showConfirm({
          title: 'Документ готов',
          message: 'Очистить черновик?',
          confirmText: 'Очистить',
          cancelText: 'Оставить'
        });
        if (clear) Storage.remove(PAGE_ID);
      } catch (err) {
        console.error(err);
        showToast('Ошибка при генерации файла: ' + err.message, 'error');
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
