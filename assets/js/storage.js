/**
 * storage.js — localStorage для черновиков и общих настроек.
 * Ключ: templatus_draft_[page_id]
 * Срок хранения: 30 дней.
 */

const Storage = (() => {
  const PREFIX = "templatus_";
  const DRAFT_TTL_DAYS = 30;
  const STATS_KEY = `${PREFIX}stats`;

  function key(pageId) {
    return `${PREFIX}draft_${pageId}`;
  }

  function get(pageId) {
    try {
      const raw = localStorage.getItem(key(pageId));
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem(key(pageId));
        return null;
      }
      return data.values || null;
    } catch (e) {
      console.warn("Storage read error", e);
      return null;
    }
  }

  function set(pageId, values) {
    try {
      const expires = Date.now() + DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(
        key(pageId),
        JSON.stringify({ values, expires, updated: Date.now() })
      );
    } catch (e) {
      console.warn("Storage write error", e);
    }
  }

  function remove(pageId) {
    try {
      localStorage.removeItem(key(pageId));
    } catch (e) {
      console.warn("Storage remove error", e);
    }
  }

  function clearAll() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`${PREFIX}draft_`))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Storage clear error", e);
    }
  }

  function list() {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith(`${PREFIX}draft_`))
        .map((k) => {
          try {
            const raw = localStorage.getItem(k);
            const data = JSON.parse(raw);
            return {
              pageId: k.replace(`${PREFIX}draft_`, ""),
              updated: data.updated || 0,
              expires: data.expires || 0,
              values: data.values || {},
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => (b.updated || 0) - (a.updated || 0));
    } catch (e) {
      console.warn("Storage list error", e);
      return [];
    }
  }

  // Счётчик сгенерированных документов
  function getStats() {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Stats read error", e);
    }
    // Случайное стартовое число при первом посещении
    return { generated: Math.floor(Math.random() * 5000) + 1200 };
  }

  function incrementGenerated() {
    const stats = getStats();
    stats.generated = (stats.generated || 0) + 1;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn("Stats write error", e);
    }
    return stats.generated;
  }

  // Тема
  function getTheme() {
    try {
      return localStorage.getItem(`${PREFIX}theme`) || "light";
    } catch (e) {
      return "light";
    }
  }

  function setTheme(theme) {
    try {
      localStorage.setItem(`${PREFIX}theme`, theme);
    } catch (e) {
      console.warn("Theme write error", e);
    }
  }

  return {
    get,
    set,
    remove,
    clearAll,
    list,
    getStats,
    incrementGenerated,
    getTheme,
    setTheme,
  };
})();

window.Storage = Storage;
