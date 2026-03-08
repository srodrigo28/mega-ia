(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function renderTopTable(topGlobal, expected) {
    const tbody = byId("statsTopBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    topGlobal.forEach((entry, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (index + 1) + "</td>" +
        "<td>" + String(entry.number).padStart(2, "0") + "</td>" +
        "<td>" + entry.frequency + "</td>" +
        "<td>" + (entry.deviationPct > 0 ? "+" : "") + entry.deviationPct.toFixed(2) + "%</td>" +
        "<td>" + expected + "</td>";
      tbody.appendChild(tr);
    });
  }

  function renderSimpleKeyValueList(targetId, obj, suffix) {
    const target = byId(targetId);
    if (!target) return;

    const parts = [];
    Object.keys(obj).forEach((key) => {
      parts.push("<span><strong>" + key + "</strong>: " + obj[key] + (suffix || "") + "</span>");
    });
    target.innerHTML = parts.join(" | ");
  }

  function renderRecentTop(targetId, list) {
    const target = byId(targetId);
    if (!target) return;

    target.innerHTML = list
      .map((item) => String(item.number).padStart(2, "0") + " (" + item.frequency + ")")
      .join(" - ");
  }

  function renderMeta(stats) {
    const status = byId("statsStatus");
    if (!status) return;

    status.textContent =
      "Base oficial atualizada ate concurso " +
      stats.lastContest.number +
      " (" +
      stats.lastContest.date +
      "), total analisado: " +
      stats.contestsAnalyzed +
      ".";
  }

  function renderSumStats(sumStats) {
    const target = byId("statsSoma");
    if (!target) return;
    target.textContent =
      "Media: " + sumStats.mean +
      " | Desvio padrao: " + sumStats.stdDev +
      " | Min: " + sumStats.min +
      " | Max: " + sumStats.max;
  }

  function renderDecades(decades) {
    const target = byId("statsDecades");
    if (!target) return;
    target.innerHTML = decades
      .map((item) => "<span><strong>" + item.range + "</strong>: " + item.frequency + "</span>")
      .join(" | ");
  }

  function init() {
    if (!window.MEGA_STATS) {
      return;
    }

    const stats = window.MEGA_STATS;
    renderMeta(stats);
    renderTopTable(stats.topGlobal, stats.expectedFrequencyPerNumber);
    renderRecentTop("statsRecentTop", stats.topRecent100);
    renderSimpleKeyValueList("statsImparPar", stats.oddDistribution, " concursos");
    renderSimpleKeyValueList("statsRepeticao", stats.repeatFromPrevious, " concursos");
    renderSumStats(stats.sumStats);
    renderDecades(stats.decadeDistribution);
  }

  init();
})();
