"use strict";

/* ===========================================================================
   host-gamenn.js — شاشة المدرّس أثناء اللعب.
   السيرفر (GameService) هو اللي بيتحكم في الأسئلة والوقت والنقاط، والصفحة بتعرض
   الأحداث بس: Question → AnswerCount → Reveal → ... → GameFinished
   =========================================================================== */

const ADMIN_PAGE = "adminn.html";
const LOBBY_PAGE = "lobbyn.html";
const LOGIN_PAGE = "loginn.html";
const SHAPES = ["▲", "◆", "●", "■"];
const RESULTS_SECONDS = 3500; // نعرض الرسم البياني، وبعدها الترتيب لحد السؤال الجاي

const $ = (id) => document.getElementById(id);
const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
const formatTime = (secs) => (secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : String(secs));
const asArray = (v) => (Array.isArray(v) ? v : v?.items || v?.$values || []);
// يقرا حقل بأي حالة حروف (name / Name / NAME) وبأكتر من اسم محتمل
const pick = (o, ...names) => {
  for (const n of names) {
    const k = Object.keys(o || {}).find((key) => key.toLowerCase() === n.toLowerCase());
    if (k !== undefined) return o[k];
  }
  return undefined;
};

let session = null;
let currentChoices = [];   // [{ id, index, text }] للسؤال الحالي
let currentText = "";
let timerId = null;
let revealTimer = null;
let endAt = 0;
let countdownId = null;
let isLastQuestion = false;

/* ---------------- الشاشات ---------------- */

function showScreen(id) {
  document.querySelectorAll(".game-container > section").forEach((s) => {
    const on = s.id === id;
    s.classList.toggle("hidden", !on);
    s.classList.toggle("active", on);
  });

  // زرار Next: يظهر أثناء السؤال (Skip) والنتيجة والترتيب
  const next = $("btn-next");
  if (next) {
    next.style.display = ["screen-active-question", "screen-results", "screen-leaderboard"].includes(id) ? "" : "none";
    next.textContent = id === "screen-active-question" ? "Skip ⏭" : isLastQuestion ? "Finish 🏆" : "Next ▶";
  }
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function startTimer(seconds) {
  stopTimer();
  endAt = Date.now() + seconds * 1000;
  const tick = () => {
    const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if ($("q-timer")) $("q-timer").textContent = formatTime(left);
    if (left <= 0) stopTimer();
  };
  tick();
  timerId = setInterval(tick, 250);
}

function updateHeaderPlayers(count) {
  if ($("header-players")) $("header-players").textContent = count;
}

/* ---------------- أحداث السيرفر ---------------- */

// GetReady: { seconds } — عدّ تنازلي 3..2..1 قبل أول سؤال (محتاج تعديل الباك إند)
function onGetReady(d) {
  console.log("[host] GetReady", d);
  const nb = $("btn-next");
  if (nb) nb.style.display = "none";   // مفيش Next أثناء العدّ
  // الشاشة المشتركة (countdown.js): دايرة منقطة + الرقم في النص
  Countdown.start(Number(d?.seconds ?? d?.secondsLeft ?? 3) || 3, { number: d?.number });
}

// HostChoiceDto(AnswerId, Index, Text): بنقرا بأي اسم، وبنرجع لترتيب القيم لو الاسم غريب
function parseHostChoice(c, i) {
  const vals = Object.values(c ?? {});
  return {
    id: c?.id ?? c?.answerId ?? c?.choiceId ?? c?.optionId ?? vals[0],
    index: c?.index ?? c?.slot ?? c?.order ?? c?.position ?? i,
    text: c?.text ?? c?.answerText ?? c?.title ?? vals.find((v) => typeof v === "string") ?? ""
  };
}

// HostQuestionDto: number, total, text, imageUrl, questionType, timeLimit, secondsLeft, choices[{id,index,text}]
function onQuestion(d) {
  console.log("[host] Question", d);
  isLastQuestion = false;
  Countdown.stop();
  clearInterval(countdownId);
  clearTimeout(revealTimer);

  currentChoices = asArray(d.choices ?? d.answers ?? d.options)
    .map(parseHostChoice)
    .sort((a, b) => a.index - b.index);
  currentText = d.text ?? "";

  $("active-q-text").textContent = currentText;

  const img = $("q-image");
  const placeholder = $("q-placeholder");
  if (d.imageUrl) {
    img.src = d.imageUrl;
    img.style.display = "block";
    placeholder.style.display = "none";
  } else {
    img.style.display = "none";
    placeholder.style.display = "";
  }

  for (let i = 0; i < 4; i++) {
    const c = currentChoices[i];
    const label = $(`ans-${i}`);
    const box = label.closest(".ans-box");
    if (box) box.style.display = c ? "" : "none";
    label.textContent = c ? c.text : "";
    const stat = $(`stat-${i}`);
    if (stat) stat.textContent = "";
  }

  $("q-answers-count").textContent = "0";
  showScreen("screen-active-question");
  startTimer(Number(d.secondsLeft ?? d.timeLimit) || 20);
}

// AnswerCountDto: answered, total
function onAnswerCount(d) {
  console.log("[host] AnswerCount", d);
  const answered = d.answered ?? d.count ?? 0;
  const total = d.total ?? d.players;
  $("q-answers-count").textContent = answered;
  if (total != null) updateHeaderPlayers(total);
}

// أعداد الإجابات: object { answerId: count } (Dictionary<int,int>) أو array — بأي اسم حقل
function extractCounts(d) {
  if (d.counts && typeof d.counts === "object") return d.counts;
  for (const v of Object.values(d)) {
    if (v && typeof v === "object" && !Array.isArray(v) && Object.values(v).length
        && Object.values(v).every((n) => typeof n === "number")) return v;
  }
  return {};
}

// الترتيب: array فيه rank أو totalScore — بأي اسم حقل
function extractStandings(d) {
  if (Array.isArray(d.standings)) return d.standings;
  for (const v of Object.values(d)) {
    if (Array.isArray(v) && v.length && typeof v[0] === "object" && ("rank" in v[0] || "totalScore" in v[0])) return v;
  }
  return [];
}

// HostRevealDto: number, total, correctAnswerId, counts{answerId:count}, standings[], isLast
function onReveal(d) {
  console.log("[host] Reveal", d);
  Countdown.stop();
  stopTimer();
  isLastQuestion = !!(d.isLast ?? d.last);

  const correctId = d.correctAnswerId ?? d.correctId ?? d.correct;
  const counts = extractCounts(d);
  const perSlot = [0, 1, 2, 3].map((i) => Number(counts[currentChoices[i]?.id] ?? 0));
  const max = Math.max(1, ...perSlot);

  $("result-q-text").textContent = currentText;
  for (let i = 0; i < 4; i++) {
    const bar = $(`bar-${i}`);
    const wrap = bar.closest(".bar-wrapper");
    const choice = currentChoices[i];
    if (wrap) {
      wrap.style.display = choice ? "" : "none";
      wrap.style.opacity = choice && choice.id === correctId ? "1" : "0.4";
      const base = wrap.querySelector(".bar-base");
      if (base) base.textContent = SHAPES[i] + (choice && choice.id === correctId ? " ✓" : "");
    }
    bar.style.height = `${Math.max(8, Math.round((perSlot[i] / max) * 220))}px`;
    $(`count-${i}`).textContent = perSlot[i];
  }
  showScreen("screen-results");

  const standings = extractStandings(d);
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => {
    renderLeaderboard(standings);
    showScreen("screen-leaderboard");
  }, RESULTS_SECONDS);
}

// StandingDto: playerId, name, totalScore, pointsEarned, rank, rankChange, streak
function renderLeaderboard(standings) {
  const list = $("leaderboard-list");
  if (!list) return;
  list.innerHTML = standings.slice(0, 5).map((s) => {
    const change = s.rankChange > 0 ? `<span style="color:#7CFC9A">▲ ${s.rankChange}</span>`
      : s.rankChange < 0 ? `<span style="color:#FF8A8A">▼ ${Math.abs(s.rankChange)}</span>` : "";
    return `
      <div class="leaderboard-item" style="display:flex;align-items:center;justify-content:space-between;gap:16px;
           background:rgba(255,255,255,.14);border-radius:12px;padding:14px 22px;margin:8px 0;
           font:700 1.4rem 'Montserrat',sans-serif;color:#fff;min-width:min(520px,90vw)">
        <span>${s.rank}. ${escapeHTML(s.name)} ${change}</span>
        <span>${s.totalScore}${s.pointsEarned ? ` <small style="opacity:.75">(+${s.pointsEarned})</small>` : ""}</span>
      </div>`;
  }).join("");
}

// GameFinished: List<StandingDto>
function onFinished(board) {
  console.log("[host] GameFinished", board);
  Countdown.stop();
  stopTimer();
  clearTimeout(revealTimer);

  const top = asArray(board);
  for (let place = 1; place <= 3; place++) {
    const el = $(`podium-${place}`);
    const s = top[place - 1];
    if (!el) continue;
    if (s) {
      const name = pick(s, "name", "playerName", "nickname") ?? "Player";
      const score = pick(s, "totalScore", "score", "points") ?? 0;
      if ($(`w-name-${place}`)) $(`w-name-${place}`).textContent = name;
      if ($(`w-score-${place}`)) $(`w-score-${place}`).textContent = score;
      el.classList.remove("hidden");

      // نكتب الاسم والنقاط جوه العمود نفسه (تحت الميدالية) عشان يظهروا مهما كان الـ CSS
      const block = el.querySelector(".podium-block");
      const oldInfo = el.querySelector(".winner-info");
      if (oldInfo) oldInfo.style.display = "none";
      if (block) {
        if (getComputedStyle(block).position === "static") block.style.position = "relative";
        block.querySelector(".podium-live")?.remove();
        const box = document.createElement("div");
        box.className = "podium-live";
        box.style.cssText = "position:absolute;left:0;right:0;top:112px;padding:0 10px;text-align:center;color:#fff;font-family:'Montserrat',sans-serif";
        box.innerHTML =
          `<div style="font-weight:800;font-size:clamp(20px,2.6vw,38px);line-height:1.15;word-break:break-word">${escapeHTML(name)}</div>` +
          `<div style="margin-top:8px;font-weight:900;font-size:clamp(22px,3vw,44px);color:#FFD54A">${escapeHTML(score)}</div>`;
        block.appendChild(box);
      }
    } else {
      el.classList.add("hidden");
    }
  }
  $("btn-return-admin")?.classList.remove("hidden");
  showScreen("screen-final-podium");
}

/* ---------------- التشغيل ---------------- */

function leave(message, page) {
  if (message) alert(message);
  window.location.href = page;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!Api.auth.requireLogin(LOGIN_PAGE)) return;

  session = Api.game.current();
  if (!session || !session.roomCode) return leave("No active session found.", ADMIN_PAGE);

  const pin = session.roomCode;
  updateHeaderPlayers((await Api.game.players()).length);
  showScreen("screen-get-ready");

  $("btn-return-admin")?.addEventListener("click", async () => {
    try { await Api.realtime.disconnect(); } catch { /* ignore */ }
    window.location.href = ADMIN_PAGE;
  });

  // زرار Next: بيطلب من السيرفر ينقل للمرحلة التالية (NextPhase في GameHub)
  $("btn-next")?.addEventListener("click", async () => {
    const btn = $("btn-next");
    btn.disabled = true;
    try {
      await Api.realtime.invoke("NextPhase");
    } catch (err) {
      alert("Could not move on: " + (err.message || err.code) + "\n(لازم تضيف NextPhase في GameHub — شوف backend-changes.md)");
    } finally {
      setTimeout(() => { btn.disabled = false; }, 800);
    }
  });

  // نسجّل الأحداث قبل الاتصال والبدء، عشان أول سؤال ما يفوتناش
  Api.realtime.on("GetReady", onGetReady);
  Api.realtime.on("Question", onQuestion);
  Api.realtime.on("AnswerCount", onAnswerCount);
  Api.realtime.on("Reveal", onReveal);
  Api.realtime.on("GameFinished", onFinished);
  Api.realtime.on("PlayerJoined", async () => updateHeaderPlayers((await Api.game.players()).length));

  try {
    await Api.realtime.connect({ pin, role: "host" });
  } catch (err) {
    return leave("Could not connect to the live server: " + (err.message || err.code), LOBBY_PAGE);
  }

  // لو الجيم اتبدأ قبل كده (ريفريش للصفحة) منبدأش تاني، ونستنى الحدث الجاي
  if (session.status === "playing") {
    console.warn("اللعبة بدأت قبل كده — بنستنى السؤال أو النتيجة الجاية.");
    return;
  }

  try {
    await Api.game.start(pin); // HostJoin تم في connect، وده بينادي StartGame
  } catch (err) {
    leave("Could not start the game: " + (err.message || err.code), LOBBY_PAGE);
  }
});