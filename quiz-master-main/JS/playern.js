"use strict";

/* ===========================================================================
   playern.js — صفحة اللاعب.
   السيرفر هو اللي بيبعت الأسئلة والنتايج. اللاعب بيبعت رقم الاختيار بس (SubmitAnswer).
   أحداث السيرفر: Question → AnswerAccepted → Reveal → ... → GameFinished
   =========================================================================== */

const RECONNECT_KEY = "churchQuizReconnect"; // نفس المفتاح اللي في apin.js
const VIEWS = ["join-card", "waiting-card", "get-ready-card", "answer-pad", "result-card", "final-card"];
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

// يحط إيموجي الشخصية في كارت الانتظار والنتيجة والنهاية والفوتر
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

// كارتين واتساب من contacts.js (SUPPORT_CONTACTS: الاسم + الرقم)
function renderSupport() {
  const box = $("final-support");
  const links = $("support-links");
  if (!box || !links || typeof SUPPORT_CONTACTS === "undefined" || !SUPPORT_CONTACTS.length) return;

  const WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.9 9.9 0 0 0 4.77 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.05c-.25.7-1.45 1.34-2 1.4-.52.06-1.17.09-1.88-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.9-4.27-5.05-4.47-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1.01 2.09 1.32 2.39 1.47.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42z"/></svg>';
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

  links.innerHTML = SUPPORT_CONTACTS.slice(0, 2).map((p) => {
    const digits = String(p.phone || "").replace(/\D/g, "");
    return `<a class="support-link" target="_blank" rel="noopener noreferrer" href="${digits ? "https://wa.me/" + digits : "#"}">` +
           `<span class="sup-name">${esc(p.name)}</span><span class="sup-wa">${WA}</span></a>`;
  }).join("");
  box.hidden = false;
}

// قصاصات ورق ملونة بتنزل على الشاشة
function launchConfetti() {
  const box = $("final-confetti");
  if (!box) return;
  const colors = ["#FFD966", "#FFFFFF", "#6EC6FF", "#E5B869", "#FF7A96", "#8CF0B0"];
  box.innerHTML = Array.from({ length: 48 }, () => {
    const left = (Math.random() * 100).toFixed(1);
    const dur = (3 + Math.random() * 3.5).toFixed(2);
    const delay = (Math.random() * 4).toFixed(2);
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `<i style="left:${left}%;background:${color};animation-duration:${dur}s;animation-delay:${delay}s"></i>`;
  }).join("");
}

// عدّاد النقاط: من 0 للقيمة النهائية
function countUpNumber(el, to) {
  const t0 = performance.now();
  const dur = 1400;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// GameFinished: List<StandingDto> (playerId, name, totalScore, rank, ...)
function onFinished(board) {
  console.log("[player] GameFinished", board);
  Countdown.stop();
  const list = asArray(board);
  const mine = list.find((s) => me && s.playerId === me.playerId);
  const rank = mine?.rank;

  if ($("final-name")) $("final-name").textContent = me?.nickname || "";
  if ($("final-medal")) $("final-medal").textContent = ({ 1: "🥇", 2: "🥈", 3: "🥉" })[rank] || "🏆";
  if ($("final-headline")) {
    $("final-headline").textContent =
      rank === 1 ? "مبروك! أنت المركز الاول  🏆" :
      rank === 2 || rank === 3 ? "  كنت قريب انك تكسب👌   🎉" :
      "شكراً لمشاركتك! ✝️";
  }
  if ($("final-rank")) {
    $("final-rank").textContent = mine ? `المركز ${rank} من ${list.length}` : "";
    $("final-rank").classList.toggle("hidden", !mine);
  }
  if ($("final-score")) {
    $("final-score").classList.toggle("hidden", !mine);
    if (mine && $("final-score-num")) countUpNumber($("final-score-num"), Number(mine.totalScore) || 0);
  }
  if (mine) setFooterScore(mine.totalScore);

  renderSupport();
  launchConfetti();
  localStorage.removeItem(RECONNECT_KEY); // اللعبة خلصت: مفيش رجوع
  show("final-card");
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