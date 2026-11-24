(function () {
  "use strict";
  var fileInput = document.getElementById("file-input");
  var chooseButton = document.getElementById("choose-file");
  var format = document.getElementById("format");
  var quality = document.getElementById("quality");
  var qualityValue = document.getElementById("quality-value");
  var qualityField = document.getElementById("quality-field");
  var preview = document.getElementById("preview");
  var message = document.getElementById("message");
  var downloadButton = document.getElementById("download");
  var blob = null;
  var sourceName = "imagen";
  var sourceUrl = null;
  var resultUrl = null;
  var renderId = 0;

  function setMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle("is-error", Boolean(isError));
  }

  function convert() {
    if (!preview.dataset.url) return;
    var currentRender = ++renderId;
    var outputFormat = format.value;
    var outputQuality = Number(quality.value) / 100;
    blob = null;
    downloadButton.disabled = true;
    var image = new Image();
    image.onload = function () {
      if (currentRender !== renderId) return;
      var canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      var context = canvas.getContext("2d");
      if (!context) {
        setMessage("No se pudo convertir la imagen.", true);
        return;
      }
      if (outputFormat !== "image/png") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0);
      canvas.toBlob(function (result) {
        if (currentRender !== renderId) return;
        if (!result) {
          setMessage("No se pudo convertir la imagen.", true);
          return;
        }
        if (result.type !== outputFormat) {
          setMessage("No se puede convertir este archivo al formato seleccionado en este navegador.", true);
          return;
        }
        blob = result;
        preview.textContent = "";
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = URL.createObjectURL(result);
        preview.dataset.resultUrl = resultUrl;
        var output = document.createElement("img");
        output.src = resultUrl;
        output.alt = "Vista previa convertida";
        preview.appendChild(output);
        var extension = outputFormat === "image/jpeg" ? "jpg" : (outputFormat === "image/png" ? "png" : "webp");
        var sizeText = window.I18n ? window.I18n.formatNumber(result.size / 1024, { maximumFractionDigits: 1, useGrouping: true }) :
          new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: true }).format(result.size / 1024);
        setMessage((window.I18n ? window.I18n.t("common.result") : "Resultado") + ": " + sizeText +
          " KB · " + canvas.width + " × " + canvas.height + " px · " + extension.toUpperCase());
        downloadButton.disabled = false;
      }, outputFormat, outputQuality);
    };
    image.onerror = function () {
      if (currentRender === renderId) setMessage("No se pudo abrir la imagen.", true);
    };
    image.src = preview.dataset.url;
  }

  chooseButton.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    var file = fileInput.files[0];
    fileInput.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)) {
      renderId++;
      blob = null;
      downloadButton.disabled = true;
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      sourceUrl = null;
      resultUrl = null;
      delete preview.dataset.url;
      delete preview.dataset.resultUrl;
      preview.textContent = "";
      setMessage("Ese archivo no es una imagen. Prueba con un JPG, PNG o WebP.", true);
      return;
    }
    sourceName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = URL.createObjectURL(file);
    preview.dataset.url = sourceUrl;
    convert();
  });
  format.addEventListener("change", function () {
    qualityField.classList.toggle("hidden", format.value === "image/png");
    convert();
  });
  quality.addEventListener("input", function () {
    qualityValue.textContent = quality.value + "%";
    convert();
  });
  downloadButton.addEventListener("click", function () {
    if (!blob) return;
    var extension = format.value === "image/jpeg" ? "jpg" : (format.value === "image/png" ? "png" : "webp");
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = sourceName + "." + extension;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
})();
