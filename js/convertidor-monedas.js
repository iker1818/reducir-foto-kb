(function () {
  "use strict";
  var amount = document.getElementById("amount");
  var from = document.getElementById("from");
  var to = document.getElementById("to");
  var result = document.getElementById("result");
  var swap = document.getElementById("swap");
  var mode = document.getElementById("rate-mode");
  var manualField = document.getElementById("manual-rate-field");
  var manualRate = document.getElementById("manual-rate");
  var rateInfo = document.getElementById("rate-info");
  var rates = {};
  var apiDate = "";

  var formatter = function (value) {
    return window.I18n ? window.I18n.formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 6, useGrouping: true }) :
      new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 6, useGrouping: true }).format(value);
  };

  function showRateSource() {
    var date = new Date(apiDate);
    var language = window.I18n ? window.I18n.getLanguage() : "es";
    var formattedDate = Number.isNaN(date.getTime()) ? apiDate :
      new Intl.DateTimeFormat(language === "es" ? "es-ES" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC"
      }).format(date);
    rateInfo.textContent = "Fuente: ExchangeRate-API. Última actualización: " + formattedDate + ".";
  }

  function calculate() {
    var value = Number(amount.value);
    if (!Number.isFinite(value) || value < 0) {
      result.value = "";
      return;
    }
    var rate = 1;
    if (mode.value === "manual") {
      rate = Number(manualRate.value);
    } else {
      if (from.value === to.value) rate = 1;
      else if (from.value === "EUR") rate = rates[to.value] || 0;
      else if (to.value === "EUR") rate = 1 / (rates[from.value] || 0);
      else rate = (rates[to.value] || 0) / (rates[from.value] || 0);
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      result.value = "";
      rateInfo.textContent = "No hay una tasa disponible para esta combinación.";
      return;
    }
    result.value = formatter(value * rate) + " " + to.value;
  }

  async function loadRates() {
    try {
      var response = await fetch("https://open.er-api.com/v6/latest/EUR");
      if (!response.ok) throw new Error("rate request");
      var data = await response.json();
      if (data.result !== "success" || data.base_code !== "EUR" || !data.rates) {
        throw new Error("invalid rate response");
      }
      rates = data.rates;
      rates.EUR = 1;
      apiDate = data.time_last_update_utc || data.date || "no indicada";
      showRateSource();
      calculate();
    } catch (error) {
      mode.value = "manual";
      manualField.classList.remove("hidden");
      rateInfo.textContent = "No fue posible consultar la tasa publicada. Introduce una tasa manual; los valores son orientativos.";
      calculate();
    }
  }

  [amount, from, to, manualRate].forEach(function (control) { control.addEventListener("input", calculate); });
  mode.addEventListener("change", function () {
    manualField.classList.toggle("hidden", mode.value !== "manual");
    calculate();
  });
  swap.addEventListener("click", function () {
    var previous = from.value;
    from.value = to.value;
    to.value = previous;
    calculate();
  });
  document.addEventListener("i18n:change", function () {
    calculate();
    if (apiDate) showRateSource();
  });
  loadRates();
})();
