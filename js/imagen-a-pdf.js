(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var fileInput = $("file-input");
  var dropzone = $("dropzone");
  var fileList = $("file-list");
  var orientation = $("orientation");
  var createButton = $("create-pdf");
  var clearButton = $("clear-files");
  var message = $("message");
  var modeImagePdfButton = $("mode-image-pdf");
  var modePdfImageButton = $("mode-pdf-image");
  var orientationField = $("orientation-field");
  var formatField = $("format-field");
  var outputFormat = $("output-format");
  var modeDescription = $("mode-description");
  var toolTitle = $("tool-title");
  var images = [];
  var pdfFiles = [];
  var nextId = 1;
  var isLoading = false;
  var isGenerating = false;
  var mode = "image-pdf";

  function setMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle("is-error", Boolean(isError));
  }

  function updateButtons() {
    var count = mode === "image-pdf" ? images.length : pdfFiles.length;
    var disabled = count === 0 || isLoading || isGenerating;
    createButton.disabled = disabled;
    clearButton.disabled = disabled;
  }

  function formatSize(bytes) {
    var value = window.I18n ? window.I18n.formatNumber(bytes / 1024, { maximumFractionDigits: 1, useGrouping: true }) :
      new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: true }).format(bytes / 1024);
    return value + " KB";
  }

  function decodeImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        if (!image.naturalWidth || !image.naturalHeight) {
          URL.revokeObjectURL(url);
          reject(new Error("La imagen no tiene dimensiones válidas."));
          return;
        }
        resolve({
          id: nextId++,
          file: file,
          url: url,
          image: image
        });
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo abrir la imagen."));
      };
      image.src = url;
    });
  }

  function isSupported(file) {
    if (mode === "pdf-image") {
      var pdfExtension = file.name.split(".").pop().toLowerCase();
      return file.type === "application/pdf" || pdfExtension === "pdf";
    }
    var type = file.type.toLowerCase();
    var extension = file.name.split(".").pop().toLowerCase();
    return ["image/jpeg", "image/png", "image/webp"].indexOf(type) !== -1 ||
      (!type && ["jpg", "jpeg", "png", "webp"].indexOf(extension) !== -1);
  }

  function renderFiles() {
    fileList.textContent = "";
    var entries = mode === "image-pdf" ? images : pdfFiles;
    fileList.classList.toggle("hidden", entries.length === 0);

    if (mode === "pdf-image") {
      pdfFiles.forEach(function (item, index) {
        var row = document.createElement("li");
        row.className = "pdf-file";
        var details = document.createElement("div");
        details.className = "pdf-file__details";
        var name = document.createElement("p");
        name.className = "pdf-file__name";
        name.textContent = item.file.name;
        var size = document.createElement("p");
        size.className = "msg";
        size.textContent = formatSize(item.file.size) + " · Páginas: " + item.documentPdf.numPages;
        details.appendChild(name);
        details.appendChild(size);
        var actions = document.createElement("div");
        actions.className = "pdf-file__actions";
        var removeButton = document.createElement("button");
        removeButton.className = "btn btn--ghost";
        removeButton.type = "button";
        removeButton.dataset.action = "remove";
        removeButton.dataset.id = item.id;
        removeButton.textContent = "Quitar";
        removeButton.setAttribute("aria-label", "Quitar " + item.file.name);
        removeButton.disabled = isLoading || isGenerating;
        actions.appendChild(removeButton);
        row.appendChild(details);
        row.appendChild(actions);
        fileList.appendChild(row);
      });
      updateButtons();
      return;
    }

    images.forEach(function (item, index) {
      var row = document.createElement("li");
      row.className = "pdf-file";

      var preview = document.createElement("img");
      preview.className = "pdf-file__preview";
      preview.src = item.url;
      preview.alt = "";

      var details = document.createElement("div");
      details.className = "pdf-file__details";
      var name = document.createElement("p");
      name.className = "pdf-file__name";
      name.textContent = item.file.name;
      var size = document.createElement("p");
      size.className = "msg";
      size.textContent = formatSize(item.file.size) + " · " +
        item.image.naturalWidth + " × " + item.image.naturalHeight + " px";
      details.appendChild(name);
      details.appendChild(size);

      var actions = document.createElement("div");
      actions.className = "pdf-file__actions";
      [
        { action: "up", label: "Subir", disabled: index === 0 },
        { action: "down", label: "Bajar", disabled: index === images.length - 1 },
        { action: "remove", label: "Quitar", disabled: false }
      ].forEach(function (control) {
        var button = document.createElement("button");
        button.className = "btn btn--ghost";
        button.type = "button";
        button.dataset.action = control.action;
        button.dataset.id = item.id;
        button.disabled = control.disabled || isLoading || isGenerating;
        button.textContent = control.label;
        button.setAttribute("aria-label", control.label + " " + item.file.name);
        actions.appendChild(button);
      });

      row.appendChild(preview);
      row.appendChild(details);
      row.appendChild(actions);
      fileList.appendChild(row);
    });

    updateButtons();
  }

  async function addFiles(fileCollection) {
    var files = Array.prototype.slice.call(fileCollection);
    if (!files.length) return;
    if (isLoading || isGenerating) {
      setMessage("Espera a que termine el proceso actual antes de añadir imágenes.", true);
      return;
    }

    isLoading = true;
    updateButtons();
    var added = 0;
    var rejected = 0;

    if (mode === "pdf-image") {
      if (!window.pdfjsLib) {
        isLoading = false;
        setMessage("No se pudo cargar el lector PDF.", true);
        return;
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }

    for (var i = 0; i < files.length; i++) {
      if (!isSupported(files[i])) {
        rejected++;
        continue;
      }
      try {
        if (mode === "pdf-image") {
          var buffer = await files[i].arrayBuffer();
          var task = window.pdfjsLib.getDocument({ data: buffer });
          var documentPdf = await task.promise;
          pdfFiles.push({
            id: nextId++,
            file: files[i],
            documentPdf: documentPdf
          });
        } else {
          images.push(await decodeImage(files[i]));
        }
        added++;
      } catch (error) {
        rejected++;
      }
    }

    isLoading = false;
    renderFiles();
    if (rejected) {
      setMessage("Imágenes añadidas: " + added +
        ". Archivos omitidos por formato no compatible o error de lectura: " + rejected + ".", true);
    } else {
      setMessage("Imágenes listas para el PDF: " + added + ".");
    }
    fileInput.value = "";
  }

  function moveImage(id, offset) {
    var index = images.findIndex(function (item) { return item.id === id; });
    var destination = index + offset;
    if (index < 0 || destination < 0 || destination >= images.length) return;
    var item = images.splice(index, 1)[0];
    images.splice(destination, 0, item);
    renderFiles();
  }

  function handleFileAction(event) {
    var button = event.target.closest("button[data-action]");
    if (!button || isLoading || isGenerating) return;
    var id = Number(button.dataset.id);
    if (button.dataset.action === "up") {
      moveImage(id, -1);
    } else if (button.dataset.action === "down") {
      moveImage(id, 1);
    } else if (button.dataset.action === "remove") {
      if (mode === "pdf-image") {
        var pdfIndex = pdfFiles.findIndex(function (item) { return item.id === id; });
        if (pdfIndex !== -1) {
          pdfFiles.splice(pdfIndex, 1);
          renderFiles();
          setMessage("PDF quitado.");
        }
        return;
      }
      var index = images.findIndex(function (item) { return item.id === id; });
      if (index !== -1) {
        URL.revokeObjectURL(images[index].url);
        images.splice(index, 1);
        renderFiles();
        setMessage("Imagen quitada.");
      }
    }
  }

  function createPageImage(item, pageWidth, pageHeight) {
    var dpi = 200;
    var canvas = document.createElement("canvas");
    canvas.width = Math.round(pageWidth / 72 * dpi);
    canvas.height = Math.round(pageHeight / 72 * dpi);
    var context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la página.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingQuality = "high";
    var margin = Math.round(36 / 72 * dpi);
    var scale = Math.min(
      (canvas.width - margin * 2) / item.image.naturalWidth,
      (canvas.height - margin * 2) / item.image.naturalHeight
    );
    var width = item.image.naturalWidth * scale;
    var height = item.image.naturalHeight * scale;
    context.drawImage(item.image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);

    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error("No se pudo codificar una imagen."));
          return;
        }
        blob.arrayBuffer().then(function (buffer) {
          resolve(new Uint8Array(buffer));
        }, reject);
      }, "image/jpeg", 0.9);
    });
  }

  async function createPdf(items, pageWidth, pageHeight) {
    var encoder = new TextEncoder();
    var chunks = [];
    var length = 0;
    var objectCount = 2 + items.length * 3;
    var offsets = new Array(objectCount + 1);

    function append(bytes) {
      chunks.push(bytes);
      length += bytes.length;
    }

    function appendText(text) {
      append(encoder.encode(text));
    }

    function addObject(id, body) {
      offsets[id] = length;
      appendText(id + " 0 obj\n" + body + "\nendobj\n");
    }

    function addImageObject(id, bytes) {
      offsets[id] = length;
      appendText(id + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " +
        Math.round(pageWidth / 72 * 200) + " /Height " + Math.round(pageHeight / 72 * 200) +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
        bytes.length + " >>\nstream\n");
      append(bytes);
      appendText("\nendstream\nendobj\n");
    }

    appendText("%PDF-1.4\n");
    var pageIds = items.map(function (_, index) { return 3 + index * 3; });
    addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
    addObject(2, "<< /Type /Pages /Kids [" +
      pageIds.map(function (id) { return id + " 0 R"; }).join(" ") +
      "] /Count " + items.length + " >>");

    for (var index = 0; index < items.length; index++) {
      var pageId = 3 + index * 3;
      var imageId = pageId + 1;
      var contentId = pageId + 2;
      var imageBytes = await createPageImage(items[index], pageWidth, pageHeight);

      addObject(pageId, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
        pageWidth.toFixed(2) + " " + pageHeight.toFixed(2) +
        "] /Resources << /XObject << /Im0 " + imageId +
        " 0 R >> >> /Contents " + contentId + " 0 R >>");
      addImageObject(imageId, imageBytes);

      var content = "q\n" + pageWidth.toFixed(2) + " 0 0 " +
        pageHeight.toFixed(2) + " 0 0 cm\n/Im0 Do\nQ";
      addObject(contentId, "<< /Length " + encoder.encode(content).length +
        " >>\nstream\n" + content + "\nendstream");
    }

    var xrefOffset = length;
    appendText("xref\n0 " + (objectCount + 1) + "\n0000000000 65535 f \n");
    for (var objectId = 1; objectId <= objectCount; objectId++) {
      appendText(String(offsets[objectId]).padStart(10, "0") + " 00000 n \n");
    }
    appendText("trailer\n<< /Size " + (objectCount + 1) +
      " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF");

    return new Blob(chunks, { type: "application/pdf" });
  }

  async function generateImages() {
    if (!pdfFiles.length || isLoading || isGenerating) return;
    isGenerating = true;
    renderFiles();
    setMessage("Convirtiendo páginas…");
    var exported = 0;
    var format = outputFormat.value;
    try {
      for (var pdfIndex = 0; pdfIndex < pdfFiles.length; pdfIndex++) {
        var pdfFile = pdfFiles[pdfIndex];
        var baseName = pdfFile.file.name.replace(/\.pdf$/i, "") || "documento";
        for (var pageNumber = 1; pageNumber <= pdfFile.documentPdf.numPages; pageNumber++) {
          var page = await pdfFile.documentPdf.getPage(pageNumber);
          var viewport = page.getViewport({ scale: 2 });
          var canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          var context = canvas.getContext("2d");
          if (!context) throw new Error("No se pudo preparar la página.");
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          var blob = await new Promise(function (resolve) {
            canvas.toBlob(resolve, format === "png" ? "image/png" : "image/jpeg", 0.92);
          });
          if (!blob) throw new Error("No se pudo generar una imagen.");
          var url = URL.createObjectURL(blob);
          var link = document.createElement("a");
          link.href = url;
          link.download = baseName + "-pagina-" + pageNumber + "." + (format === "png" ? "png" : "jpg");
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          exported++;
        }
      }
      setMessage("Imágenes creadas: " + exported + ".");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo convertir el PDF. Prueba con otro archivo.", true);
    } finally {
      isGenerating = false;
      renderFiles();
    }
  }

  async function generate() {
    if (mode === "pdf-image") {
      await generateImages();
      return;
    }
    if (!images.length || isLoading || isGenerating) return;
    isGenerating = true;
    var currentImages = images.slice();
    var landscape = orientation.value === "landscape";
    var pageWidth = landscape ? 841.89 : 595.28;
    var pageHeight = landscape ? 595.28 : 841.89;
    renderFiles();
    setMessage("Creando el PDF…");

    try {
      var pdf = await createPdf(currentImages, pageWidth, pageHeight);
      var url = URL.createObjectURL(pdf);
      var link = document.createElement("a");
      link.href = url;
      link.download = "imagenes.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      setMessage("Páginas creadas: " + currentImages.length + ".");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo crear el PDF. Prueba con imágenes más pequeñas o en otro formato.", true);
    } finally {
      isGenerating = false;
      renderFiles();
    }
  }

  function clearFiles() {
    if (isLoading || isGenerating) return;
    images.forEach(function (item) { URL.revokeObjectURL(item.url); });
    images = [];
    pdfFiles = [];
    renderFiles();
    setMessage("");
  }

  function setMode(nextMode) {
    if (isLoading || isGenerating || nextMode === mode) return;
    clearFiles();
    mode = nextMode;
    var pdfToImage = mode === "pdf-image";
    modeImagePdfButton.setAttribute("aria-pressed", String(!pdfToImage));
    modePdfImageButton.setAttribute("aria-pressed", String(pdfToImage));
    modeImagePdfButton.className = pdfToImage ? "btn btn--ghost" : "btn btn--primary";
    modePdfImageButton.className = pdfToImage ? "btn btn--primary" : "btn btn--ghost";
    orientationField.classList.toggle("hidden", pdfToImage);
    formatField.classList.toggle("hidden", !pdfToImage);
    fileInput.accept = pdfToImage ? ".pdf,application/pdf" : "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
    fileInput.multiple = !pdfToImage;
    dropzone.setAttribute("aria-label", pdfToImage ? "Añadir PDF" : "Añadir imágenes al PDF");
    dropzone.querySelector(".dropzone__title").textContent = pdfToImage ? "Arrastra tu PDF aquí" : "Arrastra tus imágenes aquí";
    dropzone.querySelector(".dropzone__hint").textContent = pdfToImage ? "o haz clic para elegir uno o varios PDF" : "o haz clic para elegir JPG, PNG o WebP";
    modeDescription.textContent = pdfToImage ?
      "Cada página se renderiza en una imagen PNG o JPG, según el formato elegido." :
      "Cada imagen ocupa una página y se ajusta sin deformarse. Puedes cambiar el orden antes de crear el PDF.";
    createButton.textContent = pdfToImage ? "Crear y descargar imágenes" : "Crear y descargar PDF";
    updateButtons();
  }

  dropzone.addEventListener("click", function () { fileInput.click(); });
  dropzone.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", function () { addFiles(fileInput.files); });
  ["dragenter", "dragover"].forEach(function (type) {
    dropzone.addEventListener(type, function (event) {
      event.preventDefault();
      dropzone.classList.add("is-active");
    });
  });
  ["dragleave", "drop"].forEach(function (type) {
    dropzone.addEventListener(type, function (event) {
      event.preventDefault();
      dropzone.classList.remove("is-active");
    });
  });
  dropzone.addEventListener("drop", function (event) { addFiles(event.dataTransfer.files); });
  fileList.addEventListener("click", handleFileAction);
  createButton.addEventListener("click", generate);
  clearButton.addEventListener("click", clearFiles);
  modeImagePdfButton.addEventListener("click", function () { setMode("image-pdf"); });
  modePdfImageButton.addEventListener("click", function () { setMode("pdf-image"); });
})();
