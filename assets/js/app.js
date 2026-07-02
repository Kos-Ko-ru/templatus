/**
 * app.js — общая логика сайта templatus.
 * Тема, мобильное меню, FAQ-аккордеон, счётчик документов, рекламный модал.
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileMenu();
  initAccordion();
  updateCounter();
  initContactForm();
});

function initTheme() {
  const saved = Storage.getTheme();
  applyTheme(saved);
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      Storage.setTheme(next);
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = theme === "dark" ? "sun" : "moon";
  document.querySelectorAll("[data-theme-icon]").forEach((el) => {
    el.textContent = icon === "sun" ? "☀" : "☾";
  });
}

function initMobileMenu() {
  const toggle = document.querySelector("[data-mobile-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("hidden");
    toggle.setAttribute("aria-expanded", String(!open));
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initAccordion() {
  document.querySelectorAll("[data-accordion-header]").forEach((header) => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;
      const isOpen = body.classList.contains("open");
      document.querySelectorAll("[data-accordion-body]").forEach((b) => b.classList.remove("open"));
      if (!isOpen) body.classList.add("open");
      header.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

function animateValue(el, start, end, duration) {
  const startTime = performance.now();
  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (end - start) * ease);
    el.textContent = current.toLocaleString("ru-RU");
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateCounter() {
  const els = document.querySelectorAll("[data-doc-counter]");
  if (!els.length) return;
  const stats = Storage.getStats();
  els.forEach((el) => animateValue(el, 0, stats.generated, 1500));
}

function bumpCounter() {
  const value = Storage.incrementGenerated();
  document.querySelectorAll("[data-doc-counter]").forEach((el) => {
    el.textContent = value.toLocaleString("ru-RU");
  });
  return value;
}

/**
 * Показывает модальное окно перед скачиванием с прогресс-баром.
 * @param {Function} onDownload — вызывается после завершения прогресса
 */
function showDownloadModal(onDownload) {
  const overlay = document.getElementById("download-modal");
  const progress = document.getElementById("download-progress");
  const btn = document.getElementById("download-modal-btn");
  if (!overlay) {
    onDownload();
    return;
  }

  overlay.classList.add("open");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Подождите...";
  }
  if (progress) progress.style.width = "0%";

  let percent = 0;
  const duration = 3500;
  const interval = 50;
  const step = 100 / (duration / interval);

  const timer = setInterval(() => {
    percent += step;
    if (percent >= 100) {
      percent = 100;
      clearInterval(timer);
      if (progress) progress.style.width = "100%";
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Скачать документ";
        btn.onclick = () => {
          onDownload();
          closeDownloadModal();
        };
      }
    } else {
      if (progress) progress.style.width = `${percent}%`;
    }
  }, interval);
}

function closeDownloadModal() {
  const overlay = document.getElementById("download-modal");
  if (overlay) overlay.classList.remove("open");
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const subject = formData.get("subject")?.toString().trim() || "";
    const message = formData.get("message")?.toString().trim() || "";

    const subjectLabels = {
      proposal: "Предложение о сотрудничестве",
      bug: "Ошибка на сайте",
      template: "Запрос шаблона",
      other: "Другое",
    };

    const mailSubject = `[templatus] ${subjectLabels[subject] || subject}`;
    const mailBody = `Имя: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${message}`;
    window.location.href = `mailto:hello@templatus.ru?subject=${encodeURIComponent(mailSubject)}&body=${mailBody}`;
  });
}

function createShareHash(pageId, values) {
  try {
    const payload = JSON.stringify({ pageId: pageId, values: values });
    return btoa(unescape(encodeURIComponent(payload)));
  } catch (e) {
    console.warn('Share hash error', e);
    return '';
  }
}

function shareDraft(pageId, values) {
  if (!pageId || !values) return;
  const hash = createShareHash(pageId, values);
  if (!hash) {
    alert('Не удалось создать ссылку');
    return;
  }
  Storage.set(pageId, values);
  const url = `${window.location.origin}/share#${hash}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert('Ссылка скопирована в буфер обмена');
    }).catch(() => {
      prompt('Скопируйте ссылку:', url);
    });
  } else {
    prompt('Скопируйте ссылку:', url);
  }
}

window.showDownloadModal = showDownloadModal;
window.closeDownloadModal = closeDownloadModal;
window.bumpCounter = bumpCounter;
window.initContactForm = initContactForm;
window.shareDraft = shareDraft;
