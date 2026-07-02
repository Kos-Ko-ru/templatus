/**
 * my-documents.js — страница истории документов из localStorage.
 */
(function () {
  'use strict';

  // Реестр известных страниц-генераторов
  const PAGE_REGISTRY = {
    'resume-it': { title: 'Резюме IT-специалиста', url: '/resume/it-specialist.html', type: 'resume', icon: 'ph-user' },
    'resume-sales': { title: 'Резюме менеджера по продажам', url: '/resume/sales-manager.html', type: 'resume', icon: 'ph-chart-line-up' },
    'resume-noexp': { title: 'Резюме без опыта', url: '/resume/no-experience.html', type: 'resume', icon: 'ph-student' },
    'resume-accountant': { title: 'Резюме бухгалтера', url: '/resume/accountant.html', type: 'resume', icon: 'ph-calculator' },
    'resume-marketer': { title: 'Резюме маркетолога', url: '/resume/marketer.html', type: 'resume', icon: 'ph-megaphone' },
    'resume-pm': { title: 'Резюме менеджера проекта', url: '/resume/project-manager.html', type: 'resume', icon: 'ph-kanban' },
    'resume-designer': { title: 'Резюме дизайнера', url: '/resume/designer.html', type: 'resume', icon: 'ph-paint-brush' },
    'resume-sysadmin': { title: 'Резюме системного администратора', url: '/resume/system-admin.html', type: 'resume', icon: 'ph-desktop-tower' },
    'resume-lawyer': { title: 'Резюме юриста', url: '/resume/lawyer.html', type: 'resume', icon: 'ph-scales' },
    'resume-hr': { title: 'Резюме HR-специалиста', url: '/resume/hr-specialist.html', type: 'resume', icon: 'ph-users' },
    'resume-analyst': { title: 'Резюме аналитика', url: '/resume/analyst.html', type: 'resume', icon: 'ph-chart-pie-slice' },
    'resume-driver': { title: 'Резюме водителя', url: '/resume/driver.html', type: 'resume', icon: 'ph-car' },
    'resume-cashier': { title: 'Резюме кассира', url: '/resume/cashier.html', type: 'resume', icon: 'ph-cash-register' },
    'resume-cook': { title: 'Резюме повара', url: '/resume/cook.html', type: 'resume', icon: 'ph-cooking-pot' },
    'resume-security': { title: 'Резюме охранника', url: '/resume/security.html', type: 'resume', icon: 'ph-shield-check' },
    'resume-nurse': { title: 'Резюме медсестры', url: '/resume/nurse.html', type: 'resume', icon: 'ph-heartbeat' },

    'doc-arenda': { title: 'Договор аренды жилья', url: '/documents/dogovor-arendy.html', type: 'document', icon: 'ph-house' },
    'doc-otpusk': { title: 'Заявление на отпуск', url: '/documents/zayavlenie-otpusk.html', type: 'document', icon: 'ph-airplane' },
    'doc-doverennost': { title: 'Доверенность', url: '/documents/doverennost.html', type: 'document', icon: 'ph-signature' },
    'doc-kompred': { title: 'Коммерческое предложение', url: '/documents/kommercheskoye-predlozheniye.html', type: 'document', icon: 'ph-currency-rub' },
    'doc-uvolnenie': { title: 'Заявление на увольнение', url: '/documents/zayavlenie-uvolnenie.html', type: 'document', icon: 'ph-sign-out' },
    'doc-raspiska': { title: 'Расписка в получении денег', url: '/documents/raspiska-dengi.html', type: 'document', icon: 'ph-money' },
    'doc-akt': { title: 'Акт приёма-передачи', url: '/documents/akt-priemki.html', type: 'document', icon: 'ph-handshake' },

    'pptx-pitch': { title: 'Питч-дек стартапа', url: '/presentations/pitch-deck.html', type: 'presentation', icon: 'ph-rocket' },
    'pptx-quarterly': { title: 'Квартальный отчёт', url: '/presentations/quarterly-report.html', type: 'presentation', icon: 'ph-chart-bar' },
    'pptx-business-plan': { title: 'Бизнес-план', url: '/presentations/business-plan.html', type: 'presentation', icon: 'ph-briefcase' },
    'pptx-education': { title: 'Образовательная презентация', url: '/presentations/education.html', type: 'presentation', icon: 'ph-chalkboard-teacher' },
    'pptx-marketing': { title: 'Маркетинговая стратегия', url: '/presentations/marketing-strategy.html', type: 'presentation', icon: 'ph-trend-up' },
    'pptx-project-report': { title: 'Отчёт о проекте', url: '/presentations/project-report.html', type: 'presentation', icon: 'ph-clipboard-text' }
  };

  function getPageInfo(pageId) {
    return PAGE_REGISTRY[pageId] || {
      title: pageId,
      url: '/',
      type: 'unknown',
      icon: 'ph-file'
    };
  }

  function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  function renderList() {
    const listEl = document.getElementById('doc-history-list');
    const emptyEl = document.getElementById('doc-history-empty');
    const clearBtn = document.getElementById('clear-history');

    if (!listEl) return;

    const items = Storage.list();

    if (!items.length) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      clearBtn.classList.add('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    clearBtn.classList.remove('hidden');

    listEl.innerHTML = items.map(function (item) {
      const info = getPageInfo(item.pageId);
      const fullName = item.values.fullName || item.values.fio || '';
      const projectTitle = item.values.projectTitle || item.values.title || '';
      const subtitle = fullName || projectTitle || '';
      const shareHash = createShareHash(item.pageId, item.values);
      const shareUrl = shareHash ? `${window.location.origin}/share.html#${shareHash}` : '';

      return `
        <article class="doc-history-item" data-page-id="${item.pageId}">
          <div class="doc-history-icon"><i class="ph ${info.icon}" aria-hidden="true"></i></div>
          <div class="doc-history-info">
            <h3>${info.title}</h3>
            ${subtitle ? `<p class="doc-history-subtitle">${subtitle}</p>` : ''}
            <p class="doc-history-date">Последнее изменение: ${formatDate(item.updated)}</p>
          </div>
          <div class="doc-history-actions">
            <a href="${info.url}" class="btn btn-primary btn-sm">Редактировать</a>
            ${shareUrl ? `<button type="button" class="btn btn-secondary btn-sm" data-share-url="${shareUrl}">Поделиться</button>` : ''}
            <button type="button" class="btn btn-danger btn-sm" data-remove="${item.pageId}">Удалить</button>
          </div>
        </article>
      `;
    }).join('');

    bindActions();
  }

  function bindActions() {
    document.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const pageId = btn.dataset.remove;
        if (confirm('Удалить черновик?')) {
          Storage.remove(pageId);
          renderList();
        }
      });
    });

    document.querySelectorAll('[data-share-url]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const url = btn.dataset.shareUrl;
        if (navigator.clipboard && url) {
          navigator.clipboard.writeText(url).then(function () {
            alert('Ссылка скопирована в буфер обмена');
          }).catch(function () {
            prompt('Скопируйте ссылку:', url);
          });
        } else {
          prompt('Скопируйте ссылку:', url);
        }
      });
    });

    const clearBtn = document.getElementById('clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (confirm('Очистить всю историю документов?')) {
          Storage.clearAll();
          renderList();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', renderList);
})();
