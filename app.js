(function () {
  "use strict";

  const appData = window.ToolsSuperAppData || { tools: [], featuredIds: [], categories: {} };
  const STORAGE_KEYS = {
    theme: "tools-super-theme",
    palette: "tools-super-palette",
    favorites: "tools-super-favorites",
    recent: "tools-super-recent",
    viewMode: "tools-super-view-mode",
    onboarding: "tools-super-onboarding",
    usage: "tools-super-usage"
  };
  const PALETTES = [
    {
      id: "classic",
      name: "Classic Purple",
      description: "The original purple app feel with soft material surfaces.",
      swatches: ["#7c3aed", "#ede7f6", "#f5f3fa"]
    },
    {
      id: "berry",
      name: "Berry",
      description: "Warm pink-red accent with softer cards and highlights.",
      swatches: ["#f43f5e", "#ffe4ea", "#fff4f6"]
    },
    {
      id: "sky",
      name: "Sky",
      description: "Cool blue accent for a lighter classic dashboard look.",
      swatches: ["#0ea5e9", "#dff3ff", "#f3fbff"]
    },
    {
      id: "mint",
      name: "Mint",
      description: "Soft green accent with the original rounded card feel.",
      swatches: ["#10b981", "#def7ee", "#f2fbf7"]
    },
    {
      id: "amber",
      name: "Amber",
      description: "Gold accent with warmer surfaces and simple contrast.",
      swatches: ["#f59e0b", "#fff3d1", "#fffbef"]
    }
  ];
  const categoryLabels = Object.fromEntries(
    Object.entries(appData.categories || {}).map(function ([key, value]) {
      return [key, value.label];
    })
  );
  const toolIndex = new Map(
    (appData.tools || []).map(function (tool) {
      return [tool.id, tool];
    })
  );

  // Auto dark mode — detect system preference if no stored theme
  const _systemDark = (function () {
    try {
      return !window.localStorage.getItem("tools-super-theme") &&
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) { return false; }
  }());

  // Tool usage counts for Popular badge
  let toolUsageMap = (function () {
    try {
      const v = JSON.parse(window.localStorage.getItem("tools-super-usage") || "{}");
      return (v && typeof v === "object") ? v : {};
    } catch (e) { return {}; }
  }());

  const state = {
    theme: loadStoredValue(STORAGE_KEYS.theme, _systemDark ? "dark" : "light"),
    palette: loadStoredValue(STORAGE_KEYS.palette, "classic"),
    favorites: loadStoredArray(STORAGE_KEYS.favorites),
    recent: loadStoredArray(STORAGE_KEYS.recent),
    currentView: "dashboard",
    activeCategory: "all",
    searchTerm: "",
    activeToolId: null,
    viewMode: loadStoredValue(STORAGE_KEYS.viewMode, "grid")
  };
  const refs = {};
  let activeToolCleanup = null;
  let onboardingSlide = 0;

  if (!toolIndex.size) {
    return;
  }

  init();

  function init() {
    refs.root = document.documentElement;
    refs.metaThemeColor = document.querySelector('meta[name="theme-color"]');
    refs.viewRoot = document.getElementById("viewRoot");
    refs.searchInput = document.getElementById("searchInput");
    refs.themeToggle = document.getElementById("themeToggle");
    refs.themeToggleIcon = document.getElementById("themeToggleIcon");
    refs.paletteToggle = document.getElementById("paletteToggle");
    refs.paletteTray = document.getElementById("paletteTray");
    refs.paletteTrayOptions = document.getElementById("paletteTrayOptions");
    refs.homeBrandButton = document.getElementById("homeBrandButton");
    refs.sideRailItems = Array.from(document.querySelectorAll(".side-rail__item"));
    refs.bottomNavItems = Array.from(document.querySelectorAll(".bottom-nav__item"));
    refs.toolOverlay = document.getElementById("toolOverlay");
    refs.toolOverlayContent = document.getElementById("toolOverlayContent");
    refs.toastStack = document.getElementById("toastStack");
    refs.fabSearch = document.getElementById("fabSearch");
    refs.onboarding = document.getElementById("onboarding");
    refs.onboardingNext = document.getElementById("onboardingNext");
    refs.onboardingSkip = document.getElementById("onboardingSkip");
    refs.onboardingSlides = document.getElementById("onboardingSlides");
    refs.onboardingDots = document.getElementById("onboardingDots");

    bindStaticEvents();
    renderPaletteOptions(refs.paletteTrayOptions);
    applyAppearance();
    renderView();
    if (!loadStoredValue(STORAGE_KEYS.onboarding, "")) {
      showOnboarding();
    }
    // Hide splash screen after first render
    var splash = document.getElementById("splashScreen");
    if (splash) {
      splash.classList.add("is-hiding");
      window.setTimeout(function () { splash.hidden = true; }, 480);
    }
    // URL deep-link: ?tool=tool-id
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var toolParam = urlParams.get("tool");
      if (toolParam && toolIndex.has(toolParam)) {
        window.setTimeout(function () { openTool(toolParam); }, 50);
      }
    } catch (e) {}
    // Swipe panel down to close (mobile)
    initSwipeToClose();
  }

  function bindStaticEvents() {
    refs.searchInput.addEventListener("input", function (event) {
      state.searchTerm = String(event.target.value || "").trim().toLowerCase();
      if (state.currentView !== "dashboard") {
        state.currentView = "dashboard";
      }
      renderView();
    });

    refs.themeToggle.addEventListener("click", function () {
      state.theme = state.theme === "dark" ? "light" : "dark";
      persistState(STORAGE_KEYS.theme, state.theme);
      applyAppearance();
      renderView();
      showToast("Theme updated");
    });

    refs.paletteToggle.addEventListener("click", function () {
      const willOpen = refs.paletteTray.hidden;
      refs.paletteTray.hidden = !willOpen;
      refs.paletteToggle.setAttribute("aria-expanded", String(willOpen));
    });

    refs.homeBrandButton.addEventListener("click", function () {
      state.currentView = "dashboard";
      state.activeCategory = "all";
      renderView();
    });

    refs.sideRailItems.forEach(function (item) {
      item.addEventListener("click", function () {
        setView(item.dataset.view);
      });
    });

    refs.bottomNavItems.forEach(function (item) {
      item.addEventListener("click", function () {
        setView(item.dataset.view);
      });
    });

    if (refs.fabSearch) {
      refs.fabSearch.addEventListener("click", function () {
        refs.searchInput.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    if (refs.onboardingNext) {
      refs.onboardingNext.addEventListener("click", advanceOnboarding);
    }
    if (refs.onboardingSkip) {
      refs.onboardingSkip.addEventListener("click", dismissOnboarding);
    }
    document.addEventListener("click", handleDelegatedClick);
    document.addEventListener("keydown", handleDelegatedKeydown);
  }

  function handleDelegatedClick(event) {
    const paletteOption = event.target.closest("[data-set-palette]");
    if (paletteOption) {
      state.palette = paletteOption.dataset.setPalette;
      persistState(STORAGE_KEYS.palette, state.palette);
      applyAppearance();
      renderPaletteOptions(refs.paletteTrayOptions);
      renderView();
      showToast("Palette updated");
      return;
    }

    if (
      !refs.paletteTray.hidden &&
      !event.target.closest("#paletteTray") &&
      !event.target.closest("#paletteToggle")
    ) {
      refs.paletteTray.hidden = true;
      refs.paletteToggle.setAttribute("aria-expanded", "false");
    }

    const toggleFavoriteButton = event.target.closest("[data-toggle-favorite]");
    if (toggleFavoriteButton) {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(toggleFavoriteButton.dataset.toggleFavorite);
      return;
    }

    const openToolButton = event.target.closest("[data-open-tool]");
    if (openToolButton) {
      openTool(openToolButton.dataset.openTool);
      return;
    }

    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      state.currentView = "dashboard";
      state.activeCategory = categoryButton.dataset.category;
      renderView();
      return;
    }

    const clearDataButton = event.target.closest("[data-action='clear-data']");
    if (clearDataButton) {
      state.favorites = [];
      state.recent = [];
      persistState(STORAGE_KEYS.favorites, state.favorites);
      persistState(STORAGE_KEYS.recent, state.recent);
      renderView();
      showToast("Local app data cleared");
      return;
    }

    const resetSettingsButton = event.target.closest("[data-action='reset-settings']");
    if (resetSettingsButton) {
      state.theme = "light";
      state.palette = "classic";
      persistState(STORAGE_KEYS.theme, "light");
      persistState(STORAGE_KEYS.palette, "classic");
      applyAppearance();
      renderView();
      showToast("Appearance reset to defaults");
      return;
    }

    const closeToolTrigger = event.target.closest("[data-close-tool]");
    if (closeToolTrigger) {
      closeTool();
    }

    const openLegalButton = event.target.closest("[data-open-legal]");
    if (openLegalButton) {
      openLegalPage(openLegalButton.dataset.openLegal);
    }

    const viewToggleButton = event.target.closest("[data-toggle-view]");
    if (viewToggleButton) {
      state.viewMode = state.viewMode === "list" ? "grid" : "list";
      persistState(STORAGE_KEYS.viewMode, state.viewMode);
      renderView();
    }
  }

  function handleDelegatedKeydown(event) {
    // Ctrl+K / ⌘K — focus search from anywhere
    if ((event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      refs.searchInput.focus();
      refs.searchInput.select();
      return;
    }
    if (event.key === "Escape") {
      if (!refs.paletteTray.hidden) {
        refs.paletteTray.hidden = true;
        refs.paletteToggle.setAttribute("aria-expanded", "false");
      }
      if (state.activeToolId) {
        closeTool();
      }
      return;
    }

    const opener = event.target.closest("[data-open-tool]");
    if (opener && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openTool(opener.dataset.openTool);
    }
  }

  function setView(view) {
    state.currentView = view;
    renderView();
  }

  function applyAppearance() {
    if (!PALETTES.some(function (palette) { return palette.id === state.palette; })) {
      state.palette = "classic";
    }

    refs.root.dataset.theme = state.theme;
    refs.root.dataset.palette = state.palette;
    refs.themeToggleIcon.textContent = state.theme === "dark" ? "light_mode" : "dark_mode";
    window.requestAnimationFrame(function () {
      if (refs.metaThemeColor) {
        const computed = getComputedStyle(refs.root);
        refs.metaThemeColor.setAttribute("content", computed.getPropertyValue("--primary").trim());
      }
    });
  }

  function renderView() {
    syncNavigation();

    if (state.currentView === "favorites") {
      renderFavoritesView();
      return;
    }
    if (state.currentView === "recent") {
      renderRecentView();
      return;
    }
    if (state.currentView === "settings") {
      renderSettingsView();
      return;
    }
    renderDashboardView();
  }

  function syncNavigation() {
    refs.sideRailItems.forEach(function (item) {
      item.classList.toggle("is-active", item.dataset.view === state.currentView);
    });
    refs.bottomNavItems.forEach(function (item) {
      item.classList.toggle("is-active", item.dataset.view === state.currentView);
    });
  }

  function renderDashboardView() {
    const filteredTools = getFilteredTools();
    const featuredTools = getToolsFromIds(appData.featuredIds);
    const recentTools = getToolsFromIds(state.recent);
    const favoriteTools = getToolsFromIds(state.favorites);
    const searchScoped = Boolean(state.searchTerm) || state.activeCategory !== "all";

    const sections = [
      renderHeroCard(featuredTools.slice(0, 4))
    ];

    if (!searchScoped && recentTools.length) {
      sections.push(renderContinueCard(recentTools[0]));
      sections.push(renderHorizontalSection("Recent", "Your last opened tools.", recentTools));
    }

    if (!searchScoped && favoriteTools.length) {
      sections.push(renderHorizontalSection("Favorites", "Your saved shortcuts.", favoriteTools));
    }

    sections.push(renderExploreSection(filteredTools, searchScoped));

    refs.viewRoot.innerHTML = '<div class="dashboard-grid">' + sections.join("") + "</div>";
  }

  function renderFavoritesView() {
    const favoriteTools = getToolsFromIds(state.favorites);
    refs.viewRoot.innerHTML =
      '<div class="dashboard-grid">' +
      renderSectionShell(
        "Favorites",
        "Starred tools appear here for quick access.",
        favoriteTools.length
          ? '<div class="tool-grid">' + favoriteTools.map(function (tool) { return renderToolCard(tool); }).join("") + "</div>"
          : renderEmptySurface(
              "No favorites yet",
              "Star tools from the home view or tool dialog to build a personal shortcut shelf."
            )
      ) +
      "</div>";
  }

  function renderRecentView() {
    const recentTools = getToolsFromIds(state.recent);
    refs.viewRoot.innerHTML =
      '<div class="dashboard-grid">' +
      renderSectionShell(
        "Recent",
        "Tools you opened most recently.",
        recentTools.length
          ? '<div class="tool-grid">' + recentTools.map(function (tool) { return renderToolCard(tool); }).join("") + "</div>"
          : renderEmptySurface(
              "Nothing opened yet",
              "Open any tool from the home view and it will appear here automatically."
            )
      ) +
      "</div>";
  }

  function renderSettingsView() {
    refs.viewRoot.innerHTML =
      '<div class="dashboard-grid">' +
      '<div class="settings-profile-card">' +
      '<div class="settings-profile-card__icon"><span class="material-symbols-rounded">construction</span></div>' +
      '<div><p class="settings-profile-card__title">Tools Super App</p>' +
      '<p class="settings-profile-card__meta">' + appData.tools.length + ' tools &nbsp;&middot;&nbsp; ' +
      state.favorites.length + ' favorites &nbsp;&middot;&nbsp; ' +
      (state.theme === "dark" ? "Dark" : "Light") + ' mode</p>' +
      '</div>' +
      '</div>' +
      '<div class="settings-grid">' +
      '<section class="section-card">' +
      '<div class="section-heading"><div><h2>Appearance</h2></div><p class="section-heading__meta">Theme and accent color settings.</p></div>' +
      '<div class="settings-row"><div class="list-row"><div><strong>Dark mode</strong><p class="settings-row__detail">Switch between light and dark theme styles.</p></div><button class="switch ' + (state.theme === "dark" ? "is-active" : "") + '" type="button" id="inlineThemeSwitch" aria-label="Toggle theme"></button></div></div>' +
      '<div class="settings-row"><div><strong>Accent color</strong><p class="settings-row__detail">Choose a classic accent color for the app.</p></div><div class="palette-options" id="settingsPaletteOptions"></div></div>' +
      '<div class="settings-row"><button class="button button--surface" type="button" data-action="reset-settings"><span class="material-symbols-rounded">restart_alt</span><span>Reset to defaults</span></button></div>' +
      "</section>" +
      '<section class="section-card">' +
      '<div class="section-heading"><div><h2>Privacy</h2></div><p class="section-heading__meta">Everything runs in the browser.</p></div>' +
      '<div class="settings-row"><strong>Data storage</strong><p class="settings-row__detail">Favorites, recent tools, theme, and accent are stored only in your browser on this device.</p></div>' +
      '<div class="settings-row"><strong>Tool execution</strong><p class="settings-row__detail">Calculators, formatters, QR, barcode, image tools, and hashing run client-side.</p></div>' +
      '<div class="settings-row"><strong>Currency rates</strong><p class="settings-row__detail">Currency conversion still uses bundled static rates, not live market data.</p></div>' +
      "</section>" +
      '<section class="section-card">' +
      '<div class="section-heading"><div><h2>About</h2></div><p class="section-heading__meta">Classic style with the upgraded split-file structure and tool fixes.</p></div>' +
      '<div class="stat-strip">' +
      renderStatChip("Total tools", String(appData.tools.length)) +
      renderStatChip("Favorites", String(state.favorites.length)) +
      renderStatChip("Recent", String(state.recent.length)) +
      "</div>" +
      '<div class="settings-row"><strong>Version note</strong><p class="settings-row__detail">The app keeps the new code structure and tool quality improvements, but the shell styling is back to the older look.</p></div>' +
      '<div class="settings-row"><button class="button button--surface" type="button" data-action="clear-data"><span class="material-symbols-rounded">delete</span><span>Clear local app data</span></button></div>' +
      "</section>" +
      '<section class="section-card">' +
      '<div class="section-heading"><div><h2>Legal</h2></div><p class="section-heading__meta">App policies and usage terms.</p></div>' +
      '<div class="settings-row"><div class="list-row"><div><strong>Privacy Policy</strong><p class="settings-row__detail">How we handle app data and your privacy.</p></div><button class="button button--surface" type="button" data-open-legal="privacy"><span class="material-symbols-rounded">privacy_tip</span><span>View</span></button></div></div>' +
      '<div class="settings-row"><div class="list-row"><div><strong>Terms &amp; Conditions</strong><p class="settings-row__detail">Rules and conditions for using the app.</p></div><button class="button button--surface" type="button" data-open-legal="terms"><span class="material-symbols-rounded">gavel</span><span>View</span></button></div></div>' +
      "</section>" +
      "</div>" +
      "</div>";

    const inlineThemeSwitch = document.getElementById("inlineThemeSwitch");
    if (inlineThemeSwitch) {
      inlineThemeSwitch.addEventListener("click", function () {
        state.theme = state.theme === "dark" ? "light" : "dark";
        persistState(STORAGE_KEYS.theme, state.theme);
        applyAppearance();
        renderView();
      });
    }

    const settingsPaletteOptions = document.getElementById("settingsPaletteOptions");
    if (settingsPaletteOptions) {
      renderPaletteOptions(settingsPaletteOptions);
    }
  }

  function renderHeroCard(featuredTools) {
    return (
      '<section class="hero-card">' +
      '<div class="hero-card__layout">' +
      '<div class="hero-card__headline">' +
      '<p class="eyebrow">Tools Super App</p>' +
      '<h2 class="hero-card__title">43+ advanced utilities in one place</h2>' +
      '<p class="hero-card__copy">Text tools, calculators, image helpers, QR, barcode, hash, regex, diff, and more with the familiar simpler app style.</p>' +
      "</div>" +
      '<div class="hero-card__stats">' +
      renderStatChip("Utilities", String(appData.tools.length)) +
      renderStatChip("Favorites", String(state.favorites.length)) +
      renderStatChip("Recent", String(state.recent.length)) +
      "</div>" +
      '<div class="hero-card__actions">' +
      featuredTools
        .map(function (tool) {
          return (
            '<button class="hero-quick-action" type="button" data-open-tool="' +
            tool.id +
            '">' +
            renderIcon(tool.icon) +
            "<span>" +
            escapeHtml(tool.name) +
            "</span></button>"
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderContinueCard(tool) {
    return (
      '<div class="continue-card" role="button" tabindex="0" data-open-tool="' +
      tool.id +
      '">' +
      '<div class="continue-card__inner">' +
      '<div class="tool-card__icon">' +
      renderIcon(tool.icon) +
      "</div>" +
      '<div class="continue-card__body">' +
      '<p class="continue-card__label">Continue where you left off</p>' +
      '<p class="continue-card__name">' +
      escapeHtml(tool.name) +
      "</p>" +
      '<p class="continue-card__category">' +
      escapeHtml(categoryLabels[tool.category] || tool.category) +
      "</p>" +
      "</div>" +
      "</div>" +
      '<span class="material-symbols-rounded continue-card__arrow">arrow_forward</span>' +
      "</div>"
    );
  }

  function renderExploreSection(filteredTools, searchScoped) {
    const scopeLabel = searchScoped
      ? "Showing " + filteredTools.length + " matching tools"
      : "Tap a category chip or search to find a tool";

    const isList = state.viewMode === "list";
    const content = filteredTools.length
      ? (isList
          ? '<div class="tool-grid tool-grid--list">' + filteredTools.map(function (tool) { return renderToolCardList(tool); }).join("") + "</div>"
          : '<div class="tool-grid">' + filteredTools.map(function (tool) { return renderToolCard(tool); }).join("") + "</div>")
      : renderEmptySurface(
          "No matching tools",
          "Try a different search term or switch back to the full catalog."
        );

    return (
      '<section class="section-card">' +
      '<div class="section-heading"><div><h2>Browse Tools</h2></div>' +
      '<div class="section-heading__right">' +
      '<p class="section-heading__meta">' + escapeHtml(scopeLabel) + "</p>" +
      '<button class="icon-button view-toggle-btn" type="button" data-toggle-view aria-label="Toggle view mode">' +
      renderIcon(isList ? "grid_view" : "view_list") +
      "</button></div></div>" +
      renderCategoryChips() +
      content +
      "</section>"
    );
  }

  function renderHorizontalSection(title, subtitle, tools) {
    return renderSectionShell(
      title,
      subtitle,
      '<div class="tool-grid tool-grid--compact">' + tools.slice(0, 8).map(function (tool) { return renderToolCard(tool); }).join("") + "</div>"
    );
  }

  function renderCategorySection(category, tools) {
    const categoryMeta = appData.categories[category] || { label: category, description: "" };
    return renderSectionShell(
      categoryMeta.label,
      categoryMeta.description,
      '<div class="tool-grid">' + tools.map(function (tool) { return renderToolCard(tool); }).join("") + "</div>"
    );
  }

  function renderSectionShell(title, subtitle, content) {
    return (
      '<section class="section-card">' +
      '<div class="section-heading"><div><h2>' +
      escapeHtml(title) +
      "</h2></div><p class=\"section-heading__meta\">" +
      escapeHtml(subtitle) +
      "</p></div>" +
      content +
      "</section>"
    );
  }

  function renderCategoryChips() {
    const categories = [{ id: "all", label: "All" }].concat(
      Object.keys(appData.categories || {})
        .filter(function (key) {
          return key !== "all";
        })
        .map(function (key) {
          return { id: key, label: appData.categories[key].label };
        })
    );

    return (
      '<div class="segmented-filter">' +
      categories
        .map(function (category) {
          return (
            '<button class="chip ' +
            (state.activeCategory === category.id ? "is-active" : "") +
            '" type="button" data-category="' +
            category.id +
            '">' +
            escapeHtml(category.label) +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderToolCard(tool) {
    const isFavorite = state.favorites.includes(tool.id);
    const isPopular = (toolUsageMap[tool.id] || 0) >= 3;
    const term = state.searchTerm || "";
    return (
      '<article class="tool-card" role="button" tabindex="0" data-open-tool="' +
      tool.id +
      '">' +
      '<div class="tool-card__top">' +
      '<div class="tool-card__icon">' +
      renderIcon(tool.icon) +
      "</div>" +
      '<button class="favorite-button ' +
      (isFavorite ? "is-active" : "") +
      '" type="button" aria-label="' +
      (isFavorite ? "Remove from favorites" : "Add to favorites") +
      '" data-toggle-favorite="' +
      tool.id +
      '">' +
      renderIcon(isFavorite ? "kid_star" : "star") +
      "</button>" +
      "</div>" +
      '<div class="tool-card__body">' +
      (isPopular ? '<span class="tool-popular-badge">Popular</span>' : "") +
      '<p class="tool-card__name">' +
      highlightText(tool.name, term) +
      "</p>" +
      '<p class="tool-card__description">' +
      highlightText(tool.description, term) +
      "</p>" +
      '<p class="tool-card__keywords">' +
      escapeHtml((tool.keywords || []).slice(0, 3).join(" / ")) +
      "</p>" +
      "</div>" +
      "</article>"
    );
  }

  function renderToolCardList(tool) {
    const isFavorite = state.favorites.includes(tool.id);
    const term = state.searchTerm || "";
    return (
      '<article class="tool-card tool-card--list" role="button" tabindex="0" data-open-tool="' +
      tool.id +
      '">' +
      '<div class="tool-card__icon">' +
      renderIcon(tool.icon) +
      "</div>" +
      '<div class="tool-card--list__body">' +
      '<p class="tool-card__name">' +
      highlightText(tool.name, term) +
      "</p>" +
      '<p class="tool-card__description">' +
      highlightText(tool.description, term) +
      "</p>" +
      "</div>" +
      '<button class="favorite-button ' +
      (isFavorite ? "is-active" : "") +
      '" type="button" aria-label="' +
      (isFavorite ? "Remove from favorites" : "Add to favorites") +
      '" data-toggle-favorite="' +
      tool.id +
      '">' +
      renderIcon(isFavorite ? "kid_star" : "star") +
      "</button>" +
      "</article>"
    );
  }

  function renderListRow(tool) {
    return (
      '<article class="list-row" role="button" tabindex="0" data-open-tool="' +
      tool.id +
      '">' +
      '<div class="list-row__icon">' +
      renderIcon(tool.icon) +
      "</div>" +
      '<div class="list-row__body"><strong>' +
      escapeHtml(tool.name) +
      "</strong><p class=\"supporting-copy\">" +
      escapeHtml(tool.description) +
      "</p></div>" +
      "</article>"
    );
  }

  function renderPaletteOptions(host) {
    host.innerHTML = PALETTES.map(function (palette) {
      return (
        '<button class="palette-option ' +
        (palette.id === state.palette ? "is-active" : "") +
        '" type="button" data-set-palette="' +
        palette.id +
        '">' +
        '<div><strong>' +
        escapeHtml(palette.name) +
        "</strong><p class=\"supporting-copy\">" +
        escapeHtml(palette.description) +
        "</p></div>" +
        '<div class="palette-option__swatches">' +
        palette.swatches
          .map(function (swatch) {
            return '<span class="palette-option__swatch" style="background:' + swatch + ';"></span>';
          })
          .join("") +
        "</div>" +
        "</button>"
      );
    }).join("");
  }

  function renderStatChip(label, value) {
    return (
      '<div class="stat-chip"><span class="stat-chip__label">' +
      escapeHtml(label) +
      '</span><span class="stat-chip__value">' +
      escapeHtml(value) +
      "</span></div>"
    );
  }

  function renderEmptySurface(title, detail) {
    return (
      '<div class="empty-surface">' +
      renderIcon("search_off") +
      "<strong>" +
      escapeHtml(title) +
      "</strong><p>" +
      escapeHtml(detail) +
      "</p></div>"
    );
  }

  function getFilteredTools() {
    return appData.tools.filter(function (tool) {
      if (state.activeCategory !== "all" && tool.category !== state.activeCategory) {
        return false;
      }
      if (!state.searchTerm) {
        return true;
      }
      const haystack = [tool.name, tool.description].concat(tool.keywords || []).join(" ").toLowerCase();
      return haystack.includes(state.searchTerm);
    });
  }

  function getFilteredToolsByCategory(category) {
    return appData.tools.filter(function (tool) {
      return tool.category === category;
    });
  }

  function getToolsFromIds(ids) {
    return ids
      .map(function (id) {
        return toolIndex.get(id);
      })
      .filter(Boolean);
  }

  function toggleFavorite(toolId) {
    if (!toolIndex.has(toolId)) {
      return;
    }
    if (state.favorites.includes(toolId)) {
      state.favorites = state.favorites.filter(function (id) {
        return id !== toolId;
      });
      showToast("Removed from favorites");
    } else {
      state.favorites = [toolId].concat(
        state.favorites.filter(function (id) {
          return id !== toolId;
        })
      );
      showToast("Added to favorites");
    }
    persistState(STORAGE_KEYS.favorites, state.favorites);
    syncOverlayFavoriteButton();
    renderView();
  }

  function addToRecent(toolId) {
    state.recent = [toolId].concat(
      state.recent.filter(function (id) {
        return id !== toolId;
      })
    ).slice(0, 10);
    persistState(STORAGE_KEYS.recent, state.recent);
    // Track usage count for Popular badge
    toolUsageMap[toolId] = (toolUsageMap[toolId] || 0) + 1;
    try { window.localStorage.setItem(STORAGE_KEYS.usage, JSON.stringify(toolUsageMap)); } catch (e) {}
  }

  function openTool(toolId) {
    const tool = toolIndex.get(toolId);
    if (!tool) {
      return;
    }

    if (state.activeToolId && state.activeToolId !== toolId) {
      closeTool();
    }

    state.activeToolId = toolId;
    addToRecent(toolId);
    renderView();

    refs.toolOverlayContent.innerHTML =
      '<div class="tool-dialog">' +
      '<header class="tool-dialog__header">' +
      '<div class="tool-dialog__title-row">' +
      '<div class="tool-card__icon">' +
      renderIcon(tool.icon) +
      "</div>" +
      '<div><p class="eyebrow">' +
      escapeHtml(categoryLabels[tool.category] || tool.category) +
      '</p><h2 class="tool-dialog__title" id="toolTitle">' +
      escapeHtml(tool.name) +
      '</h2><p class="tool-dialog__description">' +
      escapeHtml(tool.description) +
      "</p></div>" +
      "</div>" +
      '<div class="tool-dialog__header-actions">' +
      '<button class="favorite-button" type="button" id="toolDialogFavorite" data-toggle-favorite="' +
      tool.id +
      '"></button>' +
      '<button class="icon-button" type="button" aria-label="Close tool" data-close-tool>' +
      renderIcon("close") +
      "</button>" +
      "</div>" +
      "</header>" +
      '<div id="toolDialogMount"></div>' +
      "</div>";

    syncOverlayFavoriteButton();

    const mount = document.getElementById("toolDialogMount");
    if (mount && typeof tool.render === "function") {
      const renderResult = tool.render(createToolContext(tool, mount));
      activeToolCleanup = renderResult && typeof renderResult.dispose === "function"
        ? renderResult.dispose
        : null;
    }

    refs.toolOverlay.classList.add("is-open");
    refs.toolOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    // Update URL for shareable deep link
    try { history.replaceState(null, "", "?tool=" + encodeURIComponent(toolId)); } catch (e) {}
  }

  function openLegalPage(type) {
    const isPrivacy = type === "privacy";
    const title = isPrivacy ? "Privacy Policy" : "Terms & Conditions";
    const icon = isPrivacy ? "privacy_tip" : "gavel";
    const effectiveDate = "April 20, 2026";
    const content = isPrivacy
      ? '<p class="settings-row__detail">Effective Date: ' + effectiveDate + '</p>' +
        '<p>Tools Super App respects your privacy. This Privacy Policy explains how our app handles user data.</p>' +
        '<h3>1. Information We Collect</h3><p>We may collect limited non-personal information such as app performance data, crash reports, device type, OS version, and anonymous usage analytics.</p>' +
        '<h3>2. How We Use Information</h3><p>We use collected information to improve performance, fix bugs, enhance user experience, analyze app usage trends, and show ads if enabled.</p>' +
        '<h3>3. Local Processing</h3><p>Many features work directly on your device. Input text, images, and tool data are generally processed locally and are not uploaded unless stated otherwise.</p>' +
        '<h3>4. Data Sharing</h3><p>We do not sell your personal data. Some limited data may be shared with analytics, crash reporting, or advertising services.</p>' +
        '<h3>5. Advertising</h3><p>If ads are enabled, ad providers such as Google AdMob may collect identifiers and usage information according to their own privacy policies.</p>' +
        '<h3>6. Security</h3><p>We take reasonable steps to protect user information, but no system is 100% secure.</p>' +
        '<h3>7. Children&apos;s Privacy</h3><p>Our app is not intended to knowingly collect personal information from children under 13.</p>' +
        '<h3>8. Changes to This Policy</h3><p>We may update this Privacy Policy from time to time. Changes will appear on this page with a revised effective date.</p>' +
        '<h3>9. Contact Us</h3><p>Email: saifbd308@gmail.com</p>'
      : '<p class="settings-row__detail">Effective Date: ' + effectiveDate + '</p>' +
        '<p>By downloading or using Tools Super App, you agree to these Terms and Conditions.</p>' +
        '<h3>1. Use of the App</h3><p>You agree to use the app only for lawful purposes and in a way that does not harm the app or other users.</p>' +
        '<h3>2. No Guarantee</h3><p>We do not guarantee that tool outputs will always be error-free, complete, or suitable for every use case.</p>' +
        '<h3>3. Intellectual Property</h3><p>All branding, design, content, and software elements of the app belong to the developer unless otherwise stated.</p>' +
        '<h3>4. Tool Results</h3><p>Tool outputs are provided for convenience only. Users should verify important results independently.</p>' +
        '<h3>5. Advertisements</h3><p>The app may contain third-party ads. We are not responsible for advertiser content or services.</p>' +
        '<h3>6. Third-Party Services</h3><p>The app may use analytics, crash reporting, and advertising services that are subject to their own terms.</p>' +
        '<h3>7. Limitation of Liability</h3><p>We are not liable for any loss or damage arising from the use of the app.</p>' +
        '<h3>8. Updates</h3><p>We may update, modify, or remove app features at any time without notice.</p>' +
        '<h3>9. Changes to Terms</h3><p>We may update these Terms and Conditions at any time. Continued use of the app means acceptance of the latest version.</p>' +
        '<h3>10. Contact</h3><p>Email: saifbd308@gmail.com</p>';

    refs.toolOverlayContent.innerHTML =
      '<div class="tool-dialog">' +
      '<header class="tool-dialog__header">' +
      '<div class="tool-dialog__title-row">' +
      '<div class="tool-card__icon"><span class="material-symbols-rounded">' + icon + '</span></div>' +
      '<div><p class="eyebrow">Legal</p><h2 class="tool-dialog__title" id="toolTitle">' + title + '</h2></div>' +
      '</div>' +
      '<div class="tool-dialog__header-actions">' +
      '<button class="icon-button" type="button" aria-label="Close" data-close-tool><span class="material-symbols-rounded">close</span></button>' +
      '</div>' +
      '</header>' +
      '<div class="legal-page-body">' + content + '</div>' +
      '</div>';

    refs.toolOverlay.classList.add("is-open");
    refs.toolOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function showOnboarding() {
    if (refs.onboarding) {
      refs.onboarding.hidden = false;
      document.body.classList.add("modal-open");
    }
  }

  function advanceOnboarding() {
    onboardingSlide = onboardingSlide + 1;
    if (onboardingSlide >= 3) {
      dismissOnboarding();
      return;
    }
    var allSlides = refs.onboardingSlides
      ? Array.from(refs.onboardingSlides.querySelectorAll(".onboarding-slide"))
      : [];
    allSlides.forEach(function (s, i) {
      s.classList.toggle("is-active", i === onboardingSlide);
    });
    var allDots = refs.onboardingDots
      ? Array.from(refs.onboardingDots.querySelectorAll(".onboarding-dot"))
      : [];
    allDots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === onboardingSlide);
    });
    if (refs.onboardingNext && onboardingSlide === 2) {
      refs.onboardingNext.textContent = "Get Started";
    }
  }

  function dismissOnboarding() {
    if (refs.onboarding) {
      refs.onboarding.hidden = true;
    }
    document.body.classList.remove("modal-open");
    persistState(STORAGE_KEYS.onboarding, "done");
  }

  function initSwipeToClose() {
    var panel = refs.toolOverlay ? refs.toolOverlay.querySelector(".tool-overlay__panel") : null;
    if (!panel) { return; }
    var startY = 0;
    var dragging = false;
    panel.addEventListener("touchstart", function (e) {
      if (e.target.closest(".tool-overlay__handle")) {
        startY = e.touches[0].clientY;
        dragging = true;
      }
    }, { passive: true });
    panel.addEventListener("touchmove", function (e) {
      if (!dragging) { return; }
      var dy = e.touches[0].clientY - startY;
      if (dy > 0) { panel.style.transform = "translateY(" + dy + "px)"; }
    }, { passive: true });
    panel.addEventListener("touchend", function (e) {
      if (!dragging) { return; }
      dragging = false;
      var dy = e.changedTouches[0].clientY - startY;
      panel.style.transform = "";
      if (dy > 90) { closeTool(); }
    }, { passive: true });
  }

  function closeTool() {
    if (typeof activeToolCleanup === "function") {
      try {
        activeToolCleanup();
      } catch (error) {
        // Ignore cleanup failures and continue closing the dialog.
      }
    }
    activeToolCleanup = null;
    state.activeToolId = null;
    refs.toolOverlay.classList.remove("is-open");
    refs.toolOverlay.setAttribute("aria-hidden", "true");
    refs.toolOverlayContent.innerHTML = "";
    document.body.classList.remove("modal-open");
    // Clear URL param
    try { history.replaceState(null, "", window.location.pathname); } catch (e) {}
  }

  function syncOverlayFavoriteButton() {
    const button = document.getElementById("toolDialogFavorite");
    if (!button || !state.activeToolId) {
      return;
    }
    const isFavorite = state.favorites.includes(state.activeToolId);
    button.classList.toggle("is-active", isFavorite);
    button.setAttribute("aria-label", isFavorite ? "Remove from favorites" : "Add to favorites");
    button.innerHTML = renderIcon(isFavorite ? "kid_star" : "star");
  }

  function createToolContext(tool, mount) {
    return {
      tool: tool,
      renderToolShell: function (options) {
        return renderToolShell(mount, tool, options || {});
      },
      renderResultPanel: renderResultPanel,
      setEmptyState: setEmptyState,
      setErrorState: setErrorState,
      setSuccessState: setSuccessState,
      createActionButton: createActionButton,
      attachCopyAction: attachCopyAction,
      attachDownloadAction: attachDownloadAction,
      copyText: copyText,
      downloadText: downloadText,
      downloadBlob: downloadBlob,
      downloadUrl: downloadUrl,
      showToast: showToast,
      escapeHtml: escapeHtml,
      formatNumber: formatNumber
    };
  }

  function renderToolShell(host, tool, options) {
    const wrapper = document.createElement("section");
    wrapper.className = "tool-workspace";
    wrapper.innerHTML =
      '<section class="tool-workspace__summary">' +
      '<p class="eyebrow">' + escapeHtml(options.eyebrow || "Workspace") + '</p>' +
      '<h3 class="tool-dialog__title" style="margin:6px 0 8px; font-size:1.65rem;">' +
      escapeHtml(options.title || tool.name) +
      "</h3>" +
      '<p class="body-copy">' +
      escapeHtml(options.intro || tool.description) +
      "</p>" +
      "</section>" +
      '<div class="tool-workspace__grid">' +
      '<section class="tool-workspace__controls" data-tool-controls></section>' +
      '<aside class="tool-workspace__aside" data-tool-aside></aside>' +
      "</div>";

    host.replaceChildren(wrapper);

    const controls = wrapper.querySelector("[data-tool-controls]");
    const aside = wrapper.querySelector("[data-tool-aside]");
    const resultPanel = renderResultPanel(aside, {
      eyebrow: options.resultEyebrow || "Output",
      title: options.resultTitle || "Ready for input",
      detail: options.resultDetail || "Add data or run a tool action to populate this panel."
    });
    const actions = document.createElement("div");
    actions.className = "tool-actions";
    aside.appendChild(actions);

    return {
      root: wrapper,
      controls: controls,
      aside: aside,
      actions: actions,
      resultPanel: resultPanel,
      resultBody: resultPanel.body
    };
  }

  function renderResultPanel(host, options) {
    const panel = document.createElement("section");
    panel.className = "result-panel";
    panel.innerHTML =
      '<div class="result-panel__header">' +
      '<div><p class="eyebrow">' +
      escapeHtml(options.eyebrow || "Output") +
      '</p><h4 class="result-panel__title">' +
      escapeHtml(options.title || "Ready") +
      '</h4></div><span class="state-pill" data-state="empty">Waiting</span>' +
      "</div>" +
      '<p class="result-panel__detail">' +
      escapeHtml(options.detail || "") +
      '</p><div class="result-panel__body"></div>';
    host.appendChild(panel);

    return {
      root: panel,
      title: panel.querySelector(".result-panel__title"),
      detail: panel.querySelector(".result-panel__detail"),
      badge: panel.querySelector(".state-pill"),
      body: panel.querySelector(".result-panel__body")
    };
  }

  function setEmptyState(panel, title, detail) {
    updatePanelState(panel, "empty", "Waiting", title, detail);
  }

  function setErrorState(panel, title, detail) {
    updatePanelState(panel, "error", "Error", title, detail);
  }

  function setSuccessState(panel, title, detail) {
    updatePanelState(panel, "success", "Ready", title, detail);
  }

  function updatePanelState(panel, stateLabel, badgeLabel, title, detail) {
    panel.badge.dataset.state = stateLabel;
    panel.badge.textContent = badgeLabel;
    panel.title.textContent = title;
    panel.detail.textContent = detail;
  }

  function createActionButton(options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button " + (options.variant ? "button--" + options.variant : "button--surface");
    button.innerHTML = renderIcon(options.icon || "bolt") + "<span>" + escapeHtml(options.label || "Action") + "</span>";
    if (options.onClick) {
      button.addEventListener("click", options.onClick);
    }
    if (options.disabled) {
      button.disabled = true;
    }
    return button;
  }

  function attachCopyAction(host, options) {
    const button = createActionButton({
      icon: options.icon || "content_copy",
      label: options.label || "Copy result",
      variant: options.variant || "surface"
    });
    const origInner = button.innerHTML;
    button.addEventListener("click", function () {
      const value = typeof options.getValue === "function" ? options.getValue() : "";
      if (!value) {
        showToast(options.emptyMessage || "Nothing to copy yet");
        return;
      }
      copyText(String(value))
        .then(function () {
          showToast(options.successMessage || "Copied to clipboard");
          // Animated checkmark feedback
          button.classList.add("copy-success");
          button.innerHTML = renderIcon("check_circle") + "<span>Copied!</span>";
          window.setTimeout(function () {
            button.innerHTML = origInner;
            button.classList.remove("copy-success");
          }, 1800);
        })
        .catch(function () {
          showToast("Clipboard access failed");
        });
    });
    host.appendChild(button);
    return button;
  }

  function attachDownloadAction(host, options) {
    const button = createActionButton({
      icon: options.icon || "download",
      label: options.label || "Download",
      variant: options.variant || "surface"
    });
    button.addEventListener("click", function () {
      const payload = typeof options.getPayload === "function" ? options.getPayload() : null;
      if (!payload) {
        showToast(options.emptyMessage || "Nothing to download yet");
        return;
      }
      if (payload.blob) {
        downloadBlob(payload.filename, payload.blob);
      } else if (payload.url) {
        downloadUrl(payload.filename, payload.url);
      } else if (payload.text !== undefined) {
        downloadText(payload.filename, payload.text, payload.type);
      }
      showToast(options.successMessage || "Download started");
    });
    host.appendChild(button);
    return button;
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value);
    }
    return new Promise(function (resolve, reject) {
      const helper = document.createElement("textarea");
      helper.value = value;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      const success = document.execCommand("copy");
      helper.remove();
      if (success) {
        resolve();
      } else {
        reject(new Error("Copy failed"));
      }
    });
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    downloadBlob(filename, blob);
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    downloadUrl(filename, url);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1200);
  }

  function downloadUrl(filename, url) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "download";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    refs.toastStack.appendChild(toast);
    window.setTimeout(function () {
      toast.remove();
    }, 2400);
  }

  function renderIcon(name) {
    return '<span class="material-symbols-rounded">' + escapeHtml(name) + "</span>";
  }

  function formatNumber(value, maximumFractionDigits) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: maximumFractionDigits == null ? 2 : maximumFractionDigits
    }).format(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function highlightText(text, term) {
    var escaped = escapeHtml(text);
    if (!term) { return escaped; }
    var escapedTerm = escapeHtml(term);
    var idx = escaped.toLowerCase().indexOf(escapedTerm.toLowerCase());
    if (idx === -1) { return escaped; }
    return escaped.slice(0, idx) +
      '<mark class="search-hl">' + escaped.slice(idx, idx + escapedTerm.length) + "</mark>" +
      escaped.slice(idx + escapedTerm.length);
  }

  function loadStoredValue(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function loadStoredArray(key) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value.filter(function (item) { return typeof item === "string"; }) : [];
    } catch (error) {
      return [];
    }
  }

  function persistState(key, value) {
    try {
      window.localStorage.setItem(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
    } catch (error) {
      return;
    }
  }
})();
