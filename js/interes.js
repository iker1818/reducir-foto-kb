(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var eur = function (value) { return window.I18n ? window.I18n.formatCurrency(value, "EUR") : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: true }).format(value); };
  var number = function (value) { return window.I18n ? window.I18n.formatNumber(value, { maximumFractionDigits: 0, useGrouping: true }) : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: true }).format(value); };

  function calculate() {
    var ini = Number($("ini").value);
    var mes = Number($("mes").value);
    var tasa = Number($("tasa").value) / 100;
    var inputYears = Number($("anios").value);
    var n = parseInt($("cap").value, 10);
    if (!$("ini").value || !$("mes").value || !$("tasa").value || !$("anios").value ||
      !Number.isFinite(ini) || ini < 0 || !Number.isFinite(mes) || mes < 0 ||
      !Number.isFinite(tasa) || tasa < 0 || !Number.isFinite(inputYears) ||
      inputYears < 1 || inputYears > 60) {
      $("tabla").textContent = "";
      $("resumen").textContent = window.I18n ? window.I18n.exact("Introduce valores válidos.") : "Introduce valores válidos.";
      return;
    }
    var anios = Math.floor(inputYears);
    var rm = Math.pow(1 + tasa / n, n / 12) - 1; // tipo mensual equivalente

    var saldo = ini, invertido = ini, rows = "";
    for (var y = 1; y <= anios; y++) {
      for (var m = 0; m < 12; m++) { saldo = saldo * (1 + rm) + mes; invertido += mes; }
      rows += "<tr><td>" + number(y) + "</td><td>" + eur(invertido) + "</td><td>" +
              eur(saldo - invertido) + "</td><td>" + eur(saldo) + "</td></tr>";
    }
    if (!Number.isFinite(saldo) || !Number.isFinite(invertido)) {
      $("tabla").textContent = "";
      $("resumen").textContent = window.I18n ? window.I18n.exact("El resultado supera el rango calculable.") : "El resultado supera el rango calculable.";
      return;
    }
    $("tabla").innerHTML = rows;
    $("resumen").textContent = window.I18n && window.I18n.getLanguage() === "en" ?
      "Total: " + eur(saldo) + " · Invested: " + eur(invertido) + " · Interest: " + eur(saldo - invertido) :
      "Total: " + eur(saldo) + " · Invertido: " + eur(invertido) + " · Intereses: " + eur(saldo - invertido);
  }

  ["ini", "mes", "tasa", "anios", "cap"].forEach(function (id) {
    $(id).addEventListener("input", calculate);
  });
  document.addEventListener("i18n:change", calculate);
  calculate();
})();
