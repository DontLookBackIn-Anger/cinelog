/**
 * 影迹 · CineLog — Main Application Logic
 * Features:
 * - Categorized shelves (电影 / 电视剧 / 动漫 / 综艺)
 * - Fluid horizontal sliding UI (drag-to-scroll with momentum, smooth arrows, edge fades, grid toggle)
 * - Posters (URL, local image upload with Canvas compression, artistic SVG poster generator + fallback)
 * - Full CRUD, search, status filter, localStorage persistence, JSON import/export
 */
(function () {
  const STORAGE_KEY = "cinelog_media_items_v1";
  const STORAGE_NOTES_KEY = "cinelog_notes_v1";
  const STORAGE_UPDATED_KEY = "cinelog_local_updated_at_v1";

  const STATUS_META = {
    watched:  { label: "已看", className: "status-watched" },
    watching: { label: "在看", className: "status-watching" },
    wishlist: { label: "想看", className: "status-wishlist" },
  };

  // Application State
  const state = {
    items: [],
    notes: [],
    noteTypeFilter: "all",
    currentNoteDetailId: null,
    localUpdatedAt: 0,
    syncConfig: null,
    syncState: "idle", // "idle" | "syncing" | "synced" | "error"
    syncPushTimer: null,
    activeCategory: "all",
    statusFilter: "all",
    searchQuery: "",
    gridModes: {}, // { movie: false, tv: false, ... }
    heroIndex: 0,
    currentDetailId: null,
    formTempPosterDataUrl: "",
    formPaletteKey: "",
  };

  // DOM References
  const dom = {
    shelvesContainer: document.getElementById("shelvesContainer"),
    globalEmptyState: document.getElementById("globalEmptyState"),
    navPills: document.getElementById("navPills"),
    brandHome: document.getElementById("brandHome"),
    searchInput: document.getElementById("searchInput"),
    searchClear: document.getElementById("searchClear"),
    statusFilterPills: document.getElementById("statusFilterPills"),
    btnResetFilters: document.getElementById("btnResetFilters"),

    // Hero
    heroBackdrop: document.getElementById("heroBackdrop"),
    heroBadge: document.getElementById("heroBadge"),
    heroTitle: document.getElementById("heroTitle"),
    heroMeta: document.getElementById("heroMeta"),
    heroReview: document.getElementById("heroReview"),
    heroPosterImg: document.getElementById("heroPosterImg"),
    heroPosterWrap: document.getElementById("heroPosterWrap"),
    heroDetailBtn: document.getElementById("heroDetailBtn"),
    heroNextBtn: document.getElementById("heroNextBtn"),

    // Stats
    statTotal: document.getElementById("statTotal"),
    statWatched: document.getElementById("statWatched"),
    statAvg: document.getElementById("statAvg"),
    btnAutoFillPosters: document.getElementById("btnAutoFillPosters"),

    // Toolbar Actions
    btnOnlineSearch: document.getElementById("btnOnlineSearch"),
    btnAddNew: document.getElementById("btnAddNew"),
    btnExport: document.getElementById("btnExport"),
    btnImport: document.getElementById("btnImport"),
    importFileInput: document.getElementById("importFileInput"),
    btnSyncStatus: document.getElementById("btnSyncStatus"),
    syncStatusText: document.getElementById("syncStatusText"),

    // Notes Section & Modals
    notesCount: document.getElementById("notesCount"),
    notesFilterTabs: document.getElementById("notesFilterTabs"),
    notesGrid: document.getElementById("notesGrid"),
    notesEmptyState: document.getElementById("notesEmptyState"),
    btnAddNote: document.getElementById("btnAddNote"),
    btnWriteNoteFromDetail: document.getElementById("btnWriteNoteFromDetail"),

    noteDetailModal: document.getElementById("noteDetailModal"),
    noteDetailClose: document.getElementById("noteDetailClose"),
    noteDetailMeta: document.getElementById("noteDetailMeta"),
    noteDetailTitle: document.getElementById("noteDetailTitle"),
    noteDetailLinked: document.getElementById("noteDetailLinked"),
    noteDetailTags: document.getElementById("noteDetailTags"),
    noteDetailContent: document.getElementById("noteDetailContent"),
    btnEditNoteFromDetail: document.getElementById("btnEditNoteFromDetail"),
    btnDeleteNoteFromDetail: document.getElementById("btnDeleteNoteFromDetail"),

    noteFormModal: document.getElementById("noteFormModal"),
    noteFormModalTitle: document.getElementById("noteFormModalTitle"),
    noteFormClose: document.getElementById("noteFormClose"),
    btnCancelNoteForm: document.getElementById("btnCancelNoteForm"),
    noteForm: document.getElementById("noteForm"),
    noteFieldId: document.getElementById("noteFieldId"),
    noteFieldTitle: document.getElementById("noteFieldTitle"),
    noteFieldType: document.getElementById("noteFieldType"),
    noteFieldMediaId: document.getElementById("noteFieldMediaId"),
    noteFieldDate: document.getElementById("noteFieldDate"),
    noteFieldTags: document.getElementById("noteFieldTags"),
    noteFieldContent: document.getElementById("noteFieldContent"),
    noteCharCount: document.getElementById("noteCharCount"),

    // Online Search Modal & Inline Search
    onlineSearchModal: document.getElementById("onlineSearchModal"),
    onlineSearchClose: document.getElementById("onlineSearchClose"),
    onlineSearchCategory: document.getElementById("onlineSearchCategory"),
    onlineSearchInput: document.getElementById("onlineSearchInput"),
    btnRunOnlineSearch: document.getElementById("btnRunOnlineSearch"),
    tmdbKeyInput: document.getElementById("tmdbKeyInput"),
    btnSaveTmdbKey: document.getElementById("btnSaveTmdbKey"),
    onlineSearchStatus: document.getElementById("onlineSearchStatus"),
    onlineResultsGrid: document.getElementById("onlineResultsGrid"),

    formOnlineQuery: document.getElementById("formOnlineQuery"),
    btnFormOnlineSearch: document.getElementById("btnFormOnlineSearch"),
    formOnlineStatus: document.getElementById("formOnlineStatus"),
    formOnlineResults: document.getElementById("formOnlineResults"),

    // Sync Modal
    syncModal: document.getElementById("syncModal"),
    syncClose: document.getElementById("syncClose"),
    syncLastTime: document.getElementById("syncLastTime"),
    syncProviderTabs: document.getElementById("syncProviderTabs"),
    panelGist: document.getElementById("panelGist"),
    panelSupabase: document.getElementById("panelSupabase"),
    panelNone: document.getElementById("panelNone"),
    syncGistToken: document.getElementById("syncGistToken"),
    syncGistId: document.getElementById("syncGistId"),
    syncSupabaseUrl: document.getElementById("syncSupabaseUrl"),
    syncSupabaseKey: document.getElementById("syncSupabaseKey"),
    syncSupabaseRowId: document.getElementById("syncSupabaseRowId"),
    syncAutoToggle: document.getElementById("syncAutoToggle"),
    syncAutoRow: document.getElementById("syncAutoRow"),
    btnCopySql: document.getElementById("btnCopySql"),
    btnSaveAndSync: document.getElementById("btnSaveAndSync"),
    btnManualPull: document.getElementById("btnManualPull"),
    btnManualPush: document.getElementById("btnManualPush"),
    syncShareCodeInput: document.getElementById("syncShareCodeInput"),
    btnApplyShareCode: document.getElementById("btnApplyShareCode"),
    btnCopyShareCode: document.getElementById("btnCopyShareCode"),

    // Detail Modal
    detailModal: document.getElementById("detailModal"),
    detailClose: document.getElementById("detailClose"),
    detailBackdrop: document.getElementById("detailBackdrop"),
    detailPosterImg: document.getElementById("detailPosterImg"),
    detailBadges: document.getElementById("detailBadges"),
    detailTitle: document.getElementById("detailTitle"),
    detailSubtitle: document.getElementById("detailSubtitle"),
    detailStars: document.getElementById("detailStars"),
    detailScore: document.getElementById("detailScore"),
    detailDate: document.getElementById("detailDate"),
    detailTags: document.getElementById("detailTags"),
    detailReview: document.getElementById("detailReview"),
    btnEditFromDetail: document.getElementById("btnEditFromDetail"),
    btnDeleteFromDetail: document.getElementById("btnDeleteFromDetail"),

    // Form Modal
    formModal: document.getElementById("formModal"),
    formModalTitle: document.getElementById("formModalTitle"),
    formClose: document.getElementById("formClose"),
    btnCancelForm: document.getElementById("btnCancelForm"),
    mediaForm: document.getElementById("mediaForm"),
    fieldId: document.getElementById("fieldId"),
    fieldCategory: document.getElementById("fieldCategory"),
    fieldStatus: document.getElementById("fieldStatus"),
    fieldTitle: document.getElementById("fieldTitle"),
    fieldOriginalTitle: document.getElementById("fieldOriginalTitle"),
    fieldYear: document.getElementById("fieldYear"),
    fieldRating: document.getElementById("fieldRating"),
    fieldDate: document.getElementById("fieldDate"),
    fieldTags: document.getElementById("fieldTags"),
    fieldReview: document.getElementById("fieldReview"),
    fieldPosterUrl: document.getElementById("fieldPosterUrl"),
    posterFileInput: document.getElementById("posterFileInput"),
    formPosterPreview: document.getElementById("formPosterPreview"),
    btnGenPoster: document.getElementById("btnGenPoster"),
    starPicker: document.getElementById("starPicker"),
    starPickerVal: document.getElementById("starPickerVal"),

    toastContainer: document.getElementById("toastContainer"),
  };

  // ================= STORAGE & HELPERS =================
  function loadItems() {
    try {
      const ts = Number(localStorage.getItem(STORAGE_UPDATED_KEY) || 0);
      state.localUpdatedAt = Number.isFinite(ts) ? ts : 0;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to read localStorage:", e);
    }
    return JSON.parse(JSON.stringify(window.CineData.INITIAL_ITEMS));
  }

  function loadNotes() {
    try {
      const raw = localStorage.getItem(STORAGE_NOTES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed to read notes:", e);
    }
    return JSON.parse(JSON.stringify(window.CineData.INITIAL_NOTES || []));
  }

  function saveItems(options = {}) {
    const { skipCloudPush = false, updatedAt = Date.now() } = options;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(state.notes));
      state.localUpdatedAt = updatedAt;
      localStorage.setItem(STORAGE_UPDATED_KEY, String(updatedAt));
    } catch (e) {
      showToast("本地存储空间不足，建议导出 JSON 备份或压缩海报图片");
    }
    if (!skipCloudPush) {
      scheduleAutoPush();
    }
  }

  function getPosterSrc(item) {
    if (item.posterUrl && item.posterUrl.trim()) {
      return item.posterUrl.trim();
    }
    return window.PosterArt.generate({
      title: item.title,
      originalTitle: item.originalTitle,
      year: item.year,
      category: item.category,
      paletteKey: item.paletteKey,
    });
  }

  function getCategoryMeta(catId) {
    return (
      window.CineData.CATEGORIES.find((c) => c.id === catId) ||
      window.CineData.CATEGORIES[0]
    );
  }

  function renderStarsText(rating) {
    const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return "★".repeat(r) + "☆".repeat(5 - r);
  }

  function showToast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      el.style.transition = "all 0.25s ease";
      setTimeout(() => el.remove(), 260);
    }, 2600);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ================= FILTERING =================
  function getFilteredItems() {
    const q = state.searchQuery.trim().toLowerCase();
    return state.items.filter((item) => {
      if (state.statusFilter !== "all" && item.status !== state.statusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        item.title,
        item.originalTitle,
        item.review,
        String(item.year || ""),
        ...(item.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  // ================= STATS & HERO =================
  function renderStats() {
    const total = state.items.length;
    const watched = state.items.filter((i) => i.status === "watched").length;
    const rated = state.items.filter((i) => Number(i.rating) > 0);
    const avg =
      rated.length > 0
        ? (rated.reduce((sum, i) => sum + Number(i.rating), 0) / rated.length).toFixed(1)
        : "0.0";

    dom.statTotal.textContent = total;
    dom.statWatched.textContent = watched;
    dom.statAvg.textContent = avg;

    // Show "一键补全海报" button whenever any item lacks a real posterUrl
    const missingCount = state.items.filter((i) => !i.posterUrl || !i.posterUrl.trim()).length;
    if (dom.btnAutoFillPosters && !dom.btnAutoFillPosters.disabled) {
      dom.btnAutoFillPosters.classList.toggle("hidden", missingCount === 0);
      dom.btnAutoFillPosters.textContent = `✨ 一键补全海报 (${missingCount})`;
    }
  }

  function renderHero() {
    const candidates = state.items.filter((i) => i.rating >= 4);
    const pool = candidates.length > 0 ? candidates : state.items;
    if (pool.length === 0) return;

    const item = pool[state.heroIndex % pool.length];
    const posterSrc = getPosterSrc(item);
    const cat = getCategoryMeta(item.category);
    const st = STATUS_META[item.status] || STATUS_META.watched;

    dom.heroBackdrop.style.backgroundImage = `url("${posterSrc}")`;
    dom.heroBadge.textContent = `${cat.icon} ${cat.name} · 精选记录`;
    dom.heroTitle.textContent = item.title;
    dom.heroMeta.innerHTML = `
      <span class="hero-rating">★ ${Number(item.rating).toFixed(1)}</span>
      ${item.year ? `<span>${item.year}</span>` : ""}
      <span>${cat.name}</span>
      <span>${st.label}</span>
    `;
    dom.heroReview.textContent = item.review || "暂无短评，点击查看详情补充你的观后感吧。";
    dom.heroPosterImg.src = posterSrc;
    dom.heroPosterImg.alt = item.title;

    dom.heroDetailBtn.onclick = () => openDetailModal(item.id);
    dom.heroPosterWrap.onclick = () => openDetailModal(item.id);
  }

  // ================= SHELVES RENDERING =================
  function renderShelves() {
    const filtered = getFilteredItems();
    const isFiltering = Boolean(state.searchQuery.trim() || state.statusFilter !== "all");
    dom.shelvesContainer.innerHTML = "";

    let totalRendered = 0;

    window.CineData.CATEGORIES.forEach((cat) => {
      const catItems = filtered.filter((i) => i.category === cat.id);
      if (isFiltering && catItems.length === 0) {
        return;
      }
      totalRendered += catItems.length;

      const isGrid = Boolean(state.gridModes[cat.id]);

      const section = document.createElement("section");
      section.className = "shelf-section";
      section.id = `shelf-${cat.id}`;
      section.style.setProperty("--shelf-color", cat.color);

      section.innerHTML = `
        <div class="shelf-header">
          <div class="shelf-title-group">
            <span class="shelf-accent-bar"></span>
            <h2 class="shelf-title">
              <span>${cat.icon}</span>
              <span>${cat.name}</span>
            </h2>
            <span class="shelf-count">${catItems.length} 部</span>
          </div>
          <div class="shelf-controls">
            <button class="shelf-action-btn ${isGrid ? "active" : ""}" data-toggle-grid="${cat.id}" title="切换滑动/网格视图">
              ${isGrid ? "切换滑动" : "展开网格"}
            </button>
            <div class="carousel-nav-group ${isGrid ? "hidden" : ""}">
              <button class="carousel-arrow" data-scroll-dir="prev" aria-label="向左滑动">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button class="carousel-arrow" data-scroll-dir="next" aria-label="向右滑动">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="shelf-viewport ${isGrid ? "" : "is-slider"}">
          <div class="shelf-track ${isGrid ? "is-grid" : ""}" data-track="${cat.id}"></div>
        </div>
      `;

      const track = section.querySelector(".shelf-track");

      catItems.forEach((item) => {
        track.appendChild(createMediaCard(item));
      });

      // Inline "+ 添加" card at the end of each shelf
      const addCard = document.createElement("div");
      addCard.className = "add-inline-card";
      addCard.innerHTML = `
        <div class="add-inline-plus">+</div>
        <span>添加${cat.name}</span>
      `;
      addCard.addEventListener("click", () => {
        if (track.dataset.wasDragging === "1") return;
        openFormModal(null, cat.id);
      });
      track.appendChild(addCard);

      // Grid toggle button
      const toggleBtn = section.querySelector(`[data-toggle-grid="${cat.id}"]`);
      toggleBtn.addEventListener("click", () => {
        state.gridModes[cat.id] = !state.gridModes[cat.id];
        renderShelves();
      });

      dom.shelvesContainer.appendChild(section);

      // Wire up fluid sliding controls if in slider mode
      if (!isGrid) {
        setupFluidSlider(section, track);
      }
    });

    dom.globalEmptyState.classList.toggle("hidden", totalRendered > 0 || !isFiltering);
  }

  function createMediaCard(item) {
    const card = document.createElement("article");
    card.className = "media-card";
    card.dataset.id = item.id;

    const posterSrc = getPosterSrc(item);
    const fallbackSrc = window.PosterArt.generate({
      title: item.title,
      originalTitle: item.originalTitle,
      year: item.year,
      category: item.category,
      paletteKey: item.paletteKey,
    });
    const st = STATUS_META[item.status] || STATUS_META.watched;
    const tagsHtml = (item.tags || [])
      .slice(0, 3)
      .map((t) => `<span class="overlay-tag">${escapeHtml(t)}</span>`)
      .join("");

    card.innerHTML = `
      <div class="poster-frame">
        <img src="${posterSrc}" alt="${escapeHtml(item.title)}" loading="lazy" referrerpolicy="no-referrer" />
        <span class="card-status-badge ${st.className}">${st.label}</span>
        ${item.rating ? `<span class="card-rating-badge">★ ${Number(item.rating).toFixed(1)}</span>` : ""}
        <div class="poster-hover-overlay">
          <p class="overlay-review">${escapeHtml(item.review || "点击查看详情与笔记")}</p>
          <div class="overlay-tags">${tagsHtml}</div>
        </div>
      </div>
      <div class="card-meta">
        <div class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
        <div class="card-sub">
          <span>${item.year || "未知年份"}</span>
          <span>${item.date ? item.date.slice(0, 7) : st.label}</span>
        </div>
      </div>
    `;

    const img = card.querySelector("img");
    img.addEventListener("error", () => {
      if (img.src !== fallbackSrc) img.src = fallbackSrc;
    });

    card.addEventListener("click", (e) => {
      const track = card.closest(".shelf-track");
      if (track && track.dataset.wasDragging === "1") {
        e.preventDefault();
        return;
      }
      openDetailModal(item.id);
    });

    return card;
  }

  // ================= FLUID SLIDING ENGINE =================
  function setupFluidSlider(section, track) {
    const viewport = section.querySelector(".shelf-viewport");
    const prevBtn = section.querySelector('[data-scroll-dir="prev"]');
    const nextBtn = section.querySelector('[data-scroll-dir="next"]');

    function updateControls() {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const current = track.scrollLeft;
      const atStart = current <= 2;
      const atEnd = current >= maxScroll - 2;

      if (prevBtn) prevBtn.disabled = atStart;
      if (nextBtn) nextBtn.disabled = atEnd;

      viewport.style.setProperty("--fade-left", atStart ? "0" : "1");
      viewport.style.setProperty("--fade-right", atEnd ? "0" : "1");
    }

    // Smooth button navigation (glides ~3 cards at a time)
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        const step = Math.max(280, track.clientWidth * 0.72);
        track.scrollBy({ left: -step, behavior: "smooth" });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const step = Math.max(280, track.clientWidth * 0.72);
        track.scrollBy({ left: step, behavior: "smooth" });
      });
    }

    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);
    requestAnimationFrame(updateControls);

    // Mouse Drag-to-Scroll with Inertia / Momentum
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let movedDistance = 0;
    let momentumRaf = null;

    function stopMomentum() {
      if (momentumRaf) {
        cancelAnimationFrame(momentumRaf);
        momentumRaf = null;
      }
    }

    track.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      stopMomentum();
      isDown = true;
      movedDistance = 0;
      track.dataset.wasDragging = "0";
      startX = e.pageX;
      lastX = e.pageX;
      lastTime = performance.now();
      startScrollLeft = track.scrollLeft;
      velocity = 0;
      track.classList.add("is-dragging");
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const now = performance.now();
      const dx = e.pageX - startX;
      movedDistance = Math.abs(dx);
      if (movedDistance > 6) {
        track.dataset.wasDragging = "1";
      }
      track.scrollLeft = startScrollLeft - dx;

      const dt = Math.max(1, now - lastTime);
      velocity = (lastX - e.pageX) / dt; // px per ms
      lastX = e.pageX;
      lastTime = now;
    });

    window.addEventListener("mouseup", () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("is-dragging");

      // Apply smooth inertia glide if flicked
      let v = velocity * 16; // scale to per-frame
      if (Math.abs(v) > 1.2) {
        const glide = () => {
          track.scrollLeft += v;
          v *= 0.92;
          if (Math.abs(v) > 0.4) {
            momentumRaf = requestAnimationFrame(glide);
          } else {
            momentumRaf = null;
          }
        };
        momentumRaf = requestAnimationFrame(glide);
      }

      // Reset click guard shortly after mouseup
      setTimeout(() => {
        track.dataset.wasDragging = "0";
      }, 60);
    });

    // Allow Shift + MouseWheel to glide horizontally
    track.addEventListener(
      "wheel",
      (e) => {
        if (e.shiftKey && Math.abs(e.deltaY) > 0) {
          e.preventDefault();
          track.scrollBy({ left: e.deltaY * 1.4, behavior: "smooth" });
        }
      },
      { passive: false }
    );
  }

  // ================= DETAIL MODAL =================
  function openDetailModal(id) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;

    state.currentDetailId = id;
    const posterSrc = getPosterSrc(item);
    const cat = getCategoryMeta(item.category);
    const st = STATUS_META[item.status] || STATUS_META.watched;

    dom.detailBackdrop.style.backgroundImage = `url("${posterSrc}")`;
    dom.detailPosterImg.src = posterSrc;
    dom.detailPosterImg.alt = item.title;

    dom.detailBadges.innerHTML = `
      <span class="detail-badge" style="color:${cat.color};border:1px solid ${cat.color}55;background:${cat.color}1a">${cat.icon} ${cat.name}</span>
      <span class="detail-badge ${st.className}">${st.label}</span>
      ${item.year ? `<span class="detail-badge">${item.year}</span>` : ""}
    `;

    dom.detailTitle.textContent = item.title;
    dom.detailSubtitle.textContent = item.originalTitle || "";
    dom.detailSubtitle.classList.toggle("hidden", !item.originalTitle);

    dom.detailStars.textContent = renderStarsText(item.rating);
    dom.detailScore.textContent = item.rating ? `${Number(item.rating).toFixed(1)} / 5.0` : "未评分";
    dom.detailDate.textContent = item.date ? `记录于 ${item.date}` : "";

    dom.detailTags.innerHTML = (item.tags || [])
      .map((t) => `<span class="detail-tag"># ${escapeHtml(t)}</span>`)
      .join("");
    dom.detailTags.classList.toggle("hidden", !item.tags || item.tags.length === 0);

    dom.detailReview.textContent = item.review || "还没有写观后感，点击下方「编辑记录」写下你的想法吧。";

    dom.detailModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeDetailModal() {
    dom.detailModal.classList.add("hidden");
    state.currentDetailId = null;
    document.body.style.overflow = "";
  }

  // ================= ADD / EDIT FORM MODAL =================
  function setStarPicker(value) {
    const val = Math.max(1, Math.min(5, Number(value) || 5));
    dom.fieldRating.value = val;
    dom.starPickerVal.textContent = val.toFixed(1);
    dom.starPicker.querySelectorAll(".star-btn").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.val) <= val);
    });
  }

  function updateFormPosterPreview() {
    const urlVal = dom.fieldPosterUrl.value.trim();
    if (state.formTempPosterDataUrl) {
      dom.formPosterPreview.src = state.formTempPosterDataUrl;
      return;
    }
    if (urlVal) {
      dom.formPosterPreview.src = urlVal;
      return;
    }
    dom.formPosterPreview.src = window.PosterArt.generate({
      title: dom.fieldTitle.value.trim() || "新片海报",
      originalTitle: dom.fieldOriginalTitle.value.trim(),
      year: dom.fieldYear.value.trim(),
      category: dom.fieldCategory.value,
      paletteKey: state.formPaletteKey,
    });
  }

  function openFormModal(editItem = null, defaultCategory = "movie", prefill = null) {
    state.formTempPosterDataUrl = "";
    dom.formOnlineQuery.value = "";
    dom.formOnlineStatus.classList.add("hidden");
    dom.formOnlineResults.classList.add("hidden");
    dom.formOnlineResults.innerHTML = "";
    const today = new Date().toISOString().slice(0, 10);

    if (editItem) {
      dom.formModalTitle.textContent = "编辑影视记录";
      dom.fieldId.value = editItem.id;
      dom.fieldCategory.value = editItem.category;
      dom.fieldStatus.value = editItem.status || "watched";
      dom.fieldTitle.value = editItem.title || "";
      dom.fieldOriginalTitle.value = editItem.originalTitle || "";
      dom.fieldYear.value = editItem.year || "";
      setStarPicker(editItem.rating || 5);
      dom.fieldDate.value = editItem.date || "";
      dom.fieldTags.value = (editItem.tags || []).join(" ");
      dom.fieldReview.value = editItem.review || "";
      state.formPaletteKey = editItem.paletteKey || "";

      if (editItem.posterUrl && editItem.posterUrl.startsWith("data:image")) {
        state.formTempPosterDataUrl = editItem.posterUrl;
        dom.fieldPosterUrl.value = "";
      } else {
        dom.fieldPosterUrl.value = editItem.posterUrl || "";
      }
    } else {
      dom.formModalTitle.textContent = prefill ? "联网收录新片" : "记录新片";
      dom.mediaForm.reset();
      dom.fieldId.value = "";
      dom.fieldCategory.value = (prefill && prefill.category) || defaultCategory;
      dom.fieldStatus.value = "watched";
      dom.fieldDate.value = today;
      dom.fieldYear.value = (prefill && prefill.year) || new Date().getFullYear();
      if (prefill) {
        dom.fieldTitle.value = prefill.title || "";
        dom.fieldOriginalTitle.value = prefill.originalTitle || "";
        dom.fieldPosterUrl.value = prefill.posterUrl || "";
        dom.fieldReview.value = prefill.summary || "";
      }
      setStarPicker(5);
      state.formPaletteKey =
        window.PosterArt.palettes[Math.floor(Math.random() * window.PosterArt.palettes.length)];
    }

    updateFormPosterPreview();
    dom.formModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => dom.fieldTitle.focus(), 60);
  }

  function closeFormModal() {
    dom.formModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // Compress uploaded local poster image to 2:3 friendly dimensions for localStorage
  function compressImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxW = 420;
          const maxH = 630;
          let { width, height } = img;
          const ratio = Math.min(maxW / width, maxH / height, 1);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.84));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ================= EVENT BINDINGS =================
  function bindEvents() {
    // Brand scroll to top
    dom.brandHome.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Category Nav Pills (smooth scroll to block)
    dom.navPills.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav-pill");
      if (!btn) return;
      const target = btn.dataset.target;
      dom.navPills.querySelectorAll(".nav-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (target === "all") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const shelfEl = document.getElementById(`shelf-${target}`);
        if (shelfEl) {
          shelfEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });

    // Search
    dom.searchInput.addEventListener("input", () => {
      state.searchQuery = dom.searchInput.value;
      dom.searchClear.classList.toggle("hidden", !state.searchQuery);
      renderShelves();
      renderNotes();
    });

    dom.searchClear.addEventListener("click", () => {
      dom.searchInput.value = "";
      state.searchQuery = "";
      dom.searchClear.classList.add("hidden");
      renderShelves();
      renderNotes();
      dom.searchInput.focus();
    });

    // Status Filter Chips
    dom.statusFilterPills.addEventListener("click", (e) => {
      const chip = e.target.closest(".filter-chip");
      if (!chip) return;
      state.statusFilter = chip.dataset.status;
      dom.statusFilterPills.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderShelves();
    });

    dom.btnResetFilters.addEventListener("click", () => {
      state.searchQuery = "";
      state.statusFilter = "all";
      dom.searchInput.value = "";
      dom.searchClear.classList.add("hidden");
      dom.statusFilterPills.querySelectorAll(".filter-chip").forEach((c) => {
        c.classList.toggle("active", c.dataset.status === "all");
      });
      renderShelves();
    });

    // Hero Next Spotlight
    dom.heroNextBtn.addEventListener("click", () => {
      state.heroIndex += 1;
      renderHero();
    });

    // Add New Button
    dom.btnAddNew.addEventListener("click", () => openFormModal(null, "movie"));

    // Detail Modal Events
    dom.detailClose.addEventListener("click", closeDetailModal);
    dom.detailModal.addEventListener("click", (e) => {
      if (e.target === dom.detailModal) closeDetailModal();
    });

    dom.btnEditFromDetail.addEventListener("click", () => {
      const item = state.items.find((i) => i.id === state.currentDetailId);
      closeDetailModal();
      if (item) openFormModal(item);
    });

    dom.btnWriteNoteFromDetail.addEventListener("click", () => {
      const item = state.items.find((i) => i.id === state.currentDetailId);
      closeDetailModal();
      if (item) openNoteFormModal(null, item.id);
    });

    dom.btnDeleteFromDetail.addEventListener("click", () => {
      const item = state.items.find((i) => i.id === state.currentDetailId);
      if (!item) return;
      if (confirm(`确定要删除《${item.title}》的记录吗？`)) {
        state.items = state.items.filter((i) => i.id !== item.id);
        saveItems();
        closeDetailModal();
        renderAll();
        showToast(`已删除《${item.title}》`);
      }
    });

    // Form Modal Events
    dom.formClose.addEventListener("click", closeFormModal);
    dom.btnCancelForm.addEventListener("click", closeFormModal);
    dom.formModal.addEventListener("click", (e) => {
      if (e.target === dom.formModal) closeFormModal();
    });

    // Star Picker
    dom.starPicker.addEventListener("click", (e) => {
      const btn = e.target.closest(".star-btn");
      if (!btn) return;
      setStarPicker(btn.dataset.val);
    });

    // Live Poster Preview updates
    [dom.fieldTitle, dom.fieldOriginalTitle, dom.fieldYear, dom.fieldCategory].forEach((el) => {
      el.addEventListener("input", updateFormPosterPreview);
      el.addEventListener("change", updateFormPosterPreview);
    });

    dom.fieldPosterUrl.addEventListener("input", () => {
      if (dom.fieldPosterUrl.value.trim()) {
        state.formTempPosterDataUrl = "";
      }
      updateFormPosterPreview();
    });

    dom.btnGenPoster.addEventListener("click", () => {
      state.formTempPosterDataUrl = "";
      dom.fieldPosterUrl.value = "";
      const palettes = window.PosterArt.palettes;
      const curIdx = palettes.indexOf(state.formPaletteKey);
      state.formPaletteKey = palettes[(curIdx + 1) % palettes.length];
      updateFormPosterPreview();
    });

    dom.posterFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await compressImageFile(file);
        state.formTempPosterDataUrl = dataUrl;
        dom.fieldPosterUrl.value = "";
        updateFormPosterPreview();
        showToast("本地海报已载入并自动优化尺寸");
      } catch {
        showToast("图片读取失败，请换一张图片试试");
      }
      e.target.value = "";
    });

    // Form Submit
    dom.mediaForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = dom.fieldId.value;
      const tags = dom.fieldTags.value
        .split(/[\s,，、]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const posterUrl = state.formTempPosterDataUrl || dom.fieldPosterUrl.value.trim();

      const payload = {
        id: id || "item_" + Date.now(),
        category: dom.fieldCategory.value,
        status: dom.fieldStatus.value,
        title: dom.fieldTitle.value.trim(),
        originalTitle: dom.fieldOriginalTitle.value.trim(),
        year: dom.fieldYear.value ? Number(dom.fieldYear.value) : "",
        rating: Number(dom.fieldRating.value) || 5,
        date: dom.fieldDate.value,
        tags,
        review: dom.fieldReview.value.trim(),
        posterUrl,
        paletteKey: state.formPaletteKey,
      };

      if (id) {
        const idx = state.items.findIndex((i) => i.id === id);
        if (idx !== -1) state.items[idx] = payload;
        showToast(`已更新《${payload.title}》`);
      } else {
        state.items.unshift(payload);
        showToast(`已添加《${payload.title}》到${getCategoryMeta(payload.category).name}`);
      }

      saveItems();
      closeFormModal();
      renderAll();
    });

    // Export JSON (includes both items & notes)
    dom.btnExport.addEventListener("click", () => {
      const bundle = {
        version: 2,
        exportedAt: new Date().toISOString(),
        items: state.items,
        notes: state.notes,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cinelog-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("已导出片单与影评笔记 JSON 备份");
    });

    // Import JSON (supports both v1 array and v2 { items, notes } bundle)
    dom.btnImport.addEventListener("click", () => dom.importFileInput.click());
    dom.importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if (Array.isArray(imported)) {
            state.items = imported;
            saveItems();
            renderAll();
            showToast(`成功导入 ${imported.length} 条影视记录`);
          } else if (imported && Array.isArray(imported.items)) {
            state.items = imported.items;
            if (Array.isArray(imported.notes)) {
              state.notes = imported.notes;
            }
            saveItems();
            renderAll();
            showToast(`成功导入 ${state.items.length} 条影视与 ${state.notes.length} 篇笔记`);
          } else {
            throw new Error("Invalid format");
          }
        } catch {
          showToast("导入失败：请选择有效的 CineLog JSON 备份文件");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    // Escape key closes modals
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!dom.onlineSearchModal.classList.contains("hidden")) closeOnlineSearchModal();
        else if (!dom.noteFormModal.classList.contains("hidden")) closeNoteFormModal();
        else if (!dom.noteDetailModal.classList.contains("hidden")) closeNoteDetailModal();
        else if (!dom.syncModal.classList.contains("hidden")) closeSyncModal();
        else if (!dom.formModal.classList.contains("hidden")) closeFormModal();
        else if (!dom.detailModal.classList.contains("hidden")) closeDetailModal();
      }
    });

    // Online Search Modal & Inline Form Search Events
    if (dom.btnAutoFillPosters) {
      dom.btnAutoFillPosters.addEventListener("click", autoFillMissingPosters);
    }
    dom.btnOnlineSearch.addEventListener("click", openOnlineSearchModal);
    dom.onlineSearchClose.addEventListener("click", closeOnlineSearchModal);
    dom.onlineSearchModal.addEventListener("click", (e) => {
      if (e.target === dom.onlineSearchModal) closeOnlineSearchModal();
    });
    dom.btnRunOnlineSearch.addEventListener("click", runOnlineSearch);
    dom.onlineSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runOnlineSearch();
      }
    });
    dom.btnSaveTmdbKey.addEventListener("click", () => {
      window.CineSearch.setTmdbKey(dom.tmdbKeyInput.value);
      showToast(dom.tmdbKeyInput.value.trim() ? "已保存 TMDB Key，搜索将自动启用" : "已清除 TMDB Key");
    });

    dom.btnFormOnlineSearch.addEventListener("click", runInlineOnlineSearch);
    dom.formOnlineQuery.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runInlineOnlineSearch();
      }
    });

    // Notes Section & Modals Events
    dom.notesFilterTabs.addEventListener("click", (e) => {
      const chip = e.target.closest(".filter-chip");
      if (!chip) return;
      state.noteTypeFilter = chip.dataset.noteType;
      dom.notesFilterTabs.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderNotes();
    });

    dom.btnAddNote.addEventListener("click", () => openNoteFormModal(null, ""));
    dom.noteDetailClose.addEventListener("click", closeNoteDetailModal);
    dom.noteDetailModal.addEventListener("click", (e) => {
      if (e.target === dom.noteDetailModal) closeNoteDetailModal();
    });
    dom.btnEditNoteFromDetail.addEventListener("click", () => {
      const note = state.notes.find((n) => n.id === state.currentNoteDetailId);
      closeNoteDetailModal();
      if (note) openNoteFormModal(note);
    });
    dom.btnDeleteNoteFromDetail.addEventListener("click", () => {
      const note = state.notes.find((n) => n.id === state.currentNoteDetailId);
      if (!note) return;
      if (confirm(`确定要删除笔记《${note.title}》吗？`)) {
        state.notes = state.notes.filter((n) => n.id !== note.id);
        saveItems();
        closeNoteDetailModal();
        renderNotes();
        showToast(`已删除笔记《${note.title}》`);
      }
    });

    dom.noteFormClose.addEventListener("click", closeNoteFormModal);
    dom.btnCancelNoteForm.addEventListener("click", closeNoteFormModal);
    dom.noteFormModal.addEventListener("click", (e) => {
      if (e.target === dom.noteFormModal) closeNoteFormModal();
    });
    dom.noteFieldContent.addEventListener("input", () => {
      dom.noteCharCount.textContent = `${dom.noteFieldContent.value.length} 字`;
    });
    dom.noteForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = dom.noteFieldId.value;
      const tags = dom.noteFieldTags.value
        .split(/[\s,，、]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        id: id || "note_" + Date.now(),
        title: dom.noteFieldTitle.value.trim(),
        type: dom.noteFieldType.value || "review",
        mediaId: dom.noteFieldMediaId.value || "",
        date: dom.noteFieldDate.value || new Date().toISOString().slice(0, 10),
        tags,
        content: dom.noteFieldContent.value.trim(),
      };

      if (id) {
        const idx = state.notes.findIndex((n) => n.id === id);
        if (idx !== -1) state.notes[idx] = payload;
        showToast(`已更新笔记《${payload.title}》`);
      } else {
        state.notes.unshift(payload);
        showToast(`已保存新笔记《${payload.title}》`);
      }
      saveItems();
      closeNoteFormModal();
      renderNotes();
    });

    // Cloud Sync Modal Events
    dom.btnSyncStatus.addEventListener("click", openSyncModal);
    dom.syncClose.addEventListener("click", closeSyncModal);
    dom.syncModal.addEventListener("click", (e) => {
      if (e.target === dom.syncModal) closeSyncModal();
    });

    dom.syncProviderTabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".provider-tab");
      if (!tab) return;
      selectSyncProviderTab(tab.dataset.provider);
    });

    dom.btnCopySql.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.CineSync.SUPABASE_SQL_SNIPPET);
        showToast("已复制 Supabase 建表 SQL");
      } catch {
        showToast("复制失败，请查看 DEPLOY.md 中的 SQL 语句");
      }
    });

    dom.btnSaveAndSync.addEventListener("click", handleSaveAndSync);
    dom.btnManualPull.addEventListener("click", () => handleManualPull());
    dom.btnManualPush.addEventListener("click", () => handleManualPush());

    dom.btnCopyShareCode.addEventListener("click", async () => {
      const cfg = readSyncFormConfig();
      if (!window.CineSync.isConfigured(cfg)) {
        showToast("请先填写并保存云端同步配置");
        return;
      }
      const code = window.CineSync.encodeShareCode(cfg);
      dom.syncShareCodeInput.value = code;
      try {
        await navigator.clipboard.writeText(code);
        showToast("已复制配置口令！发送到手机粘贴即可一键绑定");
      } catch {
        dom.syncShareCodeInput.select();
        showToast("口令已填入输入框，请手动全选复制");
      }
    });

    dom.btnApplyShareCode.addEventListener("click", async () => {
      const code = dom.syncShareCodeInput.value.trim();
      if (!code) {
        showToast("请先粘贴来自另一台设备的配置口令");
        return;
      }
      try {
        const decoded = window.CineSync.decodeShareCode(code);
        state.syncConfig = window.CineSync.saveConfig(decoded);
        populateSyncForm(state.syncConfig);
        showToast("口令导入成功，正在拉取云端数据...");
        await pullFromCloud({ silent: false, force: true });
      } catch (err) {
        showToast(err.message || "配置口令无效");
      }
    });

    // Auto-pull when returning to this tab / waking up phone browser
    document.addEventListener("visibilitychange", () => {
      if (
        document.visibilityState === "visible" &&
        state.syncConfig &&
        state.syncConfig.autoSync &&
        window.CineSync.isConfigured(state.syncConfig)
      ) {
        pullFromCloud({ silent: true, force: false });
      }
    });
  }

  // ================= CLOUD SYNC CONTROLLER =================
  function formatTime(ts) {
    if (!ts) return "尚未同步";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function updateSyncStatusUI(status, customLabel) {
    state.syncState = status;
    dom.btnSyncStatus.classList.remove("is-synced", "is-syncing", "is-error");

    const configured = window.CineSync.isConfigured(state.syncConfig);
    if (!configured) {
      dom.syncStatusText.textContent = "未同步";
      dom.syncLastTime.textContent = "尚未配置云端同步";
      return;
    }

    if (status === "syncing") {
      dom.btnSyncStatus.classList.add("is-syncing");
      dom.syncStatusText.textContent = customLabel || "同步中...";
    } else if (status === "synced") {
      dom.btnSyncStatus.classList.add("is-synced");
      dom.syncStatusText.textContent = customLabel || "已云同步";
    } else if (status === "error") {
      dom.btnSyncStatus.classList.add("is-error");
      dom.syncStatusText.textContent = customLabel || "同步失败";
    } else {
      dom.btnSyncStatus.classList.add("is-synced");
      dom.syncStatusText.textContent = "云同步";
    }

    if (state.syncConfig && state.syncConfig.lastSyncedAt) {
      dom.syncLastTime.textContent = `上次同步：${formatTime(state.syncConfig.lastSyncedAt)}`;
    } else {
      dom.syncLastTime.textContent = "已配置，等待首次同步";
    }
  }

  function selectSyncProviderTab(provider) {
    dom.syncProviderTabs.querySelectorAll(".provider-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.provider === provider);
    });
    dom.panelGist.classList.toggle("hidden", provider !== "gist");
    dom.panelSupabase.classList.toggle("hidden", provider !== "supabase");
    dom.panelNone.classList.toggle("hidden", provider !== "none");
    dom.syncAutoRow.classList.toggle("hidden", provider === "none");
    dom.btnManualPull.classList.toggle("hidden", provider === "none");
    dom.btnManualPush.classList.toggle("hidden", provider === "none");
  }

  function populateSyncForm(cfg) {
    const provider = cfg.provider === "none" ? "gist" : cfg.provider;
    selectSyncProviderTab(cfg.provider === "none" ? "none" : provider);
    dom.syncGistToken.value = cfg.gistToken || "";
    dom.syncGistId.value = cfg.gistId || "";
    dom.syncSupabaseUrl.value = cfg.supabaseUrl || "";
    dom.syncSupabaseKey.value = cfg.supabaseAnonKey || "";
    dom.syncSupabaseRowId.value = cfg.supabaseRecordId || "default_user";
    dom.syncAutoToggle.checked = cfg.autoSync !== false;
    dom.syncShareCodeInput.value = "";
    updateSyncStatusUI(state.syncState);
  }

  function readSyncFormConfig() {
    const activeTab = dom.syncProviderTabs.querySelector(".provider-tab.active");
    const provider = activeTab ? activeTab.dataset.provider : "none";
    return {
      ...state.syncConfig,
      provider,
      autoSync: dom.syncAutoToggle.checked,
      gistToken: dom.syncGistToken.value.trim(),
      gistId: dom.syncGistId.value.trim(),
      supabaseUrl: dom.syncSupabaseUrl.value.trim(),
      supabaseAnonKey: dom.syncSupabaseKey.value.trim(),
      supabaseRecordId: dom.syncSupabaseRowId.value.trim() || "default_user",
    };
  }

  function openSyncModal() {
    populateSyncForm(state.syncConfig);
    if (state.syncConfig.provider === "none") {
      selectSyncProviderTab("gist");
    }
    dom.syncModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeSyncModal() {
    dom.syncModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function scheduleAutoPush() {
    if (!state.syncConfig || !state.syncConfig.autoSync) return;
    if (!window.CineSync.isConfigured(state.syncConfig)) return;

    if (state.syncPushTimer) clearTimeout(state.syncPushTimer);
    state.syncPushTimer = setTimeout(() => {
      pushToCloud({ silent: true });
    }, 800);
  }

  async function pullFromCloud({ silent = false, force = false } = {}) {
    if (!window.CineSync.isConfigured(state.syncConfig)) return { pulled: false };
    updateSyncStatusUI("syncing", "拉取中...");
    try {
      const result = await window.CineSync.pull(state.syncConfig);
      if (result.exists && result.data && Array.isArray(result.data.items)) {
        const remoteTs = Number(result.data.updatedAt) || 0;
        const shouldApply = force || state.localUpdatedAt === 0 || remoteTs > state.localUpdatedAt;
        if (shouldApply) {
          state.items = result.data.items;
          if (Array.isArray(result.data.notes)) {
            state.notes = result.data.notes;
          }
          saveItems({ skipCloudPush: true, updatedAt: remoteTs || Date.now() });
          renderAll();
          if (!silent) showToast(`已从云端同步 ${state.items.length} 条影视与 ${state.notes.length} 篇笔记`);
        } else if (!silent) {
          showToast("当前已是最新数据");
        }
        state.syncConfig = window.CineSync.saveConfig({
          ...state.syncConfig,
          lastSyncedAt: Date.now(),
        });
        updateSyncStatusUI("synced");
        return { pulled: true, existed: true };
      } else {
        updateSyncStatusUI("synced");
        return { pulled: false, existed: false };
      }
    } catch (err) {
      console.error("Cloud pull failed:", err);
      updateSyncStatusUI("error");
      if (!silent) showToast(`拉取失败：${err.message}`);
      return { pulled: false, error: err };
    }
  }

  async function pushToCloud({ silent = false } = {}) {
    if (!window.CineSync.isConfigured(state.syncConfig)) return false;
    updateSyncStatusUI("syncing", "上传中...");
    try {
      const ts = state.localUpdatedAt || Date.now();
      const res = await window.CineSync.push(state.syncConfig, state.items, ts, state.notes);
      const nextCfg = {
        ...state.syncConfig,
        lastSyncedAt: Date.now(),
      };
      if (res && res.gistId && res.gistId !== state.syncConfig.gistId) {
        nextCfg.gistId = res.gistId;
        dom.syncGistId.value = res.gistId;
      }
      state.syncConfig = window.CineSync.saveConfig(nextCfg);
      updateSyncStatusUI("synced");
      if (!silent) {
        showToast(res && res.created ? "已自动创建私密 Gist 并完成首次云端上传！" : "已成功推送到云端");
      }
      return true;
    } catch (err) {
      console.error("Cloud push failed:", err);
      updateSyncStatusUI("error");
      if (!silent) showToast(`上传失败：${err.message}`);
      return false;
    }
  }

  async function handleSaveAndSync() {
    const nextCfg = readSyncFormConfig();
    if (nextCfg.provider !== "none" && !window.CineSync.isConfigured(nextCfg)) {
      showToast("请完整填写必填的云端配置信息");
      return;
    }
    state.syncConfig = window.CineSync.saveConfig(nextCfg);
    if (nextCfg.provider === "none") {
      updateSyncStatusUI("idle");
      showToast("已切换为仅本地存储");
      closeSyncModal();
      return;
    }

    // Try pulling first so binding a second device does not overwrite cloud data
    const pullRes = await pullFromCloud({ silent: false, force: true });
    if (pullRes.error) return;
    if (!pullRes.existed) {
      await pushToCloud({ silent: false });
    }
  }

  async function handleManualPull() {
    const nextCfg = readSyncFormConfig();
    if (!window.CineSync.isConfigured(nextCfg)) {
      showToast("请先填写云端配置");
      return;
    }
    state.syncConfig = window.CineSync.saveConfig(nextCfg);
    await pullFromCloud({ silent: false, force: true });
  }

  async function handleManualPush() {
    const nextCfg = readSyncFormConfig();
    if (!window.CineSync.isConfigured(nextCfg)) {
      showToast("请先填写云端配置");
      return;
    }
    state.syncConfig = window.CineSync.saveConfig(nextCfg);
    await pushToCloud({ silent: false });
  }

  // ================= REVIEWS & NOTES MODULE =================
  function getNoteTypeMeta(typeId) {
    const list = window.CineData.NOTE_TYPES || [];
    return list.find((t) => t.id === typeId) || { id: "review", label: "深度影评", icon: "✍️" };
  }

  function renderNotes() {
    const q = state.searchQuery.trim().toLowerCase();
    const filtered = state.notes.filter((n) => {
      if (state.noteTypeFilter !== "all" && n.type !== state.noteTypeFilter) return false;
      if (!q) return true;
      const linked = state.items.find((i) => i.id === n.mediaId);
      const hay = [
        n.title,
        n.content,
        linked ? linked.title : "",
        ...(n.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    dom.notesCount.textContent = `${filtered.length} 篇`;
    dom.notesGrid.innerHTML = "";
    dom.notesEmptyState.classList.toggle("hidden", filtered.length > 0);

    filtered.forEach((note) => {
      const typeMeta = getNoteTypeMeta(note.type);
      const linked = state.items.find((i) => i.id === note.mediaId);
      const card = document.createElement("article");
      card.className = "note-card";

      const posterHtml = linked
        ? `<div class="note-card-poster" title="关联作品：${escapeHtml(linked.title)}">
             <img src="${getPosterSrc(linked)}" alt="${escapeHtml(linked.title)}" loading="lazy" />
           </div>`
        : "";

      const tagsHtml = (note.tags || [])
        .slice(0, 3)
        .map((t) => `<span class="detail-tag"># ${escapeHtml(t)}</span>`)
        .join("");

      card.innerHTML = `
        ${posterHtml}
        <div class="note-card-main">
          <div class="note-card-top">
            <span class="note-type-pill">${typeMeta.icon} ${typeMeta.label}</span>
            <span class="note-date">${escapeHtml(note.date || "")}</span>
          </div>
          <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
          <p class="note-card-excerpt">${escapeHtml(note.content)}</p>
          <div class="note-card-footer">
            ${linked ? `<span class="note-media-chip">🎬 ${escapeHtml(linked.title)}</span>` : ""}
            ${tagsHtml}
          </div>
        </div>
      `;

      card.addEventListener("click", () => openNoteDetailModal(note.id));
      dom.notesGrid.appendChild(card);
    });
  }

  function openNoteDetailModal(noteId) {
    const note = state.notes.find((n) => n.id === noteId);
    if (!note) return;
    state.currentNoteDetailId = noteId;
    const typeMeta = getNoteTypeMeta(note.type);
    const linked = state.items.find((i) => i.id === note.mediaId);

    dom.noteDetailMeta.innerHTML = `
      <span class="note-type-pill">${typeMeta.icon} ${typeMeta.label}</span>
      <span class="note-date">${escapeHtml(note.date || "")}</span>
    `;
    dom.noteDetailTitle.textContent = note.title;

    if (linked) {
      const cat = getCategoryMeta(linked.category);
      dom.noteDetailLinked.classList.remove("hidden");
      dom.noteDetailLinked.innerHTML = `
        <img src="${getPosterSrc(linked)}" alt="${escapeHtml(linked.title)}" />
        <div class="note-linked-info">
          <span class="note-linked-name">关联作品：《${escapeHtml(linked.title)}》</span>
          <span class="note-linked-sub">${cat.icon} ${cat.name} · ${linked.year || ""} · ★ ${Number(linked.rating || 0).toFixed(1)}（点击查看影视详情）</span>
        </div>
      `;
      dom.noteDetailLinked.onclick = () => {
        closeNoteDetailModal();
        openDetailModal(linked.id);
      };
    } else {
      dom.noteDetailLinked.classList.add("hidden");
      dom.noteDetailLinked.onclick = null;
    }

    dom.noteDetailTags.innerHTML = (note.tags || [])
      .map((t) => `<span class="detail-tag"># ${escapeHtml(t)}</span>`)
      .join("");
    dom.noteDetailTags.classList.toggle("hidden", !note.tags || note.tags.length === 0);

    dom.noteDetailContent.textContent = note.content || "";
    dom.noteDetailModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeNoteDetailModal() {
    dom.noteDetailModal.classList.add("hidden");
    state.currentNoteDetailId = null;
    document.body.style.overflow = "";
  }

  function populateNoteMediaSelect(selectedId = "") {
    dom.noteFieldMediaId.innerHTML = `<option value="">不关联具体作品</option>`;
    state.items.forEach((item) => {
      const cat = getCategoryMeta(item.category);
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = `${cat.icon} ${item.title}${item.year ? ` (${item.year})` : ""}`;
      if (item.id === selectedId) opt.selected = true;
      dom.noteFieldMediaId.appendChild(opt);
    });
  }

  function openNoteFormModal(editNote = null, defaultMediaId = "") {
    const today = new Date().toISOString().slice(0, 10);
    if (editNote) {
      dom.noteFormModalTitle.textContent = "编辑影评 / 笔记";
      dom.noteFieldId.value = editNote.id;
      dom.noteFieldTitle.value = editNote.title || "";
      dom.noteFieldType.value = editNote.type || "review";
      populateNoteMediaSelect(editNote.mediaId || "");
      dom.noteFieldDate.value = editNote.date || today;
      dom.noteFieldTags.value = (editNote.tags || []).join(" ");
      dom.noteFieldContent.value = editNote.content || "";
    } else {
      dom.noteFormModalTitle.textContent = "写影评 / 笔记";
      dom.noteForm.reset();
      dom.noteFieldId.value = "";
      dom.noteFieldType.value = "review";
      populateNoteMediaSelect(defaultMediaId);
      dom.noteFieldDate.value = today;
      if (defaultMediaId) {
        const linked = state.items.find((i) => i.id === defaultMediaId);
        if (linked) {
          dom.noteFieldTitle.value = `《${linked.title}》观后感`;
        }
      }
    }
    dom.noteCharCount.textContent = `${dom.noteFieldContent.value.length} 字`;
    dom.noteFormModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => dom.noteFieldTitle.focus(), 60);
  }

  function closeNoteFormModal() {
    dom.noteFormModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // ================= ONLINE MEDIA & POSTER SEARCH =================
  async function autoFillMissingPosters() {
    const missing = state.items.filter((i) => !i.posterUrl || !i.posterUrl.trim());
    if (missing.length === 0) {
      showToast("所有片单都已经有海报啦");
      return;
    }

    const btn = dom.btnAutoFillPosters;
    btn.disabled = true;
    let done = 0;
    let matched = 0;
    btn.textContent = `⏳ 正在补全海报 (0/${missing.length})...`;

    // Process 3 items concurrently for fast, smooth progressive updates
    const concurrency = 3;
    let cursor = 0;

    async function worker() {
      while (cursor < missing.length) {
        const idx = cursor++;
        const item = missing[idx];
        const url = await window.CineSearch.findBestPoster(item);
        if (url) {
          item.posterUrl = url;
          matched++;
        }
        done++;
        btn.textContent = `⏳ 正在补全海报 (${done}/${missing.length})...`;
        if (url) {
          renderHero();
          renderShelves();
          renderNotes();
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, missing.length) }, worker));

    btn.disabled = false;
    if (matched > 0) {
      saveItems();
      renderAll();
      showToast(`已自动联网补全 ${matched} 部影视的官方海报，并自动保存同步！`);
    } else {
      renderStats();
      showToast("暂未获取到在线海报，请检查网络或稍后再试");
    }
  }

  function openOnlineSearchModal() {
    dom.tmdbKeyInput.value = window.CineSearch.getTmdbKey();
    dom.onlineSearchModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => dom.onlineSearchInput.focus(), 60);
  }

  function closeOnlineSearchModal() {
    dom.onlineSearchModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  async function runOnlineSearch() {
    const q = dom.onlineSearchInput.value.trim();
    const cat = dom.onlineSearchCategory.value;
    if (!q) {
      showToast("请输入要搜索的片名");
      return;
    }
    dom.onlineSearchStatus.textContent = `正在联网搜索「${q}」的高清海报与信息...`;
    dom.onlineResultsGrid.innerHTML = "";

    try {
      const results = await window.CineSearch.searchMedia(q, cat);
      if (results.length === 0) {
        dom.onlineSearchStatus.textContent = `未找到「${q}」的公开海报结果，试试换中文/英文原名，或在上方配置可选 TMDB Key。`;
        return;
      }
      dom.onlineSearchStatus.textContent = `找到 ${results.length} 条结果，点击任意卡片即可自动填入高清海报并收录：`;
      results.forEach((item) => {
        const card = document.createElement("div");
        card.className = "online-result-card";
        card.innerHTML = `
          <div class="online-result-poster">
            <img src="${escapeHtml(item.posterUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" referrerpolicy="no-referrer" />
            <span class="online-source-badge">${escapeHtml(item.source)}</span>
          </div>
          <div class="online-result-info">
            <div class="online-result-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
            <div class="online-result-sub">${item.year || "未知年份"} · ${getCategoryMeta(item.category).name}</div>
          </div>
        `;
        card.addEventListener("click", () => {
          closeOnlineSearchModal();
          openFormModal(null, item.category, item);
          showToast(`已自动填入《${item.title}》海报与信息`);
        });
        dom.onlineResultsGrid.appendChild(card);
      });
    } catch (err) {
      dom.onlineSearchStatus.textContent = "联网搜索遇到网络波动，请稍后再试。";
    }
  }

  async function runInlineOnlineSearch() {
    const q = (dom.formOnlineQuery.value || dom.fieldTitle.value).trim();
    if (!q) {
      showToast("请先输入片名再搜海报");
      dom.formOnlineQuery.focus();
      return;
    }
    dom.formOnlineQuery.value = q;
    dom.formOnlineStatus.classList.remove("hidden");
    dom.formOnlineStatus.textContent = `正在联网搜「${q}」的海报...`;
    dom.formOnlineResults.classList.add("hidden");
    dom.formOnlineResults.innerHTML = "";

    try {
      const results = await window.CineSearch.searchMedia(q, dom.fieldCategory.value || "all");
      if (results.length === 0) {
        dom.formOnlineStatus.textContent = "未搜到匹配海报，可尝试换英文原名，或继续使用下方本地上传 / 手动 URL。";
        return;
      }
      dom.formOnlineStatus.textContent = `找到 ${results.length} 张海报：点「全填」自动补全片名+海报，点「仅海报」只替换海报`;
      dom.formOnlineResults.classList.remove("hidden");
      results.slice(0, 10).forEach((item) => {
        const card = document.createElement("div");
        card.className = "inline-pick-card";
        card.innerHTML = `
          <div class="inline-pick-thumb">
            <img src="${escapeHtml(item.posterUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" referrerpolicy="no-referrer" />
          </div>
          <div class="inline-pick-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
          <div class="inline-pick-actions">
            <button type="button" class="inline-mini-btn" data-act="all">全填</button>
            <button type="button" class="inline-mini-btn" data-act="poster">仅海报</button>
          </div>
        `;
        card.querySelector('[data-act="all"]').addEventListener("click", () => {
          state.formTempPosterDataUrl = "";
          dom.fieldTitle.value = item.title || dom.fieldTitle.value;
          if (item.originalTitle) dom.fieldOriginalTitle.value = item.originalTitle;
          if (item.year) dom.fieldYear.value = item.year;
          if (item.category) dom.fieldCategory.value = item.category;
          dom.fieldPosterUrl.value = item.posterUrl;
          updateFormPosterPreview();
          showToast(`已填入《${item.title}》信息与高清海报`);
        });
        card.querySelector('[data-act="poster"]').addEventListener("click", () => {
          state.formTempPosterDataUrl = "";
          dom.fieldPosterUrl.value = item.posterUrl;
          updateFormPosterPreview();
          showToast("已替换为选中的官方海报");
        });
        dom.formOnlineResults.appendChild(card);
      });
    } catch {
      dom.formOnlineStatus.textContent = "联网搜索失败，请检查网络或稍后重试。";
    }
  }

  function renderAll() {
    renderStats();
    renderHero();
    renderShelves();
    renderNotes();
  }

  // ================= INIT =================
  function init() {
    state.items = loadItems();
    state.notes = loadNotes();
    state.syncConfig = window.CineSync.loadConfig();
    bindEvents();
    renderAll();
    updateSyncStatusUI("idle");

    // Auto-pull on startup if cloud sync is configured
    if (state.syncConfig.autoSync && window.CineSync.isConfigured(state.syncConfig)) {
      pullFromCloud({ silent: true, force: false });
    }
  }

  init();
})();
