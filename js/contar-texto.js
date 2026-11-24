(function () {
  "use strict";
  var input = document.getElementById("text-input");
  var words = document.getElementById("words");
  var chars = document.getElementById("chars");
  var charsNoSpaces = document.getElementById("chars-no-spaces");
  var lines = document.getElementById("lines");
  var reading = document.getElementById("reading");
  var copyButton = document.getElementById("copy");
  var clearButton = document.getElementById("clear");
  var message = document.getElementById("message");
  var integer = {
    format: function (value) {
      return window.I18n ? window.I18n.formatNumber(value, { maximumFractionDigits: 0, useGrouping: true }) :
        new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: true }).format(value);
    }
  };

  function update() {
    var text = input.value;
    var wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    words.textContent = integer.format(wordCount);
    chars.textContent = integer.format(text.length);
    charsNoSpaces.textContent = integer.format(text.replace(/\s/g, "").length);
    lines.textContent = integer.format(text ? text.split(/\r\n|\r|\n/).length : 0);
    var minutes = wordCount / 225;
    var minuteText = window.I18n && window.I18n.getLanguage() === "en" ? " min" : " min";
    reading.textContent = minutes === 0 ? "0" + minuteText :
      (minutes < 1 ? "< 1" + minuteText : integer.format(Math.ceil(minutes)) + minuteText);
  }

  input.addEventListener("input", update);
  clearButton.addEventListener("click", function () {
    input.value = "";
    update();
    input.focus();
  });
  copyButton.addEventListener("click", async function () {
    if (!input.value) return;
    try {
      await navigator.clipboard.writeText(input.value);
      message.textContent = "Texto copiado.";
    } catch (error) {
      message.textContent = "No se pudo copiar; selecciona el texto manualmente.";
    }
  });
  update();
})();
