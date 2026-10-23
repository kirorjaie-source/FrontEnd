"use strict";

const QuizRender = {
  SHAPES: ["▲", "◆", "●", "■"],
  RANK_ICONS: ["🥇", "🥈", "🥉", "4", "5"],

  renderQuestion(question, currentIndex, totalQuestions) {
    document.getElementById("answers-count").textContent = "0";
    document.getElementById("question-number").textContent = `السؤال ${currentIndex + 1} من ${totalQuestions}`;
    document.getElementById("progress-bar").style.width = `${((currentIndex + 1) / totalQuestions) * 100}%`;
    document.getElementById("question-text").textContent = question.text;

    const chartArea = document.getElementById("bar-chart-area");
    if (chartArea) chartArea.style.display = "none";

    for (let i = 0; i < 4; i++) {
      const checkEl = document.getElementById(`check-${i}`);
      if (checkEl) checkEl.style.display = "none";
    }

    const answerList = document.getElementById("answer-list");
    answerList.replaceChildren();

    const isTF = question.answers.length === 2;
    if (document.getElementById("col-2")) document.getElementById("col-2").style.display = isTF ? "none" : "flex";
    if (document.getElementById("col-3")) document.getElementById("col-3").style.display = isTF ? "none" : "flex";

    question.answers.forEach((answer, index) => {
      const card = document.createElement("div");
      card.className = `answer-option card-${index}`;

      const shape = document.createElement("span");
      shape.className = "answer-shape-badge";
      shape.textContent = this.SHAPES[index] || String(index + 1);

      const label = document.createElement("span");
      label.className = "answer-text-label";
      label.textContent = answer;

      card.append(shape, label);
      answerList.appendChild(card);
    });

    document.getElementById("scoreboard-panel").hidden = true;
    document.getElementById("quiz-panel").hidden = false;
  },

  showStats(voteCounts, correctIdx) {
    const chartArea = document.getElementById("bar-chart-area");
    if (!chartArea) return;
    chartArea.style.display = "flex";

    const maxVotes = Math.max(...voteCounts, 1);
    for (let i = 0; i < 4; i++) {
      const numEl = document.getElementById(`vote-${i}`);
      const barEl = document.getElementById(`bar-${i}`);
      const checkEl = document.getElementById(`check-${i}`);

      if (numEl) numEl.textContent = voteCounts[i];
      if (barEl) {
        barEl.style.height = `${(voteCounts[i] / maxVotes) * 120 + 10}px`;
      }
      if (checkEl) {
        checkEl.style.display = (i === correctIdx) ? "block" : "none";
      }
    }

    document.querySelectorAll(".answer-option").forEach((opt, idx) => {
      if (idx === correctIdx) {
        opt.style.borderColor = "#22c55e";
        opt.style.transform = "scale(1.02)";
        opt.style.boxShadow = "0 0 25px rgba(34, 197, 94, 0.6)";
      } else {
        opt.style.opacity = "0.35";
      }
    });
  },

  showScoreboard(players, currentIndex, totalQuestions) {
    document.getElementById("quiz-panel").hidden = true;
    document.getElementById("scoreboard-panel").hidden = false;
    document.getElementById("scoreboard-round-info").textContent = `نتائج السؤال ${currentIndex + 1} من ${totalQuestions}`;

    const listEl = document.getElementById("leaderboard-list");
    listEl.innerHTML = "";

    if (!players || players.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; color: var(--muted); padding: 25px;">
          لم يسجل أي لاعب إجابة حتى الآن.
        </div>`;
      return;
    }

    players.forEach((player, index) => {
      const row = document.createElement("div");
      row.className = `lb-player-row ${index === 0 ? "rank-1" : ""}`;
      row.style.animationDelay = `${index * 0.08}s`;

      row.innerHTML = `
        <div class="lb-rank-badge">${this.RANK_ICONS[index] || (index + 1)}</div>
        <div class="lb-player-info">
          <span class="lb-avatar">${player.avatar}</span>
          <span class="lb-name">${player.name}</span>
          ${player.streak >= 2 ? `<span class="lb-streak">🔥 ${player.streak}</span>` : ""}
        </div>
        <div class="lb-score-wrap">
          ${player.lastAdded > 0 ? `<span class="lb-score-added">+${player.lastAdded}</span>` : ""}
          <span class="lb-score">${player.score}</span>
        </div>
      `;
      listEl.appendChild(row);
    });
  }
};