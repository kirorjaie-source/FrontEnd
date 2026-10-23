"use strict";

/* ===========================================================================
   playern.js — صفحة اللاعب.
   السيرفر هو اللي بيبعت الأسئلة والنتايج. اللاعب بيبعت رقم الاختيار بس (SubmitAnswer).
   أحداث السيرفر: Question → AnswerAccepted → Reveal → ... → GameFinished
   =========================================================================== */

const RECONNECT_KEY = "churchQuizReconnect"; // نفس المفتاح اللي في apin.js
const VIEWS = ["join-card", "waiting-card", "get-ready-card", "answer-pad", "result-card"];
const COLORS = { correct: "#26890C", wrong: "#E21B3C", none: "#555B66", over: "#1368CE" };

const $ = (id) => document.getElementById(id);
const asArray = (v) => (Array.isArray(v) ? v : v?.items || v?.$values || []);

let me = null;        // { playerId, nickname }
let choices = [];     // [{ id, index }] للسؤال الحالي
let answered = false;

/* ---------------- الشاشات ---------------- */

function show(viewId) {
  VIEWS.forEach((v) => $(v)?.classList.toggle("hidden", v !== viewId));
}

// onlyReady = true  → شاشة Get Ready لوحدها (من غير لوجو ولا الفوتر)
function showWaiting(title, text, onlyReady = false) {
  const titleEl = document.querySelector("#get-ready-card .ready-title");
  const textEl = document.querySelector("#get-ready-card .loading-text");
  if (titleEl) titleEl.textContent = title;
  if (textEl) textEl.textContent = text;
  document.body.classList.toggle("only-ready", onlyReady);
  show("get-ready-card");
}

// رقم الترتيب الكبير بدل صورة الثعلب في شاشة النتيجة
function setRankNumber(rank) {
  let el = $("rank-big");
  if (!el) {
    el = document.createElement("div");
    el.id = "rank-big";
    $("score-gained-text")?.closest(".score-gained-box")?.before(el);
  }
  el.textContent = rank != null ? rank : "";
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #result-card .avatar-large-box { display: none !important; }
    #rank-big { font: 900 7rem/1 'Montserrat', sans-serif; color: #fff;
                text-shadow: 0 6px 0 rgba(0,0,0,.25); margin: 24px 0 12px; text-align: center; }
    body.only-ready .player-footer,
    body.only-ready .brand-logo { display: none !important; }
  `;
  document.head.appendChild(style);
}

function showError(message) {
  const el = $("error-msg");
  if (el) el.textContent = message || "";
}

function setFooterScore(score) {
  if ($("footer-player-score")) $("footer-player-score").textContent = score;
}

function enterWaitingRoom() {
  if ($("player-name-display")) $("player-name-display").textContent = me.nickname;
  if ($("footer-player-name")) $("footer-player-name").textContent = me.nickname;
  setFooterScore(0);
  $("player-footer")?.classList.remove("hidden");
  show("waiting-card");
}

/* ---------------- أحداث السيرفر ---------------- */

// بيقرأ الـ id من أي اسم حقل محتمل (id / answerId / Id / optionId ...)
function pickId(c) {
  if (c == null) return undefined;
  if (typeof c === "number" || typeof c === "string") return c;
  return c.id ?? c.answerId ?? c.Id ?? c.AnswerId ?? c.optionId ?? c.OptionId;
}

// PlayerQuestionDto: number, total, timeLimit, secondsLeft, choices[{id,index}]
function onQuestion(d) {
  console.log("[player] Question", d);
  clearInterval(readyTimer);
  Countdown.stop();
  document.body.classList.remove("only-ready");
  const raw = asArray(d.choices ?? d.answers ?? d.options ?? d.Choices ?? d.Answers);
  console.log("[player] raw choices:", raw);

  choices = raw
    .map((c, i) => ({
      id: pickId(c),
      index: (typeof c === "object" && c !== null ? (c.index ?? c.slot ?? c.order) : undefined) ?? i
    }))
    .sort((a, b) => a.index - b.index);
  answered = false;

  if ($("pad-q-num")) $("pad-q-num").textContent = d.number ?? "";
  if ($("pad-q-type")) $("pad-q-type").textContent = choices.length === 2 ? "True / False" : "Quiz";

  document.querySelectorAll("#pad-grid .pad-btn").forEach((btn) => {
    const choice = choices[Number(btn.dataset.index)];
    btn.style.display = choice ? "" : "none";
    btn.disabled = false;
    btn.style.opacity = "";
  });
  show("answer-pad");
}

// GetReady: { seconds } — شاشة Ready بعدّ تنازلي قبل السؤال الجاي
let readyTimer = null;
function onGetReady(d) {
  console.log("[player] GetReady", d);
  clearInterval(readyTimer);
  const seconds = Number(d?.seconds ?? d) || 3;
  // شاشة Get Ready من countdown.js (بتغطي الصفحة كلها، وبتقفل لما السؤال يوصل)
  Countdown.start(seconds, { number: d?.number });
}

function onAnswerAccepted(d) {
  console.log("[player] AnswerAccepted", d);
  showWaiting("Answer sent!", "Waiting for other players...");
}

// PlayerRevealDto: answered, isCorrect, pointsEarned, totalScore, rank, rankChange, streak, correctSlot, playersCount, top
function onReveal(d) {
  console.log("[player] Reveal", d);
  Countdown.stop();
  const banner = $("result-banner");
  const wasAnswered = d.answered ?? false;

  if (banner) {
    banner.textContent = !wasAnswered ? "Time's up" : d.isCorrect ? "Correct" : "Incorrect";
    banner.style.background = !wasAnswered ? COLORS.none : d.isCorrect ? COLORS.correct : COLORS.wrong;
    banner.style.color = "#fff";
  }
  if ($("score-gained-text")) $("score-gained-text").textContent = `+ ${d.pointsEarned ?? 0}`;

  const streak = d.streak > 1 ? `  🔥 ${d.streak}` : "";
  if ($("podium-text")) {
    $("podium-text").textContent = `You're #${d.rank} of ${d.playersCount}${streak}`;
  }
  setFooterScore(d.totalScore ?? 0);
  setRankNumber(d.rank);
  show("result-card");
}

// GameFinished: List<StandingDto> (playerId, name, totalScore, rank, ...)
function onFinished(board) {
  console.log("[player] GameFinished", board);
  Countdown.stop();
  const list = asArray(board);
  const mine = list.find((s) => me && s.playerId === me.playerId);

  const banner = $("result-banner");
  if (banner) {
    banner.textContent = "Game Over";
    banner.style.background = COLORS.over;
    banner.style.color = "#fff";
  }
  if ($("score-gained-text")) $("score-gained-text").textContent = mine ? `${mine.totalScore} pts` : "";
  if ($("podium-text")) {
    $("podium-text").textContent = mine ? `You finished #${mine.rank} of ${list.length}` : "Thanks for playing!";
  }
  if (mine) setFooterScore(mine.totalScore);
  setRankNumber(mine ? mine.rank : "");

  localStorage.removeItem(RECONNECT_KEY); // اللعبة خلصت: مفيش رجوع
  show("result-card");
}

/* ---------------- الدخول ---------------- */

async function joinGame(urlPin) {
  const pin = ($("pin-input")?.value || urlPin || "").trim();
  const nickname = $("nickname-input").value.trim();

  if (!/^\d{6}$/.test(pin)) return showError("Enter the 6-digit Game PIN.");
  if (!nickname) return showError("Enter your nickname.");

  const btn = $("btn-join");
  btn.disabled = true;
  showError("");
  try {
    const p = await Api.game.join(pin, nickname);
    me = { playerId: p.playerId ?? p.id, nickname };
    enterWaitingRoom();
  } catch (err) {
    console.error("Join failed:", err);
    showError(err.message || "Could not join. Try again.");
  } finally {
    btn.disabled = false;
  }
}

// لو اللاعب عمل ريفريش أثناء اللعبة نرجّعه بالـ reconnectToken
async function tryRejoin(urlPin) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(RECONNECT_KEY)); } catch { /* ignore */ }
  if (!saved || (urlPin && saved.pin !== urlPin)) return false;
  try {
    await Api.game.rejoin();
    me = { playerId: saved.playerId, nickname: saved.nickname };
    enterWaitingRoom(); // لو اللعبة شغالة السيرفر هيبعت السؤال الحالي بعدها
    return true;
  } catch (err) {
    console.warn("Rejoin failed:", err);
    localStorage.removeItem(RECONNECT_KEY);
    return false;
  }
}

/* ---------------- التشغيل ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  injectStyles();
  const urlPin = new URLSearchParams(location.search).get("pin") || "";

  // لو مفيش PIN في الرابط نظهر خانة الـ PIN
  if (!urlPin) $("pin-input")?.classList.remove("hidden");
  else if ($("pin-input")) $("pin-input").value = urlPin;

  // نسجّل الأحداث قبل أي اتصال
  Api.realtime.on("GetReady", onGetReady);
  Api.realtime.on("Question", onQuestion);
  Api.realtime.on("AnswerAccepted", onAnswerAccepted);
  Api.realtime.on("Reveal", onReveal);
  Api.realtime.on("GameFinished", onFinished);

  $("btn-join").addEventListener("click", () => joinGame(urlPin));
  $("nickname-input").addEventListener("keydown", (e) => { if (e.key === "Enter") joinGame(urlPin); });

  document.querySelectorAll("#pad-grid .pad-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (answered) return;
      const choice = choices[Number(btn.dataset.index)];
      if (!choice) return;

      // حماية: لو الـ id مش رقم صالح منبعتش للسيرفر (ده كان سبب خطأ الـ binding)
      const answerId = Number(choice.id);
      if (choice.id == null || !Number.isFinite(answerId)) {
        console.error("Choice has no valid numeric id:", choice, "all choices:", choices);
        showWaiting("Oops!", "Answer id is missing in the question data. Check the console.");
        return;
      }

      answered = true;
      document.querySelectorAll("#pad-grid .pad-btn").forEach((b) => {
        b.disabled = true;
        b.style.opacity = b === btn ? "1" : "0.4";
      });
      try {
        await Api.game.submitAnswer(answerId);
        showWaiting("Answer sent!", "Waiting for other players...");
      } catch (err) {
        console.error("SubmitAnswer failed:", err);
        showWaiting("Oops!", err.message || "Could not send your answer.");
      }
    });
  });

  show("join-card");
  await tryRejoin(urlPin);
});