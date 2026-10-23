"use strict";

const channel = new BroadcastChannel("kahoot_game_bus");
const participant = JSON.parse(localStorage.getItem("churchQuizCurrentParticipant") || "null");

if (!participant) {
  alert("من فضلك أدخل اسمك أولاً.");
  window.location.href = "participant.html";
} else {
  document.getElementById("nameDisplay").textContent = participant.fullName;
  document.getElementById("avatarDisplay").textContent = participant.avatar || "👤";
}

let myCurrentChoice = null;
let myScore = 0;

// إرسال الإجابة عند الضغط على أي شكل
function sendAnswer(choiceIndex) {
  if (myCurrentChoice !== null) return;
  myCurrentChoice = choiceIndex;

  // تشغيل صوت النقر
  if (typeof PlayerSounds !== "undefined") {
    PlayerSounds.buttonTap();
  }

  // إخفاء الأزرار وإظهار بطاقة التأكيد
  document.getElementById("gamepadGrid").style.display = "none";
  document.getElementById("answeredScreen").style.display = "block";

  // إرسال الإجابة لشاشة العرض المركزية
  channel.postMessage({
    type: "PLAYER_ANSWER",
    playerName: participant.fullName,
    choiceIndex: choiceIndex
  });
}

// ربط مستمعات النقر للأزرار الأربعة
document.getElementById("btnRed").addEventListener("click", () => sendAnswer(0));
document.getElementById("btnBlue").addEventListener("click", () => sendAnswer(1));
document.getElementById("btnYellow").addEventListener("click", () => sendAnswer(2));
document.getElementById("btnGreen").addEventListener("click", () => sendAnswer(3));

// الاستماع لأحداث شاشة الكويز
channel.onmessage = (event) => {
  const data = event.data;
  if (!data) return;

  // 1. بدء سؤال جديد
  if (data.type === "NEW_QUESTION") {
    myCurrentChoice = null;
    document.getElementById("waitingCard").style.display = "none";
    document.getElementById("answeredScreen").style.display = "none";
    document.getElementById("resultFeedbackScreen").style.display = "none";

    const grid = document.getElementById("gamepadGrid");
    grid.style.display = "grid";

    // إخفاء الزرين الأصفر والأخضر في حالة صح أو خطأ
    const isTF = data.qType === "tf" || data.choicesCount === 2;
    document.getElementById("btnYellow").style.display = isTF ? "none" : "flex";
    document.getElementById("btnGreen").style.display = isTF ? "none" : "flex";
  }

  // 2. إعلان نتيجة السؤال
  if (data.type === "QUESTION_RESULT") {
    document.getElementById("gamepadGrid").style.display = "none";
    document.getElementById("answeredScreen").style.display = "none";

    const feedbackScreen = document.getElementById("resultFeedbackScreen");
    const feedbackIcon = document.getElementById("feedbackIcon");
    const feedbackTitle = document.getElementById("feedbackTitle");
    const feedbackDesc = document.getElementById("feedbackDesc");

    feedbackScreen.style.display = "block";

    const isCorrect = (myCurrentChoice !== null && Number(myCurrentChoice) === Number(data.correctIndex));

    if (isCorrect) {
      myScore += 1000;
      document.getElementById("scoreDisplay").textContent = `${myScore} نقطة`;

      feedbackIcon.textContent = "🎉";
      feedbackTitle.textContent = "إجابة صحيحة!";
      feedbackTitle.style.color = "#22c55e";
      feedbackDesc.textContent = "+1000 نقطة أضيفت لرصيدك!";

      if (typeof PlayerSounds !== "undefined") {
        PlayerSounds.correct();
      }
    } else {
      feedbackIcon.textContent = "❌";
      feedbackTitle.textContent = "إجابة غير صحيحة!";
      feedbackTitle.style.color = "#ef4444";
      feedbackDesc.textContent = myCurrentChoice === null ? "لم تقم باختيار إجابة في الوقت المحدد." : "حظاً أوفر في السؤال التالي!";

      if (typeof PlayerSounds !== "undefined") {
        PlayerSounds.wrong();
      }
    }
  }

  // 3. انتهاء المسابقة
  if (data.type === "GAME_OVER") {
    window.location.href = "podium.html";
  }
};