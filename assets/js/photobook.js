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
    { id: "ptserif", label: "PT Serif (антиква)", css: "'PT Serif', Georgia, serif" },
    { id: "cormorant", label: "Cormorant (изящная антиква)", css: "'Cormorant', Georgia, serif" },
    { id: "inter", label: "Inter (гротеск)", css: "'Inter', Arial, sans-serif" },
    { id: "montserrat", label: "Montserrat (гротеск)", css: "'Montserrat', Arial, sans-serif" },
    { id: "oswald", label: "Oswald (узкий гротеск)", css: "'Oswald', Arial Narrow, sans-serif" },
    { id: "caveat", label: "Caveat (рукописный)", css: "'Caveat', cursive" },
    { id: "marck", label: "Marck Script (рукописный)", css: "'Marck Script', cursive" },
    { id: "badscript", label: "Bad Script (рукописный)", css: "'Bad Script', cursive" },
    { id: "lobster", label: "Lobster (акцидентный)", css: "'Lobster', cursive" },
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
      title_page: { name: "Титульный лист", slots: [
        { type: "image", x: 0, y: 0, w: half, h: H },
        { type: "text", x: rightX, y: Math.round(H * 0.38), w: half - m * 2, h: 34, text: "Наша история", size: 30, font: "playfair", align: "center" },
        { type: "text", x: rightX, y: Math.round(H * 0.38) + 44, w: half - m * 2, h: 18, text: "2026", size: 16, font: "caveat", align: "center" },
      ]},
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
       title_page: '<rect x="4" y="4" width="52" height="52" rx="3"/><rect x="66" y="20" width="48" height="9" rx="2"/><rect x="76" y="33" width="28" height="5" rx="2"/>',
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
    const proj = {
      projectId: "tpl_book_" + Math.random().toString(36).slice(2, 6),
      themeId: theme.id,
      format: "square20",
      palette: theme.palette,
      customBg: null,
      spreads: ["title_page", ...theme.spreads].map((layout, i) => makeSpread(layout, i)),
    };
    proj.cover = makeCover(proj.format);
    return proj;
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

  // Позиция верхнего левого угла картинки (мм в координатах слота).
  // +12% «подглядывания» с каждой стороны — фото легко двигать внутри рамки всегда
  function imageOffset(slot, mediaItem) {
    const d = imageDrawSize(slot, mediaItem);
    const spanX = Math.max(0, d.wMm - slot.w) + slot.w * 0.12;
    const spanY = Math.max(0, d.hMm - slot.h) + slot.h * 0.12;
    return {
      x: (slot.crop.ox * 2 - 1) * spanX - Math.max(0, (slot.w - d.wMm) / 2),
      y: (slot.crop.oy * 2 - 1) * spanY - Math.max(0, (slot.h - d.hMm) / 2),
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

  /* ---------- Обложка и корешок ---------- */
  let editingCover = false;
  const activeSpread = () => editingCover ? state.cover : state.spreads[current];
  const spreadWmm = () => editingCover
    ? fmt().pageW * 2 + state.cover.spineW
    : fmt().pageW * 2;

  function makeCover(formatKey) {
    const f = FORMATS[formatKey || (state ? state.format : null) || "square20"];
    const spine = Math.max(5, Math.round((f.pageH + 20) * 0.05));
    const W = f.pageW * 2 + spine;
    const frontX = f.pageW + spine;
    return {
      layout: "cover",
      isCover: true,
      spineW: spine,
      bg: null,
      slots: [
        { slotId: "cover_bg", type: "image", x: 0, y: 0, w: W, h: f.pageH, img: null, crop: { zoom: 1, ox: 0.5, oy: 0.5, rot: 0 } },
        { slotId: "cover_title", type: "text", x: Math.round(frontX + f.pageW * 0.15), y: Math.round(f.pageH * 0.38), w: Math.round(f.pageW * 0.7), h: 30, text: "Название книги", size: 26, font: "playfair", align: "center", spacing: 0, uppercase: false, bold: false, italic: false, color: "#FFFFFF" },
        { slotId: "cover_subtitle", type: "text", x: Math.round(frontX + f.pageW * 0.15), y: Math.round(f.pageH * 0.38) + 40, w: Math.round(f.pageW * 0.7), h: 16, text: "2026", size: 14, font: "caveat", align: "center", spacing: 0, uppercase: false, bold: false, italic: false, color: "#FFFFFF" },
        { slotId: "cover_spine", type: "text", x: f.pageW + 1, y: Math.round(f.pageH * 0.46), w: spine - 2, h: 14, text: "КОРЕШОК", size: 9, font: "oswald", align: "center", spacing: 0.05, uppercase: true, bold: false, italic: false, color: "#FFFFFF" },
      ],
    };
  }

  // пересчёт ширины корешка по числу страниц
  function recalcSpine() {
    const c = state.cover;
    if (!c || !c.autoSpine) return;
    const sheets = state.spreads.length; // 1 лист ≈ 1 разворот в упрощении
    c.spineW = Math.min(40, Math.max(5, Math.round(3 + sheets * 0.6)));
  }

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
    const sp = activeSpread();
    const f = fmt();
    const totalW = spreadWmm();
    const areaW = area.clientWidth - 80, areaH = area.clientHeight - 80;
    const fitScale = Math.min(areaW / totalW, areaH / f.pageH);
    const s = zoom > 0 ? zoom : Math.max(0.2, fitScale); // px на мм

    const el = $("#pbSpread");
    el.style.width = (totalW * s) + "px";
    el.style.height = (f.pageH * s) + "px";
    lastScale = s;
    const zp = $("#pbZoomPct");
    if (zp) zp.textContent = Math.round((s / 3.78) * 100) + "%";
    el.style.background = sp.bg || state.customBg || palette().background;
    el.classList.toggle("pb-guides", guides);
    el.innerHTML = "";

    // Линии сгибов / корешок
    if (editingCover) {
      const mkFold = (xMm, tip) => {
        const fd = document.createElement("div");
        fd.className = "pb-fold cover";
        fd.style.left = xMm * s + "px";
        fd.dataset.tip = tip;
        el.appendChild(fd);
      };
      mkFold(f.pageW, "Линия сгиба: задняя обложка → корешок");
      mkFold(f.pageW + sp.spineW, "Линия сгиба: корешок → передняя обложка");
    } else {
      const fold = document.createElement("div");
      fold.className = "pb-fold";
      fold.dataset.tip = "Корешок — не размещайте лица в центре";
      el.appendChild(fold);
    }

    // чипы-подписи страниц (не экспортируются, только для ориентира)
    const chip = (text, xMm, yMm, primary) => {
      const c = document.createElement("div");
      c.className = "pb-page-chip" + (primary ? " primary" : "");
      c.textContent = text;
      c.style.left = xMm * s + "px";
      c.style.top = yMm * s + "px";
      el.appendChild(c);
    };
    if (editingCover) {
      chip("Задняя обложка", 4, f.pageH - 9, false);
      chip("Передняя обложка", f.pageW + sp.spineW + 4, f.pageH - 9, false);
      chip("Корешок · " + sp.spineW + " мм", f.pageW - 4, 5, true);
    } else {
      chip("стр. " + (current * 2 + 1), 4, f.pageH - 9, false);
      chip("стр. " + (current * 2 + 2), f.pageW + 4, f.pageH - 9, false);
      if (current === 0) chip("Титульный лист", f.pageW - 48, 5, true);
      else if (current === state.spreads.length - 1) chip("Последний разворот", f.pageW - 62, 5, true);
    }

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
      div.style.zIndex = 10 + i; // порядок слоёв = порядок в массиве (и в панели «Слои»)
      if (slot.rot) {
        div.style.transformOrigin = "center";
        div.style.transform = `rotate(${slot.rot}deg)`;
      }

      if (slot.type === "decor") {
        const shape = DECOR_SHAPES[slot.shape] || DECOR_SHAPES.line;
        const fill = !!DECOR_FILL[slot.shape];
        div.style.background = "none";
        div.style.outline = "none";
        div.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%;display:block;overflow:visible">
          ${shape.svg.replace(/stroke-width/g, 'vector-effect="non-scaling-stroke" stroke-width')}
        </svg>`.replace('vector-effect="non-scaling-stroke" stroke-width', 'stroke-width');
        const svg = div.firstChild;
        [...svg.children].forEach((el2) => {
          const col = slot.color || palette().accent;
          if (fill) { el2.setAttribute("fill", col); el2.setAttribute("stroke", "none"); }
          else { el2.setAttribute("fill", "none"); el2.setAttribute("stroke", col); }
        });
      } else if (slot.type === "image") {
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
          div.innerHTML = `<div class="pb-empty-hint">▭Перетащите фото<br>или кликните</div>`;
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
      div.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if (selectedSlot !== i) { selectedSlot = i; renderSide(); updateHandles(); }
      });
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        selectedSlot = i;
        openContextMenu(e.clientX, e.clientY, i);
      });
      el.appendChild(div);
    });

    updateHandles();

    // перетаскивание декора из библиотеки на холст (on* — без дублей при ре-рендере)
    el.ondragover = (e) => { if (e.dataTransfer.types.includes("text/pbshape")) e.preventDefault(); };
    el.ondrop = (e) => {
      const shape = e.dataTransfer.getData("text/pbshape");
      if (!shape || !DECOR_SHAPES[shape]) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / lastScale, my = (e.clientY - rect.top) / lastScale;
      const wide = ["line", "dline", "dashline", "wave"].includes(shape);
      activeSpread().slots.push({
        slotId: "dec_" + Date.now() % 100000, type: "decor", shape,
        x: Math.round(mx - (wide ? 30 : 15)), y: Math.round(my - (wide ? 3 : 15)),
        w: wide ? 60 : 30, h: wide ? 6 : 30, rot: 0, color: palette().accent,
      });
      selectedSlot = activeSpread().slots.length - 1;
      renderApp(); save();
    };

    // клик по пустой области разворота — снять выделение
    el.onmousedown = (e) => {
      if (selectedSlot != null) { selectedSlot = null; renderCanvas(); renderSide(); }
    };
  }

  /* ---------- Ручки управления выбранным слотом ---------- */
  function updateHandles() {
    const el = $("#pbSpread");
    if (!el) return;
    $$(".pb-elbar, .pb-resize, .pb-rotatehandle", el).forEach((h) => { h.remove(); });
    $$(".pb-slot", el).forEach((d) => {
      d.classList.remove("selected");
      d.style.zIndex = 10 + (+d.dataset.slotIndex); // восстановить исходный z-index
    });
    if (selectedSlot == null) return;
    const div = $(`.pb-slot[data-slot-index="${selectedSlot}"]`, el);
    const slot = activeSpread().slots[selectedSlot];
    if (!div || !slot) return;
    div.classList.add("selected");
    div.style.zIndex = 500;

    const s = lastScale;
    const bb = slotBBox(slot); // bbox с учётом вращения

    // панель действий элемента
    const bar = document.createElement("div");
    bar.className = "pb-elbar";
    bar.style.zIndex = 1000;
    bar.style.left = Math.max(0, bb.x * s) + "px";
    bar.style.top = Math.max(0, bb.y * s - 34) + "px";
    const mkBtn = (icon, title, fn, dragMode) => {
      const b = document.createElement("button");
      b.className = "pb-elbar-btn";
      b.title = title;
      b.innerHTML = icon;
      if (dragMode) {
        b.addEventListener("mousedown", (e) => startSlotDrag(e, dragMode, slot));
      } else {
        b.addEventListener("mousedown", (e) => e.stopPropagation());
        b.addEventListener("click", (e) => { e.stopPropagation(); closeContextMenu(); fn(); });
      }
      return b;
    };
    bar.appendChild(mkBtn("⠿", "Переместить (или Alt+перетаскивание)", null, "move"));
    bar.appendChild(mkBtn("⟳", "Вращать (Shift — шаг 15°)", null, "rotate"));
    bar.appendChild(mkBtn("⧉", "Дублировать (Ctrl+D)", () => {
      const sp = activeSpread();
      const copy = JSON.parse(JSON.stringify(slot));
      copy.slotId += "_c" + Date.now() % 1000;
      sp.slots.splice(selectedSlot + 1, 0, copy);
      selectedSlot++;
      renderApp(); save();
    }));
    bar.appendChild(mkBtn("▲", "Слой выше", () => moveLayer(selectedSlot, 1)));
    bar.appendChild(mkBtn("▼", "Слой ниже", () => moveLayer(selectedSlot, -1)));
    bar.appendChild(mkBtn("✕", "Удалить (Delete)", () => {
      activeSpread().slots.splice(selectedSlot, 1);
      selectedSlot = null;
      renderApp(); save();
    }, false));
    bar.lastChild.classList.add("danger");
    el.appendChild(bar);

    // ручка вращения
    const rot = document.createElement("div");
    rot.className = "pb-rotatehandle";
    rot.style.zIndex = 1001;
    rot.title = "Вращать (Shift — шаг 15°)";
    rot.innerHTML = "⟳";
    rot.style.left = (bb.x * s + bb.w * s / 2 - 11) + "px";
    rot.style.top = Math.max(0, bb.y * s - 22) + "px";
    rot.addEventListener("mousedown", (e) => startSlotDrag(e, "rotate", slot));
    el.appendChild(rot);

    // ресайз
    const rh = document.createElement("div");
    rh.className = "pb-resize";
    rh.style.zIndex = 1001;
    rh.title = "Изменить размер";
    rh.style.left = ((bb.x + bb.w) * s - 8) + "px";
    rh.style.top = ((bb.y + bb.h) * s - 8) + "px";
    rh.addEventListener("mousedown", (e) => startSlotDrag(e, "resize", slot));
    el.appendChild(rh);
  }

  const clampNum = (v, a, b) => Math.min(b, Math.max(a, isFinite(v) ? v : a));

  /* ---------- SVG-рендер декора для экспорта (идентично экрану) ---------- */
  const decorCache = {};
  function decorImage(slot) {
    const col = slot.color || palette().accent;
    const key = slot.shape + "|" + col;
    if (!decorCache[key]) {
      const shape = DECOR_SHAPES[slot.shape] || DECOR_SHAPES.line;
      const fill = !!DECOR_FILL[slot.shape];
      const inner = [...shape.svg.replace(/<g /g, "<g ").matchAll(/<([a-z]+)[^>]*/g)].map(() => "").join("");
      // перекраска: добавляем атрибуты через CSS-переменные
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${
        fill ? `fill="${col}" stroke="none"` : `fill="none" stroke="${col}"`
      }>${shape.svg}</svg>`;
      const img = new Image();
      const entry = { img, ready: false };
      img.onload = () => { entry.ready = true; };
      img.src = "data:image/svg+xml;charset=utf8," + encodeURIComponent(svg);
      decorCache[key] = entry;
    }
    return decorCache[key];
  }

  /* ---------- Магнит (snap) как в Figma ---------- */
  let snapGuides = [];
  let snapBadges = [];
  function findSnap(slot, nx, ny) {
    const f = fmt();
    const thr = 8 / lastScale; // порог в мм (~8px)
    const guides = [];
    const W = spreadWmm();

    const vx = [], vy = [];
    // осевые линии разворота и центры страниц
    [0, f.pageW, W, W / 2, f.pageW / 2, f.pageW * 1.5].forEach((v) => vx.push(v));
    [0, f.pageH, f.pageH / 2].forEach((v) => vy.push(v));
    activeSpread().slots.forEach((s) => {
      if (s === slot) return;
      vx.push(s.x, s.x + s.w, s.x + s.w / 2);
      vy.push(s.y, s.y + s.h, s.y + s.h / 2);
    });

    const tryAxis = (pos, size, targets, axis) => {
      let best = null;
      [pos, pos + size / 2, pos + size].forEach((pv, k) => {
        targets.forEach((tv) => {
          const d = Math.abs(pv - tv);
          if (d < thr && (!best || d < best.d)) best = { d, tv, k };
        });
      });
      if (best) {
        const adj = best.k === 0 ? best.tv : best.k === 1 ? best.tv - size / 2 : best.tv - size;
        guides.push({ axis, v: best.tv });
        return adj;
      }
      return pos;
    };

    // равные отступы (как в Figma): соседи по строке/столбцу
    const others = activeSpread().slots.filter((q) => q !== slot);
    const overlap = (a1, a2, b1, b2) => Math.min(a2, b2) - Math.max(a1, b1);
    const rowN = others.filter((q) => overlap(q.y, q.y + q.h, ny, ny + slot.h) > Math.min(slot.h, q.h) * 0.3)
                       .sort((a, b) => a.x - b.x);
    const colN = others.filter((q) => overlap(q.x, q.x + q.w, nx, nx + slot.w) > Math.min(slot.w, q.w) * 0.3)
                       .sort((a, b) => a.y - b.y);
    const L = [...rowN].reverse().find((q) => q.x + q.w <= nx + slot.w / 2);
    const R = rowN.find((q) => q.x >= nx + slot.w / 2);
    if (L && R) vx.push((L.x + L.w + R.x - slot.w) / 2); // центр между соседями = равные зазоры
    const T = [...colN].reverse().find((q) => q.y + q.h <= ny + slot.h / 2);
    const Bm = colN.find((q) => q.y >= ny + slot.h / 2);
    if (T && Bm) vy.push((T.y + T.h + Bm.y - slot.h) / 2);

    const x2 = tryAxis(nx, slot.w, vx, "v");
    const y2 = tryAxis(ny, slot.h, vy, "h");

    // бейджи расстояний до ближайших соседей
    const badges = [];
    const mkBadge = (gx, gy, text) => badges.push({ x: gx, y: gy, text });
    if (L) mkBadge((L.x + L.w + x2) / 2, y2 + slot.h / 2, Math.max(0, Math.round(x2 - L.x - L.w)) + " мм");
    if (R) mkBadge((x2 + slot.w + R.x) / 2, y2 + slot.h / 2, Math.max(0, Math.round(R.x - x2 - slot.w)) + " мм");
    if (T) mkBadge(x2 + slot.w / 2, (T.y + T.h + y2) / 2, Math.max(0, Math.round(y2 - T.y - T.h)) + " мм");
    if (Bm) mkBadge(x2 + slot.w / 2, (y2 + slot.h + Bm.y) / 2, Math.max(0, Math.round(Bm.y - y2 - slot.h)) + " мм");
    return { x: x2, y: y2, guides, badges };
  }

  function drawSnapGuides() {
    clearSnapGuides();
    const el = $("#pbSpread");
    if (!el) return;
    snapGuides.forEach((g) => {
      const d = document.createElement("div");
      d.className = g.axis === "v" ? "pb-guide pb-guide-v" : "pb-guide pb-guide-h";
      if (g.axis === "v") { d.style.left = g.v * lastScale + "px"; d.style.top = "-30px"; d.style.bottom = "-30px"; }
      else { d.style.top = g.v * lastScale + "px"; d.style.left = "-30px"; d.style.right = "-30px"; }
      el.appendChild(d);
    });
    snapBadges.forEach((b) => {
      const d = document.createElement("div");
      d.className = "pb-dist";
      d.textContent = b.text;
      d.style.left = b.x * lastScale + "px";
      d.style.top = b.y * lastScale + "px";
      el.appendChild(d);
    });
  }

  function clearSnapGuides() {
    $$(".pb-guide, .pb-dist").forEach((g) => g.remove());
  }

  /* ---------- BBox слота с учётом вращения ---------- */
  function slotBBox(slot) {
    if (!slot.rot) return { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
    const cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
    const r = slot.rot * Math.PI / 180;
    const pts = [[slot.x, slot.y], [slot.x + slot.w, slot.y], [slot.x, slot.y + slot.h], [slot.x + slot.w, slot.y + slot.h]]
      .map(([x, y]) => {
        const dx = x - cx, dy = y - cy;
        return [cx + dx * Math.cos(r) - dy * Math.sin(r), cy + dx * Math.sin(r) + dy * Math.cos(r)];
      });
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }

  /* ---------- Декор-элементы ---------- */
  const DECOR_SHAPES = {
    line:     { name: "Линия",        svg: '<rect x="0" y="47" width="100" height="6" rx="3"/>' },
    dline:    { name: "Двойная линия", svg: '<rect x="0" y="34" width="100" height="5" rx="2"/><rect x="0" y="60" width="100" height="5" rx="2"/>' },
    dashline: { name: "Пунктир",      svg: '<rect x="0" y="46" width="18" height="7" rx="2"/><rect x="28" y="46" width="18" height="7" rx="2"/><rect x="56" y="46" width="18" height="7" rx="2"/><rect x="84" y="46" width="16" height="7" rx="2"/>' },
    rect:     { name: "Рамка",        svg: '<rect x="3" y="3" width="94" height="94" fill="none" stroke-width="5"/>' },
    circle:   { name: "Круг",         svg: '<circle cx="50" cy="50" r="46" fill="none" stroke-width="5"/>' },
    dotc:     { name: "Точка",        svg: '<circle cx="50" cy="50" r="28"/>' },
    ring2:    { name: "Двойной круг", svg: '<circle cx="50" cy="50" r="46" fill="none" stroke-width="5"/><circle cx="50" cy="50" r="34" fill="none" stroke-width="5"/>' },
    triangle: { name: "Треугольник",  svg: '<path d="M50 8 L94 90 L6 90 Z" fill="none" stroke-width="5"/>' },
    diamond:  { name: "Ромб",         svg: '<path d="M50 4 L96 50 L50 96 L4 50 Z" fill="none" stroke-width="5"/>' },
    heart:    { name: "Сердце",       svg: '<path d="M50 88 C10 60 4 34 22 20 C36 9 50 20 50 32 C50 20 64 9 78 20 C96 34 90 60 50 88 Z"/>' },
    star:     { name: "Звезда",       svg: '<path d="M50 4 L61 38 L97 38 L68 59 L79 94 L50 72 L21 94 L32 59 L3 38 L39 38 Z"/>' },
    corner:   { name: "Уголок",       svg: '<path d="M6 40 L6 6 L40 6" fill="none" stroke-width="8" stroke-linecap="round"/>' },
    corner2:  { name: "Двойной уголок", svg: '<path d="M4 42 L4 4 L42 4" fill="none" stroke-width="7" stroke-linecap="round"/><path d="M16 52 L16 16 L52 16" fill="none" stroke-width="5" stroke-linecap="round"/>' },
    tape:     { name: "Скотч",        svg: '<rect x="4" y="30" width="92" height="40" rx="2"/>' },
    leaf:     { name: "Лист",         svg: '<path d="M50 6 C84 30 88 68 50 94 C12 68 16 30 50 6 Z" fill="none" stroke-width="5"/>' },
    flourish: { name: "Завиток",      svg: '<path d="M6 60 C6 34 30 30 38 46 C44 58 34 68 24 62 C16 57 22 44 36 44 L64 44 C78 44 84 57 76 62 C66 68 56 58 62 46 C70 30 94 34 94 60" fill="none" stroke-width="5" stroke-linecap="round"/>' },
    sun:      { name: "Солнце",       svg: '<circle cx="50" cy="50" r="20" fill="none" stroke-width="5"/><g stroke-width="5" stroke-linecap="round"><line x1="50" y1="6" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="94"/><line x1="6" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="94" y2="50"/><line x1="19" y1="19" x2="29" y2="29"/><line x1="71" y1="71" x2="81" y2="81"/><line x1="19" y1="81" x2="29" y2="71"/><line x1="71" y1="29" x2="81" y2="19"/></g>' },
    wave:     { name: "Волна",        svg: '<path d="M4 50 C20 26 36 26 50 50 C64 74 80 74 96 50" fill="none" stroke-width="7" stroke-linecap="round"/>' },
    arch:     { name: "Арка",         svg: '<path d="M10 92 L10 50 C10 22 90 22 90 50 L90 92" fill="none" stroke-width="6"/>' },
    brackets: { name: "Скобки",       svg: '<path d="M36 8 L10 8 L10 92 L36 92 M64 8 L90 8 L90 92 L64 92" fill="none" stroke-width="7" stroke-linecap="round"/>' },
    badge:    { name: "Бирка",        svg: '<path d="M8 50 L30 26 L92 26 L92 74 L30 74 Z" fill="none" stroke-width="5"/>' },
    plus:     { name: "Крест",        svg: '<path d="M50 8 L50 92 M8 50 L92 50" fill="none" stroke-width="8" stroke-linecap="round"/>' },
    grid4:    { name: "Сетка точек",  svg: '<g><circle cx="20" cy="20" r="7"/><circle cx="50" cy="20" r="7"/><circle cx="80" cy="20" r="7"/><circle cx="20" cy="50" r="7"/><circle cx="50" cy="50" r="7"/><circle cx="80" cy="50" r="7"/><circle cx="20" cy="80" r="7"/><circle cx="50" cy="80" r="7"/><circle cx="80" cy="80" r="7"/></g>' },
  };
  const DECOR_FILL = { line: 1, dline: 1, dashline: 1, heart: 1, star: 1, tape: 1, dotc: 1, grid4: 1 };

  /* ---------- Перетаскивание / ресайз / вращение слота (мм) ---------- */
  function startSlotDrag(e, mode, slot) {
    e.preventDefault();
    e.stopPropagation();
    const f = fmt();
    const sx = e.clientX, sy = e.clientY;
    const o = { x: slot.x, y: slot.y, w: slot.w, h: slot.h, rot: slot.rot || 0 };
    let moved = false;

    // вращение: угол от центра элемента к курсору
    let startAngle = null;
    if (mode === "rotate") {
      const rect = $("#pbSpread").getBoundingClientRect();
      const cx = rect.left + (slot.x + slot.w / 2) * lastScale;
      const cy = rect.top + (slot.y + slot.h / 2) * lastScale;
      startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    }

    const onMove = (ev) => {
      const dx = (ev.clientX - sx) / lastScale;
      const dy = (ev.clientY - sy) / lastScale;
      moved = true;
      if (mode === "rotate") {
        const rect = $("#pbSpread").getBoundingClientRect();
        const cx = rect.left + (slot.x + slot.w / 2) * lastScale;
        const cy = rect.top + (slot.y + slot.h / 2) * lastScale;
        const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        let deg = o.rot + (a - startAngle) * 180 / Math.PI;
        deg = ((Math.round(deg) % 360) + 360) % 360;
        if (ev.shiftKey) deg = Math.round(deg / 15) * 15; // шаг 15° с Shift
        slot.rot = deg;
      } else if (mode === "move") {
        let nx = clampNum(o.x + dx, -f.bleed, spreadWmm() - 10);
        let ny = clampNum(o.y + dy, -f.bleed, f.pageH - 10);
        // магнит как в Figma: привязка к краям/центрам соседей и страниц
        const snap = findSnap(slot, nx, ny);
        nx = snap.x; ny = snap.y;
        slot.x = Math.round(nx); slot.y = Math.round(ny);
        snapGuides = snap.guides; snapBadges = snap.badges || [];
      } else {
        if (ev.shiftKey) {
          // Shift — пропорции сохраняются
          const w2 = clampNum(o.w + dx, 10, spreadWmm() - o.x);
          const ratio = o.h / o.w;
          slot.w = Math.round(w2);
          slot.h = Math.round(clampNum(w2 * ratio, 4, f.pageH - o.y));
        } else {
          slot.w = Math.round(clampNum(o.w + dx, 10, spreadWmm() - o.x));
          slot.h = Math.round(clampNum(o.h + dy, slot.type === "text" ? 4 : 8, f.pageH - o.y));
        }
      }
      renderCanvas();
      drawSnapGuides();
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      snapGuides = [];
      clearSnapGuides();
      if (moved) { suppressClick = true; renderSide(); save(); }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

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
      if (e.ctrlKey) { // Ctrl+колесо — масштаб холста
        e.preventDefault();
        zoomCanvas(e.deltaY < 0 ? 1.12 : 1 / 1.12);
        return;
      }
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
      // lastScale (px/мм) не зависит от ре-рендера, в отличие от getBoundingClientRect() оторванного div
      const mmPerPx = 1 / lastScale;
      const dxMm = (e.clientX - sx) * mmPerPx, dyMm = (e.clientY - sy) * mmPerPx;
      const oldOff = imageOffset({ ...slot, crop: c0 }, mi);
      // смещение картинки = старое + сдвиг мыши; ox/oy в [0..1] с запасом ±12%
      const spanX = Math.max(0, oldOff.wMm - slot.w) + slot.w * 0.12;
      const spanY = Math.max(0, oldOff.hMm - slot.h) + slot.h * 0.12;
      const wantX = oldOff.x + dxMm, wantY = oldOff.y + dyMm;
      slot.crop.ox = clamp01((wantX / spanX + 1) / 2);
      slot.crop.oy = clamp01((wantY / spanY + 1) / 2);
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

    // --- Обложка ---
    const cvr = state.cover;
    if (cvr) {
      const cwrap = document.createElement("div");
      cwrap.className = "pb-thumb-wrap" + (editingCover ? " active" : "");
      const cth = document.createElement("div");
      cth.className = "pb-thumb";
      cth.title = "Обложка: задняя + корешок + передняя";
      cth.style.width = "140px";
      const f0 = fmt();
      const totalMm = f0.pageW * 2 + cvr.spineW;
      [f0.pageW, cvr.spineW, f0.pageW].forEach((wMm, k) => {
        const zone = document.createElement("div");
        zone.className = "pb-thumb-page";
        zone.style.flex = "none";
        zone.style.width = Math.max(2, wMm / totalMm * 134) + "px";
        if (k === 1) zone.style.background = "var(--pb-accent)";
        else if (cvr.slots.some(x => x.type === "image" && x.img)) zone.style.background = "linear-gradient(135deg,#9aa6b5,#c3ccd8)";
        cth.appendChild(zone);
      });
      const cnum = document.createElement("span");
      cnum.className = "pb-thumb-num";
      cnum.textContent = "Обл.";
      cth.appendChild(cnum);
      cth.addEventListener("click", () => { editingCover = true; selectedSlot = null; renderApp(); });
      cwrap.appendChild(cth);
      const ccap = document.createElement("div");
      ccap.className = "pb-thumb-caption title";
      ccap.textContent = "Обложка + корешок";
      cwrap.appendChild(ccap);
      strip.appendChild(cwrap);
      const sep = document.createElement("div");
      sep.className = "pb-strip-sep";
      strip.appendChild(sep);
    }

    state.spreads.forEach((sp, i) => {
      const f = fmt();
      const wrap = document.createElement("div");
      wrap.className = "pb-thumb-wrap" + (i === current ? " active" : "");
      const th = document.createElement("div");
      th.className = "pb-thumb";
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
          s.className = "pb-thumb-slot" + (slot.type === "text" ? " txt" : "") + (slot.type === "decor" ? " dec" : "");
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

      th.addEventListener("click", () => { editingCover = false; current = i; selectedSlot = null; renderApp(); });
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
      wrap.appendChild(th);
      const cap = document.createElement("div");
      cap.className = "pb-thumb-caption" + (i === 0 ? " title" : "");
      cap.textContent = i === 0 ? "Титульный лист" : `стр. ${i * 2 + 1}–${i * 2 + 2}`;
      wrap.appendChild(cap);
      strip.appendChild(wrap);
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
    const sp = activeSpread();
    const layouts = layoutsFor(fmt());
    const p = palette();
    const sel = selectedSlot != null ? sp.slots[selectedSlot] : null;

    side.innerHTML = `
      <div class="pb-section">
        <h4>Элементы страницы</h4>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn" id="pbAddFrame">▭ Рамка</button>
          <button class="btn" id="pbAddText">T Текст</button>
          <button class="btn" id="pbAddDecor">✦ Декор</button>
          <button class="btn" id="pbFillBook" title="Разложить фото из галереи по страницам">⇉ Разложить</button>
        </div>
        <h4 style="margin-top:14px">Библиотека декора</h4>
        <div class="pb-decor-lib" id="pbDecorLib">
          ${Object.entries(DECOR_SHAPES).map(([k, v]) => `
            <div class="pb-decor-item" draggable="true" data-libshape="${k}" title="${v.name} — кликните или перетащите на холст">
              <svg viewBox="0 0 100 100" width="30" height="30">${v.svg}</svg>
            </div>`).join("")}
        </div>
        <h4 style="margin-top:14px">Наборы дизайна</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <button class="btn" data-decorset="classic" title="Уголки и разделитель корешка">Классика</button>
          <button class="btn" data-decorset="romantic" title="Сердце и линии">Романтика</button>
          <button class="btn" data-decorset="minimal" title="Строгие линии">Минимал</button>
          <button class="btn" data-decorset="celebration" title="Звёзды и скотч">Праздник</button>
          <button class="btn" data-decorset="washi" title="Скотч и круги" style="grid-column:1/-1">Ваши-Скотчи (Washi)</button>
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
          <button class="btn" data-slotact="dup" title="Дублировать">⧉</button>
          <button class="btn" data-slotact="del" title="Удалить">🗑</button>
          <button class="btn" data-slotact="up" title="На слой выше">▲</button>
          <button class="btn" data-slotact="down" title="На слой ниже">▼</button>
          <button class="btn" data-slotact="rot0" title="Выровнять угол (0°)">↺</button>
        </div>` : `<p style="font-size:.8rem;color:var(--color-muted);margin-top:10px">Кликните по элементу на холсте, чтобы настроить его положение и размер. Рамку можно перетаскивать за верхнюю полоску ⠿ и растягивать за уголок.</p>`}
      </div>

      ${editingCover ? `
      <div class="pb-section">
        <h4>Обложка и корешок</h4>
        <div class="pb-slider-row">
          <span>Корешок, мм</span>
          <input type="range" min="5" max="40" step="1" value="${state.cover.spineW}" id="pbSpineW">
          <b style="min-width:26px;text-align:right">${state.cover.spineW}</b>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--color-muted);margin-top:8px">
          <input type="checkbox" id="pbAutoSpine" ${state.cover.autoSpine ? "checked" : ""}>
          Рассчитывать по числу страниц
        </label>
        <div class="pb-slider-row" style="margin-top:8px">
          <span>Фон обложки</span>
          <input type="color" class="pb-color-input" id="pbCoverBg" value="${state.cover.bg || palette().background}">
        </div>
        <p style="font-size:.75rem;color:var(--color-muted);margin:10px 0 0">
          Слева — задняя обложка, в центре — корешок, справа — передняя с заголовком.
        </p>
      </div>` : `
      <div class="pb-section">
        <h4>Сетка страницы</h4>
        <div class="pb-layout-grid">
          ${Object.entries(layouts).map(([k, L]) =>
            `<button class="pb-layout-btn ${sp.layout === k ? "active" : ""}" data-layout="${k}" title="${L.name}">${LAYOUT_ICON(k)}</button>`).join("")}
        </div>
      </div>`}

      <div class="pb-section">
        <h4>Слои (сверху — верхний)</h4>
        <div class="pb-layers">
          ${[...sp.slots].reverse().map((sl) => {
            const idx = sp.slots.indexOf(sl);
            const ic = sl.type === "image" ? "▭" : sl.type === "text" ? "𝐓" : "✦";
            const name = sl.type === "image" ? (sl.img ? "Фото" : "Рамка") : sl.type === "text" ? (sl.text.replace(/<[^>]+>/g, "").slice(0, 18) || "Текст") : "Декор: " + (DECOR_SHAPES[sl.shape] || {}).name;
            return `<div class="pb-layer ${selectedSlot === idx ? "active" : ""}" data-layer="${idx}">
              <span style="width:16px;display:inline-flex;justify-content:center">${ic}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
              ${sl.rot ? `<em style="font-size:.7rem;color:var(--color-muted)">${sl.rot}°</em>` : ""}
            </div>`;
          }).join("")}
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
          ⬆<br>
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
          <button class="btn" data-act="rotate" title="Повернуть на 90°">⟳ 90°</button>
          <button class="btn" data-act="replace" title="Заменить фото">⇄</button>
          <button class="btn" data-act="remove" title="Убрать фото">✕</button>
          <button class="btn" data-act="fill" title="Заполнить слот (сброс кропа)">⤢</button>
        </div>
        <div class="pb-slider-row"><span>Zoom</span><input type="range" min="1" max="4" step="0.05" value="${sel.crop.zoom}" data-knob="zoom"></div>
        <div class="pb-slider-row"><span>DPI: <b id="pbDpiVal">${dpiLabel(sel)}</b></span></div>
      </div>` : ""}

      ${sel && sel.type === "decor" ? `
      <div class="pb-section" id="pbDecorPanel">
        <h4>Декор-элемент</h4>
        <select class="pb-select" data-dknob="shape" style="width:100%">
          ${Object.entries(DECOR_SHAPES).map(([k, v]) => `<option value="${k}" ${sel.shape === k ? "selected" : ""}>${v.name}</option>`).join("")}
        </select>
        <div class="pb-slider-row" style="margin-top:10px">
          <span>Цвет</span>
          <input type="color" class="pb-color-input" data-dknob="color" value="${sel.color || palette().accent}">
        </div>
        <div class="pb-slider-row">
          <span>Угол, °</span>
          <input type="range" min="0" max="345" step="15" value="${sel.rot || 0}" data-dknob="rot">
          <b style="min-width:30px;text-align:right">${sel.rot || 0}</b>
        </div>
      </div>` : ""}

      ${sel && sel.type === "text" ? `
      <div class="pb-section pb-text-controls" id="pbTextPanel">
        <h4>Типографика</h4>
        <select class="pb-select" data-knob="font" style="width:100%">
          ${FONTS.map(f => `<option value="${f.id}" ${sel.font === f.id ? "selected" : ""}>${f.label}</option>`).join("")}
        </select>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn" data-knob="align" data-v="left" title="По левому краю">⯇</button>
          <button class="btn" data-knob="align" data-v="center" title="По центру">≡</button>
          <button class="btn" data-knob="align" data-v="right" title="По правому краю">⯈</button>
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

    // Слои: выбор по клику
    $$(".pb-layer", side).forEach(l => l.addEventListener("click", () => {
      selectedSlot = +l.dataset.layer;
      renderCanvas(); renderSide();
    }));

    // Обложка: корешок
    const spine = $("#pbSpineW", side);
    if (spine) {
      spine.addEventListener("input", () => {
        state.cover.spineW = +spine.value;
        state.cover.autoSpine = false;
        spine.parentElement.querySelector("b").textContent = spine.value;
        renderCanvas(); renderFilmstrip(); save();
      });
      $("#pbAutoSpine", side).addEventListener("change", (e) => {
        state.cover.autoSpine = e.target.checked;
        if (state.cover.autoSpine) { recalcSpine(); renderApp(); save(); }
      });
      $("#pbCoverBg", side).addEventListener("input", (e) => {
        state.cover.bg = e.target.value;
        renderCanvas(); save();
      });
    }

    // Добавление элементов
    $("#pbAddFrame")?.addEventListener("click", () => addSlot("image"));
    $("#pbAddText")?.addEventListener("click", () => addSlot("text"));
    $("#pbAddDecor")?.addEventListener("click", () => addSlot("decor"));
    $$(".pb-decor-item", side).forEach((it) => {
      const shape = it.dataset.libshape;
      it.addEventListener("click", () => {
        const f = fmt();
        const sp = activeSpread();
        const n = sp.slots.length;
        sp.slots.push({
          slotId: "dec_" + Date.now() % 100000 + n, type: "decor", shape,
          x: Math.round(spreadWmm() / 2 - 30), y: Math.round(f.pageH / 2 - 15),
          w: shape === "line" || shape === "dline" || shape === "dashline" || shape === "wave" ? 60 : 30,
          h: shape === "line" || shape === "dline" || shape === "dashline" ? 6 : 30,
          rot: 0, color: palette().accent,
        });
        selectedSlot = sp.slots.length - 1;
        renderApp(); save();
      });
      it.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/pbshape", shape));
    });
    $$("[data-decorset]", side).forEach(b => b.addEventListener("click", () => addDecorSet(b.dataset.decorset)));

    // Панель декора
    const dp = $("#pbDecorPanel", side);
    if (dp) {
      const ds = sp.slots[selectedSlot];
      $$("[data-dknob]", dp).forEach(el => el.addEventListener("input", () => {
        const k = el.dataset.dknob;
        if (k === "shape") ds.shape = el.value;
        if (k === "color") ds.color = el.value;
        if (k === "rot") { ds.rot = +el.value; el.parentElement.querySelector("b").textContent = el.value; }
        renderCanvas(); save();
      }));
    }
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
      if (["up", "down", "rot0"].includes(b.dataset.slotact)) {
        const idx = selectedSlot;
        if (b.dataset.slotact === "up" && idx < sp.slots.length - 1) {
          [sp.slots[idx], sp.slots[idx + 1]] = [sp.slots[idx + 1], sp.slots[idx]];
          selectedSlot = idx + 1;
        } else if (b.dataset.slotact === "down" && idx > 0) {
          [sp.slots[idx], sp.slots[idx - 1]] = [sp.slots[idx - 1], sp.slots[idx]];
          selectedSlot = idx - 1;
        } else if (b.dataset.slotact === "rot0") {
          sp.slots[idx].rot = 0;
        }
      } else if (b.dataset.slotact === "dup") {
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
    const sp = activeSpread();
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
    } else if (type === "decor") {
      Object.assign(base, { shape: "line", color: palette().accent, rot: 0, w: 60, h: 6 });
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

  /* ---------- Наборы дизайна (декор-композиции) ---------- */
  function addDecorSet(kind) {
    const f = fmt();
    const sp = activeSpread();
    const W = spreadWmm(), H = f.pageH;
    const p = palette();
    const mk = (shape, x, y, w, h, rot = 0, color = null) => {
      sp.slots.push({ slotId: "dec_" + Date.now() % 100000 + sp.slots.length, type: "decor", shape, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), rot, color: color || p.accent });
    };
    if (kind === "classic") {
      // классика: рамки-уголки + разделитель по центру корешка
      mk("corner", 12, 12, 24, 24); mk("corner", W - 36, H - 36, 24, 24, 180);
      mk("line", f.pageW + 20, H / 2 - 2, 40, 4);
    } else if (kind === "romantic") {
      mk("heart", f.pageW * 0.45, H * 0.06, 20, 20);
      mk("line", 30, H * 0.12, W - 60, 3);
      mk("line", 30, H * 0.9, W - 60, 3);
      mk("circle", W - 60, 20, 34, 34, 0, "transparent" === "x" ? null : null);
    } else if (kind === "minimal") {
      mk("line", 30, 24, 90, 2);
      mk("line", W - 120, H - 26, 90, 2);
      mk("rect", f.pageW + 14, H / 2 - 26, 52, 52, 0);
    } else if (kind === "celebration") {
      mk("star", f.pageW * 0.2, H * 0.15, 18, 18);
      mk("star", f.pageW * 0.75, H * 0.2, 12, 12, 15);
      mk("star", W - f.pageW * 0.3, H * 0.75, 15, 15);
      mk("tape", f.pageW * 0.35, H * 0.08, 46, 20, -6);
    } else if (kind === "washi") {
      mk("tape", 24, 18, 50, 22, -8);
      mk("tape", W - 80, H - 44, 50, 22, 7);
      mk("circle", f.pageW + 22, H / 2 - 17, 34, 34);
    }
    selectedSlot = null;
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
    const pageWmm = spread ? (opts.cover ? f.pageW * 2 + opts.spineW : f.pageW * 2) : f.pageW;
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
        let x = slot.x - offsetX + B, y = slot.y + B;
        if (x + slot.w < B - 0.1 || x > Wmm - B + 0.1) return;
        // поддержка вращения: поворот вокруг центра слота
        let rotRestore = null;
        if (slot.rot) {
          rotRestore = true;
          const cx = x + slot.w / 2, cy = y + slot.h / 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(slot.rot * Math.PI / 180);
          ctx.translate(-cx, -cy);
        }
        if (slot.type === "decor") {
          const di = decorImage(slot);
          if (slot.shape === "tape") ctx.globalAlpha = 0.75;
          if (di && di.ready) ctx.drawImage(di.img, x, y, slot.w, slot.h);
          else ctx.fillRect(x, y, slot.w, slot.h); // пока SVG не готов
          ctx.globalAlpha = 1;
          if (rotRestore) ctx.restore();
          return;
        }
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
          // контекст масштабирован в мм, поэтому размер в px = размер в мм
          ctx.font = `${slot.italic ? "italic " : ""}${slot.bold ? 600 : 400} ${slot.size}px ${fontCss(slot.font)}`;
          ctx.textAlign = slot.align === "center" ? "center" : slot.align === "right" ? "right" : "left";
          ctx.textBaseline = "top";
          try { ctx.letterSpacing = slot.spacing + "em"; } catch {}
          const tx = slot.align === "center" ? x + slot.w / 2 : slot.align === "right" ? x + slot.w : x;
          const lines = (slot.text || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").split("\n");
          let ty = y;
          lines.forEach((line) => {
            const l = slot.uppercase ? line.toUpperCase() : line;
            ctx.fillText(l, tx, ty);
            ty += slot.size * 1.25; // межстрочный интервал в мм
          });
          ctx.restore();
        }
        if (rotRestore) ctx.restore();
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
    // декор: прогреваем SVG-кэш
    const warms = new Set();
    state.cover?.slots.forEach(warmDecor);
    state.spreads.forEach((sp) => sp.slots.forEach(warmDecor));
    function warmDecor(sl) {
      if (sl.type !== "decor") return;
      const di = decorImage(sl);
      if (!di.ready && !warms.has(di)) {
        warms.add(di);
        jobs.push(new Promise((res) => {
          if (di.ready) return res();
          di.img.addEventListener("load", res, { once: true });
          di.img.addEventListener("error", res, { once: true });
          setTimeout(res, 3000);
        }));
      }
    }
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
        cover: state.cover ? {
          spineW: state.cover.spineW,
          autoSpine: !!state.cover.autoSpine,
          background: state.cover.bg || null,
          elements: state.cover.slots.map(s => s.type === "image"
            ? { type: "image", slotId: s.slotId, x: s.x, y: s.y, w: s.w, h: s.h, src: (mediaOf(s) || {}).name || null, crop: { ...s.crop } }
            : { type: "text", slotId: s.slotId, x: s.x, y: s.y, w: s.w, h: s.h, text: (s.text || "").replace(/<[^>]+>/g, ""), font: s.font, size: s.size, align: s.align }),
        } : null,
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
      if (state.cover) {
        const cc = drawToCanvas(state.cover, { spread: true, cover: true, spineW: state.cover.spineW, bleed: true, dpi: 300 });
        const cb = await new Promise((r) => cc.toBlob(r, "image/jpeg", 0.95));
        zip.file("cover_300dpi.jpg", cb);
      }
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
      if (state.cover) {
        const cw = f.pageW * 2 + state.cover.spineW + f.bleed * 2;
        const cc = drawToCanvas(state.cover, { spread: true, cover: true, spineW: state.cover.spineW, bleed: true, dpi: 300 });
        pdf.addPage([cw, f.pageH + f.bleed * 2]);
        pdf.addImage(cc.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, cw, f.pageH + f.bleed * 2);
      }
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
      if (state.cover) {
        const cw = f.pageW * 2 + state.cover.spineW;
        const cc = drawToCanvas(state.cover, { spread: true, cover: true, spineW: state.cover.spineW, bleed: false, dpi: 96 });
        pdf.addPage([cw, f.pageH]);
        pdf.addImage(cc.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, cw, f.pageH);
      }
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
      pushHistory();
    }, 400);
  }

  /* ---------- Контекстное меню (ПКМ) ---------- */
  function closeContextMenu() {
    const m = $("#pbContextMenu");
    if (m) { m.remove(); }
  }

  const CM_ICONS = { "ph-swap": "⇄", "ph-arrow-clockwise": "⟳", "ph-frame-corners": "⤢", "ph-copy": "⧉", "ph-arrow-up": "▲", "ph-arrow-down": "▼", "ph-undo": "↺", "ph-trash": "🗑" };

  function openContextMenu(x, y, slotIdx) {
    closeContextMenu();
    selectedSlot = slotIdx;
    const sp = activeSpread();
    const slot = sp.slots[slotIdx];
    if (!slot) return;
    renderSide(); updateHandles();

    const items = [];
    if (slot.type === "image") {
      items.push({ icon: "ph-swap", label: "Заменить фото", fn: () => pickFile((mi) => { slot.img = mi.id; renderApp(); save(); }) });
      items.push({ icon: "ph-arrow-clockwise", label: "Повернуть фото 90°", fn: () => { slot.crop.rot = ((slot.crop.rot || 0) + 1) % 4; renderApp(); save(); } });
      items.push({ icon: "ph-frame-corners", label: "Сбросить кроп", fn: () => { slot.crop = { zoom: 1, ox: 0.5, oy: 0.5, rot: slot.crop.rot }; renderApp(); save(); } });
      items.push({ sep: 1 });
    }
    if (slot.type === "text" || slot.type === "decor") {
      items.push({ icon: "ph-arrow-clockwise", label: "Повернуть на 15°", fn: () => { slot.rot = ((slot.rot || 0) + 15) % 360; renderApp(); save(); } });
      items.push({ sep: 1 });
    }
    items.push({ icon: "ph-copy", label: "Дублировать (Ctrl+D)", fn: () => {
      const copy = JSON.parse(JSON.stringify(slot));
      copy.slotId += "_c" + Date.now() % 1000;
      sp.slots.splice(slotIdx + 1, 0, copy);
      selectedSlot = slotIdx + 1;
      renderApp(); save();
    } });
    items.push({ icon: "ph-arrow-up", label: "Слой выше", fn: () => { moveLayer(slotIdx, 1); } });
    items.push({ icon: "ph-arrow-down", label: "Слой ниже", fn: () => { moveLayer(slotIdx, -1); } });
    items.push({ sep: 1 });
    items.push({ icon: "ph-undo", label: "Отменить (Ctrl+Z)", fn: undo });
    items.push({ icon: "ph-trash", label: "Удалить (Del)", danger: 1, fn: () => {
      sp.slots.splice(slotIdx, 1);
      selectedSlot = null;
      renderApp(); save();
    } });

    const m = document.createElement("div");
    m.id = "pbContextMenu";
    m.className = "pb-contextmenu";
    items.forEach((it) => {
      if (it.sep) { const hr = document.createElement("div"); hr.className = "pb-cm-sep"; m.appendChild(hr); return; }
      const b = document.createElement("button");
      b.className = "pb-cm-item" + (it.danger ? " danger" : "");
      b.innerHTML = `${CM_ICONS[it.icon] || ""} ${it.label}`;
      b.addEventListener("click", () => { closeContextMenu(); it.fn(); });
      m.appendChild(b);
    });
    document.body.appendChild(m);
    const mw = m.offsetWidth, mh = m.offsetHeight;
    m.style.left = Math.min(x, window.innerWidth - mw - 8) + "px";
    m.style.top = Math.min(y, window.innerHeight - mh - 8) + "px";
    setTimeout(() => {
      document.addEventListener("mousedown", onDocDown);
    }, 0);
    function onDocDown(e) {
      if (!m.contains(e.target)) { closeContextMenu(); document.removeEventListener("mousedown", onDocDown); }
    }
  }

  function moveLayer(idx, dir) {
    const sp = activeSpread();
    const to = idx + dir;
    if (to < 0 || to >= sp.slots.length) return;
    [sp.slots[idx], sp.slots[to]] = [sp.slots[to], sp.slots[idx]];
    selectedSlot = to;
    renderApp(); save();
  }

  /* ---------- История (Ctrl+Z / Ctrl+Y) ---------- */
  let hist = [], histIdx = -1;
  function pushHistory() {
    const snap = JSON.stringify(state);
    if (hist[histIdx] === snap) return;
    hist = hist.slice(0, histIdx + 1);
    hist.push(snap);
    if (hist.length > 60) hist.shift();
    histIdx = hist.length - 1;
  }
  function undo() {
    if (histIdx <= 0) return showToast("Отменять нечего");
    histIdx--;
    restoreSnapshot(hist[histIdx]);
    showToast("Отменено (Ctrl+Z)");
  }
  function redo() {
    if (histIdx >= hist.length - 1) return showToast("Повторять нечего");
    histIdx++;
    restoreSnapshot(hist[histIdx]);
    showToast("Возвращено (Ctrl+Y)");
  }
  function restoreSnapshot(snap) {
    state = JSON.parse(snap);
    if (!state.cover) state.cover = makeCover(state.format);
    current = Math.min(current, state.spreads.length - 1);
    selectedSlot = null;
    closeContextMenu();
    renderApp();
    try { localStorage.setItem(LS_KEY, JSON.stringify({ state, media: media.map(({ _el, ...m }) => m) })); } catch (e) {}
  }

  function restore() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.state || !data.state.spreads) return false;
      state = data.state;
      if (!state.cover) { state.cover = makeCover(state.format); state.cover.autoSpine = false; }
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
    editingCover = false;
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
    $("#pbZoomPct").addEventListener("click", () => { zoom = 3.78; renderCanvas(); }); // 96dpi = 100%
    $("#pbUndoBtn").addEventListener("click", undo);
    $("#pbRedoBtn").addEventListener("click", redo);
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

    // Ctrl + колесо — масштаб холста в любом месте рабочей области
    const area = $("#pbCanvasArea");
    area.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      zoomCanvas(e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
      if (!$("#pbApp").classList.contains("active")) return;
      const meta = e.ctrlKey || e.metaKey;
      const code = e.code || ""; // физическая клавиша — работает и на русской раскладке
      // перехватываем раньше contenteditable/input, чтобы Ctrl+Z/D/Y работали всегда
      if (meta && code === "KeyZ") { e.preventDefault(); e.stopPropagation(); e.shiftKey ? redo() : undo(); return; }
      if (meta && code === "KeyY") { e.preventDefault(); e.stopPropagation(); redo(); return; }
      if (meta && code === "KeyD" && selectedSlot != null) {
        e.preventDefault(); e.stopPropagation();
        const sp = activeSpread();
        const copy = JSON.parse(JSON.stringify(sp.slots[selectedSlot]));
        copy.slotId += "_k" + Date.now() % 1000;
        sp.slots.splice(selectedSlot + 1, 0, copy);
        selectedSlot++;
        renderApp(); save();
        return;
      }
      if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (meta && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if (meta && e.key.toLowerCase() === "d" && selectedSlot != null) {
        e.preventDefault();
        const sp = activeSpread();
        const copy = JSON.parse(JSON.stringify(sp.slots[selectedSlot]));
        copy.slotId += "_k" + Date.now() % 1000;
        sp.slots.splice(selectedSlot + 1, 0, copy);
        selectedSlot++;
        renderApp(); save();
        return;
      }
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
        activeSpread().slots.splice(selectedSlot, 1);
        selectedSlot = null;
        renderApp(); save();
      }
      if (e.key === "Escape") { closeContextMenu(); selectedSlot = null; renderCanvas(); renderSide(); }
    }, true);
  }

  function zoomCanvas(factor) {
    const base = zoom > 0 ? zoom : fitScaleNow();
    zoom = Math.min(12, Math.max(0.2, base * factor));
    renderCanvas();
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
