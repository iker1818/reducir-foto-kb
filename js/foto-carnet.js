(function () {
  "use strict";
  var fileInput = document.getElementById("file-input");
  var chooseButton = document.getElementById("choose-file");
  var ratio = document.getElementById("ratio");
  var positionX = document.getElementById("position-x");
  var positionY = document.getElementById("position-y");
  var positionXValue = document.getElementById("position-x-value");
  var positionYValue = document.getElementById("position-y-value");
  var format = document.getElementById("format");
  var preview = document.getElementById("preview");
  var message = document.getElementById("message");
  var downloadButton = document.getElementById("download");
  var sourceImage = null;
  var sourceUrl = null;
  var outputBlob = null;
  var renderId = 0;
  var loadId = 0;

  function render() {
    if (!sourceImage) return;
    var currentRender = ++renderId;
    outputBlob = null;
    downloadButton.disabled = true;
    var parts = ratio.value.split(":").map(Number);
    var target = parts[0] / parts[1];
    var width = sourceImage.naturalWidth;
    var height = sourceImage.naturalHeight;
    var cropWidth = width;
    var cropHeight = width / target;
    if (cropHeight > height) {
      cropHeight = height;
      cropWidth = height * target;
    }
    var xRange = Math.max(0, width - cropWidth);
    var yRange = Math.max(0, height - cropHeight);
    var x = xRange * ((Number(positionX.value) + 100) / 200);
    var y = yRange * ((Number(positionY.value) + 100) / 200);
    var outputWidth = ratio.value === "35:45" ? 700 : 600;
    var outputHeight = Math.round(outputWidth / target);
    var canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    var context = canvas.getContext("2d");
    if (!context) {
      message.textContent = "No se pudo generar la imagen.";
      message.classList.add("is-error");
      return;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.imageSmoothingQuality = "high";
    context.drawImage(sourceImage, x, y, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
    preview.textContent = "";
    preview.appendChild(canvas);
    canvas.toBlob(function (blob) {
      if (currentRender !== renderId) return;
      if (!blob) {
        message.textContent = "No se pudo generar la imagen.";
        message.classList.add("is-error");
        return;
      }
      outputBlob = blob;
      downloadButton.disabled = false;
      var size = window.I18n ? window.I18n.formatNumber(blob.size / 1024, { maximumFractionDigits: 1, useGrouping: true }) :
        new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: true }).format(blob.size / 1024);
      message.textContent = "Vista previa: " + outputWidth + " × " + outputHeight + " px · " + size + " KB";
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
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = URL.createObjectURL(file);
    var image = new Image();
    image.onload = function () {
      if (currentLoad !== loadId) return;
      sourceImage = image;
      render();
    };
    image.onerror = function () {
      if (currentLoad !== loadId) return;
      sourceImage = null;
      outputBlob = null;
      downloadButton.disabled = true;
      message.textContent = "No se pudo abrir la imagen.";
      message.classList.add("is-error");
    };
    image.src = sourceUrl;
  });
  [ratio, positionX, positionY, format].forEach(function (control) { control.addEventListener("input", render); });
  positionX.addEventListener("input", function () { positionXValue.textContent = Number(positionX.value) === 0 ? "Centro" : (positionX.value > 0 ? "Derecha" : "Izquierda"); });
  positionY.addEventListener("input", function () { positionYValue.textContent = Number(positionY.value) === 0 ? "Centro" : (positionY.value > 0 ? "Abajo" : "Arriba"); });
  downloadButton.addEventListener("click", function () {
    if (!outputBlob) return;
    var url = URL.createObjectURL(outputBlob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "foto-carnet." + (format.value === "image/png" ? "png" : "jpg");
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
})();
