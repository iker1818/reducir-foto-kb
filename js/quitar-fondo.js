(function () {
  "use strict";
  var fileInput = document.getElementById("file-input");
  var chooseButton = document.getElementById("choose-file");
  var toleranceInput = document.getElementById("tolerance");
  var toleranceValue = document.getElementById("tolerance-value");
  var background = document.getElementById("background");
  var preview = document.getElementById("preview");
  var message = document.getElementById("message");
  var downloadButton = document.getElementById("download");
  var sourceImage = null;
  var outputCanvas = null;
  var loadId = 0;

  function process() {
    if (!sourceImage) return;
    outputCanvas = null;
    downloadButton.disabled = true;
    var canvas = document.createElement("canvas");
    var maxSide = 1800;
    var scale = Math.min(1, maxSide / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight));
    canvas.width = Math.round(sourceImage.naturalWidth * scale);
    canvas.height = Math.round(sourceImage.naturalHeight * scale);
    var context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      message.textContent = "No se pudo procesar la imagen.";
      message.classList.add("is-error");
      return;
    }
    var pixels;
    try {
      context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
      pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      message.textContent = "No se pudo procesar la imagen.";
      message.classList.add("is-error");
      return;
    }
    var data = pixels.data;
    var corners = [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]];
    var seed = [0, 0, 0];
    corners.forEach(function (point) {
      var index = (point[1] * canvas.width + point[0]) * 4;
      seed[0] += data[index]; seed[1] += data[index + 1]; seed[2] += data[index + 2];
    });
    seed = seed.map(function (value) { return value / 4; });
    var tolerance = Number(toleranceInput.value);
    var visited = new Uint8Array(canvas.width * canvas.height);
    var queue = [];
    corners.forEach(function (point) { queue.push(point[0], point[1]); });
    while (queue.length) {
      var y = queue.pop();
      var x = queue.pop();
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
      var pixelIndex = y * canvas.width + x;
      if (visited[pixelIndex]) continue;
      visited[pixelIndex] = 1;
      var index = pixelIndex * 4;
      var distance = Math.abs(data[index] - seed[0]) + Math.abs(data[index + 1] - seed[1]) + Math.abs(data[index + 2] - seed[2]);
      if (distance > tolerance * 3) continue;
      data[index + 3] = 0;
      queue.push(x - 1, y); queue.push(x + 1, y); queue.push(x, y - 1); queue.push(x, y + 1);
    }
    context.putImageData(pixels, 0, 0);
    outputCanvas = canvas;
    preview.textContent = "";
    preview.classList.toggle("canvas-checker", background.value === "transparent");
    preview.style.background = background.value === "transparent" ? "" : background.value;
    preview.appendChild(canvas);
    downloadButton.disabled = false;
    message.classList.remove("is-error");
  }

  chooseButton.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    var file = fileInput.files[0];
    var currentLoad = ++loadId;
    fileInput.value = "";
    if (!file) return;
    outputCanvas = null;
    downloadButton.disabled = true;
    if (!file.type.startsWith("image/")) {
      sourceImage = null;
      outputCanvas = null;
      downloadButton.disabled = true;
      message.textContent = "Ese archivo no es una imagen. Prueba con un JPG, PNG o WebP.";
      message.classList.add("is-error");
      return;
    }
    var url = URL.createObjectURL(file);
    var image = new Image();
    image.onload = function () {
      if (currentLoad !== loadId) {
        URL.revokeObjectURL(url);
        return;
      }
      sourceImage = image;
      URL.revokeObjectURL(url);
      process();
    };
    image.onerror = function () {
      URL.revokeObjectURL(url);
      if (currentLoad !== loadId) return;
      sourceImage = null;
      outputCanvas = null;
      downloadButton.disabled = true;
      message.textContent = "No se pudo abrir la imagen.";
      message.classList.add("is-error");
    };
    image.src = url;
  });
  toleranceInput.addEventListener("input", function () {
    toleranceValue.textContent = toleranceInput.value;
    process();
  });
  background.addEventListener("change", function () {
    preview.classList.toggle("canvas-checker", background.value === "transparent");
    preview.style.background = background.value === "transparent" ? "" : background.value;
  });
  downloadButton.addEventListener("click", function () {
    if (!outputCanvas) return;
    outputCanvas.toBlob(function (blob) {
      if (!blob) {
        message.textContent = "No se pudo generar la imagen.";
        message.classList.add("is-error");
        return;
      }
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "imagen-sin-fondo.png";
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }, "image/png");
  });
})();
