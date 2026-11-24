(function () {
  "use strict";
  var DATA = {
    "Longitud": { m: 1, km: 1000, cm: 0.01, mm: 0.001, milla: 1609.344, yarda: 0.9144, pie: 0.3048, pulgada: 0.0254 },
    "Masa": { kg: 1, g: 0.001, mg: 1e-6, t: 1000, libra: 0.45359237, onza: 0.028349523125 },
    "Volumen": { litro: 1, ml: 0.001, "m³": 1000, "galón (EE. UU.)": 3.785411784, "taza (EE. UU.)": 0.2365882365 },
    "Velocidad": { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, nudo: 0.514444 },
    "Almacenamiento": { bit: 0.125, B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
    "Temperatura": { "°C": 1, "°F": 1, "K": 1 }
  };
  var $ = function (id) { return document.getElementById(id); };
  var cat = $("cat"), ua = $("ua"), ub = $("ub"), va = $("va"), vb = $("vb");
  var copyStatus = $("copy-status");

  function toCelsius(v, u) { return u === "°F" ? (v - 32) * 5 / 9 : u === "K" ? v - 273.15 : v; }
  function fromCelsius(c, u) { return u === "°F" ? c * 9 / 5 + 32 : u === "K" ? c + 273.15 : c; }

  function convert(v, from, to) {
    if (!Number.isFinite(v)) return NaN;
    if (cat.value === "Temperatura") {
      var celsius = toCelsius(v, from);
      return celsius < -273.15 ? NaN : fromCelsius(celsius, to);
    }
    return v * DATA[cat.value][from] / DATA[cat.value][to];
  }
  function fmt(n) { return String(parseFloat(n.toPrecision(10))); }

  function fill(select, units, selected) {
    select.innerHTML = "";
    units.forEach(function (u, i) {
      var o = document.createElement("option");
      o.value = o.textContent = u;
      if (i === selected) o.selected = true;
      select.appendChild(o);
    });
  }
  function loadCategory() {
    var units = Object.keys(DATA[cat.value]);
    fill(ua, units, 0); fill(ub, units, 1);
    fromA();
  }
  function fromA() {
    var v = parseFloat(va.value);
    var converted = convert(v, ua.value, ub.value);
    vb.value = Number.isFinite(converted) ? fmt(converted) : "";
    copyStatus.textContent = "";
  }
  function fromB() {
    var v = parseFloat(vb.value);
    var converted = convert(v, ub.value, ua.value);
    va.value = Number.isFinite(converted) ? fmt(converted) : "";
    copyStatus.textContent = "";
  }

  $("copy-result").addEventListener("click", function () {
    if (!vb.value) {
      copyStatus.textContent = "No hay un resultado para copiar.";
      return;
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      copyStatus.textContent = "El portapapeles no está disponible en este navegador o conexión.";
      return;
    }
    navigator.clipboard.writeText(vb.value + " " + ub.value).then(function () {
      copyStatus.textContent = "Copiado";
    }).catch(function () {
      copyStatus.textContent = "No se pudo copiar; selecciona el resultado para copiarlo manualmente.";
    });
  });

  fill(cat, Object.keys(DATA), 0);
  cat.addEventListener("change", loadCategory);
  va.addEventListener("input", fromA);
  vb.addEventListener("input", fromB);
  ua.addEventListener("change", fromA);
  ub.addEventListener("change", fromA);
  $("swap").addEventListener("click", function () {
    var a = ua.value; ua.value = ub.value; ub.value = a;
    fromA();
  });
  loadCategory();
})();
