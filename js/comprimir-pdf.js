(function () {
  "use strict";
  var fileInput = document.getElementById("file-input");
  var chooseButton = document.getElementById("choose-file");
  var before = document.getElementById("before");
  var after = document.getElementById("after");
  var compressButton = document.getElementById("compress");
  var message = document.getElementById("message");
  var file = null;
  var pdf = null;
  var outputBlob = null;
  var format = { format: function (value) { return window.I18n ? window.I18n.formatNumber(value, { maximumFractionDigits: 1, useGrouping: true }) : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: true }).format(value); } };

  function size(bytes) { return format.format(bytes / 1024) + " KB"; }

  chooseButton.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", async function () {
    file = fileInput.files[0];
    if (!file) return;
    before.textContent = size(file.size);
    after.textContent = "—";
    try {
      pdf = await window.PDFLib.PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
      compressButton.disabled = false;
      message.textContent = "PDF cargado. El resultado puede ser igual o mayor si ya estaba optimizado.";
      message.classList.remove("is-error");
    } catch (error) {
      compressButton.disabled = true;
      message.textContent = "No se pudo abrir el PDF.";
      message.classList.add("is-error");
    }
  });
  compressButton.addEventListener("click", async function () {
    if (!pdf) return;
    compressButton.disabled = true;
    message.textContent = "Optimizando PDF…";
    try {
      var bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
      outputBlob = new Blob([bytes], { type: "application/pdf" });
      after.textContent = size(outputBlob.size);
      var url = URL.createObjectURL(outputBlob);
      var link = document.createElement("a");
      link.href = url;
      link.download = (file.name.replace(/\.pdf$/i, "") || "documento") + "-optimizado.pdf";
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      if (outputBlob.size >= file.size) {
        message.textContent = "El PDF ya estaba bien optimizado; el tamaño no ha disminuido.";
      } else {
        var reduction = (1 - outputBlob.size / file.size) * 100;
        message.textContent = "Reducción aproximada: " + format.format(reduction) + " %.";
      }
      message.classList.remove("is-error");
    } catch (error) {
      message.textContent = "No se pudo optimizar el PDF.";
      message.classList.add("is-error");
    } finally { compressButton.disabled = false; }
  });
})();
