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

/* ---------------- الشخصية ---------------- */
const AVATAR_KEY = "kokAvatar";
let selectedAvatar = localStorage.getItem(AVATAR_KEY) || (window.Kok?.DEFAULT_AVATAR ?? "fox");

function buildAvatarPicker() {
  const box = $("avatar-picker");
  if (!box || !window.Kok) return;
  box.innerHTML = window.Kok.avatars
    .map((a) => `<button type="button" class="avatar-opt" role="radio" data-key="${a.key}" aria-label="${a.key}">${a.emoji}</button>`)
    .join("");
  const mark = () => box.querySelectorAll(".avatar-opt").forEach((b) => {
    const on = b.dataset.key === selectedAvatar;
    b.classList.toggle("selected", on);
    b.setAttribute("aria-checked", String(on));
  });
  box.addEventListener("click", (e) => {
    const b = e.target.closest(".avatar-opt");
    if (!b) return;
    selectedAvatar = b.dataset.key;
    localStorage.setItem(AVATAR_KEY, selectedAvatar);
    mark();
  });
  mark();
}

// يحط إيموجي الشخصية في كارت الانتظار والنتيجة والفوتر
function applyAvatar(key) {
  const emoji = window.Kok?.avatarEmoji(key) || "🦊";
  document.querySelectorAll(".avatar-emoji, .player-avatar-mini").forEach((el) => { el.textContent = emoji; });
}
let readyId = null;

/* ---------------- الشاشات ---------------- */

function show(viewId) {
  VIEWS.forEach((v) => $(v)?.classList.toggle("hidden", v !== viewId));
  $("main-logo")?.classList.toggle("hidden", viewId !== "join-card");
}

function showWaiting(title, text) {
  const titleEl = document.querySelector("#get-ready-card .ready-title");
  const textEl = document.querySelector("#get-ready-card .loading-text");
  if (titleEl) titleEl.textContent = title;
  if (textEl) textEl.textContent = text;
  show("get-ready-card");
}

function showError(message) {
  const el = $("error-msg");
  if (el) el.textContent = message || "";
}

function setFooterScore(score) {
  if ($("footer-player-score")) $("footer-player-score").textContent = score;
}

function enterWaitingRoom() {
  applyAvatar(me.avatar);
  if ($("player-name-display")) $("player-name-display").textContent = me.nickname;
  if ($("footer-player-name")) $("footer-player-name").textContent = me.nickname;
  setFooterScore(0);
  $("player-footer")?.classList.remove("hidden");
  show("waiting-card");
}

/* ---------------- أحداث السيرفر ---------------- */

// GetReady: { seconds } — "Get Ready!" بعدّ تنازلي لكل اللاعبين (محتاج تعديل الباك إند)
function onGetReady(d) {
  console.log("[player] GetReady", d);
  // الشاشة المشتركة (countdown.js): دايرة منقطة + الرقم في النص
  Countdown.start(Number(d?.seconds ?? d?.secondsLeft ?? 3) || 3, { number: d?.number });
}

// ChoiceDto(AnswerId, Index): بنقرا الـ id بأي اسم، ولو الاسم غريب ناخد أول قيمة (ترتيب الـ DTO)
function parseChoice(c, i) {
  const vals = Object.values(c ?? {});
  return {
    id: c?.id ?? c?.answerId ?? c?.choiceId ?? c?.optionId ?? vals[0],
    index: c?.index ?? c?.slot ?? c?.order ?? c?.position ?? i
  };
}

// PlayerQuestionDto: number, total, timeLimit, secondsLeft, choices[{id,index}]
function onQuestion(d) {
  console.log("[player] Question", d);
  clearInterval(readyId);
  Countdown.stop();
  choices = asArray(d.choices ?? d.answers ?? d.options)
    .map(parseChoice)
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
    const p = await Api.game.join(pin, nickname, selectedAvatar);
    me = { playerId: p.playerId ?? p.id, nickname, avatar: selectedAvatar };
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
    me = { playerId: saved.playerId, nickname: saved.nickname, avatar: saved.avatar || selectedAvatar };
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
  const urlPin = new URLSearchParams(location.search).get("pin") || "";

  // لو مفيش PIN في الرابط نظهر خانة الـ PIN
  if (!urlPin) $("pin-input")?.classList.remove("hidden");
  else {
    if ($("pin-input")) $("pin-input").value = urlPin;
    if ($("pin-chip-value")) $("pin-chip-value").textContent = urlPin;
    $("pin-chip")?.classList.remove("hidden");
  }

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
      answered = true;
      document.querySelectorAll("#pad-grid .pad-btn").forEach((b) => { b.disabled = true; b.style.opacity = b === btn ? "1" : "0.4"; });
      try {
        const answerId = Number(choice.id);
        if (!Number.isFinite(answerId)) {
          console.error("Choice id is not a number — شوف شكل الـ Question في الـ Console:", choice);
          throw new Error("Unexpected choice format (see Console).");
        }
        await Api.game.submitAnswer(answerId);
        showWaiting("Answer sent!", "Waiting for other players...");
      } catch (err) {
        console.error("SubmitAnswer failed:", err);
        showWaiting("Oops!", err.message || "Could not send your answer.");
      }
    });
  });

  buildAvatarPicker();
  show("join-card");
  await tryRejoin(urlPin);
});
