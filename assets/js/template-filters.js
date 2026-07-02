/**
 * Фильтрация и поиск шаблонов на страницах-списках.
 * Ожидает:
 *  - .template-toolbar с data-filter-target="селектор сетки"
 *  - .template-search (input[type="search"])
 *  - .template-filters с кнопками [data-filter="категория"]
 *  - карточки .card с data-category="категория"
 */
(function () {
  'use strict';

  function initToolbar(toolbar) {
    const gridSelector = toolbar.dataset.filterTarget;
    if (!gridSelector) return;

    const grid = document.querySelector(gridSelector);
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(':scope > .card'));
    if (!cards.length) return;

    const searchInput = toolbar.querySelector('.template-search');
    const filterButtons = Array.from(toolbar.querySelectorAll('[data-filter]'));
    const emptyState = toolbar.querySelector('.templates-empty');

    let activeFilter = 'all';
    let searchQuery = '';

    function normalize(str) {
      return (str || '').toLowerCase().replace(/ё/g, 'е').trim();
    }

    function cardText(card) {
      const title = card.querySelector('h3');
      const desc = card.querySelector('p');
      return normalize((title ? title.textContent : '') + ' ' + (desc ? desc.textContent : ''));
    }

    function splitValues(value) {
      return (value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }

    function applyFilters() {
      let visibleCount = 0;
      const filterValues = splitValues(activeFilter);

      cards.forEach(function (card) {
        const cardCategories = splitValues(card.dataset.category);
        const matchesCategory = activeFilter === 'all' || cardCategories.some(function (c) {
          return filterValues.indexOf(c) !== -1;
        });
        const matchesSearch = !searchQuery || cardText(card).indexOf(searchQuery) !== -1;
        const visible = matchesCategory && matchesSearch;

        card.classList.toggle('hidden', !visible);
        if (visible) visibleCount++;
      });

      if (emptyState) {
        emptyState.classList.toggle('hidden', visibleCount > 0);
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = normalize(searchInput.value);
        // При поиске сбрасываем категорию на "Все", чтобы искать по всем шаблонам
        if (searchQuery && activeFilter !== 'all') {
          activeFilter = 'all';
          filterButtons.forEach(function (btn) {
            var isAll = btn.dataset.filter === 'all';
            btn.classList.toggle('active', isAll);
            btn.setAttribute('aria-pressed', String(isAll));
          });
        }
        applyFilters();
      });
    }

    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeFilter = button.dataset.filter;

        filterButtons.forEach(function (btn) {
          btn.classList.toggle('active', btn === button);
          btn.setAttribute('aria-pressed', String(btn === button));
        });

        applyFilters();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-filter-target]').forEach(initToolbar);
  });
})();
