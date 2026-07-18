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
  initCookieConsent();
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

function toggleCounterBadges(count) {
  const showCounter = count > 0;
  document.querySelectorAll("[data-counter-badge]").forEach((b) => {
    b.hidden = !showCounter;
  });
  document.querySelectorAll("[data-trust-badge]").forEach((b) => {
    b.hidden = showCounter;
  });
}

function updateCounter() {
  const els = document.querySelectorAll("[data-doc-counter]");
  const stats = Storage.getStats();
  toggleCounterBadges(stats.generated);
  if (!els.length) return;
  if (stats.generated > 0) {
    els.forEach((el) => animateValue(el, 0, stats.generated, 1500));
  }
}

function bumpCounter() {
  const value = Storage.incrementGenerated();
  document.querySelectorAll("[data-doc-counter]").forEach((el) => {
    el.textContent = value.toLocaleString("ru-RU");
  });
  toggleCounterBadges(value);
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
    showToast('Не удалось создать ссылку', 'error');
    return;
  }
  Storage.set(pageId, values);
  const url = `${window.location.origin}/share#${hash}`;
  showShareModal(url);
}

window.showDownloadModal = showDownloadModal;
window.closeDownloadModal = closeDownloadModal;
window.bumpCounter = bumpCounter;
window.initContactForm = initContactForm;
window.shareDraft = shareDraft;

/* =========================
   Toast, modal and cookie consent
   ========================= */

(function () {
  const TOAST_ICONS = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '!',
  };

  function ensureContainers() {
    if (!document.getElementById('tm-toast-container')) {
      const container = document.createElement('div');
      container.id = 'tm-toast-container';
      container.className = 'tm-toast-container';
      document.body.appendChild(container);
    }
  }

  window.showToast = function (message, type) {
    type = type || 'info';
    ensureContainers();
    const container = document.getElementById('tm-toast-container');
    const toast = document.createElement('div');
    toast.className = `tm-toast tm-toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="tm-toast-icon">${TOAST_ICONS[type] || 'ℹ'}</span>
      <span class="tm-toast-message">${escapeHtml(message)}</span>
      <button class="tm-toast-close" aria-label="Закрыть">×</button>
    `;
    toast.querySelector('.tm-toast-close').addEventListener('click', () => removeToast(toast));
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    const timer = setTimeout(() => removeToast(toast), 3500);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => setTimeout(() => removeToast(toast), 1500));
  };

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.showModal = function (options) {
    options = options || {};
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'tm-modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      const buttons = (options.buttons || [{ text: 'OK', value: true, primary: true }]).map((btn, idx) => {
        const cls = btn.primary !== false ? 'btn btn-primary' : 'btn btn-secondary';
        return `<button type="button" class="${cls}" data-value="${encodeURIComponent(JSON.stringify(btn.value ?? idx))}">${escapeHtml(btn.text)}</button>`;
      }).join('');

      const modalClass = ['tm-modal', options.className].filter(Boolean).join(' ');
      overlay.innerHTML = `
        <div class="${modalClass}">
          <h3 class="tm-modal-title">${escapeHtml(options.title || '')}</h3>
          <div class="tm-modal-body">${options.message || ''}</div>
          <div class="tm-modal-actions">${buttons}</div>
        </div>
      `;

      function close(value) {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 200);
        resolve(value);
      }

      overlay.querySelectorAll('button[data-value]').forEach((btn) => {
        btn.addEventListener('click', () => {
          try {
            close(JSON.parse(decodeURIComponent(btn.dataset.value)));
          } catch (e) {
            close(btn.dataset.value);
          }
        });
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && options.dismissable !== false) {
          close(null);
        }
      });

      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') {
          close(null);
          document.removeEventListener('keydown', esc);
        }
      });

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('open'));
    });
  };

  window.showConfirm = function (options) {
    options = options || {};
    return showModal({
      title: options.title || 'Подтверждение',
      message: options.message || '',
      buttons: [
        { text: options.cancelText || 'Отмена', value: false, primary: false },
        { text: options.confirmText || 'Да', value: true, primary: true },
      ],
    });
  };

  window.showPrompt = function (options) {
    options = options || {};
    const message = (options.message || '') + `<input type="text" value="${escapeHtml(options.defaultValue || '')}" id="tm-prompt-input">`;
    return showModal({
      title: options.title || 'Введите значение',
      message: message,
      buttons: [
        { text: options.cancelText || 'Отмена', value: null, primary: false },
        { text: options.okText || 'OK', value: 'ok', primary: true },
      ],
    }).then((value) => {
      if (value === 'ok') {
        const input = document.getElementById('tm-prompt-input');
        return input ? input.value : null;
      }
      return null;
    });
  };

  window.showShareModal = function (url) {
    const promise = showModal({
      className: 'tm-modal-share',
      title: 'Поделиться документом',
      message: `
        <div class="tm-share-header">
          <div class="tm-share-icon"><i class="ph ph-share-network" aria-hidden="true"></i></div>
          <p class="tm-share-hint">Скопируйте ссылку и отправьте её. Получатель откроет заполненный документ.</p>
        </div>
        <div class="tm-share-link">
          <input type="text" id="tm-share-input" value="${escapeHtml(url)}" readonly aria-label="Ссылка на документ">
          <button type="button" class="btn btn-primary" id="tm-share-copy">
            <i class="ph ph-copy" aria-hidden="true"></i>
            <span>Копировать</span>
          </button>
        </div>
      `,
      buttons: [{ text: 'Закрыть', value: true, primary: false }],
    });

    const input = document.getElementById('tm-share-input');
    const copyBtn = document.getElementById('tm-share-copy');
    if (input && copyBtn) {
      input.addEventListener('click', () => input.select());
      copyBtn.addEventListener('click', () => {
        copyToClipboard(input.value, 'Ссылка скопирована в буфер обмена');
        input.select();
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i><span>Скопировано</span>';
        copyBtn.classList.add('tm-copied');
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
          copyBtn.classList.remove('tm-copied');
        }, 2000);
      });
    }

    return promise.then(() => true);
  };

  window.copyToClipboard = function (text, successMessage) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage || 'Скопировано в буфер обмена', 'success');
      }).catch(() => {
        showToast('Не удалось скопировать автоматически', 'error');
      });
    } else {
      showToast('Буфер обмена недоступен', 'error');
    }
  };

  window.initCookieConsent = function () {
    const key = 'templatus-cookies-accepted';
    if (localStorage.getItem(key)) return;

    const banner = document.createElement('div');
    banner.className = 'tm-cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Уведомление о cookies');
    banner.innerHTML = `
      <p>Мы используем файлы cookie и похожие технологии для аналитики и корректной работы сервиса. Продолжая пользоваться сайтом, вы соглашаетесь с <a href="/privacy" target="_blank">политикой конфиденциальности</a>.</p>
      <button type="button" class="btn btn-primary" id="tm-cookie-accept">Принять</button>
    `;
    document.body.appendChild(banner);

    requestAnimationFrame(() => banner.classList.add('show'));

    banner.querySelector('#tm-cookie-accept').addEventListener('click', () => {
      localStorage.setItem(key, '1');
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    });
  };

  window.cookiesAccepted = function () {
    return !!localStorage.getItem('templatus-cookies-accepted');
  };
})();
