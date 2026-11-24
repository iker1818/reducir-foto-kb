(function () {
  "use strict";
  var inSubfolder = /\/(fotos|conversiones|finanzas|documentos|info)\//.test(window.location.pathname);
  var prefix = inSubfolder ? "../" : "";
  var appearanceStorageKey = "hazlofacil-tools-appearance";
  var appearance = { theme: "auto" };

  try {
    var savedAppearance = JSON.parse(localStorage.getItem(appearanceStorageKey) || "null");
    if (savedAppearance && typeof savedAppearance === "object") {
      if (["auto", "light", "dark"].includes(savedAppearance.theme)) appearance.theme = savedAppearance.theme;
    }
  } catch (error) {}

  function applyAppearance() {
    var root = document.documentElement;
    root.setAttribute("data-theme", appearance.theme);
  }

  function saveAppearance() {
    applyAppearance();
    try { localStorage.setItem(appearanceStorageKey, JSON.stringify({ theme: appearance.theme })); } catch (error) {}
  }

  applyAppearance();

  if (!document.querySelector(".nav")) {
    var createdNav = document.createElement("nav");
    createdNav.className = "nav";
    createdNav.setAttribute("aria-label", "Principal");
    createdNav.innerHTML =
      '<div class="container nav__inner"><a class="brand" href="' + prefix + 'index.html" data-i18n-aria="brand.home"><img class="brand__logo" src="' + prefix + 'img/Logo.jfif" alt="Logotipo de Make Easy, herramientas sencillas" data-i18n-alt="brand.logoAlt"></a>' +
      '<button class="nav__toggle btn btn--ghost" type="button" aria-expanded="false" aria-controls="nav-menu">Menú</button>' +
      '<ul id="nav-menu" class="nav__menu">' +
      '<li class="nav__item nav__item--dropdown"><button class="nav__dropdown-toggle" type="button" aria-expanded="false" aria-controls="submenu-fotos">Fotos</button><ul id="submenu-fotos" class="nav__submenu">' +
      '<li><a href="' + prefix + 'fotos/reducir-foto.html">Reducir foto</a></li><li><a href="' + prefix + 'fotos/quitar-fondo.html">Quitar fondo</a></li><li><a href="' + prefix + 'fotos/cambiar-formato.html">Cambiar formato de fotos</a></li><li><a href="' + prefix + 'fotos/foto-carnet.html">Foto carnet / Pasaporte / DNI</a></li><li><a href="' + prefix + 'fotos/mejorar-resolucion.html">Mejorar resolución</a></li></ul></li>' +
      '<li class="nav__item nav__item--dropdown"><button class="nav__dropdown-toggle" type="button" aria-expanded="false" aria-controls="submenu-convertidores">Convertidores</button><ul id="submenu-convertidores" class="nav__submenu">' +
      '<li><a href="' + prefix + 'conversiones/unidades.html">Convertidor de unidades</a></li><li><a href="' + prefix + 'conversiones/imagen-a-pdf.html">Imagen ↔ PDF</a></li><li><a href="' + prefix + 'conversiones/convertidor-monedas.html">Convertidor de monedas</a></li></ul></li>' +
      '<li class="nav__item nav__item--dropdown"><button class="nav__dropdown-toggle" type="button" aria-expanded="false" aria-controls="submenu-finanzas">Finanzas</button><ul id="submenu-finanzas" class="nav__submenu">' +
      '<li><a href="' + prefix + 'finanzas/interes.html">Calculadora de interés compuesto</a></li><li><a href="' + prefix + 'finanzas/porcentajes.html">Calculadora de porcentajes</a></li><li><a href="' + prefix + 'finanzas/prestamo.html">Calculadora de cuota de préstamo / hipoteca</a></li></ul></li>' +
      '<li class="nav__item nav__item--dropdown"><button class="nav__dropdown-toggle" type="button" aria-expanded="false" aria-controls="submenu-documentos">Documentos</button><ul id="submenu-documentos" class="nav__submenu">' +
      '<li><a href="' + prefix + 'documentos/combinar-pdf.html">Combinar PDF</a></li><li><a href="' + prefix + 'documentos/dividir-pdf.html">Dividir PDF</a></li><li><a href="' + prefix + 'documentos/comprimir-pdf.html">Comprimir PDF</a></li><li><a href="' + prefix + 'documentos/ocr.html">Extraer texto con OCR</a></li><li><a href="' + prefix + 'documentos/contar-texto.html">Contar palabras y caracteres</a></li></ul></li>' +
      '<li><a href="' + prefix + 'herramientas.html">Todas</a></li></ul></div>';
    document.body.insertBefore(createdNav, document.body.firstChild);
  }

  var nav = document.querySelector(".nav");
  var menuButton = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");

  var toolPaths = [
    "/fotos/reducir-foto.html",
    "/fotos/quitar-fondo.html",
    "/fotos/cambiar-formato.html",
    "/fotos/foto-carnet.html",
    "/fotos/mejorar-resolucion.html",
    "/conversiones/unidades.html",
    "/conversiones/imagen-a-pdf.html",
    "/conversiones/convertidor-monedas.html",
    "/finanzas/interes.html",
    "/finanzas/porcentajes.html",
    "/finanzas/prestamo.html",
    "/documentos/combinar-pdf.html",
    "/documentos/dividir-pdf.html",
    "/documentos/comprimir-pdf.html",
    "/documentos/ocr.html",
    "/documentos/contar-texto.html"
  ];
  var recentStorageKey = "hazlofacil-tools-recent-tools";
  var toolPathSet = new Set(toolPaths);
  var recentPaths = [];
  var currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

  try {
    var storedPaths = JSON.parse(localStorage.getItem(recentStorageKey) || "[]");
    if (Array.isArray(storedPaths)) {
      recentPaths = storedPaths.filter(function (path, index) {
        return toolPathSet.has(path) && storedPaths.indexOf(path) === index;
      });
    }
  } catch (error) {}

  if (toolPathSet.has(currentPath)) {
    recentPaths = [currentPath].concat(recentPaths.filter(function (path) { return path !== currentPath; })).slice(0, 12);
    try { localStorage.setItem(recentStorageKey, JSON.stringify(recentPaths)); } catch (error) {}
  }

  document.querySelectorAll("a[href]").forEach(function (link) {
    var target;
    try { target = new URL(link.href, window.location.href); } catch (error) { return; }
    if (target.origin !== window.location.origin || !recentPaths.includes(target.pathname.replace(/\/+$/, "") || "/")) return;
    link.classList.add("is-visited");
    if (link.querySelector(".visited-badge")) return;
    var badge = document.createElement("span");
    badge.className = "visited-badge";
    badge.setAttribute("data-i18n", "common.visited");
    badge.textContent = window.I18n ? window.I18n.t("common.visited") : "Visitado";
    link.appendChild(badge);
  });

  if (document.body && window.MutationObserver) {
    var statusTimers = new WeakMap();
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var status = mutation.target.nodeType === 1 ? mutation.target.closest('[role="status"], [aria-live], .result__info') :
          mutation.target.parentElement && mutation.target.parentElement.closest('[role="status"], [aria-live], .result__info');
        if (!status) return;
        status.classList.remove("is-updated");
        void status.offsetWidth;
        status.classList.add("is-updated");
        window.clearTimeout(statusTimers.get(status));
        statusTimers.set(status, window.setTimeout(function () {
          status.classList.remove("is-updated");
          statusTimers.delete(status);
        }, 500));
      });
    }).observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  if (!nav || !menuButton || !menu) return;

  var languageControl = document.createElement("label");
  languageControl.className = "language-control";
  languageControl.setAttribute("aria-label", "Idioma");
  languageControl.innerHTML =
    '<span data-i18n="nav.language">Idioma</span>' +
    '<select id="language-select" aria-label="Idioma">' +
    '<option value="es">ES</option><option value="en">EN</option>' +
    '</select>';
  var inner = nav.querySelector(".nav__inner");
  var appearanceButton = document.createElement("button");
  appearanceButton.className = "btn btn--ghost appearance-toggle";
  appearanceButton.type = "button";
  appearanceButton.id = "appearance-toggle";
  appearanceButton.setAttribute("aria-controls", "appearance-panel");
  appearanceButton.setAttribute("aria-expanded", "false");
  appearanceButton.setAttribute("data-i18n", "appearance.open");
  appearanceButton.textContent = "Apariencia";

  var appearancePanel = document.createElement("section");
  appearancePanel.className = "appearance-panel";
  appearancePanel.id = "appearance-panel";
  appearancePanel.setAttribute("aria-labelledby", "appearance-title");
  appearancePanel.setAttribute("hidden", "");
  appearancePanel.innerHTML =
    '<h2 id="appearance-title" data-i18n="appearance.title">Personalizar apariencia</h2>' +
    '<div class="appearance-panel__fields">' +
    '<label class="appearance-panel__field" for="appearance-theme"><span data-i18n="appearance.theme">Tema</span>' +
    '<select id="appearance-theme"><option value="auto" data-i18n="appearance.auto">Automático</option><option value="light" data-i18n="appearance.light">Claro</option><option value="dark" data-i18n="appearance.dark">Oscuro</option></select></label>' +
    '</div>';

  var controls = document.createElement("div");
  controls.className = "nav__controls";
  controls.appendChild(languageControl);
  controls.appendChild(appearanceButton);
  if (inner) {
    inner.appendChild(controls);
    inner.appendChild(appearancePanel);
  }

  var themeSelect = appearancePanel.querySelector("#appearance-theme");
  themeSelect.value = appearance.theme;

  function setAppearancePanel(open, restoreFocus) {
    appearancePanel.hidden = !open;
    appearanceButton.setAttribute("aria-expanded", String(open));
    if (restoreFocus) appearanceButton.focus();
  }

  appearanceButton.addEventListener("click", function () {
    var open = appearancePanel.hidden;
    closeDropdowns();
    if (open && menu.classList.contains("is-open")) closeMenu(false);
    setAppearancePanel(open, false);
  });
  themeSelect.addEventListener("change", function () {
    appearance.theme = themeSelect.value;
    saveAppearance();
  });

  var languageSelect = document.getElementById("language-select");
  if (languageSelect && window.I18n) {
    languageSelect.value = window.I18n.getLanguage();
    languageSelect.addEventListener("change", function () {
      window.I18n.setLanguage(languageSelect.value);
    });
  }

  var dropdowns = Array.prototype.slice.call(nav.querySelectorAll(".nav__dropdown-toggle"));
  var desktopMedia = window.matchMedia("(min-width: 561px)");
  var closeTimers = new WeakMap();

  function closeDropdown(button, restoreFocus) {
    var timer = closeTimers.get(button);
    if (timer) window.clearTimeout(timer);
    closeTimers.delete(button);
    button.setAttribute("aria-expanded", "false");
    button.parentElement.classList.remove("is-open");
    if (restoreFocus) button.focus();
  }

  function closeDropdowns(except) {
    dropdowns.forEach(function (button) {
      if (button !== except) closeDropdown(button, false);
    });
  }

  function closeMenu(restoreFocus) {
    menu.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    closeDropdowns();
    if (restoreFocus) menuButton.focus();
  }

  if (desktopMedia.addEventListener) {
    desktopMedia.addEventListener("change", function () {
      closeMenu(false);
      if (desktopMedia.matches) {
        dropdowns.forEach(function (button) {
          if (!button.parentElement.matches(":hover")) return;
          button.setAttribute("aria-expanded", "true");
          button.parentElement.classList.add("is-open");
        });
      }
    });
  }

  menuButton.addEventListener("click", function () {
    setAppearancePanel(false, false);
    var open = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
    if (!open) closeDropdowns();
  });

  dropdowns.forEach(function (button) {
    var item = button.parentElement;
    item.addEventListener("mouseenter", function () {
      if (!desktopMedia.matches) return;
      var timer = closeTimers.get(button);
      if (timer) window.clearTimeout(timer);
      closeTimers.delete(button);
      closeDropdowns(button);
      button.setAttribute("aria-expanded", "true");
      item.classList.add("is-open");
    });
    item.addEventListener("mouseleave", function () {
      if (!desktopMedia.matches) return;
      var timer = window.setTimeout(function () {
        closeDropdown(button, false);
      }, 120);
      closeTimers.set(button, timer);
    });
    button.addEventListener("click", function () {
      setAppearancePanel(false, false);
      if (desktopMedia.matches && item.matches(":hover")) {
        button.setAttribute("aria-expanded", "true");
        item.classList.add("is-open");
        return;
      }
      var open = button.getAttribute("aria-expanded") !== "true";
      closeDropdowns(button);
      button.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);
    });
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest(".nav__submenu a")) {
      closeDropdowns();
      if (menu.classList.contains("is-open")) closeMenu(false);
    }
  });

  document.addEventListener("click", function (event) {
    if (!nav.contains(event.target)) {
      closeDropdowns();
      setAppearancePanel(false, false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!appearancePanel.hidden) {
      setAppearancePanel(false, true);
      return;
    }
    var openButton = dropdowns.find(function (button) {
      return button.getAttribute("aria-expanded") === "true";
    });
    if (openButton) closeDropdown(openButton, true);
    else if (menu.classList.contains("is-open")) closeMenu(true);
  });
})();
