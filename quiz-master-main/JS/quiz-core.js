"use strict";

const $ = (id) => document.getElementById(id);
const channel = new BroadcastChannel("kahoot_game_bus");

const params = new URLSearchParams(window.location.search);
const requestedQuizId = params.get("quiz");

const allQuizzes = JSON.parse(localStorage.getItem("churchAdminQuizzes") || "[]");
const allQuestions = JSON.parse(localStorage.getItem("churchAdminQuestions") || "[]");

const quiz = allQuizzes.find((q) => q.id === requestedQuizId && q.status === "Ready") ||
             allQuizzes.find((q) => q.status === "Ready");

let questions = [];
let currentIndex = 0;
let secondsLeft = 0;
let timerId = null;
let submitted = false;
let currentAnswersReceived = 0;
let currentVoteCounts = [0, 0, 0, 0];

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function formatTimer(totalSecs) {
  if (totalSecs >= 60) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }
  return String(totalSecs);
}

function startTimer() {
  stopTimer();

  // دعم الوقت المخصص لكل سؤال على حدة، أو الرجوع للوقت الافتراضي للكويز
  const currentQ = questions[currentIndex];
  const qTime = currentQ?.timeLimit;
  const duration = Math.min(Number(qTime || quiz.timePerQuestion) || 30, 10800);

  secondsLeft = duration;
  $("timer-count").textContent = formatTimer(secondsLeft);

  timerId = setInterval(() => {
    secondsLeft -= 1;
    $("timer-count").textContent = formatTimer(secondsLeft);

    // تكتكة الثواني الأخيرة عبر GameSounds
    if (secondsLeft <= 5 && secondsLeft > 0) {
      if (typeof GameSounds !== "undefined") GameSounds.tick();
    }

    if (secondsLeft <= 0) {
      stopTimer();
      triggerShowStats();
    }
  }, 1000);
}

function triggerShowStats() {
  stopTimer();

  // تشغيل جرس انتهاء الوقت عبر GameSounds
  if (typeof GameSounds !== "undefined") GameSounds.timesUp();

  const correctIdx = Number(questions[currentIndex].correct);
  channel.postMessage({
    type: "QUESTION_RESULT",
    correctIndex: correctIdx
  });

  QuizRender.showStats(currentVoteCounts, correctIdx);
  $("next-button").textContent = "المتصدرون (Leaderboard) ←";
}

function loadQuestion() {
  if (submitted) return;
  const q = questions[currentIndex];
  if (!q) return;

  currentAnswersReceived = 0;
  currentVoteCounts = [0, 0, 0, 0];
  GameState.livePlayers.forEach(p => p.lastAdded = 0);

  QuizRender.renderQuestion(q, currentIndex, questions.length);

  $("previous-button").disabled = currentIndex === 0;
  $("next-button").textContent = "التالي →";
  $("next-button").hidden = currentIndex === questions.length - 1;
  $("submit-button").hidden = currentIndex !== questions.length - 1;

  channel.postMessage({
    type: "NEW_QUESTION",
    choicesCount: q.answers.length
  });

  startTimer();
}

// الاستماع للاعبين الجدد وإجاباتهم الحية
channel.onmessage = (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "PLAYER_JOINED" && data.player) {
    GameState.addPlayer(data.player);
  }

  if (data.type === "PLAYER_ANSWER") {
    currentAnswersReceived++;
    $("answers-count").textContent = currentAnswersReceived;

    const choice = Number(data.choiceIndex);
    if (choice >= 0 && choice < 4) {
      currentVoteCounts[choice]++;
    }

    const correctIdx = Number(questions[currentIndex].correct);
    GameState.recordAnswer(data.playerName, choice, correctIdx);
  }
};

function completeGame() {
  if (submitted) return;
  stopTimer();
  submitted = true;

  GameState.saveFinalStandings();
  channel.postMessage({ type: "GAME_OVER" });

  $("quiz-panel").hidden = true;
  $("scoreboard-panel").hidden = true;
  $("result-panel").hidden = false;
}

function init() {
  if (!quiz) {
    alert("لا يوجد كويز متاح حالياً.");
    return;
  }

  const valid = allQuestions.filter(q => q && q.text && Array.isArray(q.answers));
  if (Array.isArray(quiz.questionIds) && quiz.questionIds.length > 0) {
    const ids = new Set(quiz.questionIds);
    questions = valid.filter(q => ids.has(q.id));
  } else {
    questions = valid;
  }

  if (questions.length === 0) {
    alert("هذا الكويز لا يحتوي على أسئلة.");
    return;
  }

  $("quiz-title").textContent = quiz.title;
  $("quiz-category").textContent = quiz.category || "General";

  GameState.init();

  $("previous-button").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      loadQuestion();
    }
  });

  $("next-button").addEventListener("click", () => {
    if ($("bar-chart-area").style.display === "none") {
      triggerShowStats();
    } else {
      if (typeof GameSounds !== "undefined") GameSounds.leaderboardSwoosh();
      QuizRender.showScoreboard(GameState.getTopPlayers(5), currentIndex, questions.length);
    }
  });

  $("next-question-btn").addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      loadQuestion();
    } else {
      completeGame();
    }
  });

  $("submit-button").addEventListener("click", () => {
    if ($("bar-chart-area").style.display === "none") {
      triggerShowStats();
      $("submit-button").textContent = "عرض المتصدرين والنتيجة النهائية";
    } else {
      if (typeof GameSounds !== "undefined") GameSounds.leaderboardSwoosh();
      QuizRender.showScoreboard(GameState.getTopPlayers(5), currentIndex, questions.length);
      $("next-question-btn").textContent = "إنهاء والذهاب لمنصة التتويج 🏆";
      $("next-question-btn").onclick = () => completeGame();
    }
  });

  loadQuestion();
}

document.addEventListener("DOMContentLoaded", init);