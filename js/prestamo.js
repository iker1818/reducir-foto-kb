(function () {
  "use strict";
  var capital = document.getElementById("capital");
  var years = document.getElementById("years");
  var annualRate = document.getElementById("rate");
  var frequency = document.getElementById("frequency");
  var payment = document.getElementById("payment");
  var interest = document.getElementById("interest");
  var total = document.getElementById("total");
  var money = function (value) {
    return window.I18n ? window.I18n.formatCurrency(value, "EUR") :
      new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2, useGrouping: true }).format(value);
  };

  function calculate() {
    var principal = Number(capital.value);
    var loanYears = Number(years.value);
    var periodsPerYear = Number(frequency.value);
    var periods = loanYears * periodsPerYear;
    var periodicRate = Number(annualRate.value) / 100 / periodsPerYear;
    if (!capital.value || !years.value || !annualRate.value ||
      !Number.isFinite(principal) || principal <= 0 || !Number.isInteger(loanYears) || loanYears < 1 || loanYears > 50 ||
      !Number.isFinite(periods) || periods <= 0 ||
      !Number.isFinite(periodicRate) || periodicRate < 0) {
      payment.textContent = interest.textContent = total.textContent = "—";
      return;
    }
    var periodicPayment = periodicRate === 0 ?
      principal / periods :
      principal * periodicRate / (1 - Math.pow(1 + periodicRate, -periods));
    var totalPaid = periodicPayment * periods;
    var totalInterest = totalPaid - principal;
    if (!Number.isFinite(periodicPayment) || !Number.isFinite(totalPaid) || !Number.isFinite(totalInterest)) {
      payment.textContent = interest.textContent = total.textContent = "—";
      return;
    }
    payment.textContent = money(periodicPayment);
    interest.textContent = money(totalInterest);
    total.textContent = money(totalPaid);
  }

  [capital, years, annualRate, frequency].forEach(function (control) {
    control.addEventListener("input", calculate);
    control.addEventListener("change", calculate);
  });
  document.addEventListener("i18n:change", calculate);
  calculate();
})();
