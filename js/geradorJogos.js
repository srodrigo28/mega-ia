(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function pickUniqueNumbers() {
    const numbers = [];
    while (numbers.length < 6) {
      const n = Math.floor(Math.random() * 60) + 1;
      if (!numbers.includes(n)) {
        numbers.push(n);
      }
    }
    numbers.sort((a, b) => a - b);
    return numbers;
  }

  function maxConsecutiveRun(numbers) {
    let run = 1;
    let maxRun = 1;
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] === numbers[i - 1] + 1) {
        run += 1;
        if (run > maxRun) {
          maxRun = run;
        }
      } else {
        run = 1;
      }
    }
    return maxRun;
  }

  function buildProfileRules(stats) {
    const mean = stats.sumStats.mean;
    return {
      conservador: {
        label: "Conservador",
        oddTarget: 3,
        oddTolerance: 1,
        minSum: mean - 30,
        maxSum: mean + 30,
        minDecades: 4,
        maxConsecutive: 2
      },
      equilibrado: {
        label: "Equilibrado",
        oddTarget: 3,
        oddTolerance: 2,
        minSum: mean - 45,
        maxSum: mean + 45,
        minDecades: 3,
        maxConsecutive: 2
      },
      agressivo: {
        label: "Agressivo",
        oddTarget: 3,
        oddTolerance: 3,
        minSum: mean - 60,
        maxSum: mean + 60,
        minDecades: 2,
        maxConsecutive: 3
      }
    };
  }

  function evaluateGame(numbers, stats, rules) {
    const oddCount = numbers.filter((n) => n % 2 !== 0).length;
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    const decades = new Set(numbers.map((n) => Math.floor((n - 1) / 10))).size;
    const seqRun = maxConsecutiveRun(numbers);

    const topGlobalSet = new Set(stats.topGlobal.slice(0, 15).map((x) => x.number));
    const topRecentSet = new Set(stats.topRecent100.slice(0, 10).map((x) => x.number));

    let score = 100;

    const oddDistance = Math.abs(oddCount - rules.oddTarget);
    if (oddDistance > rules.oddTolerance) {
      score -= (oddDistance - rules.oddTolerance) * 18;
    }

    if (sum < rules.minSum) {
      score -= Math.min(30, Math.round((rules.minSum - sum) / 3));
    } else if (sum > rules.maxSum) {
      score -= Math.min(30, Math.round((sum - rules.maxSum) / 3));
    }

    if (decades < rules.minDecades) {
      score -= (rules.minDecades - decades) * 12;
    }

    if (seqRun > rules.maxConsecutive) {
      score -= (seqRun - rules.maxConsecutive) * 15;
    }

    const inGlobal = numbers.filter((n) => topGlobalSet.has(n)).length;
    const inRecent = numbers.filter((n) => topRecentSet.has(n)).length;
    score += inGlobal * 2;
    score += inRecent * 2;

    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      numbers,
      score,
      oddCount,
      evenCount: 6 - oddCount,
      sum,
      decades,
      seqRun,
      inGlobal,
      inRecent
    };
  }

  function generateBestGame(stats, rules) {
    let best = null;
    for (let i = 0; i < 2000; i++) {
      const candidate = pickUniqueNumbers();
      const evaluated = evaluateGame(candidate, stats, rules);
      if (!best || evaluated.score > best.score) {
        best = evaluated;
      }
      if (best.score >= 99) {
        break;
      }
    }
    return best;
  }

  function renderGames(games, profileLabel) {
    const target = byId("resultadoGerador");
    if (!target) return;

    if (!games.length) {
      target.innerHTML = "<p>Nenhum jogo gerado.</p>";
      return;
    }

    const cards = games.map((game, index) => {
      const dezenas = game.numbers.map((n) => String(n).padStart(2, "0")).join(" - ");
      return (
        "<article class='jogo-card'>" +
          "<h4>Jogo " + (index + 1) + " | Score " + game.score + "/100</h4>" +
          "<p class='jogo-dezenas'>" + dezenas + "</p>" +
          "<p><strong>Perfil:</strong> " + profileLabel + "</p>" +
          "<p><strong>Impar/Par:</strong> " + game.oddCount + "/" + game.evenCount + "</p>" +
          "<p><strong>Soma:</strong> " + game.sum + " | <strong>Faixas:</strong> " + game.decades + " | <strong>Sequencia max:</strong> " + game.seqRun + "</p>" +
          "<p><strong>Top global:</strong> " + game.inGlobal + " | <strong>Top ultimos 100:</strong> " + game.inRecent + "</p>" +
        "</article>"
      );
    });

    target.innerHTML = cards.join("");
  }

  function init() {
    const btn = byId("btnGerarJogos");
    if (!btn) return;

    btn.addEventListener("click", function () {
      if (!window.MEGA_STATS) {
        return;
      }

      const stats = window.MEGA_STATS;
      const profileKey = byId("perfilGerador").value;
      const gamesCount = parseInt(byId("qtdJogosGerador").value, 10);
      const profiles = buildProfileRules(stats);
      const rules = profiles[profileKey] || profiles.equilibrado;

      const games = [];
      const used = new Set();

      while (games.length < gamesCount) {
        const game = generateBestGame(stats, rules);
        const key = game.numbers.join(",");
        if (!used.has(key)) {
          used.add(key);
          games.push(game);
        }
      }

      renderGames(games, rules.label);
    });
  }

  init();
})();
