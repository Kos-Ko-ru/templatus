/**
 * Рекламные блоки РСЯ (Яндекс.Директ / Рекламная сеть Яндекса) для templatus.ru
 *
 * Инструкция:
 * 1. Создайте блоки в партнёрском кабинете РСЯ: https://partner.yandex.ru/
 * 2. Скопируйте ID блоков (вида R-A-XXXXXXXX-Y) в конфиг AD_CONFIG.blocks ниже.
 * 3. Назначение слотов:
 *    - banner-top      — горизонтальный баннер 728×90 под шапкой
 *    - between-steps   — баннер 468×60 между шагами формы
 *    - before-download — блок 300×250 в модальном окне перед скачиванием
 *    - after-download  — горизонтальный баннер 728×90 после основного контента
 *
 * Если ID блока не задан, будет показан placeholder из HTML.
 */
(function () {
  'use strict';

  var AD_CONFIG = {
    enabled: true,
    blocks: {
      'banner-top': '',      // пример: 'R-A-19533623-1'
      'between-steps': '',   // пример: 'R-A-19533623-2'
      'before-download': '', // пример: 'R-A-19533623-3'
      'after-download': ''   // пример: 'R-A-19533623-4'
    }
  };

  if (!AD_CONFIG.enabled) return;

  window.yaContextCb = window.yaContextCb || [];

  function renderSlot(slot) {
    var slotName = slot.dataset.adSlot;
    var blockId = AD_CONFIG.blocks[slotName];

    if (!blockId) {
      // ID блока не задан — скрываем placeholder, чтобы не выглядело непрофессионально
      slot.style.display = 'none';
      return;
    }

    var renderTo = 'yandex_rtb_' + blockId.replace(/[^a-zA-Z0-9]/g, '_');

    // Очищаем placeholder и создаём контейнер для РСЯ
    slot.innerHTML = '<div id="' + renderTo + '"></div>';
    slot.classList.add('ad-loading');

    window.yaContextCb.push(function () {
      if (typeof Ya === 'undefined' || !Ya.Context || !Ya.Context.AdvManager) return;
      Ya.Context.AdvManager.render({
        blockId: blockId,
        renderTo: renderTo
      });
    });
  }

  function initAds() {
    var slots = document.querySelectorAll('[data-ad-slot]');
    for (var i = 0; i < slots.length; i++) {
      renderSlot(slots[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAds);
  } else {
    initAds();
  }
})();
