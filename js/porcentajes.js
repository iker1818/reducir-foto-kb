(function () {
  "use strict";
  var type = document.getElementById("case");
  var a = document.getElementById("a");
  var b = document.getElementById("b");
  var labelA = document.getElementById("label-a");
  var labelB = document.getElementById("label-b");
  var answer = document.getElementById("answer");
  var answerLabel = document.getElementById("answer-label");
  var number = function (value) {
    return window.I18n ? window.I18n.formatNumber(value) :
      new Intl.NumberFormat("es-ES", { maximumFractionDigits: 6, useGrouping: true }).format(value);
  };

  function calculate() {
    if (a.value.trim() === "" || b.value.trim() === "") {
      answer.textContent = "—";
      answerLabel.textContent = window.I18n ? window.I18n.exact("Introduce ambos valores.") : "Introduce ambos valores.";
      return;
    }
    var first = Number(a.value);
    var second = Number(b.value);
    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      answer.textContent = "—";
      answerLabel.textContent = window.I18n ? window.I18n.exact("Introduce valores válidos.") : "Introduce valores válidos.";
      return;
    }
    var result;
    var label;
    if (type.value === "of") {
      result = first * second / 100;
      label = "Resultado";
    } else if (type.value === "is") {
      result = second === 0 ? NaN : first * 100 / second;
      label = "Porcentaje";
      if (Number.isFinite(result)) result = number(result) + " %";
    } else if (type.value === "change") {
      result = second * (1 + first / 100);
      label = first >= 0 ? "Valor con aumento" : "Valor con descuento";
    } else {
      result = first === 0 ? NaN : (second - first) * 100 / first;
      label = "Variación";
      if (Number.isFinite(result)) result = number(result) + " %";
    }
    if (!Number.isFinite(result) && typeof result !== "string") {
      answer.textContent = "—";
      answerLabel.textContent = window.I18n ? window.I18n.exact("No se puede calcular") : "No se puede calcular";
      return;
    }
    answer.textContent = typeof result === "string" ? result : number(result);
    answerLabel.textContent = window.I18n ? window.I18n.exact(label) : label;
  }

  function updateLabels(resetValues) {
    if (type.value === "of") {
      labelA.textContent = "Porcentaje X (%)"; labelB.textContent = "Valor Y";
      if (resetValues) { a.value = "20"; b.value = "100"; }
    } else if (type.value === "is") {
      labelA.textContent = "Cantidad A"; labelB.textContent = "Total B";
      if (resetValues) { a.value = "25"; b.value = "200"; }
    } else if (type.value === "change") {
      labelA.textContent = "Aumento o descuento (%)"; labelB.textContent = "Valor inicial";
      if (resetValues) { a.value = "15"; b.value = "100"; }
    } else {
      labelA.textContent = "Valor inicial"; labelB.textContent = "Valor final";
      if (resetValues) { a.value = "100"; b.value = "125"; }
    }
    if (window.I18n) {
      labelA.textContent = window.I18n.exact(labelA.textContent);
      labelB.textContent = window.I18n.exact(labelB.textContent);
    }
    calculate();
  }

  type.addEventListener("change", function () { updateLabels(true); });
  [a, b].forEach(function (control) { control.addEventListener("input", calculate); });
  document.addEventListener("i18n:change", function () { updateLabels(false); });
  updateLabels(false);
})();
