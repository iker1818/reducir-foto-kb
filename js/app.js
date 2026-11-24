/* ==========================================================
   app.js — Reducir foto a KB
   Todo se hace en el navegador con canvas; no se sube nada.
   ========================================================== */

(function () {
  "use strict";

  // ---------- Referencias al DOM ----------
  const $ = (id) => document.getElementById(id);
  const dropzone = $("dropzone");
  const fileInput = $("file-input");
  const options = $("options");
  const customWeight = $("custom-weight");
  const result = $("result");
  const preview = $("preview");
  const resultInfo = $("result-info");
  const btnDownload = $("btn-download");
  const btnReset = $("btn-reset");
  const message = $("message");

  // ---------- Estado ----------
  const state = {
    source: null,      // imagen cargada (ImageBitmap o HTMLImageElement)
    sourceBytes: 0,
    baseName: "foto",
    blob: null,        // resultado final
    previewUrl: null,
    runId: 0,          // evita que un cálculo antiguo pise a uno nuevo
    timer: null
  };

  // ---------- Mensajes ----------
  function setMessage(text, isError) {
    message.textContent = text || "";
    message.classList.toggle("is-error", Boolean(isError));
  }

  // ---------- Cargar la imagen ----------
  async function loadFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Ese archivo no es una imagen. Prueba con un JPG, PNG o WebP.", true);
      return;
    }
    setMessage("");
    try {
      state.source = await decodeImage(file);
    } catch (e) {
      setMessage("No se ha podido abrir esa imagen. Si es HEIC (iPhone), conviértela primero a JPG.", true);
      return;
    }
    state.sourceBytes = file.size;
    state.baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
    options.classList.remove("hidden");
    dropzone.classList.add("hidden");
    process();
  }

  async function decodeImage(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file); } catch (e) { /* se prueba con Image */ }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  // ---------- Leer opciones ----------
  function getMaxKB() {
    const choice = document.querySelector('input[name="weight"]:checked').value;
    if (choice === "custom") {
      const n = Number(customWeight.value);
      return Number.isInteger(n) && n >= 10 && n <= 5000 ? n : null;
    }
    return parseInt(choice, 10);
  }

  function getShape() {
    return document.querySelector('input[name="shape"]:checked').value;
  }

  // Recorte centrado según la forma elegida
  function getCrop(width, height, shape) {
    if (shape === "original") return { sx: 0, sy: 0, sw: width, sh: height };
    const [a, b] = shape.split(":").map(Number);
    const target = a / b;
    let sw = width;
    let sh = width / target;
    if (sh > height) { sh = height; sw = height * target; }
    return { sx: (width - sw) / 2, sy: (height - sh) / 2, sw, sh };
  }

  // ---------- Compresión ----------
  function toBlob(canvas, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  }

  function drawScaled(crop, scale) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(crop.sw * scale));
    canvas.height = Math.max(1, Math.round(crop.sh * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // fondo blanco para PNG con transparencia
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(state.source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  // Busca la mayor calidad que cabe en maxBytes; si no cabe, reduce las dimensiones
  async function compress(crop, maxBytes) {
    let scale = Math.min(1, 2000 / Math.max(crop.sw, crop.sh));

    while (true) {
      const canvas = drawScaled(crop, scale);
      let lo = 0.3, hi = 0.92, best = null;

      for (let i = 0; i < 7; i++) {
        const mid = (lo + hi) / 2;
        const blob = await toBlob(canvas, mid);
        if (blob.size <= maxBytes) { best = blob; lo = mid; } else { hi = mid; }
      }
      if (best) return { blob: best, width: canvas.width, height: canvas.height };

      scale *= 0.85;
      if (Math.min(crop.sw, crop.sh) * scale < 80) return null; // demasiado pequeña
    }
  }

  // ---------- Proceso completo ----------
  function process() {
    clearTimeout(state.timer);
    state.timer = setTimeout(run, 150);
  }

  async function run() {
    if (!state.source) return;
    const maxKB = getMaxKB();
    if (!maxKB) { setMessage("Escribe un peso máximo entero entre 10 y 5000 KB."); return; }

    const runId = ++state.runId;
    setMessage("Ajustando la foto…");

    const width = state.source.width;
    const height = state.source.height;
    const crop = getCrop(width, height, getShape());
    const output = await compress(crop, maxKB * 1024);

    if (runId !== state.runId) return; // ha llegado un cálculo más reciente

    if (!output) {
      result.classList.add("hidden");
      setMessage("No se puede llegar a ese peso sin dejar la foto ilegible. Prueba con un valor mayor.", true);
      return;
    }

    state.blob = output.blob;
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = URL.createObjectURL(output.blob);
    preview.src = state.previewUrl;

    const formatKB = window.I18n ? window.I18n.formatNumber : function (value) { return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: true }).format(value); };
    const originalKB = formatKB(state.sourceBytes / 1024);
    const resultKB = formatKB(output.blob.size / 1024);
    resultInfo.textContent = "Peso: original " + originalKB + " KB → resultado " + resultKB +
      " KB · Dimensiones: original " + state.source.width + " × " + state.source.height +
      " px → resultado " + output.width + " × " + output.height + " px";
    result.classList.remove("hidden");
    setMessage("");
  }

  // ---------- Descargar (sin salir de la página) ----------
  function download() {
    if (!state.blob) return;
    const maxKB = getMaxKB();
    const url = URL.createObjectURL(state.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.baseName + "-" + maxKB + "kb.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- Volver a empezar ----------
  function reset() {
    state.source = null;
    state.sourceBytes = 0;
    state.blob = null;
    state.runId++;
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = null;
    }
    fileInput.value = "";
    options.classList.add("hidden");
    result.classList.add("hidden");
    dropzone.classList.remove("hidden");
    setMessage("");
  }

  // ---------- Eventos ----------
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));

  ["dragenter", "dragover"].forEach((type) =>
    dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.add("is-active"); })
  );
  ["dragleave", "drop"].forEach((type) =>
    dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.remove("is-active"); })
  );
  dropzone.addEventListener("drop", (e) => loadFile(e.dataTransfer.files[0]));

  document.querySelectorAll('input[name="weight"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      customWeight.classList.toggle("hidden", radio.value !== "custom" || !radio.checked);
      if (radio.value === "custom" && radio.checked) customWeight.focus();
      process();
    })
  );
  document.querySelectorAll('input[name="shape"]').forEach((radio) =>
    radio.addEventListener("change", process)
  );
  customWeight.addEventListener("input", process);

  document.querySelectorAll("[data-photo-preset]").forEach((button) =>
    button.addEventListener("click", () => {
      const preset = button.dataset.photoPreset;
      document.querySelector('input[name="weight"][value="' + preset + '"]').checked = true;
      customWeight.classList.add("hidden");
      process();
    })
  );

  btnDownload.addEventListener("click", download);
  btnReset.addEventListener("click", reset);
  document.addEventListener("i18n:change", function () {
    if (state.source) process();
  });
})();
