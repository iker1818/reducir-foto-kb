(function () {
  "use strict";
  var fileInput = document.getElementById("file-input");
  var chooseButton = document.getElementById("choose-file");
  var language = document.getElementById("language");
  var recognizeButton = document.getElementById("recognize");
  var progress = document.getElementById("progress");
  var output = document.getElementById("text-output");
  var copyButton = document.getElementById("copy");
  var downloadButton = document.getElementById("download");
  var selectedFile = null;

  chooseButton.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    selectedFile = fileInput.files[0] || null;
    recognizeButton.disabled = !selectedFile;
    output.value = "";
    progress.textContent = selectedFile ? "Archivo listo: " + selectedFile.name : "";
  });
  recognizeButton.addEventListener("click", async function () {
    if (!selectedFile || !window.Tesseract) {
      progress.textContent = "No se pudo cargar el motor OCR.";
      return;
    }
    recognizeButton.disabled = true;
    progress.textContent = "Preparando OCR…";
    try {
      var result = await window.Tesseract.recognize(selectedFile, language.value, {
        logger: function (info) {
          if (info.status === "recognizing text") {
            progress.textContent = "Reconociendo texto: " + Math.round((info.progress || 0) * 100) + " %";
          } else if (info.status) {
            progress.textContent = "Preparando OCR…";
          }
        }
      });
      output.value = result.data.text.trim();
      copyButton.disabled = !output.value;
      downloadButton.disabled = !output.value;
      progress.textContent = output.value ? "Reconocimiento completado." : "No se encontró texto legible.";
    } catch (error) {
      progress.textContent = "No se pudo reconocer el texto. Prueba con una imagen más nítida.";
    } finally {
      recognizeButton.disabled = false;
    }
  });
  copyButton.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(output.value);
      progress.textContent = "Texto copiado.";
    } catch (error) {
      progress.textContent = "No se pudo copiar; selecciona el texto manualmente.";
    }
  });
  downloadButton.addEventListener("click", function () {
    var url = URL.createObjectURL(new Blob([output.value], { type: "text/plain;charset=utf-8" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = "texto-extraido.txt";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
})();
