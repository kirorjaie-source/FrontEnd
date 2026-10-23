(() => {
  "use strict";

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  // جلب البيانات عبر طبقة Api الموحدة من الباك إند
  async function readResults() {
    try {
      if (window.Api && window.Api.results) {
        const results = await window.Api.results.list();
        return Array.isArray(results) ? results : [];
      }
      const data = JSON.parse(localStorage.getItem("churchQuizResults") || "[]");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("تعذر جلب نتائج لوحة الصدارة من API:", err);
      return [];
    }
  }

  function getName(result) {
    return String(
      result.name ??
      result.fullName ??
      result.participantName ??
      result.nickname ??
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

  function getIdentity(result) {
    const code = getCode(result);

    return code
      ? `code:${code}`
      : `name:${getName(result).toLowerCase()}`;
  }

  function getScore(result) {
    return Number(
      result.score ?? result.correctAnswers ?? result.correct ?? 0
    ) || 0;
  }

  function getTotal(result) {
    return Number(
      result.total ??
      result.totalQuestions ??
      0
    ) || 0;
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

    return total > 0
      ? (getScore(result) / total) * 100
      : 0;
  }

  function getDate(result) {
    const timestamp = Date.parse(
      result.date ??
      result.completedAt ??
      result.createdAt ??
      ""
    );

    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  async function getTopThree() {
    const results = await readResults();
    const bestByParticipant = new Map();

    for (const result of results) {
      if (!result || typeof result !== "object") continue;

      const total = getTotal(result);
      if (total < 1 && getScore(result) === 0) continue;

      const player = {
        name: getName(result),
        score: getScore(result),
        percentage: getPercentage(result),
        date: getDate(result)
      };

      const key = getIdentity(result);
      const previous = bestByParticipant.get(key);

      const isBetter =
        !previous ||
        player.percentage > previous.percentage ||
        (
          player.percentage === previous.percentage &&
          player.score > previous.score
        ) ||
        (
          player.percentage === previous.percentage &&
          player.score === previous.score &&
          player.date > previous.date
        );

      if (isBetter) {
        bestByParticipant.set(key, player);
      }
    }

    return [...bestByParticipant.values()]
      .sort((a, b) =>
        b.percentage - a.percentage ||
        b.score - a.score ||
        a.name.localeCompare(b.name)
      )
      .slice(0, 3);
  }

  async function render() {
    const container = document.getElementById(
      "admin-leaderboard-content"
    );

    if (!container) return;

    container.innerHTML = `<div style="text-align:center;padding:2rem;color:#888;">جاري تحميل لوحة الصدارة... ⏳</div>`;

    const players = await getTopThree();
    const medals = ["🥇", "🥈", "🥉"];
    const ranks = ["1ST PLACE", "2ND PLACE", "3RD PLACE"];

    if (players.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <b>No results yet</b>
          <p>Saved quiz results will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="admin-top-three">
        ${players.map((player, index) => `
          <article class="admin-top-card">
            <div class="admin-top-medal">${medals[index]}</div>
            <div class="admin-top-rank">${ranks[index]}</div>
            <h3>${escapeHTML(player.name)}</h3>
            <strong>${player.percentage.toFixed(1)}%</strong>
          </article>
        `).join("")}
      </div>

      <p class="admin-leaderboard-note">
        Showing each participant's best saved result.
        All quiz attempts remain in Results.
      </p>
    `;
  }

  async function openLeaderboard() {
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.toggle(
        "active",
        page.id === "page-leaderboard"
      );
    });

    document.querySelectorAll(".nav-link").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.page === "leaderboard"
      );
    });

    const heading = document.getElementById("page-heading");
    if (heading) heading.textContent = "Leaderboard";

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");

    await render();
  }

  function init() {
    const nav = document.querySelector(".navigation");
    const content = document.querySelector(".content");

    if (!nav || !content) return;

    let navButton = nav.querySelector(
      '.nav-link[data-page="leaderboard"]'
    );

    if (!navButton) {
      navButton = document.createElement("button");
      navButton.type = "button";
      navButton.className = "nav-link";
      navButton.dataset.page = "leaderboard";
      navButton.innerHTML = "<span>🏆</span> Leaderboard";

      const settingsButton = nav.querySelector(
        '.nav-link[data-page="settings"]'
      );

      if (settingsButton) {
        nav.insertBefore(navButton, settingsButton);
      } else {
        nav.appendChild(navButton);
      }
    }

    navButton.id = "admin-leaderboard-nav";

    let page = document.getElementById("page-leaderboard");

    if (!page) {
      page = document.createElement("section");
      page.className = "page";
      page.id = "page-leaderboard";

      page.innerHTML = `
        <div class="section-heading">
          <div>
            <h2>Leaderboard</h2>
            <p>Top 3 participants by their best quiz percentage.</p>
          </div>

          <button
            class="button gold-button"
            id="admin-leaderboard-refresh"
            type="button"
          >
            ↻ Refresh
          </button>
        </div>

        <div id="admin-leaderboard-content"></div>
      `;

      content.appendChild(page);
    }

    if (!navButton.dataset.leaderboardBound) {
      navButton.dataset.leaderboardBound = "true";
      navButton.addEventListener("click", () => openLeaderboard().catch(console.error));
    }

    const refreshButton = document.getElementById(
      "admin-leaderboard-refresh"
    );

    if (
      refreshButton &&
      !refreshButton.dataset.leaderboardBound
    ) {
      refreshButton.dataset.leaderboardBound = "true";
      refreshButton.addEventListener("click", () => render().catch(console.error));
    }

    render().catch(console.error);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();