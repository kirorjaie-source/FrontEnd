"use strict";

/* ===========================================================================
   celebration.js — المؤثرات الاحتفالية والبصرية (Confetti + Sound Effects)
   تُستخدم في شاشة النتائج والتتويج لإطلاق قصاصات المطر والألعاب النارية.
   =========================================================================== */

const CelebrationFX = {
  // لحن الفانفار الاحتفالي للمركز الأول
  playWinnerFanfare() {
    if (typeof AudioEngine !== "undefined" && AudioEngine.isMuted) return;

    try {
      const ctx = typeof AudioEngine !== "undefined" ? AudioEngine.getContext() : null;
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { f: 440.00, d: 0.14 },
        { f: 440.00, d: 0.14 },
        { f: 440.00, d: 0.14 },
        { f: 554.37, d: 0.40 },
        { f: 659.25, d: 0.55 }
      ];

      let delay = 0;
      notes.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(item.f, now + delay);

        gain.gain.setValueAtTime(0.22, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + item.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + item.d);

        delay += item.d * 0.85;
      });
    } catch (e) {
      console.warn("Celebration audio error:", e);
    }
  },

  // إطلاق قصاصات الورق الملونة المتساقطة من الجانبين
  fireConfetti(durationMs = 4000) {
    if (typeof confetti !== "function") {
      console.warn("مكتبة Confetti غير محملة في الصفحة.");
      return;
    }

    const end = Date.now() + durationMs;
    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 }
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  },

  // إطلاق ألعاب نارية عشوائية في الشاشة (Fireworks Effect)
  fireFireworks(durationMs = 3000) {
    if (typeof confetti !== "function") return;

    const end = Date.now() + durationMs;
    const interval = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 250);
  },

  // دالة شاملة لإنعاش التتويج (صوت الفانفار + المطر الملون + الألعاب النارية)
  celebrateWinner() {
    this.playWinnerFanfare();
    this.fireConfetti(4000);
    this.fireFireworks(3000);
  }
};

// إتاحة الكائن عالمياً للاستدعاء من أي صفحة
window.CelebrationFX = CelebrationFX;