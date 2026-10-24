"use strict";

/* ===========================================================================
   podium-controller.js — منصة التتويج النهائية (Kokquiz).
   المصدر: localStorage.churchQuizFinalStandings (بيتحفظ من شاشة المدرّس عند GameFinished)
   =========================================================================== */

const DEFAULT_AVATARS = ["🐊", "🐼", "🦁"];
const CROWD_AVATARS = ["🐸", "🐻", "🐧", "🐶", "🐱", "🦊"];

const byId = (id) => document.getElementById(id);
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

function readJSON(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

// يوحّد شكل أي مصدر: { name, score, avatar } — ويتجاهل اللي مفيهوش اسم أو نقاط
function normalize(list) {
  return (Array.isArray(list) ? list : [])
    .map((s) => ({
      name: String(s.name ?? s.fullName ?? s.nickname ?? s.playerName ?? "").trim(),
      score: Number(s.score ?? s.totalScore ?? s.points ?? NaN),
      avatar: s.avatar || ""
    }))
    .filter((s) => s.name && Number.isFinite(s.score));
}

function loadStandings() {
  // 1) الترتيب النهائي من الجيم الحالي
  let standings = normalize(readJSON("churchQuizFinalStandings"));

  // 2) قايمة اللاعبين (لو فيها نقاط)
  if (!standings.length) standings = normalize(readJSON("churchQuizPlayers"));

  // 3) سجل النتائج التراكمي (أعلى نتيجة لكل اسم)
  if (!standings.length) {
    const map = new Map();
    normalize(readJSON("churchQuizResults", [])).forEach((r) => {
      if (!map.has(r.name) || map.get(r.name).score < r.score) map.set(r.name, r);
    });
    standings = Array.from(map.values());
  }

  // 4) أمثلة لو مفيش أي نتائج (عشان الأنيميشن)
  if (!standings.length) {
    standings = [
      { name: "مينا سمير", score: 3800, avatar: "🐊" },
      { name: "بيتر مجدي", score: 2950, avatar: "🐼" },
      { name: "مارينا هاني", score: 2100, avatar: "🦁" },
      { name: "يوسف عادل", score: 1700, avatar: "🐸" },
      { name: "مريم نبيل", score: 1250, avatar: "🐧" }
    ];
  }
  return standings.sort((a, b) => b.score - a.score);
}

/* ---------------- كل المراكز ---------------- */

function openAll(standings) {
  const overlay = byId("allOverlay");
  const list = byId("allList");
  if (!overlay || !list) return;

  const max = Math.max(1, ...standings.map((s) => s.score));
  list.innerHTML = standings.map((s, i) => {
    const rank = i + 1;
    const pct = Math.max(6, Math.round((s.score / max) * 100));
    const avatar = s.avatar || (i < 3 ? DEFAULT_AVATARS[i] : CROWD_AVATARS[i % CROWD_AVATARS.length]);
    return `
      <div class="ko-row r${rank <= 3 ? rank : "x"}" style="--i:${Math.min(i, 10)};--w:${pct}%">
        <span class="ko-fill"></span>
        <span class="ko-rank">${rank}</span>
        <span class="ko-av">${esc(avatar)}</span>
        <span class="ko-name">${rank === 1 ? "👑 " : ""}${esc(s.name)}</span>
        <span class="ko-pts">${esc(s.score)}<small>نقطة</small></span>
      </div>`;
  }).join("");

  const sub = byId("allSub");
  if (sub) sub.textContent = `${standings.length} لاعب`;
  overlay.classList.add("ko-open");
  overlay.scrollTop = 0;
}

function closeAll() {
  byId("allOverlay")?.classList.remove("ko-open");
}

/* ---------------- التشغيل ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  // 1. اسم المسابقة
  const session = readJSON("churchQuizGameSession");
  const titleBox = byId("quizTitle");
  if (titleBox && session?.quizTitle) titleBox.textContent = session.quizTitle;

  // 2. الترتيب
  const standings = loadStandings();

  // 3. تعبئة المراكز الثلاثة
  for (let place = 1; place <= 3; place++) {
    const s = standings[place - 1];
    if (!s) { byId(`rank-${place}-col`)?.classList.add("empty"); continue; }
    byId(`name-${place}`).textContent = s.name;
    byId(`points-${place}`).textContent = `${s.score} نقطة`;
    byId(`avatar-${place}`).textContent = s.avatar || DEFAULT_AVATARS[place - 1];
  }

  // 4. زرار عرض كل المراكز (لو فيه أكتر من 3)
  const allBtn = byId("showAllBtn");
  if (allBtn) {
    allBtn.addEventListener("click", () => openAll(standings));
  }
  byId("allClose")?.addEventListener("click", closeAll);
  byId("allOverlay")?.addEventListener("click", (e) => { if (e.target === byId("allOverlay")) closeAll(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

  // 5. تسلسل الصعود (Kahoot Podium Sequence)
  setTimeout(() => byId("rank-3-col")?.classList.add("show"), 1000);
  setTimeout(() => byId("rank-2-col")?.classList.add("show"), 2600);
  setTimeout(() => {
    byId("rank-1-col")?.classList.add("show");
    byId("winnerSpotlight")?.classList.add("active");
    fireWinnerConfetti();
  }, 4300);

  // الزرار يظهر بعد ما البطل يطلع
  setTimeout(() => allBtn?.classList.add("ko-ready"), 5600);
});

// قصاصات الورق الملونة الاحتفالية
function fireWinnerConfetti() {
  if (typeof confetti !== "function") return;

  const end = Date.now() + 4000;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}