"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const session = JSON.parse(localStorage.getItem("churchQuizGameSession") || "null");
  const titleBox = document.getElementById("quizTitle");
  if (titleBox && session?.quizTitle) {
    titleBox.textContent = session.quizTitle;
  }

  // جلب الفائزين الفعليين من الجلسة الحالية
  const standings = JSON.parse(localStorage.getItem("churchQuizFinalStandings") || "[]");

  // التحقق من وجود نتائج حقيقية
  if (!standings || standings.length === 0) {
    const alertBox = document.getElementById("no-results-alert");
    if (alertBox) {
      alertBox.textContent = "لم يكتمل انضمام أي متسابق فعلي في هذه الجلسة.";
      alertBox.style.display = "block";
    }
    return;
  }

  // المركز الأول
  if (standings[0]) {
    document.getElementById("name-1").textContent = standings[0].name;
    document.getElementById("points-1").textContent = `${standings[0].score} نقطة`;
    document.getElementById("avatar-1").textContent = standings[0].avatar || "👤";
  }

  // المركز الثاني إن وُجد
  if (standings[1]) {
    document.getElementById("name-2").textContent = standings[1].name;
    document.getElementById("points-2").textContent = `${standings[1].score} نقطة`;
    document.getElementById("avatar-2").textContent = standings[1].avatar || "👤";
  } else {
    document.getElementById("rank-2-col").style.display = "none";
  }

  // المركز الثالث إن وُجد
  if (standings[2]) {
    document.getElementById("name-3").textContent = standings[2].name;
    document.getElementById("points-3").textContent = `${standings[2].score} نقطة`;
    document.getElementById("avatar-3").textContent = standings[2].avatar || "👤";
  } else {
    document.getElementById("rank-3-col").style.display = "none";
  }

  // تسلسل الصعود التدريجي لكاهوت
  if (standings[2]) {
    setTimeout(() => {
      document.getElementById("rank-3-col").classList.add("show");
    }, 1000);
  }

  if (standings[1]) {
    setTimeout(() => {
      document.getElementById("rank-2-col").classList.add("show");
    }, 2400);
  }

  if (standings[0]) {
    setTimeout(() => {
      document.getElementById("rank-1-col").classList.add("show");
      document.getElementById("winnerSpotlight").classList.add("active");

      // تشغيل لحن الفانفار الاحتفالي والكونفيتي
      if (typeof CelebrationFX !== "undefined") {
        CelebrationFX.playWinnerFanfare();
        CelebrationFX.fireConfetti();
      }
    }, standings[1] ? 4000 : 1500);
  }
});