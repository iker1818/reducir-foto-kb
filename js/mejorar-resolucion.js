(function () {
  "use strict";
  var fileInput = document.getElementById("file-input");
  var chooseButton = document.getElementById("choose-file");
  var scale = document.getElementById("scale");
  var sharpness = document.getElementById("sharpness");
  var sharpnessValue = document.getElementById("sharpness-value");
  var format = document.getElementById("format");
  var preview = document.getElementById("preview");
  var message = document.getElementById("message");
  var downloadButton = document.getElementById("download");
  var sourceImage = null;
  var outputBlob = null;
  var sourceName = "imagen";
  var renderId = 0;
  var loadId = 0;

  function render() {
    if (!sourceImage) return;
    var currentRender = ++renderId;
    outputBlob = null;
    downloadButton.disabled = true;
    var multiplier = Number(scale.value);
    var width = Math.round(sourceImage.naturalWidth * multiplier);
    var height = Math.round(sourceImage.naturalHeight * multiplier);
    var outputLimit = 4000;
    var outputScale = Math.min(1, outputLimit / Math.max(width, height), Math.sqrt(12000000 / (width * height)));
    width = Math.round(width * outputScale);
    height = Math.round(height * outputScale);
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      message.textContent = "No se pudo generar la imagen.";
      message.classList.add("is-error");
      return;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(sourceImage, 0, 0, width, height);
    var amount = Number(sharpness.value) / 100;
    if (amount > 0) {
      var pixels = context.getImageData(0, 0, width, height);
      var data = pixels.data;
      var copy = new Uint8ClampedArray(data);
      var strength = amount * 0.8;
      for (var y = 1; y < height - 1; y++) {
        for (var x = 1; x < width - 1; x++) {
          var i = (y * width + x) * 4;
          for (var channel = 0; channel < 3; channel++) {
            var center = copy[i + channel];
            var neighbors = copy[i - 4 + channel] + copy[i + 4 + channel] + copy[i - width * 4 + channel] + copy[i + width * 4 + channel];
            data[i + channel] = Math.max(0, Math.min(255, center + (center * 5 - neighbors) * strength * 0.15));
          }
        }
      }
      context.putImageData(pixels, 0, 0);
    }
    preview.textContent = "";
    preview.appendChild(canvas);
    canvas.toBlob(function (blob) {
    if (currentRender !== renderId) return;
    if (!blob) {
      message.textContent = "No se pudo generar la imagen.";
      message.classList.add("is-error");
      return;
    }
    if (blob.type !== format.value) {
      message.textContent = "No se puede convertir este archivo al formato seleccionado en este navegador.";
      message.classList.add("is-error");
      return;
    }
      outputBlob = blob;
      downloadButton.disabled = false;
    var size = window.I18n ? window.I18n.formatNumber(blob.size / 1024, { maximumFractionDigits: 1, useGrouping: true }) :
      new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: true }).format(blob.size / 1024);
    message.textContent = "Resultado: " + width + " × " + height + " px · " + size + " KB";
    message.classList.remove("is-error");
    }, format.value, 0.92);
  }

  chooseButton.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    var file = fileInput.files[0];
    var currentLoad = ++loadId;
    fileInput.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
    renderId++;
    outputBlob = null;
    downloadButton.disabled = true;
    message.textContent = "Ese archivo no es una imagen. Prueba con un JPG, PNG o WebP.";
    message.classList.add("is-error");
    return;
    }
    sourceName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    var url = URL.createObjectURL(file);
    var image = new Image();
    image.onload = function () {
    URL.revokeObjectURL(url);
    if (currentLoad !== loadId) return;
    sourceImage = image;
    render();
    };
    image.onerror = function () {
    URL.revokeObjectURL(url);
    if (currentLoad !== loadId) return;
    sourceImage = null;
    outputBlob = null;
    downloadButton.disabled = true;
    message.textContent = "No se pudo abrir la imagen.";
    message.classList.add("is-error");
    };
    image.src = url;
  });
  [scale, sharpness, format].forEach(function (control) { control.addEventListener("input", render); });
  sharpness.addEventListener("input", function () { sharpnessValue.textContent = sharpness.value + "%"; });
  downloadButton.addEventListener("click", function () {
    if (!outputBlob) return;
    var url = URL.createObjectURL(outputBlob);
    var link = document.createElement("a");
    var extension = format.value === "image/jpeg" ? "jpg" : (format.value === "image/webp" ? "webp" : "png");
    link.href = url;
    link.download = sourceName + "-resolucion." + extension;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
})();
