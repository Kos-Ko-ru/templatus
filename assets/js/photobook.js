/* =========================================================
   templatus — Photobook Constructor engine
   Клиентский движок: макеты, smart crop, DPI-контроль,
   палитры, типографика, экспорт 300 DPI (PDF/ZIP/JSON).
   ========================================================= */
(() => {
  "use strict";

  const MM_PER_INCH = 25.4;
  const DPI_MIN = 150;          // порог предупреждения
  const LS_KEY = "templatus_photobook_v1";

  /* ---------- Форматы и палитры ---------- */
  const FORMATS = {
    square20: { label: "Квадрат 20×20 см", pageW: 200, pageH: 200, bleed: 5 },
    landscape25: { label: "Горизонтальный 25×20 см", pageW: 250, pageH: 200, bleed: 5 },
    portrait20: { label: "Вертикальный 20×25 см", pageW: 200, pageH: 250, bleed: 5 },
  };

  const PALETTES = [
    { id: "scandi", name: "Скандинавский серый", background: "#F5F5F4", text: "#1E293B", accent: "#78716C", divider: "#D6D3D1" },
    { id: "sand", name: "Теплый песок", background: "#FAF3E8", text: "#44403C", accent: "#B45309", divider: "#E7D8C3" },
    { id: "mono", name: "Монохром", background: "#FFFFFF", text: "#111111", accent: "#111111", divider: "#DDDDDD" },
    { id: "indigo", name: "Глубокий индиго", background: "#1E1B4B", text: "#EEF2FF", accent: "#818CF8", divider: "#3730A3" },
    { id: "pastel", name: "Нежная пастель", background: "#FDF2F8", text: "#4C1D95", accent: "#DB2777", divider: "#F9D3E8" },
  ];

  /* ---------- Шрифтовые пресеты (кириллица) ---------- */
  const FONTS = [
    { id: "playfair", label: "Playfair Display (антиква)", css: "'Playfair Display', Georgia, serif" },
    { id: "inter", label: "Inter (гротеск)", css: "'Inter', Arial, sans-serif" },
    { id: "caveat", label: "Caveat (рукописный)", css: "'Caveat', cursive" },
  ];

  /* ---------- Каталог тем ---------- */
  const THEMES = [
    {
      id: "wedding", name: "Свадьба и Годовщина", palette: "sand",
      fonts: ["playfair", "caveat"],
      desc: "Паспарту, хронологические развороты «Тогда и сейчас», утонченная антиква, широкие поля.",
      tags: ["паспарту", "серифы", "широкие поля"],
      spreads: ["hero_notes", "two_vertical", "passepartout", "full_bleed", "grid2x2", "photo_text"],
    },
    {
      id: "family", name: "Семья и Дети", palette: "pastel",
      fonts: ["inter", "caveat"],
      desc: "Модульные сетки 2×2 и 3×3, карточки для заметок, дат и забавных высказываний.",
      tags: ["сетка 2×2", "карточки", "датки"],
      spreads: ["grid2x2", "photo_text", "two_vertical", "hero_notes", "full_bleed"],
    },
    {
      id: "travel", name: "Путешествия (Travel Book)", palette: "scandi",
      fonts: ["inter", "caveat"],
      desc: "Журнальная верстка, панорамы во всю ширину разворота, блоки под маршруты и координаты.",
      tags: ["панорамы", "маршруты", "журнальная"],
      spreads: ["full_bleed", "photo_text", "two_vertical", "hero_notes", "grid2x2"],
    },
    {
      id: "portfolio", name: "Портфолио / Lookbook", palette: "mono",
      fonts: ["inter", "playfair"],
      desc: "Премиальный минимализм, обилие «воздуха», строгие пропорции, нейтральные акценты.",
      tags: ["минимализм", "воздух", "строгие"],
      spreads: ["hero_notes", "full_bleed", "passepartout", "photo_text"],
    },
    {
      id: "graduation", name: "Выпускной альбом", palette: "indigo",
      fonts: ["inter", "playfair"],
      desc: "Портретные виньетки единого масштаба с подписями ФИО, коллажи с мероприятий.",
      tags: ["виньетки", "подписи", "коллажи"],
      spreads: ["grid2x2", "two_vertical", "photo_text", "hero_notes", "full_bleed", "passepartout"],
    },
  ];

  /* ---------- Библиотека сеток (модульные макеты, мм от левого края разворота) ---------- */
  function layoutsFor(fmt) {
    const W = fmt.pageW * 2, H = fmt.pageH;
    const m = Math.round(Math.min(W, H) * 0.075); // поля
    const gap = Math.round(m * 0.4);
    const half = W / 2;
    const colW = Math.round((half - m * 2 - gap) / 2);
    const colH = Math.round((H - m * 2 - gap) / 2);
    const rightX = half + m;

    return {
      full_bleed: { name: "1 фото во всю полосу", slots: [
        { type: "image", x: 0, y: 0, w: W, h: H },
      ]},
      hero_notes: { name: "Фото + заголовок", slots: [
        { type: "image", x: m, y: m, w: half - m * 2, h: H - m * 2 },
        { type: "text", x: rightX, y: Math.round(H * 0.42), w: half - m * 2, h: 30, text: "Счастливы вместе", size: 26, font: "playfair" },
      ]},
      two_vertical: { name: "2 фото по вертикали", slots: [
        { type: "image", x: m, y: m, w: half - m * 2, h: colH },
        { type: "image", x: m, y: m + gap + colH, w: half - m * 2, h: colH },
        { type: "image", x: rightX, y: m, w: half - m * 2, h: colH },
        { type: "image", x: rightX, y: m + gap + colH, w: half - m * 2, h: colH },
      ]},
      grid2x2: { name: "Сетка 2×2", slots: [
        { type: "image", x: m, y: m, w: colW, h: colH },
        { type: "image", x: m + gap + colW, y: m, w: colW, h: colH },
        { type: "image", x: rightX, y: m, w: colW, h: colH },
        { type: "image", x: rightX + gap + colW, y: m, w: colW, h: colH },
        { type: "image", x: m, y: m + gap + colH, w: colW, h: colH },
        { type: "image", x: m + gap + colW, y: m + gap + colH, w: colW, h: colH },
        { type: "text", x: rightX, y: m + gap + colH, w: half - m * 2, h: 20, text: "Наши моменты", size: 14, font: "caveat" },
      ]},
      photo_text: { name: "Фото + текстовый блок", slots: [
        { type: "image", x: m, y: m, w: half - m * 2, h: H - m * 2 },
        { type: "text", x: rightX, y: m + 10, w: half - m * 2, h: 22, text: "Лето 2026", size: 20, font: "inter" },
        { type: "text", x: rightX, y: m + 48, w: half - m * 2, h: H - m * 2 - 60, text: "Здесь будет ваша история…", size: 11, font: "inter" },
      ]},
      passepartout: { name: "Паспарту", slots: [
        { type: "image", x: Math.round(half * 0.32), y: Math.round(H * 0.18), w: Math.round(half * 0.36 * 2), h: Math.round(H * 0.58) },
        { type: "text", x: Math.round(half * 0.32), y: Math.round(H * 0.80), w: Math.round(half * 0.72), h: 16, text: "14 июля 2026", size: 13, font: "caveat", align: "center" },
      ]},
    };
  }

  const LAYOUT_ICON = (key) => `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><g fill="#94a3b8">${
    ({ full_bleed: '<rect x="4" y="4" width="112" height="52" rx="3"/>',
       hero_notes: '<rect x="4" y="4" width="52" height="52" rx="3"/><rect x="62" y="22" width="54" height="8" rx="2"/>',
       two_vertical: '<rect x="4" y="4" width="52" height="25" rx="2"/><rect x="4" y="33" width="52" height="23" rx="2"/><rect x="62" y="4" width="54" height="25" rx="2"/><rect x="62" y="33" width="54" height="23" rx="2"/>',
       grid2x2: '<rect x="4" y="4" width="26" height="25" rx="2"/><rect x="34" y="4" width="26" height="25" rx="2"/><rect x="66" y="4" width="50" height="25" rx="2"/><rect x="4" y="33" width="56" height="23" rx="2"/><rect x="66" y="33" width="50" height="23" rx="2"/>',
       photo_text: '<rect x="4" y="4" width="52" height="52" rx="3"/><rect x="62" y="6" width="40" height="6" rx="2"/><rect x="62" y="18" width="54" height="4" rx="2"/><rect x="62" y="26" width="54" height="4" rx="2"/><rect x="62" y="34" width="54" height="4" rx="2"/><rect x="62" y="42" width="38" height="4" rx="2"/>',
       passepartout: '<rect x="4" y="4" width="112" height="52" rx="3" fill="none" stroke="#94a3b8" stroke-width="2"/><rect x="32" y="12" width="56" height="30" rx="2"/><rect x="44" y="46" width="32" height="5" rx="2"/>' })[key]
  }</g></svg>`;

  /* ---------- Состояние ---------- */
  let state = null;          // project
  let current = 0;           // индекс активного разворота
  let zoom = 0;              // px на мм (0 = fit)
  let selectedSlot = null;
  let guides = true;
  let lastScale = 1;           // текущий масштаб холста (px на мм)
  let suppressClick = false;   // подавить click после перетаскивания
  const media = [];          // {id, dataURL, w, h, name}

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = () => FORMATS[state.format];
  const palette = () => PALETTES.find(p => p.id === state.palette) || PALETTES[0];
  const fontCss = (id) => (FONTS.find(f => f.id === id) || FONTS[1]).css;

  function newProject(themeId) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    return {
      projectId: "tpl_book_" + Math.random().toString(36).slice(2, 6),
      themeId: theme.id,
      format: "square20",
      palette: theme.palette,
      customBg: null,
      spreads: theme.spreads.map((layout, i) => makeSpread(layout, i)),
    };
  }

  function makeSpread(layoutKey, idx, formatKey) {
    const L = layoutsFor(FORMATS[formatKey || (state ? state.format : null) || "square20"])[layoutKey];
    return {
      layout: layoutKey,
      bg: null,
      slots: L.slots.map((s, i) => ({
        slotId: layoutKey + "_" + i,
        ...s,
        img: null,               // {mediaId}
        crop: { zoom: 1, ox: 0.5, oy: 0.5, rot: 0 },
        text: s.text || "",
        size: s.size || 14,
        font: s.font || "inter",
        align: s.align || "left",
        spacing: 0,
        uppercase: false,
        color: null,             // null => palette.text
      })),
    };
  }

  /* ---------- Геометрия слота изображения ---------- */
  // Возвращает мм-размер отрисованной картинки внутри слота с учётом cover + zoom
  function imageDrawSize(slot, mediaItem) {
    if (!mediaItem) return null;
    const cover = Math.max(slot.w / mediaItem.w, slot.h / mediaItem.h);
    const scale = cover * slot.crop.zoom;
    return { wMm: mediaItem.w * scale, hMm: mediaItem.h * scale, scale };
  }

  // Позиция верхнего левого угла картинки (мм в координатах слота)
  function imageOffset(slot, mediaItem) {
    const d = imageDrawSize(slot, mediaItem);
    const maxOx = Math.max(0, d.wMm - slot.w), maxOy = Math.max(0, d.hMm - slot.h);
    return {
      x: -maxOx * slot.crop.ox - Math.max(0, (slot.w - d.wMm) / 2),
      y: -maxOy * slot.crop.oy - Math.max(0, (slot.h - d.hMm) / 2),
      ...d,
    };
  }

  function slotDpi(slot, mediaItem) {
    if (!mediaItem) return Infinity;
    const d = imageDrawSize(slot, mediaItem);
    const pxPerMm = mediaItem.w / d.wMm;
    return Math.round(pxPerMm * MM_PER_INCH);
  }

  const mediaOf = (slot) => {
    if (!slot || !slot.img) return null;
    return media.find(m => m.id === slot.img) || null;
  };

  /* =========================================================
     РЕНДЕР НА ЭКРАНЕ (DOM)
     ========================================================= */
  function renderApp() {
    renderCanvas();
    renderFilmstrip();
    renderSide();
  }

  function renderCanvas() {
    const area = $("#pbCanvasArea");
    const sp = state.spreads[current];
    const f = fmt();
    const areaW = area.clientWidth - 80, areaH = area.clientHeight - 80;
    const fitScale = Math.min(areaW / (f.pageW * 2), areaH / f.pageH);
    const s = zoom > 0 ? zoom : Math.max(0.2, fitScale); // px на мм

    const el = $("#pbSpread");
    el.style.width = (f.pageW * 2 * s) + "px";
    el.style.height = (f.pageH * s) + "px";
    lastScale = s;
    el.style.background = sp.bg || state.customBg || palette().background;
    el.classList.toggle("pb-guides", guides);
    el.innerHTML = "";

    // Корешок
    const fold = document.createElement("div");
    fold.className = "pb-fold";
    fold.dataset.tip = "Корешок — не размещайте лица в центре";
    el.appendChild(fold);

    // Направляющие
    if (guides) {
      const safe = document.createElement("div");
      safe.className = "pb-safe";
      const safeMm = f.bleed + 3;
      safe.style.left = safeMm * s + "px";
      safe.style.top = safeMm * s + "px";
      safe.style.right = safeMm * s + "px";
      safe.style.bottom = safeMm * s + "px";
      el.appendChild(safe);
      const bleed = document.createElement("div");
      bleed.className = "pb-bleed";
      el.appendChild(bleed);
    }

    const p = palette();
    sp.slots.forEach((slot, i) => {
      const div = document.createElement("div");
      div.className = "pb-slot" + (selectedSlot === i ? " selected" : "");
      div.dataset.type = slot.type;
      div.dataset.slotIndex = i;
      div.style.left = slot.x * s + "px";
      div.style.top = slot.y * s + "px";
      div.style.width = slot.w * s + "px";
      div.style.height = slot.h * s + "px";

      if (slot.type === "image") {
        const mi = mediaOf(slot);
        if (mi) {
          const img = document.createElement("img");
          const d = imageOffset(slot, mi);
          img.src = mi.dataURL;
          img.style.width = d.wMm * s + "px";
          img.style.height = d.hMm * s + "px";
          img.style.left = d.x * s + "px";
          img.style.top = d.y * s + "px";
          if (slot.crop.rot) {
            img.style.transformOrigin = "center";
            img.style.transform = `rotate(${slot.crop.rot * 90}deg)`;
          }
          div.appendChild(img);
          const dpi = slotDpi(slot, mi);
          if (dpi < DPI_MIN) {
            const b = document.createElement("span");
            b.className = "pb-dpi-badge";
            b.textContent = `⚠ ${dpi} DPI`;
            b.title = "Внимание: низкое разрешение";
            div.appendChild(b);
          }
        } else {
          div.innerHTML = `<div class="pb-empty-hint"><i class="ph ph-image"></i>Перетащите фото<br>или кликните</div>`;
        }
        bindImageSlot(div, slot, i);
      } else {
        div.style.fontFamily = fontCss(slot.font);
        div.style.fontSize = slot.size * s + "px";
        div.style.color = slot.color || p.text;
        div.style.textAlign = slot.align;
        div.style.letterSpacing = slot.spacing + "em";
        div.style.textTransform = slot.uppercase ? "uppercase" : "none";
        div.style.fontWeight = slot.bold ? "600" : "400";
        div.style.fontStyle = slot.italic ? "italic" : "normal";
        const t = document.createElement("div");
        t.className = "pb-text-inner";
        t.contentEditable = "true";
        t.innerHTML = slot.text;
        t.style.lineHeight = "1.25";
        t.addEventListener("input", () => { slot.text = t.innerHTML; save(); });
        t.addEventListener("mousedown", (e) => {
          if (e.altKey) { e.stopPropagation(); startSlotDrag(e, "move", slot); return; }
          // выделяем слот, но не перерисовываем холст — иначе потеряем каретку ввода
          e.stopPropagation();
          if (selectedSlot !== i) {
            selectedSlot = i;
            renderSide();
            updateHandles();
          }
        });
        div.appendChild(t);
      }
      div.addEventListener("mousedown", () => selectSlot(i));
      el.appendChild(div);
    });

    updateHandles();
  }

  /* ---------- Ручки перемещения/ресайза выбранного слота ---------- */
  function updateHandles() {
    const el = $("#pbSpread");
    if (!el) return;
    $$(".pb-movebar, .pb-resize, .pb-delhandle", el).forEach((h) => h.remove());
    $$(".pb-slot", el).forEach((d) => d.classList.remove("selected"));
    if (selectedSlot == null) return;
    const div = $(`.pb-slot[data-slot-index="${selectedSlot}"]`, el);
    const slot = state.spreads[current].slots[selectedSlot];
    if (!div || !slot) return;
    div.classList.add("selected");

    const s = lastScale;
    // ручки живут на уровне холста, чтобы не обрезались overflow:hidden у слота
    const bar = document.createElement("div");
    bar.className = "pb-movebar";
    bar.title = "Перетащите, чтобы переместить элемент (или Alt + перетаскивание)";
    bar.textContent = "⠿ переместить";
    bar.style.left = Math.max(0, slot.x * s) + "px";
    bar.style.top = Math.max(0, slot.y * s - 20) + "px";
    bar.addEventListener("mousedown", (e) => startSlotDrag(e, "move", slot));
    el.appendChild(bar);

    const del = document.createElement("div");
    del.className = "pb-delhandle";
    del.title = "Удалить элемент";
    del.textContent = "✕";
    del.style.right = "auto";
    del.style.left = (slot.x * s + slot.w * s - 40) + "px";
    del.style.top = Math.max(0, slot.y * s - 20) + "px";
    del.addEventListener("mousedown", (e) => e.stopPropagation());
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      state.spreads[current].slots.splice(selectedSlot, 1);
      selectedSlot = null;
      renderApp(); save();
    });
    el.appendChild(del);

    const rh = document.createElement("div");
    rh.className = "pb-resize";
    rh.title = "Изменить размер";
    rh.style.left = ((slot.x + slot.w) * s - 7) + "px";
    rh.style.top = ((slot.y + slot.h) * s - 7) + "px";
    rh.addEventListener("mousedown", (e) => startSlotDrag(e, "resize", slot));
    el.appendChild(rh);
  }

  /* ---------- Перемещение и ресайз слота (мм) ---------- */
  function startSlotDrag(e, mode, slot) {
    e.preventDefault();
    e.stopPropagation();
    const f = fmt();
    const sx = e.clientX, sy = e.clientY;
    const o = { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
    let moved = false;

    const onMove = (ev) => {
      const dx = (ev.clientX - sx) / lastScale;
      const dy = (ev.clientY - sy) / lastScale;
      moved = true;
      if (mode === "move") {
        slot.x = Math.round(clampNum(o.x + dx, -f.bleed, f.pageW * 2 - 10));
        slot.y = Math.round(clampNum(o.y + dy, -f.bleed, f.pageH - 10));
      } else {
        slot.w = Math.round(clampNum(o.w + dx, 10, f.pageW * 2 - o.x));
        slot.h = Math.round(clampNum(o.h + dy, 8, f.pageH - o.y));
      }
      renderCanvas();
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (moved) { suppressClick = true; renderSide(); save(); }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const clampNum = (v, a, b) => Math.min(b, Math.max(a, isFinite(v) ? v : a));

  function selectSlot(i) {
    selectedSlot = i;
    renderCanvas();
    renderSide();
  }

  /* ---------- Взаимодействие с фото-слотом ---------- */
  function bindImageSlot(div, slot, i) {
    let dragging = false, sx = 0, sy = 0, c0 = null;

    div.addEventListener("click", () => {
      if (suppressClick) { suppressClick = false; return; }
      if (!slot.img) pickFile((mi) => { slot.img = mi.id; renderCanvas(); save(); });
    });

    div.addEventListener("wheel", (e) => {
      const mi = mediaOf(slot);
      if (!mi) return;
      e.preventDefault();
      slot.crop.zoom = Math.min(4, Math.max(1, slot.crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
      renderCanvas(); save();
    }, { passive: false });

    div.addEventListener("mousedown", (e) => {
      const mi = mediaOf(slot);
      // Alt + перетаскивание — перемещение рамки; пустая рамка тоже перетаскивается
      if (e.altKey || !mi) { startSlotDrag(e, "move", slot); return; }
      dragging = true; sx = e.clientX; sy = e.clientY; c0 = { ...slot.crop };
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const mi = mediaOf(slot);
      if (!mi) return;
      const rect = div.getBoundingClientRect();
      const mmPerPx = slot.w / rect.width;
      const dxMm = (e.clientX - sx) * mmPerPx, dyMm = (e.clientY - sy) * mmPerPx;
      const oldOff = imageOffset({ ...slot, crop: c0 }, mi);
      // смещение картинки = старое + сдвиг мыши, с ограничением в [-max, 0]
      const maxOx = Math.max(0, oldOff.wMm - slot.w), maxOy = Math.max(0, oldOff.hMm - slot.h);
      const oxMm = Math.min(0, Math.max(-maxOx, oldOff.x + dxMm));
      const oyMm = Math.min(0, Math.max(-maxOy, oldOff.y + dyMm));
      slot.crop.ox = maxOx > 0 ? (oxMm + maxOx) / maxOx : 0.5;
      slot.crop.oy = maxOy > 0 ? (oyMm + maxOy) / maxOy : 0.5;
      renderCanvas();
    });

    window.addEventListener("mouseup", () => {
      if (dragging) { dragging = false; save(); }
    });

    // Drag-and-drop файлов
    div.addEventListener("dragover", (e) => { e.preventDefault(); div.classList.add("dragover"); });
    div.addEventListener("dragleave", () => div.classList.remove("dragover"));
    div.addEventListener("drop", async (e) => {
      e.preventDefault(); div.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) { const mi = await addMedia(file); slot.img = mi.id; renderCanvas(); save(); }
    });
  }

  const clamp01 = (v) => Math.min(1, Math.max(0, isFinite(v) ? v : 0.5));

  /* =========================================================
     ЛЕНТА МИНИАТЮР
     ========================================================= */
  function renderFilmstrip() {
    const strip = $("#pbFilmstrip");
    strip.innerHTML = "";
    state.spreads.forEach((sp, i) => {
      const f = fmt();
      const th = document.createElement("div");
      th.className = "pb-thumb" + (i === current ? " active" : "");
      th.draggable = true;
      th.dataset.index = i;
      const k = 54 / f.pageH; // масштаб превью: страница ~54px
      ["left", "right"].forEach((side) => {
        const page = document.createElement("div");
        page.className = "pb-thumb-page";
        sp.slots.forEach((slot) => {
          const x = side === "left" ? slot.x : slot.x - f.pageW;
          if (x + slot.w < 0 || x > f.pageW) return;
          const s = document.createElement("div");
          s.className = "pb-thumb-slot" + (slot.type === "text" ? " txt" : "");
          s.style.left = Math.max(0, x * k) + "px";
          s.style.top = slot.y * k + "px";
          s.style.width = Math.min(f.pageW - Math.max(0, x), slot.w) * k + "px";
          s.style.height = Math.max(3, slot.h * k) + "px";
          page.appendChild(s);
        });
        th.appendChild(page);
      });
      const num = document.createElement("span");
      num.className = "pb-thumb-num";
      num.textContent = i + 1;
      th.appendChild(num);
      const del = document.createElement("button");
      del.className = "pb-thumb-del";
      del.textContent = "×";
      del.title = "Удалить разворот";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        if (state.spreads.length <= 1) return alert("Нельзя удалить последний разворот.");
        if (confirm("Удалить этот разворот?")) {
          state.spreads.splice(i, 1);
          current = Math.min(current, state.spreads.length - 1);
          selectedSlot = null;
          renderApp(); save();
        }
      });
      th.appendChild(del);

      th.addEventListener("click", () => { current = i; selectedSlot = null; renderApp(); });
      th.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", i));
      th.addEventListener("dragover", (e) => { e.preventDefault(); th.classList.add("drag-over"); });
      th.addEventListener("dragleave", () => th.classList.remove("drag-over"));
      th.addEventListener("drop", (e) => {
        e.preventDefault(); th.classList.remove("drag-over");
        const from = +e.dataTransfer.getData("text/plain");
        if (from === i) return;
        const [moved] = state.spreads.splice(from, 1);
        state.spreads.splice(i, 0, moved);
        current = i;
        renderApp(); save();
      });
      strip.appendChild(th);
    });

    const add = document.createElement("button");
    add.className = "pb-strip-add";
    add.title = "Добавить чистый разворот";
    add.textContent = "+";
    add.addEventListener("click", () => {
      state.spreads.push(makeSpread("hero_notes"));
      current = state.spreads.length - 1;
      renderApp(); save();
    });
    strip.appendChild(add);

    const dup = document.createElement("button");
    dup.className = "pb-strip-add";
    dup.title = "Дублировать текущий разворот";
    dup.textContent = "⧉";
    dup.addEventListener("click", () => {
      const copy = JSON.parse(JSON.stringify(state.spreads[current]));
      copy.slots.forEach((s, i) => s.slotId += "_d" + i + Date.now() % 1000);
      state.spreads.splice(current + 1, 0, copy);
      current++;
      renderApp(); save();
    });
    strip.appendChild(dup);
  }

  /* =========================================================
     БОКОВАЯ ПАНЕЛЬ
     ========================================================= */
  function renderSide() {
    const side = $("#pbSide");
    const sp = state.spreads[current];
    const layouts = layoutsFor(fmt());
    const p = palette();
    const sel = selectedSlot != null ? sp.slots[selectedSlot] : null;

    side.innerHTML = `
      <div class="pb-section">
        <h4>Элементы страницы</h4>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn" id="pbAddFrame"><i class="ph ph-image"></i> Рамка</button>
          <button class="btn" id="pbAddText"><i class="ph ph-text-aa"></i> Текст</button>
          <button class="btn" id="pbFillBook" title="Разложить фото из галереи по страницам"><i class="ph ph-stack"></i> Разложить фото</button>
        </div>
        ${sel ? `
        <h4 style="margin-top:16px">Геометрия (мм)</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;align-items:center">
          ${["x","y","w","h"].map(k => `
            <label style="font-size:.7rem;color:var(--color-muted);text-align:center">${k.toUpperCase()}
              <input type="number" data-geo="${k}" value="${Math.round(sel[k])}" min="1" step="1"
                style="width:100%;padding:5px 4px;border:1px solid var(--pb-border);border-radius:6px;background:var(--color-bg);color:var(--color-text);font:inherit;font-size:.8rem">
            </label>`).join("")}
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn" data-slotact="dup" title="Дублировать элемент"><i class="ph ph-copy"></i></button>
          <button class="btn" data-slotact="del" title="Удалить элемент"><i class="ph ph-trash"></i></button>
        </div>` : `<p style="font-size:.8rem;color:var(--color-muted);margin-top:10px">Кликните по элементу на холсте, чтобы настроить его положение и размер. Рамку можно перетаскивать за верхнюю полоску ⠿ и растягивать за уголок.</p>`}
      </div>

      <div class="pb-section">
        <h4>Сетка страницы</h4>
        <div class="pb-layout-grid">
          ${Object.entries(layouts).map(([k, L]) =>
            `<button class="pb-layout-btn ${sp.layout === k ? "active" : ""}" data-layout="${k}" title="${L.name}">${LAYOUT_ICON(k)}</button>`).join("")}
        </div>
      </div>

      <div class="pb-section">
        <h4>Глобальная палитра</h4>
        <div class="pb-palette-list">
          ${PALETTES.map(pl => `
            <button class="pb-palette-btn ${state.palette === pl.id ? "active" : ""}" data-palette="${pl.id}">
              <span class="pb-palette-swatches">
                <i style="background:${pl.background};border:1px solid #ddd"></i>
                <i style="background:${pl.accent}"></i>
                <i style="background:${pl.text}"></i>
              </span>${pl.name}
            </button>`).join("")}
        </div>
        <div class="pb-slider-row" style="margin-top:12px">
          <span>Фон страницы</span>
          <input type="color" class="pb-color-input" id="pbBgColor" value="${sp.bg || p.background}" title="Индивидуальный цвет фона этой страницы">
        </div>
      </div>

      <div class="pb-section">
        <h4>Медиагалерея проекта</h4>
        <div class="pb-media-drop" id="pbMediaDrop">
          <i class="ph ph-upload-simple"></i><br>
          Перетащите фото (JPEG, PNG, WebP, HEIC)<br>или кликните для загрузки
        </div>
        <input type="file" id="pbMediaInput" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden>
        <div class="pb-media-list" id="pbMediaList">
          ${media.map(m => `<img src="${m.dataURL}" data-media="${m.id}" title="${m.name} — ${m.w}×${m.h}">`).join("")}
        </div>
      </div>

      ${sel && sel.type === "image" ? `
      <div class="pb-section pb-text-controls" id="pbImgPanel">
        <h4>Фото</h4>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn" data-act="rotate" title="Повернуть на 90°"><i class="ph ph-arrow-clockwise"></i> 90°</button>
          <button class="btn" data-act="replace" title="Заменить фото"><i class="ph ph-swap"></i></button>
          <button class="btn" data-act="remove" title="Убрать фото"><i class="ph ph-x"></i></button>
          <button class="btn" data-act="fill" title="Заполнить слот (сброс кропа)"><i class="ph ph-frame-corners"></i></button>
        </div>
        <div class="pb-slider-row"><span>Zoom</span><input type="range" min="1" max="4" step="0.05" value="${sel.crop.zoom}" data-knob="zoom"></div>
        <div class="pb-slider-row"><span>DPI: <b id="pbDpiVal">${dpiLabel(sel)}</b></span></div>
      </div>` : ""}

      ${sel && sel.type === "text" ? `
      <div class="pb-section pb-text-controls" id="pbTextPanel">
        <h4>Типографика</h4>
        <select class="pb-select" data-knob="font" style="width:100%">
          ${FONTS.map(f => `<option value="${f.id}" ${sel.font === f.id ? "selected" : ""}>${f.label}</option>`).join("")}
        </select>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn" data-knob="align" data-v="left" title="По левому краю"><i class="ph ph-text-align-left"></i></button>
          <button class="btn" data-knob="align" data-v="center" title="По центру"><i class="ph ph-text-align-center"></i></button>
          <button class="btn" data-knob="align" data-v="right" title="По правому краю"><i class="ph ph-text-align-right"></i></button>
          <button class="btn" data-knob="uppercase" title="ВЕРХНИЙ РЕГИСТР">AA</button>
          <button class="btn" data-knob="bold" title="Полужирный" style="font-weight:700">Ж</button>
          <button class="btn" data-knob="italic" title="Курсив" style="font-style:italic">К</button>
        </div>
        <div class="pb-slider-row"><span>Кегль</span><input type="range" min="6" max="60" step="1" value="${sel.size}" data-knob="size"></div>
        <div class="pb-slider-row"><span>Трекинг</span><input type="range" min="-0.05" max="0.3" step="0.01" value="${sel.spacing}" data-knob="spacing"></div>
        <div class="pb-slider-row"><span>Цвет</span><input type="color" class="pb-color-input" data-knob="color" value="${sel.color || p.text}"></div>
      </div>` : ""}
    `;

    // --- события панели ---

    // Добавление элементов
    $("#pbAddFrame")?.addEventListener("click", () => addSlot("image"));
    $("#pbAddText")?.addEventListener("click", () => addSlot("text"));
    $("#pbFillBook")?.addEventListener("click", openFillModal);

    // Геометрия выбранного слота
    $$("[data-geo]", side).forEach(inp => inp.addEventListener("input", () => {
      const s = sp.slots[selectedSlot];
      if (!s) return;
      const v = Math.max(+inp.min || 1, Math.round(+inp.value || 0));
      s[inp.dataset.geo] = v;
      renderCanvas(); save();
    }));

    // Дублировать / удалить слот
    $$("[data-slotact]", side).forEach(b => b.addEventListener("click", () => {
      const idx = selectedSlot;
      if (idx == null) return;
      if (b.dataset.slotact === "dup") {
        const copy = JSON.parse(JSON.stringify(sp.slots[idx]));
        copy.slotId += "_c" + Date.now() % 1000;
        copy.x = Math.min(copy.x + 8, fmt().pageW * 2 - copy.w);
        copy.y = Math.min(copy.y + 8, fmt().pageH - copy.h);
        sp.slots.splice(idx + 1, 0, copy);
        selectedSlot = idx + 1;
      } else {
        sp.slots.splice(idx, 1);
        selectedSlot = null;
      }
      renderApp(); save();
    }));

    $$("[data-layout]", side).forEach(b => b.addEventListener("click", () => {
      const keep = {};
      sp.slots.forEach((s, i) => { if (s.img) keep[s.type + (i % 3)] = s.img; });
      const ns = makeSpread(b.dataset.layout, current);
      // переносим фото по порядку
      const imgs = sp.slots.filter(s => s.img).map(s => s.img);
      ns.slots.filter(s => s.type === "image").forEach((s, i) => { if (imgs[i]) s.img = imgs[i]; });
      state.spreads[current] = ns;
      selectedSlot = null;
      renderApp(); save();
    }));

    $$("[data-palette]", side).forEach(b => b.addEventListener("click", () => {
      state.palette = b.dataset.palette;
      renderApp(); save();
    }));

    $("#pbBgColor", side).addEventListener("input", (e) => {
      sp.bg = e.target.value;
      renderCanvas(); save();
    });

    const drop = $("#pbMediaDrop", side), input = $("#pbMediaInput", side);
    drop.addEventListener("click", () => input.click());
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("dragover"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
    drop.addEventListener("drop", async (e) => {
      e.preventDefault(); drop.classList.remove("dragover");
      for (const f of e.dataTransfer.files) await addMedia(f);
      renderSide();
    });
    input.addEventListener("change", async () => {
      for (const f of input.files) await addMedia(f);
      renderSide();
    });

    $$("#pbMediaList img", side).forEach(img => img.addEventListener("click", () => {
      // если выбран image-слот — ставим фото в него, иначе в первый пустой
      const s = selectedSlot != null && sp.slots[selectedSlot].type === "image"
        ? sp.slots[selectedSlot]
        : sp.slots.find(x => x.type === "image" && !x.img);
      if (!s) return alert("Сначала выберите фотослот.");
      s.img = img.dataset.media;
      renderApp(); save();
    }));

    const panel = $("#pbImgPanel", side);
    if (panel) {
      $$("[data-act]", panel).forEach(b => b.addEventListener("click", () => {
        const s = sp.slots[selectedSlot];
        const act = b.dataset.act;
        if (act === "rotate") { s.crop.rot = ((s.crop.rot || 0) + 1) % 4; }
        if (act === "replace") pickFile((mi) => { s.img = mi.id; renderApp(); save(); });
        if (act === "remove") { s.img = null; selectedSlot = null; }
        if (act === "fill") { s.crop = { zoom: 1, ox: 0.5, oy: 0.5, rot: s.crop.rot }; }
        renderApp(); save();
      }));
      $('[data-knob="zoom"]', panel).addEventListener("input", (e) => {
        sp.slots[selectedSlot].crop.zoom = +e.target.value;
        renderCanvas(); save();
      });
    }

    const tp = $("#pbTextPanel", side);
    if (tp) {
      const s = sp.slots[selectedSlot];
      $$("[data-knob]", tp).forEach(el => el.addEventListener("input", () => {
        const k = el.dataset.knob;
        if (k === "font") s.font = el.value;
        if (k === "size") s.size = +el.value;
        if (k === "spacing") s.spacing = +el.value;
        if (k === "color") s.color = el.value;
        renderCanvas(); save();
      }));
      $$("[data-knob='align']", tp).forEach(b => b.addEventListener("click", () => {
        s.align = b.dataset.v; renderApp(); save();
      }));
      $$("[data-knob='uppercase']", tp).forEach(b => b.addEventListener("click", () => {
        s.uppercase = !s.uppercase; renderApp(); save();
      }));
      $$("[data-knob='bold']", tp).forEach(b => b.addEventListener("click", () => {
        s.bold = !s.bold; renderApp(); save();
      }));
      $$("[data-knob='italic']", tp).forEach(b => b.addEventListener("click", () => {
        s.italic = !s.italic; renderApp(); save();
      }));
    }
  }

  function dpiLabel(slot) {
    const mi = mediaOf(slot);
    if (!mi) return "—";
    const d = slotDpi(slot, mi);
    return d < DPI_MIN ? `${d} ⚠` : String(d);
  }

  /* ---------- Добавление элементов ---------- */
  function addSlot(type) {
    const f = fmt();
    const sp = state.spreads[current];
    const theme = THEMES.find(t => t.id === state.themeId) || THEMES[0];
    const n = sp.slots.length;
    const w = Math.round(f.pageW * 0.38);
    const h = type === "image" ? Math.round(w * 0.75) : 18;
    const base = {
      slotId: type + "_" + Date.now() % 100000,
      type,
      x: Math.round(f.pageW / 2 - w / 2 + (n % 5) * 8 - 16),
      y: Math.round((f.pageH - h) / 2 + (n % 3) * 10 - 10),
      w, h,
    };
    if (type === "image") {
      Object.assign(base, { img: null, crop: { zoom: 1, ox: 0.5, oy: 0.5, rot: 0 } });
    } else {
      Object.assign(base, {
        text: "Ваш текст", size: 18, font: theme.fonts[0],
        align: "center", spacing: 0, uppercase: false, bold: false, italic: false, color: null,
      });
    }
    sp.slots.push(base);
    selectedSlot = sp.slots.length - 1;
    renderApp(); save();
  }

  /* ---------- Пакетная автораскладка фото ---------- */
  function openFillModal() {
    const modal = $("#pbFillModal");
    if (!media.length) { alert("Сначала загрузите фотографии в медиагалерею проекта."); return; }
    $("#pbFillPhotos").innerHTML = media.map((m, i) => `
      <label class="pb-fill-photo" data-on="1">
        <input type="checkbox" checked data-photo="${m.id}" hidden>
        <img src="${m.dataURL}" title="${m.name}">
        <span class="pb-fill-ord">${i + 1}</span>
      </label>`).join("");
    $("#pbFillPages").innerHTML = state.spreads.map((sp, i) => `
      <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;padding:4px 0">
        <input type="checkbox" checked data-spread="${i}">
        Разворот ${i + 1} — ${layoutsFor(fmt())[sp.layout]?.name || sp.layout}
      </label>`).join("");
    openModal(modal);
    // синхронизация визуального состояния чекбоксов
    $$("#pbFillPhotos .pb-fill-photo").forEach((label) => {
      const cb = label.querySelector("input");
      const sync = () => (label.dataset.on = cb.checked ? "1" : "0");
      cb.addEventListener("change", sync);
      sync();
    });
  }

  function runFill() {
    const photoIds = $$("#pbFillPhotos input:checked").map(i => i.dataset.photo);
    const spreadIdx = $$("#pbFillPages input:checked").map(i => +i.dataset.spread);
    if (!photoIds.length || !spreadIdx.length) { alert("Выберите хотя бы одно фото и один разворот."); return; }
    let pi = 0, placed = 0;
    spreadIdx.sort((a, b) => a - b).forEach((si) => {
      state.spreads[si].slots.forEach((slot) => {
        if (slot.type === "image" && !slot.img && pi < photoIds.length) {
          slot.img = photoIds[pi++];
          placed++;
        }
      });
    });
    closeModal($("#pbFillModal"));
    renderApp(); save();
    showToast(placed
      ? `Разложено ${placed} фото по ${spreadIdx.length} разворотам.` +
        (pi < photoIds.length ? ` Не поместились: ${photoIds.length - pi}.` : "")
      : "Свободных фото-рамок на выбранных разворотах нет.");
  }

  /* ---------- Медиа: загрузка, HEIC-конвертация ---------- */
  async function addMedia(file) {
    let blob = file;
    if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
      try {
        await loadScript("https://unpkg.com/heic2any@0.0.4/dist/heic2any.min.js");
        blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
        if (Array.isArray(blob)) blob = blob[0];
      } catch {
        alert("Не удалось конвертировать HEIC: " + file.name);
        return null;
      }
    }
    const dataURL = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(blob);
    });
    const dims = await new Promise((res) => {
      const im = new Image();
      im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
      im.src = dataURL;
    });
    const mi = { id: "m" + Date.now() + Math.random().toString(36).slice(2, 5), dataURL, name: file.name, ...dims };
    media.push(mi);
    return mi;
  }

  function pickFile(cb) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/jpeg,image/png,image/webp,image/heic";
    inp.onchange = async () => { if (inp.files[0]) { const mi = await addMedia(inp.files[0]); if (mi) cb(mi); } };
    inp.click();
  }

  const _scripts = {};
  function loadScript(src) {
    if (_scripts[src]) return _scripts[src];
    return _scripts[src] = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* =========================================================
     ЭКСПОРТ: канвас-рендер в 300 DPI
     ========================================================= */
  async function ensureExportLibs() {
    await loadScript("https://unpkg.com/jszip@3.10.1/dist/jszip.min.js");
    await loadScript("https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js");
  }

  function documentFonts() {
    return (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  }

  // Рисует страницу (или разворот) на канвасе в заданном px/mm, с опциональным блидом
  function drawToCanvas(sp, opts) {
    const f = fmt();
    const spread = !!opts.spread;
    const pageWmm = spread ? f.pageW * 2 : f.pageW;
    const Wmm = pageWmm + (opts.bleed ? f.bleed * 2 : 0);
    const Hmm = f.pageH + (opts.bleed ? f.bleed * 2 : 0);
    const ppm = opts.dpi / MM_PER_INCH;
    const c = document.createElement("canvas");
    c.width = Math.round(Wmm * ppm);
    c.height = Math.round(Hmm * ppm);
    const ctx = c.getContext("2d");
    ctx.scale(ppm, ppm); // теперь единица = мм
    const B = opts.bleed ? f.bleed : 0;

    // фон
    ctx.fillStyle = sp.bg || state.customBg || palette().background;
    ctx.fillRect(0, 0, Wmm, Hmm);

    const drawSlots = (offsetX) => {
      sp.slots.forEach((slot) => {
        const x = slot.x - offsetX + B, y = slot.y + B;
        if (x + slot.w < B - 0.1 || x > Wmm - B + 0.1) return;
        if (slot.type === "image") {
          const mi = mediaOf(slot);
          if (!mi) return;
          const im = mi._el || (() => { const i = new Image(); i.src = mi.dataURL; return i; })();
          const d = imageOffset(slot, mi);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, slot.w, slot.h);
          ctx.clip();
          ctx.translate(x + slot.w / 2, y + slot.h / 2);
          if (slot.crop.rot) ctx.rotate(slot.crop.rot * Math.PI / 2);
          ctx.translate(-slot.w / 2, -slot.h / 2);
          ctx.drawImage(im, x + d.x, y + d.y, d.wMm, d.hMm);
          ctx.restore();
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, slot.w, slot.h);
          ctx.clip();
          ctx.fillStyle = slot.color || palette().text;
          ctx.font = `${slot.italic ? "italic " : ""}${slot.bold ? 600 : 400} ${slot.size}pt ${fontCss(slot.font)}`;
          ctx.textAlign = slot.align === "center" ? "center" : slot.align === "right" ? "right" : "left";
          ctx.textBaseline = "top";
          try { ctx.letterSpacing = slot.spacing + "em"; } catch {}
          const tx = slot.align === "center" ? x + slot.w / 2 : slot.align === "right" ? x + slot.w : x;
          const lines = (slot.text || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").split("\n");
          let ty = y;
          lines.forEach((line) => {
            const l = slot.uppercase ? line.toUpperCase() : line;
            ctx.fillText(l, tx, ty);
            ty += slot.size * 1.25 * 0.3528; // pt→мм × межстрочный
          });
          ctx.restore();
        }
      });
    };

    if (spread) {
      drawSlots(0);
    } else {
      drawSlots(0);        // левая страница
      if (opts.right) drawSlots(f.pageW); // правая
    }
    return c;
  }

  async function decodeAllImages() {
    await documentFonts();
    const jobs = [];
    state.spreads.forEach(sp => sp.slots.forEach(s => {
      const mi = mediaOf(s);
      if (mi && !mi._el) {
        jobs.push(new Promise((res) => {
          const im = new Image();
          im.onload = () => { mi._el = im; res(); };
          im.onerror = res;
          im.src = mi.dataURL;
        }));
      }
    }));
    await Promise.all(jobs);
  }

  function progress(pct) {
    const bar = $("#pbProgressBar");
    bar.style.width = Math.round(pct) + "%";
  }

  async function runExport(mode) {
    const modal = $("#pbExportModal");
    modal.querySelector(".pb-modal-body").style.display = "none";
    $("#pbProgress").classList.add("open");
    const t0 = performance.now();

    await ensureExportLibs();
    await decodeAllImages();

    const f = fmt();
    const projName = "photobook_" + state.projectId;
    const pdfMaker = () => new jspdf.jsPDF({
      orientation: f.pageW >= f.pageH ? "landscape" : "portrait",
      unit: "mm", format: [f.pageW * 2 + f.bleed * 2, f.pageH + f.bleed * 2],
    });

    if (mode === "json") {
      const manifest = {
        projectId: state.projectId,
        themeId: state.themeId,
        format: { type: "layflat", widthMm: f.pageW * 2, heightMm: f.pageH, bleedMm: f.bleed },
        colorPalette: {
          background: palette().background, text: palette().text,
          accent: palette().accent, divider: palette().divider,
        },
        fonts: FONTS.map(x => x.id),
        spreads: state.spreads.map((sp, i) => ({
          spreadIndex: i + 1,
          layout: sp.layout,
          background: sp.bg || null,
          elements: sp.slots.map(s => s.type === "image"
            ? { type: "image", slotId: s.slotId, x: s.x, y: s.y, w: s.w, h: s.h, src: (mediaOf(s) || {}).name || null, crop: { ...s.crop } }
            : { type: "text", slotId: s.slotId, x: s.x, y: s.y, w: s.w, h: s.h, text: (s.text || "").replace(/<[^>]+>/g, ""), font: s.font, size: s.size, align: s.align, spacing: s.spacing, uppercase: s.uppercase }),
        })),
      };
      downloadBlob(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }), projName + "_manifest.json");
    }

    if (mode === "layflat_zip") {
      const zip = new JSZip();
      for (let i = 0; i < state.spreads.length; i++) {
        const c = drawToCanvas(state.spreads[i], { spread: true, bleed: true, dpi: 300 });
        const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.95));
        zip.file(`spread_${String(i + 1).padStart(2, "0")}_300dpi.jpg`, blob);
        progress(((i + 1) / state.spreads.length) * 100);
      }
      // README с параметрами
      zip.file("README.txt",
        `Print Ready: LayFlat\nРазворотов: ${state.spreads.length}\nРазмер разворота: ${f.pageW * 2 + f.bleed * 2}×${f.pageH + f.bleed * 2} мм (с вылетами +${f.bleed} мм)\nРазрешение: 300 DPI, JPEG (sRGB)\nЦветовой профиль: sRGB (FOGRA39-совместимая конверсия в типографии)\nПроект: templatus.ru`);
      const out = await zip.generateAsync({ type: "blob" }, (m) => progress(m.percent));
      downloadBlob(out, projName + "_layflat_300dpi.zip");
    }

    if (mode === "pages_pdf") {
      const pdf = pdfMaker();
      for (let i = 0; i < state.spreads.length; i++) {
        const sp = state.spreads[i];
        // левая полоса
        let c = drawToCanvas(sp, { spread: false, bleed: true, dpi: 300 });
        if (i > 0) pdf.addPage([f.pageW + f.bleed * 2, f.pageH + f.bleed * 2]);
        pdf.addImage(c.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, f.pageW + f.bleed * 2, f.pageH + f.bleed * 2);
        // правая полоса
        pdf.addPage([f.pageW + f.bleed * 2, f.pageH + f.bleed * 2]);
        c = drawToCanvas(sp, { spread: false, bleed: true, dpi: 300, right: true });
        pdf.addImage(c.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, f.pageW + f.bleed * 2, f.pageH + f.bleed * 2);
        progress(((i + 1) / state.spreads.length) * 100);
      }
      pdf.save(projName + "_pages_300dpi.pdf");
    }

    if (mode === "preview_pdf") {
      const pdf = pdfMaker();
      for (let i = 0; i < state.spreads.length; i++) {
        const c = drawToCanvas(state.spreads[i], { spread: true, bleed: false, dpi: 96 });
        if (i > 0) pdf.addPage([f.pageW * 2, f.pageH]);
        pdf.addImage(c.toDataURL("image/jpeg", 0.82), "JPEG", 0, 0, f.pageW * 2, f.pageH);
        progress(((i + 1) / state.spreads.length) * 100);
      }
      pdf.save(projName + "_preview.pdf");
    }

    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    $("#pbProgress").classList.remove("open");
    modal.querySelector(".pb-modal-body").style.display = "";
    closeModal($("#pbExportModal"));
    showToast(`Готово за ${secs} с. Файл загружен.`);
  }

  function downloadBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function showToast(msg) {
    let t = $("#pbToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "pbToast";
      t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:#fff;padding:10px 20px;border-radius:999px;z-index:400;font-size:14px;box-shadow:0 10px 25px rgb(0 0 0/.2)";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => (t.style.display = "none"), 4000);
  }

  /* =========================================================
     СОХРАНЕНИЕ / ВОССТАНОВЛЕНИЕ
     ========================================================= */
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ state, media: media.map(({ _el, ...m }) => m) }));
      } catch (e) { /* квота — игнорируем */ }
    }, 400);
  }

  function restore() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.state || !data.state.spreads) return false;
      state = data.state;
      media.push(...data.media);
      return true;
    } catch { return false; }
  }

  /* =========================================================
     ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ
     ========================================================= */
  function initLanding() {
    const grid = $("#pbThemesGrid");
    if (!grid) return;
    grid.innerHTML = THEMES.map(t => {
      const p = PALETTES.find(x => x.id === t.palette);
      return `
      <article class="pb-theme-card" data-theme="${t.id}">
        <div class="pb-theme-preview" style="background:${p.background}">
          <div class="pb-tp-left">
            <div class="pb-tp-block" style="background:${p.divider}"></div>
            <div class="pb-tp-block" style="background:${p.divider}"></div>
          </div>
          <div class="pb-tp-right">
            <div class="pb-tp-block" style="background:${p.accent};opacity:.85"></div>
            <div class="pb-tp-text" style="background:${p.text};opacity:.5"></div>
          </div>
        </div>
        <div class="pb-theme-body">
          <h3>${t.name}</h3>
          <p>${t.desc}</p>
          <div class="pb-theme-tags">${t.tags.map(x => `<span>${x}</span>`).join("")}</div>
        </div>
      </article>`;
    }).join("");

    $$(".pb-theme-card", grid).forEach(card => card.addEventListener("click", () => {
      state = newProject(card.dataset.theme);
      current = 0;
      enterApp();
    }));

    $("#pbContinueBtn")?.addEventListener("click", () => {
      if (!restore()) { state = newProject("wedding"); }
      enterApp();
    });
  }

  function enterApp() {
    $("#pbLanding").style.display = "none";
    $("#pbApp").classList.add("active");
    selectedSlot = null;
    renderApp();
    save();
  }

  function exitApp() {
    $("#pbApp").classList.remove("active");
    $("#pbLanding").style.display = "";
  }

  function openModal(m) { m.classList.add("open"); }
  function closeModal(m) { m.classList.remove("open"); }

  function initToolbar() {
    const app = $("#pbApp");
    $("#pbExitBtn").addEventListener("click", exitApp);
    $("#pbZoomIn").addEventListener("click", () => { zoom = (zoom || fitScaleNow()) * 1.15; renderCanvas(); });
    $("#pbZoomOut").addEventListener("click", () => { zoom = Math.max(0.2, (zoom || fitScaleNow()) / 1.15); renderCanvas(); });
    $("#pbZoom100").addEventListener("click", () => { zoom = 3.78; renderCanvas(); }); // 96dpi
    $("#pbZoomFit").addEventListener("click", () => { zoom = 0; renderCanvas(); });
    $("#pbGuides").addEventListener("click", (e) => { guides = !guides; e.currentTarget.classList.toggle("btn-primary", guides); renderCanvas(); });
    $("#pbFormatSel").addEventListener("change", (e) => {
      state.format = e.target.value;
      // пересобираем развороты под новый формат с сохранением фото
      state.spreads = state.spreads.map((sp) => {
        const imgs = sp.slots.filter(s => s.img).map(s => s.img);
        const ns = makeSpread(sp.layout);
        ns.bg = sp.bg;
        ns.slots.filter(s => s.type === "image").forEach((s, i) => { if (imgs[i]) s.img = imgs[i]; });
        return ns;
      });
      renderApp(); save();
    });
    $("#pbExportBtn").addEventListener("click", () => openModal($("#pbExportModal")));
    $("#pbRunExport").addEventListener("click", () => {
      const v = $('input[name="pbExportMode"]:checked');
      if (v) runExport(v.value);
    });
    $$("[data-close-modal]").forEach(b => b.addEventListener("click", () => closeModal(b.closest(".pb-modal-backdrop"))));
    $("#pbRunFill")?.addEventListener("click", runFill);
    window.addEventListener("resize", () => { if (zoom === 0) renderCanvas(); });
    window.addEventListener("keydown", (e) => {
      if (!$("#pbApp").classList.contains("active")) return;
      const tgt = e.target;
      const editing = tgt && (tgt.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(tgt.tagName));
      if (!editing && e.key.startsWith("Arrow") && selectedSlot != null) {
        e.preventDefault();
        const s = state.spreads[current].slots[selectedSlot];
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowUp") s.y -= step;
        if (e.key === "ArrowDown") s.y += step;
        if (e.key === "ArrowLeft") s.x -= step;
        if (e.key === "ArrowRight") s.x += step;
        renderCanvas(); save();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !editing && selectedSlot != null) {
        e.preventDefault();
        state.spreads[current].slots.splice(selectedSlot, 1);
        selectedSlot = null;
        renderApp(); save();
      }
      if (e.key === "Escape") { selectedSlot = null; renderCanvas(); renderSide(); }
    });
  }

  function fitScaleNow() {
    const f = fmt(), area = $("#pbCanvasArea");
    return Math.max(0.2, Math.min((area.clientWidth - 80) / (f.pageW * 2), (area.clientHeight - 80) / f.pageH));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLanding();
    initToolbar();
    const hasDraft = !!localStorage.getItem(LS_KEY);
    const btn = $("#pbContinueBtn");
    if (btn && hasDraft) { btn.textContent = "Продолжить проект"; btn.style.display = "inline-flex"; }
  });
})();
