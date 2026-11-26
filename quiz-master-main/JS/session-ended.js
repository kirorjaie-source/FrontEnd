"use strict";

/* ===========================================================================
   session-ended.js — شاشة "انتهت هذه الجلسة" (للاعب والمدرّس)
   - بتتفعّل لوحدها في صفحة اللاعب لو الرابط فيه ?pin=XXXXXX والجيم خلصت/بدأت.
   - ومتاحة يدوي:  KokSessionEnded.show({ kind: "ended" | "started" | "host" })
   ملف مستقل: بيحقن الـ CSS بتاعه ومش محتاج أي تعديل في باقي الملفات.
   =========================================================================== */
(function () {
  const STYLE_ID = "kok-ended-style";
  const OVERLAY_ID = "kok-ended-overlay";

  const CONTENT = {
    ended: {
      icon: "⏳",
      titleAr: "انتهت هذه الجلسة",
      titleEn: "This game has ended",
      textAr: "الجيم سيشن دي خلصت ومينفعش تدخلها تاني. اطلب كود جديد من المدرّس وانضم للعبة الجاية.",
      textEn: "This game session is over. Ask your host for a new PIN to join the next one.",
      btnAr: "الدخول بكود جديد",
      btnEn: "Join another game",
      href: "__self__"
    },
    started: {
      icon: "🚪",
      titleAr: "اللعبة بدأت بالفعل",
      titleEn: "Game already started",
      textAr: "المدرّس بدأ اللعبة ومينفعش حد يدخل بعد البداية. استنى الجيم الجاي.",
      textEn: "The host has already started this game, so new players can't join now.",
      btnAr: "الدخول بكود آخر",
      btnEn: "Use another PIN",
      href: "__self__"
    },
    host: {
      icon: "⏳",
      titleAr: "انتهت صلاحية الجلسة",
      titleEn: "Session expired",
      textAr: "الجلسة دي انتهت على السيرفر. ارجع للوحة التحكم وابدأ جلسة جديدة.",
      textEn: "This session is no longer active. Go back to the dashboard to start a new one.",
      btnAr: "العودة للوحة التحكم",
      btnEn: "Back to dashboard",
      href: "adminn.html"
    }
  };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
#${OVERLAY_ID}{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;
  background:radial-gradient(1200px 700px at 50% -10%,#1d4f9a 0%,#0B1E36 55%,#06111f 100%);
  font-family:"Inter","Segoe UI",Tahoma,sans-serif;animation:kokEndFade .35s ease-out;overflow:hidden}
#${OVERLAY_ID} .kok-end-star{position:absolute;color:#F3C875;opacity:.35;animation:kokEndTwinkle 3s ease-in-out infinite}
#${OVERLAY_ID} .kok-end-card{position:relative;width:100%;max-width:440px;text-align:center;color:#fff;
  padding:34px 26px 28px;border-radius:26px;background:rgba(255,255,255,.07);
  border:1px solid rgba(243,200,117,.35);box-shadow:0 30px 70px rgba(0,0,0,.45);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);animation:kokEndPop .45s cubic-bezier(.2,.9,.3,1.2)}
#${OVERLAY_ID} .kok-end-cross{position:absolute;top:14px;inset-inline-end:18px;font-size:22px;color:#F3C875;opacity:.55}
#${OVERLAY_ID} .kok-end-icon{width:86px;height:86px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;
  font-size:40px;background:linear-gradient(135deg,rgba(243,200,117,.28),rgba(243,200,117,.08));
  border:2px solid rgba(243,200,117,.55);animation:kokEndFloat 3.2s ease-in-out infinite}
#${OVERLAY_ID} h2{margin:0 0 4px;font-size:25px;font-weight:900;color:#F3C875;line-height:1.3}
#${OVERLAY_ID} .kok-end-sub{margin:0 0 16px;font-size:14px;font-weight:700;color:rgba(255,255,255,.7);direction:ltr}
#${OVERLAY_ID} p{margin:0 0 6px;font-size:15px;line-height:1.7;color:rgba(255,255,255,.92)}
#${OVERLAY_ID} p.kok-end-en{font-size:13px;color:rgba(255,255,255,.62);direction:ltr;margin-bottom:22px}
#${OVERLAY_ID} .kok-end-btn{display:inline-flex;flex-direction:column;align-items:center;gap:1px;min-width:220px;
  padding:13px 26px;border:none;border-radius:999px;cursor:pointer;text-decoration:none;
  background:linear-gradient(135deg,#F3C875 0%,#E3A63F 100%);color:#0B1E36;font-weight:900;font-size:16px;
  box-shadow:0 10px 24px rgba(227,166,63,.4);transition:transform .15s,box-shadow .15s}
#${OVERLAY_ID} .kok-end-btn small{font-size:11.5px;font-weight:700;opacity:.75}
#${OVERLAY_ID} .kok-end-btn:hover,#${OVERLAY_ID} .kok-end-btn:focus-visible{transform:translateY(-2px);
  box-shadow:0 14px 30px rgba(227,166,63,.5);outline:none}
#${OVERLAY_ID} .kok-end-brand{margin-top:22px;font-size:12px;letter-spacing:.6px;color:rgba(255,255,255,.45)}
@keyframes kokEndFade{from{opacity:0}to{opacity:1}}
@keyframes kokEndPop{from{opacity:0;transform:scale(.92) translateY(14px)}to{opacity:1;transform:none}}
@keyframes kokEndFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes kokEndTwinkle{0%,100%{opacity:.15;transform:scale(.8)}50%{opacity:.55;transform:scale(1.15)}}
@media (max-width:480px){#${OVERLAY_ID} .kok-end-card{padding:28px 18px 24px}#${OVERLAY_ID} h2{font-size:22px}
  #${OVERLAY_ID} .kok-end-btn{width:100%;min-width:0}}
@media (prefers-reduced-motion:reduce){#${OVERLAY_ID},#${OVERLAY_ID} *{animation:none!important}}`;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function show(options) {
    const opts = typeof options === "string" ? { kind: options } : (options || {});
    const c = CONTENT[opts.kind] || CONTENT.ended;
    if (document.getElementById(OVERLAY_ID)) return;
    injectStyle();

    let href = opts.href || c.href;
    if (href === "__self__") href = location.pathname;   // نفس الصفحة بدون ?pin

    const stars = [[8, 12, 14], [86, 18, 12], [14, 78, 11], [90, 70, 15], [50, 6, 10], [70, 88, 12]]
      .map(([x, y, s], i) =>
        `<span class="kok-end-star" style="left:${x}%;top:${y}%;font-size:${s}px;animation-delay:${i * 0.45}s">✦</span>`)
      .join("");

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "kok-end-title");
    overlay.innerHTML = `
      ${stars}
      <div class="kok-end-card" dir="rtl">
        <span class="kok-end-cross">✝</span>
        <div class="kok-end-icon">${c.icon}</div>
        <h2 id="kok-end-title">${c.titleAr}</h2>
        <div class="kok-end-sub">${c.titleEn}</div>
        <p>${c.textAr}</p>
        <p class="kok-end-en">${c.textEn}</p>
        <a class="kok-end-btn" id="kok-end-btn" href="${href}">${c.btnAr}<small>${c.btnEn}</small></a>
        <div class="kok-end-brand">Kokquiz · Learn · Play · Grow</div>
      </div>`;
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";
    overlay.querySelector("#kok-end-btn")?.focus();
  }

  /* ---------- فحص تلقائي في صفحة اللاعب ---------- */
  async function checkPlayerLink() {
    if (!document.getElementById("pin-input")) return;      // مش صفحة اللاعب
    const pin = (new URLSearchParams(location.search).get("pin") || "").trim();
    if (!/^\d{4,8}$/.test(pin)) return;

    const base = (window.Api && Api.config && Api.config.API_BASE) ||
      ((location.hostname === "localhost" || location.hostname === "127.0.0.1")
        ? "https://localhost:7152/api"
        : "https://kokquiz-gaekbbdrcnhjdtd6.denmarkeast-01.azurewebsites.net/api");

    // لو اللاعب كان أصلاً جوه اللعبة دي (إعادة اتصال) منعرضش الشاشة
    try {
      const saved = JSON.parse(localStorage.getItem("churchQuizReconnect") || "null");
      if (saved && String(saved.pin) === pin) return;
    } catch { /* ignore */ }

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${base}/Games/pin/${encodeURIComponent(pin)}/status`, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return;                                    // الـ endpoint مش منشور؟ منعملش حاجة
      const data = await res.json();
      const status = String(data?.status || "").toLowerCase();
      if (status === "ended") show({ kind: "ended" });
      else if (status === "running") show({ kind: "started" });
    } catch { /* مفيش نت أو السيرفر نايم: نسيب الصفحة تشتغل عادي */ }
  }

  window.KokSessionEnded = { show };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", checkPlayerLink);
  else checkPlayerLink();
})();