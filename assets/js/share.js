/**
 * share.js — страница просмотра документа по ссылке.
 * Ссылка содержит base64(JSON {pageId, values}).
 * Данные сохраняются в localStorage, чтобы можно было отредактировать документ.
 */
(function () {
  'use strict';

  const REGISTRY = {
    'resume-it': { title: 'Резюме IT-специалиста', url: '/resume/it-specialist', type: 'resume', icon: 'ph-user' },
    'resume-sales': { title: 'Резюме менеджера по продажам', url: '/resume/sales-manager', type: 'resume', icon: 'ph-chart-line-up' },
    'resume-noexp': { title: 'Резюме без опыта', url: '/resume/no-experience', type: 'resume', icon: 'ph-student' },
    'resume-accountant': { title: 'Резюме бухгалтера', url: '/resume/accountant', type: 'resume', icon: 'ph-calculator' },
    'resume-marketer': { title: 'Резюме маркетолога', url: '/resume/marketer', type: 'resume', icon: 'ph-megaphone' },
    'resume-pm': { title: 'Резюме менеджера проекта', url: '/resume/project-manager', type: 'resume', icon: 'ph-kanban' },
    'resume-designer': { title: 'Резюме дизайнера', url: '/resume/designer', type: 'resume', icon: 'ph-paint-brush' },
    'resume-sysadmin': { title: 'Резюме системного администратора', url: '/resume/system-admin', type: 'resume', icon: 'ph-desktop-tower' },
    'resume-lawyer': { title: 'Резюме юриста', url: '/resume/lawyer', type: 'resume', icon: 'ph-scales' },
    'resume-hr': { title: 'Резюме HR-специалиста', url: '/resume/hr-specialist', type: 'resume', icon: 'ph-users' },
    'resume-analyst': { title: 'Резюме аналитика', url: '/resume/analyst', type: 'resume', icon: 'ph-chart-pie-slice' },
    'resume-driver': { title: 'Резюме водителя', url: '/resume/driver', type: 'resume', icon: 'ph-car' },
    'resume-cashier': { title: 'Резюме кассира', url: '/resume/cashier', type: 'resume', icon: 'ph-cash-register' },
    'resume-cook': { title: 'Резюме повара', url: '/resume/cook', type: 'resume', icon: 'ph-cooking-pot' },
    'resume-security': { title: 'Резюме охранника', url: '/resume/security', type: 'resume', icon: 'ph-shield-check' },
    'resume-nurse': { title: 'Резюме медсестры', url: '/resume/nurse', type: 'resume', icon: 'ph-heartbeat' },
    'resume-psychologist': { title: 'Резюме психолога', url: '/resume/psychologist', type: 'resume', icon: 'ph-brain' },
    'resume-teacher': { title: 'Резюме учителя', url: '/resume/teacher', type: 'resume', icon: 'ph-chalkboard-teacher' },
    'resume-engineer': { title: 'Резюме инженера', url: '/resume/engineer', type: 'resume', icon: 'ph-gear' },
    'resume-economist': { title: 'Резюме экономиста', url: '/resume/economist', type: 'resume', icon: 'ph-coins' },
    'resume-logistician': { title: 'Резюме логиста', url: '/resume/logistician', type: 'resume', icon: 'ph-truck' },
    'resume-cosmetologist': { title: 'Резюме косметолога', url: '/resume/cosmetologist', type: 'resume', icon: 'ph-sparkle' },
    'resume-journalist': { title: 'Резюме журналиста', url: '/resume/journalist', type: 'resume', icon: 'ph-newspaper' },
    'resume-photographer': { title: 'Резюме фотографа', url: '/resume/photographer', type: 'resume', icon: 'ph-camera' },
    'resume-waiter': { title: 'Резюме официанта', url: '/resume/waiter', type: 'resume', icon: 'ph-coffee' },
    'resume-tourism': { title: 'Резюме менеджера по туризму', url: '/resume/tourism-manager', type: 'resume', icon: 'ph-airplane-tilt' },

    'doc-arenda': { title: 'Договор аренды жилья', url: '/documents/dogovor-arendy', type: 'document', icon: 'ph-house', template: 'arenda' },
    'doc-otpusk': { title: 'Заявление на отпуск', url: '/documents/zayavlenie-otpusk', type: 'document', icon: 'ph-airplane', template: 'otpusk' },
    'doc-doverennost': { title: 'Доверенность', url: '/documents/doverennost', type: 'document', icon: 'ph-signature', template: 'doverennost' },
    'doc-kompred': { title: 'Коммерческое предложение', url: '/documents/kommercheskoye-predlozheniye', type: 'document', icon: 'ph-currency-rub', template: 'kompredlozheniye' },
    'doc-uvolnenie': { title: 'Заявление на увольнение', url: '/documents/zayavlenie-uvolnenie', type: 'document', icon: 'ph-sign-out', template: 'uvolnenie' },
    'doc-raspiska': { title: 'Расписка в получении денег', url: '/documents/raspiska-dengi', type: 'document', icon: 'ph-money', template: 'raspiska' },
    'doc-akt': { title: 'Акт приёма-передачи', url: '/documents/akt-priemki', type: 'document', icon: 'ph-handshake', template: 'akt' },

    'pptx-pitch': { title: 'Питч-дек стартапа', url: '/presentations/pitch-deck', type: 'presentation', icon: 'ph-rocket' },
    'pptx-quarterly': { title: 'Квартальный отчёт', url: '/presentations/quarterly-report', type: 'presentation', icon: 'ph-chart-bar' },
    'pptx-business-plan': { title: 'Бизнес-план', url: '/presentations/business-plan', type: 'presentation', icon: 'ph-briefcase' },
    'pptx-education': { title: 'Образовательная презентация', url: '/presentations/education', type: 'presentation', icon: 'ph-chalkboard-teacher' },
    'pptx-marketing': { title: 'Маркетинговая стратегия', url: '/presentations/marketing-strategy', type: 'presentation', icon: 'ph-trend-up' },
    'pptx-project-report': { title: 'Отчёт о проекте', url: '/presentations/project-report', type: 'presentation', icon: 'ph-clipboard-text' }
  };

  const DOC_TEMPLATES = {
    arenda: DocGenerator.arendaTemplate,
    otpusk: DocGenerator.otpuskTemplate,
    doverennost: DocGenerator.doverennostTemplate,
    kompredlozheniye: DocGenerator.kompredlozheniyeTemplate,
    uvolnenie: DocGenerator.uvolnenieTemplate,
    raspiska: DocGenerator.raspiskaTemplate,
    akt: DocGenerator.aktTemplate,
  };

  function getRegistry(pageId) {
    return REGISTRY[pageId] || { title: 'Документ', url: '/', type: 'unknown', icon: 'ph-file' };
  }

  function parseHash() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(hash))));
      if (!payload || !payload.pageId || !payload.values) throw new Error('invalid payload');
      return payload;
    } catch (e) {
      console.warn('Share parse error', e);
      return null;
    }
  }

  function renderDocumentPreview(values, templateName) {
    const template = DOC_TEMPLATES[templateName];
    if (!template) return '<p>Невозможно отобразить предпросмотр.</p>';
    return template(values)
      .map(function (block) {
        if (typeof block === 'string') {
          return '<p>' + escapeHtml(block).replace(/\n/g, '<br>') + '</p>';
        }
        const tag = block.bold ? 'strong' : 'span';
        const align = block.align === 'center' ? 'text-align:center;display:block' : '';
        return '<p style="' + align + '"><' + tag + '>' + escapeHtml(block.text) + '</' + tag + '></p>';
      })
      .join('');
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderPresentationPreview(values) {
    // pptx-generator.js renderPreview ожидает объект с title, subtitle, slides, chartLabels, chartValues, theme
    if (window.PptxGenerator && PptxGenerator.renderPreview) {
      PptxGenerator.renderPreview(values, 'share-preview');
      return null; // рендер уже выполнен
    }
    return '<p>Невозможно отобразить предпросмотр презентации.</p>';
  }

  function renderResumePreview(values) {
    if (window.ResumeGenerator && ResumeGenerator.renderPreview) {
      ResumeGenerator.renderPreview(values, 'share-preview');
      return null;
    }
    return '<p>Невозможно отобразить предпросмотр резюме.</p>';
  }

  function showError() {
    document.getElementById('share-card').classList.add('hidden');
    document.getElementById('share-preview-wrap').classList.add('hidden');
    document.getElementById('share-error').classList.remove('hidden');
  }

  function init() {
    const payload = parseHash();
    if (!payload) {
      showError();
      return;
    }

    const pageId = payload.pageId;
    const values = payload.values;
    const info = getRegistry(pageId);

    // Сохраняем черновик, чтобы по кнопке «Редактировать» можно было продолжить
    if (window.Storage && Storage.set) {
      Storage.set(pageId, values);
    }

    document.getElementById('share-doc-title').textContent = info.title;
    document.getElementById('share-icon').innerHTML = '<i class="ph ' + info.icon + '" aria-hidden="true"></i>';
    document.getElementById('share-edit').href = info.url;

    const metaParts = [];
    if (values.fullName || values.fio) metaParts.push(values.fullName || values.fio);
    if (values.projectTitle || values.title) metaParts.push(values.projectTitle || values.title);
    if (values.companyName) metaParts.push(values.companyName);
    document.getElementById('share-doc-meta').textContent = metaParts.filter(Boolean).join(' · ') || 'Создано в templatus';

    const previewContainer = document.getElementById('share-preview');
    previewContainer.innerHTML = '';

    let previewHtml = null;
    if (info.type === 'resume') {
      previewHtml = renderResumePreview(values);
    } else if (info.type === 'document') {
      previewHtml = renderDocumentPreview(values, info.template);
    } else if (info.type === 'presentation') {
      previewHtml = renderPresentationPreview(values);
    }

    if (previewHtml !== null) {
      previewContainer.innerHTML = '<div class="preview-paper">' + previewHtml + '</div>';
    }

    document.getElementById('share-copy').addEventListener('click', function () {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          alert('Ссылка скопирована в буфер обмена');
        }).catch(function () {
          prompt('Скопируйте ссылку:', url);
        });
      } else {
        prompt('Скопируйте ссылку:', url);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
