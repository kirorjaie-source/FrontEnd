"use strict";

/* ===========================================================================
   avatars.js — قايمة الشخصيات المشتركة (صفحة اللاعب + اللوبي + المدرّس).
   السيرفر بيخزّن الـ key (زي "fox")، والشاشات بتحوّله لإيموجي من هنا.
   عاوز تضيف شخصية؟ ضيف سطر جديد (key بحروف إنجليزي + الإيموجي).
   =========================================================================== */
(function () {
  const AVATARS = [
    { key: "fox",     emoji: "🦊" },
    { key: "lamb",    emoji: "🐼" },
    { key: "dove",    emoji: "🕊️" },
    { key: "lion",    emoji: "🦁" },
    { key: "fish",    emoji: "🐊" },
    { key: "tiger",   emoji: "🐯" },
    { key: "cat",     emoji: "🐱" },
    { key: "dog",     emoji: "🐶" },
    { key: "owl",     emoji: "🦉" },
    { key: "frog",    emoji: "🐸" },
    { key: "rabbit",  emoji: "🐰" },
    { key: "monkey",  emoji: "🐵" },
    { key: "penguin", emoji: "🐧" },
    { key: "katkot",   emoji: "🐥" },
    { key: "unicorn", emoji: "🦄" },
    { key: "gorilla",   emoji: "🦧" },
    { key: "butterfly",   emoji: "🦋" },
    { key: "koala",   emoji: "🐨" },
    { key: "bear",    emoji: "🐻" }
  ];
  const byKey = new Map(AVATARS.map((a) => [a.key, a.emoji]));

  window.Kok = Object.assign(window.Kok || {}, {
    avatars: AVATARS,
    DEFAULT_AVATAR: "fox",
    // key → إيموجي. لو السيرفر مخزّن إيموجي نفسه بنرجّعه زي ما هو، ولو مفيش بنرجّع نص فاضي
    avatarEmoji(value) {
      const v = String(value ?? "").trim();
      if (!v) return "";
      if (byKey.has(v)) return byKey.get(v);
      return /[^\x00-\x7F]/.test(v) ? v : "";
    }
  });
})();