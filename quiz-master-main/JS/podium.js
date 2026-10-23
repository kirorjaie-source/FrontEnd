"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // 1. قراءة اسم المسابقة
  const session = JSON.parse(localStorage.getItem("churchQuizGameSession") || "null");
  const titleBox = document.getElementById("quizTitle");
  if (titleBox && session?.quizTitle) {
    titleBox.textContent = session.quizTitle;
  }

  // 2. قراءة قائمة الفائزين المحدثة من الكويز الحالي أولاً
  let standings = JSON.parse(localStorage.getItem("churchQuizFinalStandings") || "null");

  // إذا لم تتواجد، نقرأ من قائمة المنضمين للجلسة
  if (!standings || standings.length === 0) {
    standings = JSON.parse(localStorage.getItem("churchQuizPlayers") || "null");
  }

  // إذا لم تتواجد، نقرأ من سجل النتائج التراكمية
  if (!standings || standings.length === 0) {
    const rawResults = JSON.parse(localStorage.getItem("churchQuizResults") || "[]");
    const map = new Map();
    rawResults.forEach((r) => {
      const name = (r.name || r.fullName || "").trim();
      const score = Number(r.score ?? r.percentage ?? 0);
      if (name && (!map.has(name) || map.get(name).score < score)) {
        map.set(name, { name, score, avatar: r.avatar || "👤" });
      }
    });
    standings = Array.from(map.values());
  }

  // في حال عدم وجود أي نتائج على الإطلاق نضع أمثلة واقعية لتستمتع بالأنيميشن
  if (!standings || standings.length === 0) {
    standings = [
      { name: "مينا سمير", score: 3800, avatar: "🐊" },
      { name: "بيتر مجدي", score: 2950, avatar: "🐼" },
      { name: "مارينا هاني", score: 2100, avatar: "🦁" }
    ];
  }

  // 3. ترتيب الفائزين تنازلياً حسب النقاط
  standings.sort((a, b) => b.score - a.score);

  const defaultAvatars = ["🐊", "🐼", "🦁"];

  // تعبئة بيانات المركز الأول
  if (standings[0]) {
    document.getElementById("name-1").textContent = standings[0].name;
    document.getElementById("points-1").textContent = `${standings[0].score} نقطة`;
    document.getElementById("avatar-1").textContent = standings[0].avatar || defaultAvatars[0];
  }

  // تعبئة بيانات المركز الثاني
  if (standings[1]) {
    document.getElementById("name-2").textContent = standings[1].name;
    document.getElementById("points-2").textContent = `${standings[1].score} نقطة`;
    document.getElementById("avatar-2").textContent = standings[1].avatar || defaultAvatars[1];
  }

  // تعبئة بيانات المركز الثالث
  if (standings[2]) {
    document.getElementById("name-3").textContent = standings[2].name;
    document.getElementById("points-3").textContent = `${standings[2].score} نقطة`;
    document.getElementById("avatar-3").textContent = standings[2].avatar || defaultAvatars[2];
  }

  // 4. تشغيل تسلسل الصعود لكاهوت (Kahoot Podium Sequence)
  
  // الخطوة 1: صعود المركز الثالث بعد 1 ثانية
  setTimeout(() => {
    const col3 = document.getElementById("rank-3-col");
    if (col3) col3.classList.add("show");
  }, 1000);

  // الخطوة 2: صعود المركز الثاني بعد 2.6 ثانية
  setTimeout(() => {
    const col2 = document.getElementById("rank-2-col");
    if (col2) col2.classList.add("show");
  }, 2600);

  // الخطوة 3: صعود بطل المركز الأول بعد 4.3 ثانية مع الضوء وقصاصات الاحتفال
  setTimeout(() => {
    const col1 = document.getElementById("rank-1-col");
    const spotlight = document.getElementById("winnerSpotlight");
    if (col1) col1.classList.add("show");
    if (spotlight) spotlight.classList.add("active");

    // إطلاق قصاصات الاحتفال (Confetti)
    fireWinnerConfetti();
  }, 4300);
});

// دالة إطلاق قصاصات الورق الملونة الاحتفالية
function fireWinnerConfetti() {
  if (typeof confetti !== "function") return;

  const duration = 4000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 }
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}