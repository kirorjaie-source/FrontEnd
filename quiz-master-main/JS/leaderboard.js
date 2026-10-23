
(() => {
  "use strict";

  const RESULTS_KEY = "churchQuizResults";
  const REGISTRATIONS_KEY = "churchQuizRegistrations";

  const $ = (id) => document.getElementById(id);

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getName(result) {
    return String(
      result.name ??
      result.fullName ??
      result.participantName ??
      "Participant"
    ).trim() || "Participant";
  }

  function getCode(result) {
    return String(
      result.studentCode ??
      result.student_code ??
      result.code ??
      ""
    ).trim().toLowerCase();
  }

  function getScore(result) {
    return Number(result.score ?? result.correctAnswers ?? 0) || 0;
  }

  function getTotal(result) {
    return Number(result.total ?? result.totalQuestions ?? 0) || 0;
  }

  function getPercentage(result) {
    const value = result.percentage ?? result.percent;

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Math.max(0, Math.min(100, Number(value)));
    }

    const total = getTotal(result);

    return total > 0 ? (getScore(result) / total) * 100 : 0;
  }

  function getDuration(result) {
    const value = Number(
      result.time ?? result.duration ?? result.timeTaken
    );

    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  function getDate(result) {
    const value = Date.parse(
      result.date ?? result.completedAt ?? result.createdAt ?? ""
    );

    return Number.isFinite(value) ? value : 0;
  }

  function getIdentity(result) {
    const code = getCode(result);

    return code
      ? `code:${code}`
      : `name:${getName(result).toLocaleLowerCase()}`;
  }

  function getRankedPlayers() {
    const registrationsByCode = new Map();

    readArray(REGISTRATIONS_KEY).forEach((registration) => {
      const code = getCode(registration);

      if (code) {
        registrationsByCode.set(code, registration);
      }
    });

    const best = new Map();

    readArray(RESULTS_KEY).forEach((result) => {
      if (!result || typeof result !== "object") return;

      const total = getTotal(result);
      if (total < 1) return;

      const code = getCode(result);
      const registration = code
        ? registrationsByCode.get(code)
        : null;

      const player = {
        name: getName(result),
        score: getScore(result),
        percentage: getPercentage(result),
        duration: getDuration(result),
        date: getDate(result)
      };

      if (
        player.name === "Participant" &&
        registration
      ) {
        player.name = getName(registration);
      }

      const key = getIdentity(result);
      const current = best.get(key);

      const isBetter =
        !current ||
        player.percentage > current.percentage ||
        (
          player.percentage === current.percentage &&
          player.score > current.score
        ) ||
        (
          player.percentage === current.percentage &&
          player.score === current.score &&
          player.duration !== null &&
          current.duration !== null &&
          player.duration < current.duration
        ) ||
        (
          player.percentage === current.percentage &&
          player.score === current.score &&
          player.date > current.date
        );

      if (isBetter) {
        best.set(key, player);
      }
    });

    return [...best.values()].sort((a, b) =>
      b.percentage - a.percentage ||
      b.score - a.score ||
      a.name.localeCompare(b.name)
    );
  }

  function render() {
    const podium = $("podium");
    const list = $("leaderboard-list");
    const message = $("leaderboard-message");
    const updated = $("updated-note");

    if (!podium || !list) return;

    const players = getRankedPlayers().slice(0, 3);
    const medals = ["🥇", "🥈", "🥉"];
    const labels = ["1ST PLACE", "2ND PLACE", "3RD PLACE"];

    if (players.length === 0) {
      podium.innerHTML = `
        <div class="empty-state">
          No results yet. Complete a quiz to appear here.
        </div>
      `;

      list.innerHTML = "";

      if (message) message.textContent = "";
      if (updated) updated.textContent = "";

      return;
    }

    // Display second place, first place, third place.
    const order = [players[1], players[0], players[2]];

    podium.innerHTML = order.map((player) => {
      if (!player) {
        return `
          <article class="podium-card">
            <div class="podium-medal">🏆</div>
            <div class="podium-rank">OPEN PLACE</div>
            <h3>Awaiting player</h3>
            <div class="podium-score">—</div>
          </article>
        `;
      }

      const rank = players.indexOf(player);

      return `
        <article class="podium-card${rank === 0 ? " first" : ""}">
          <div class="podium-medal">${medals[rank]}</div>
          <div class="podium-rank">${labels[rank]}</div>
          <h3>${escapeHTML(player.name)}</h3>
          <div class="podium-score">
            ${player.percentage.toFixed(1)}%
          </div>
        </article>
      `;
    }).join("");

    list.innerHTML = players.map((player, index) => `
      <article class="ranking-row">
        <div class="rank-number">${index + 1}</div>
        <div class="player-name">${escapeHTML(player.name)}</div>
        <div class="player-result">
          ${player.percentage.toFixed(1)}%
        </div>
      </article>
    `).join("");

    if (message) {
      message.textContent = "Top 3 players · Best result per participant";
    }

    if (updated) {
      updated.textContent =
        `Last refreshed: ${new Date().toLocaleString()}`;
    }
  }

  function init() {
    $("refresh-button")?.addEventListener("click", render);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ChurchQuizLeaderboard = {
    getTopThree: () => getRankedPlayers().slice(0, 3),
    refresh: render
  };
})();
