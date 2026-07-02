/**
 * reviews.js — форма отзывов и локальное хранилище отзывов.
 */
(function () {
  'use strict';

  const REVIEWS_KEY = 'templatus_reviews';

  function getReviews() {
    try {
      return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveReview(review) {
    const list = getReviews();
    list.unshift(review);
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.warn('Reviews write error', e);
    }
  }

  function renderReviews() {
    const container = document.getElementById('reviews-list');
    const empty = document.getElementById('reviews-empty');
    if (!container) return;

    const list = getReviews();
    if (!list.length) {
      container.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');
    container.innerHTML = list.map(function (review, index) {
      const stars = '★'.repeat(parseInt(review.rating, 10) || 5) + '☆'.repeat(5 - (parseInt(review.rating, 10) || 5));
      return `
        <figure class="card">
          <blockquote style="margin:0 0 .75rem;font-style:italic">“${escapeHtml(review.text)}”</blockquote>
          <figcaption style="color:var(--color-muted);font-size:.9rem">
            <strong style="color:var(--color-text-heading)">${escapeHtml(review.name)}</strong>${review.role ? ' · ' + escapeHtml(review.role) : ''}
            <div style="color:#f59e0b;letter-spacing:.1rem">${stars}</div>
          </figcaption>
          <button type="button" class="btn btn-danger btn-sm" data-remove-review="${index}" style="margin-top:.75rem">Удалить</button>
        </figure>
      `;
    }).join('');

    container.querySelectorAll('[data-remove-review]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = parseInt(btn.dataset.removeReview, 10);
        const list = getReviews();
        list.splice(idx, 1);
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
        renderReviews();
      });
    });
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

  function init() {
    const form = document.getElementById('review-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const fd = new FormData(form);
        const review = {
          name: (fd.get('name') || '').toString().trim(),
          role: (fd.get('role') || '').toString().trim(),
          rating: (fd.get('rating') || '5').toString(),
          text: (fd.get('text') || '').toString().trim(),
          date: new Date().toISOString(),
        };
        if (!review.name || !review.text) {
          alert('Заполните имя и текст отзыва');
          return;
        }
        saveReview(review);
        renderReviews();
        form.reset();
        alert('Спасибо! Ваш отзыв сохранён.');
      });
    }

    const emailBtn = document.getElementById('review-email');
    if (emailBtn) {
      emailBtn.addEventListener('click', function () {
        const form = document.getElementById('review-form');
        const fd = new FormData(form);
        const name = (fd.get('name') || '').toString().trim();
        const role = (fd.get('role') || '').toString().trim();
        const rating = (fd.get('rating') || '5').toString();
        const text = (fd.get('text') || '').toString().trim();
        if (!name || !text) {
          alert('Заполните имя и текст отзыва перед отправкой');
          return;
        }
        const body = `Имя: ${name}\nРоль: ${role}\nОценка: ${rating}\n\nОтзыв:\n${text}`;
        window.location.href = `mailto:hello@templatus.ru?subject=${encodeURIComponent('[templatus] Отзыв')}&body=${encodeURIComponent(body)}`;
      });
    }

    renderReviews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
