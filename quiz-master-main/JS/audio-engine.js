"use strict";

/* ===========================================================================
   audio.js — محرك الصوتيات المؤثرة للعبة (Web Audio API)
   لا يحتاج ملفات MP3 خارجية، يولد النغمات والمؤثرات برمجياً.
   =========================================================================== */

const AudioEngine = {
  ctx: null,
  isMuted: false,

  // جلب أو إنشاء الـ AudioContext مع حل مشكلة الأوتوبلاي
  getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  },

  // تفعيل الصوت عند أول ضغطة للمستخدم لتجاوز قيود الأمان في المتصفح
  initAutoUnlock() {
    const unlock = () => {
      const ctx = this.getContext();
      if (ctx && ctx.state === "running") {
        document.removeEventListener("click", unlock);
        document.removeEventListener("touchstart", unlock);
        document.removeEventListener("keydown", unlock);
      }
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);
  },

  // توليد نغمة أساسية بتردد وشكل موجة محدد
  playTone(freq, type = "sine", duration = 0.1, gainLevel = 0.1, decay = true) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      if (decay) {
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  },

  // ====== نغمات ومؤثرات أحداث اللعبة جاهزة للاستدعاء ======

  // 1. صوت الضغط على الأزرار (Click)
  playClick() {
    this.playTone(600, "sine", 0.05, 0.05);
  },

  // 2. صوت تكة الثواني في العد التنازلي (Tick)
  playTick() {
    this.playTone(800, "triangle", 0.04, 0.08);
  },

  // 3. صوت الثواني الأخيرة (Warning Tick)
  playWarningTick() {
    this.playTone(1000, "sawtooth", 0.08, 0.12);
  },

  // 4. صوت الإجابة الصحيحة (Ascending Chime)
  playCorrect() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // نغمات C - E - G - C

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch (e) {}
  },

  // 5. صوت الإجابة الخاطئة (Descending Buzz)
  playWrong() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  },

  // 6. نغمة بدء المسابقة (Game Start)
  playGameStart() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        this.playTone(freq, "triangle", 0.3, 0.1, true);
      });
    } catch (e) {}
  },

  // 7. نغمة الفوز والتتويج (Fanfare)
  playWinner() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const fanfareNotes = [
        { f: 523.25, d: 0.15, t: 0 },
        { f: 523.25, d: 0.15, t: 0.15 },
        { f: 523.25, d: 0.15, t: 0.30 },
        { f: 659.25, d: 0.40, t: 0.45 },
        { f: 783.99, d: 0.60, t: 0.85 }
      ];

      fanfareNotes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.15, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    } catch (e) {}
  },

  // كتم أو تشغيل الصوت
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
};

// تفعيل استماع التفاعل لتجاوز حظر المتصفح تلقائياً عند التحميل
AudioEngine.initAutoUnlock();

// إتاحته عالمياً للاتصال من جميع الصفحات
window.AudioEngine = AudioEngine;