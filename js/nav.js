(function () {
  "use strict";
  var inSubfolder = /\/(fotos|conversiones|finanzas|documentos|info)\//.test(window.location.pathname);
  var prefix = inSubfolder ? "../" : "";

  if (!document.querySelector(".nav")) {
    var createdNav = document.createElement("nav");
    createdNav.className = "nav";
    createdNav.setAttribute("aria-label", "Principal");
    createdNav.innerHTML =
      '<div class="container nav__inner"><a class="brand" href="' + prefix + 'index.html" data-i18n-aria="brand.home"><img class="brand__logo" src="' + prefix + 'img/Gemini_Generated_Image_z8re8yz8re8yz8re.jfif" alt="Logotipo de Make Easy, herramientas sencillas" data-i18n-alt="brand.logoAlt"></a>' +
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
  if (inner) inner.appendChild(languageControl);
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

  menuButton.addEventListener("click", function () {
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
    if (!nav.contains(event.target)) closeDropdowns();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var openButton = dropdowns.find(function (button) {
      return button.getAttribute("aria-expanded") === "true";
    });
    if (openButton) closeDropdown(openButton, true);
    else if (menu.classList.contains("is-open")) closeMenu(true);
  });
})();
