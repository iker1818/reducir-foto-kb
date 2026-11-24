(function () {
  "use strict";
  var fileInput = document.getElementById("file-input");
  var chooseButton = document.getElementById("choose-file");
  var pageInfo = document.getElementById("page-info");
  var pagesInput = document.getElementById("pages");
  var extractButton = document.getElementById("extract");
  var message = document.getElementById("message");
  var file = null;
  var pdf = null;

  function parsePages(text, max) {
    var result = [];
    var parts = text.split(",");
    if (!text.trim() || parts.some(function (part) { return !part.trim(); })) return null;
    for (var partIndex = 0; partIndex < parts.length; partIndex++) {
      var part = parts[partIndex].trim();
      var match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
      if (!match) return null;
      var start = Number(match[1]);
      var end = match[2] ? Number(match[2]) : start;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end > max || start > end) return null;
      for (var page = start; page <= end; page++) {
        if (result.indexOf(page - 1) === -1) result.push(page - 1);
      }
    }
    return result;
  }

  chooseButton.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", async function () {
    file = fileInput.files[0];
    fileInput.value = "";
    pdf = null;
    extractButton.disabled = true;
    message.textContent = "";
    message.classList.remove("is-error");
    if (!file) return;
    try {
      if (!window.PDFLib) throw new Error("pdf-lib unavailable");
      pdf = await window.PDFLib.PDFDocument.load(await file.arrayBuffer());
      pageInfo.textContent = file.name + " · " + pdf.getPageCount() + " páginas";
      pagesInput.value = "1-" + pdf.getPageCount();
      extractButton.disabled = false;
    } catch (error) {
      message.textContent = "No se pudo abrir el PDF.";
      message.classList.add("is-error");
    }
  });
  extractButton.addEventListener("click", async function () {
    if (!pdf) return;
    var indexes = parsePages(pagesInput.value, pdf.getPageCount());
    if (!indexes || !indexes.length) {
      message.textContent = "Introduce páginas válidas.";
      message.classList.add("is-error");
      return;
    }
    extractButton.disabled = true;
    try {
      var result = await window.PDFLib.PDFDocument.create();
      var copied = await result.copyPages(pdf, indexes);
      copied.forEach(function (page) { result.addPage(page); });
      var bytes = await result.save();
      var url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      var link = document.createElement("a");
      link.href = url;
      link.download = (file.name.replace(/\.pdf$/i, "") || "documento") + "-paginas.pdf";
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      message.textContent = indexes.length + " página(s) extraída(s).";
      message.classList.remove("is-error");
    } catch (error) {
      message.textContent = "No se pudo extraer las páginas.";
      message.classList.add("is-error");
    } finally {
      extractButton.disabled = !pdf;
    }
  });
})();
