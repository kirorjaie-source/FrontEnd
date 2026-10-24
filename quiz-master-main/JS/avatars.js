"use strict";

/* ===========================================================================
   avatars.js — اختيار شخصية اللاعب (Kokquiz).
   بيضيف شبكة شخصيات في شاشة الدخول (فوق خانة الاسم)، وبيحفظ الاختيار،
   وبيحدّث كل الأماكن اللي فيها الشخصية في صفحة اللاعب.
   الاستخدام: <script src="../JS/avatars.js"></script> قبل playern.js
   =========================================================================== */
(function () {
  // لازم القايمة دي تكون نفسها AllowedAvatars في GameService
  const LIST = ["🦊", "🐼", "🦁", "🐊", "🐸", "🐻", "🐧", "🐶", "🐱", "🐰", "🐯", "🐵", "🦄", "🐙"];
  const KEY = "kokquizAvatar";

  const read = () => {
    try { const v = localStorage.getItem(KEY); return LIST.includes(v) ? v : LIST[0]; } catch { return LIST[0]; }
  };
  let current = read();

  // نكتب الشخصية في كل مكان بيعرضها (شاشة الانتظار، النتيجة، الفوتر)
  function apply() {
    document.querySelectorAll(".avatar-emoji, .player-avatar-mini").forEach((el) => { el.textContent = current; });
  }

  function select(avatar) {
    if (!LIST.includes(avatar)) return;
    current = avatar;
    try { localStorage.setItem(KEY, avatar); } catch { /* ignore */ }
    document.querySelectorAll("#avatar-picker .av-btn").forEach((b) => {
      const on = b.dataset.avatar === avatar;
      b.classList.toggle("av-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    apply();
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #avatar-picker { width: 100%; margin-bottom: 12px; text-align: center; }
      #avatar-picker .av-title { margin-bottom: 8px; font: 800 .95rem 'Montserrat', sans-serif; opacity: .9; }
      #avatar-picker .av-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
      #avatar-picker .av-btn {
        aspect-ratio: 1; padding: 0; border: 3px solid transparent; border-radius: 12px;
        font-size: clamp(1.3rem, 6vw, 1.9rem); line-height: 1; cursor: pointer;
        background: rgba(255,255,255,.55); transition: transform .15s, border-color .15s, background .15s;
      }
      #avatar-picker .av-btn:hover { transform: scale(1.08); }
      #avatar-picker .av-btn.av-on {
        border-color: #E5B869; background: #fff; transform: scale(1.12);
        box-shadow: 0 0 0 3px rgba(229,184,105,.45), 0 6px 14px rgba(0,0,0,.25);
      }
    `;
    document.head.appendChild(style);
  }

  function buildPicker() {
    const card = document.getElementById("join-card");
    const nickname = document.getElementById("nickname-input");
    if (!card || !nickname || document.getElementById("avatar-picker")) return;

    injectStyles();
    const box = document.createElement("div");
    box.id = "avatar-picker";
    box.innerHTML =
      `<div class="av-title">Choose your character</div>` +
      `<div class="av-grid">${LIST.map((a) =>
        `<button type="button" class="av-btn" data-avatar="${a}" aria-pressed="false" aria-label="Character ${a}">${a}</button>`).join("")}</div>`;
    card.insertBefore(box, nickname);
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".av-btn");
      if (btn) select(btn.dataset.avatar);
    });
    select(current);
  }

  window.Avatars = { list: LIST, selected: () => current, select, apply };

  document.addEventListener("DOMContentLoaded", () => {
    buildPicker();
    apply();
  });
})();