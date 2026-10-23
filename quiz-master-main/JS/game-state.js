"use strict";

/* ===========================================================================
   game-state.js — إدارة حالة اللعبة والنتائج المباشرة (Host/Lobby State)
   يقوم بحساب النقاط والـ Streaks وإرسال الترتيب النهائي للباك إند.
   =========================================================================== */

const GameState = {
  // مصفوفة المتسابقين المنضمين للجولة الحالية
  livePlayers: [],

  // 1. تهيئة حالة اللاعبين عند بدء اللعبة
  async init(roomCode = null) {
    let stored = [];

    // جلب القائمة من السيرفر إذا كان رقم الغرفة متوفراً
    if (roomCode && window.Api && window.Api.game) {
      try {
        const remotePlayers = await window.Api.game.players(roomCode);
        if (Array.isArray(remotePlayers) && remotePlayers.length > 0) {
          stored = remotePlayers;
        }
      } catch (e) {
        console.warn("تعذر جلب اللاعبين من API، جاري التحميل من التخزين المحلي:", e);
      }
    }

    // Fallback للتخزين المحلي إن لم تتوفر استجابة من السيرفر
    if (!stored.length) {
      try {
        stored = JSON.parse(localStorage.getItem("churchQuizPlayers") || "[]");
      } catch {
        stored = [];
      }
    }

    this.livePlayers = stored.map((p) => this.formatPlayerObject(p));
  },

  // تنسيق كائن اللاعب لضمان وجود جميع الخصائص
  formatPlayerObject(player) {
    const name = typeof player === "string" 
      ? player 
      : (player.nickname || player.fullName || player.name || "متسابق");

    return {
      id: player.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name,
      avatar: player.avatar || "👤",
      score: Number(player.score) || 0,
      streak: Number(player.streak) || 0,
      correctCount: Number(player.correctCount) || 0,
      lastAdded: 0
    };
  },

  // 2. إضافة متسابق جديد عند انضمامه لحظياً
  addPlayer(player) {
    if (!player) return;
    
    const formatted = this.formatPlayerObject(player);
    const exists = this.livePlayers.some(
      (p) => p.name.toLowerCase() === formatted.name.toLowerCase()
    );

    if (!exists) {
      this.livePlayers.push(formatted);
      this.syncLocalCache();
    }
  },

  // 3. تسجيل إجابة المتسابق وحساب النقاط والـ Streak
  recordAnswer(playerName, choiceIndex, correctIndex, pointsMultiplier = "standard") {
    const player = this.livePlayers.find(
      (p) => p.name.toLowerCase() === String(playerName).toLowerCase()
    );
    if (!player) return;

    const isCorrect = Number(choiceIndex) === Number(correctIndex);

    if (isCorrect && pointsMultiplier !== "none" && pointsMultiplier !== "zero") {
      player.streak += 1;
      player.correctCount += 1;

      // حساب مكافأة التتابع (Streak Bonus حتى 300 نقطة إضافية)
      const streakBonus = Math.min(player.streak * 50, 300);
      const basePoints = pointsMultiplier === "double" ? 2000 : 1000;
      const added = basePoints + streakBonus;

      player.score += added;
      player.lastAdded = added;
    } else {
      player.streak = 0;
      player.lastAdded = 0;
    }

    this.syncLocalCache();
  },

  // 4. جلب أصحاب المراكز الأولى (Leaderboard Top Players)
  getTopPlayers(count = 5) {
    return [...this.livePlayers]
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, count);
  },

  // 5. حفظ وحزم النتائج النهائية للجولة وإرسالها للباك إند
  async saveFinalStandings(quizId = "", quizTitle = "Church Quiz", roomCode = "", totalQuestions = 0) {
    const sorted = [...this.livePlayers].sort((a, b) => b.score - a.score);

    // حفظ النسخة المحلية لشاشة التتويج
    localStorage.setItem("churchQuizFinalStandings", JSON.stringify(sorted));

    // إرسال البيانات إلى C# API لربطها بجدول النتائج الكلي
    if (window.Api && window.Api.results && window.Api.results.saveGame) {
      try {
        const payload = {
          quizId,
          quizTitle,
          roomCode,
          totalQuestions,
          players: sorted.map((p) => ({
            nickname: p.name,
            correct: p.correctCount,
            points: p.score,
            timeSeconds: 0
          }))
        };

        await window.Api.results.saveGame(payload);
        console.log("تم حفظ النتائج النهائية للمسابقة على السيرفر بنجاح! 🏆");
      } catch (err) {
        console.error("فشل إرسال النتائج النهائية للسيرفر:", err);
      }
    }
  },

  // تحديث التخزين المحلي الاحتياطي
  syncLocalCache() {
    try {
      localStorage.setItem("churchQuizPlayers", JSON.stringify(this.livePlayers));
    } catch (e) {
      console.warn("Storage quota limit reached.");
    }
  }
};

// إتاحة الكائن عالمياً للاستخدام في شاشات host-game.js و lobby.js
window.GameState = GameState;