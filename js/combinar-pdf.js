(function () {
  "use strict";
  var fileInput = document.getElementById("file-input");
  var chooseButton = document.getElementById("choose-file");
  var fileList = document.getElementById("file-list");
  var mergeButton = document.getElementById("merge");
  var clearButton = document.getElementById("clear");
  var message = document.getElementById("message");
  var files = [];
  var nextId = 1;

  function formatSize(size) {
    return (window.I18n ? window.I18n.formatNumber(size / 1024, { maximumFractionDigits: 1, useGrouping: true }) :
      new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: true }).format(size / 1024)) + " KB";
  }

  function render() {
    fileList.textContent = "";
    files.forEach(function (file, index) {
      var row = document.createElement("div");
      row.className = "file-row";
      var name = document.createElement("div");
      name.className = "file-row__name";
      name.textContent = (index + 1) + ". " + file.name + " · " + formatSize(file.size);
      var actions = document.createElement("div");
      actions.className = "button-row";
      [["up", "Subir", index === 0], ["down", "Bajar", index === files.length - 1], ["remove", "Quitar", false]].forEach(function (control) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn--ghost";
        button.dataset.action = control[0];
        button.dataset.id = file.id;
        button.textContent = control[1];
        button.disabled = control[2];
        actions.appendChild(button);
      });
      row.appendChild(name); row.appendChild(actions); fileList.appendChild(row);
    });
    mergeButton.disabled = files.length < 2;
    clearButton.disabled = files.length === 0;
  }

  chooseButton.addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    Array.prototype.forEach.call(fileInput.files, function (file) {
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        files.push({ id: nextId++, file: file, name: file.name, size: file.size });
      }
    });
    fileInput.value = "";
    render();
  });
  fileList.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;
    var index = files.findIndex(function (file) { return file.id === Number(button.dataset.id); });
    if (index < 0) return;
    if (button.dataset.action === "up" && index > 0) {
      files.splice(index - 1, 2, files[index], files[index - 1]);
    } else if (button.dataset.action === "down" && index < files.length - 1) {
      files.splice(index, 2, files[index + 1], files[index]);
    } else if (button.dataset.action === "remove") {
      files.splice(index, 1);
    }
    render();
  });
  clearButton.addEventListener("click", function () { files = []; render(); message.textContent = ""; });
  mergeButton.addEventListener("click", async function () {
    if (!window.PDFLib || files.length < 2) {
      message.textContent = "No se pudo cargar PDF-lib.";
      message.classList.add("is-error");
      return;
    }
    mergeButton.disabled = true;
    message.textContent = "Combinando PDF…";
    try {
      var result = await window.PDFLib.PDFDocument.create();
      for (var i = 0; i < files.length; i++) {
        var source = await window.PDFLib.PDFDocument.load(await files[i].file.arrayBuffer());
        var pages = await result.copyPages(source, source.getPageIndices());
        pages.forEach(function (page) { result.addPage(page); });
      }
      var bytes = await result.save();
      var blob = new Blob([bytes], { type: "application/pdf" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url; link.download = "documentos-combinados.pdf"; link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      message.textContent = "PDF combinado descargado.";
      message.classList.remove("is-error");
    } catch (error) {
      message.textContent = "No se pudo combinar. Comprueba que los PDF no estén protegidos o dañados.";
      message.classList.add("is-error");
    } finally { mergeButton.disabled = false; }
  });
})();
