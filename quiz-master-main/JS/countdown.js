"use strict";

/* ===========================================================================
   countdown.js — شاشة "Get Ready!" المشتركة (المدرّس + اللاعبين).
   الاستخدام:
     Countdown.start(3, { number: 2 })   // يبدأ العدّ 3..2..1 ويكتب "Question 2"
     Countdown.stop()                    // يقفلها (بنناديها لما السؤال يوصل)
   الشكل كله في countdown.css
   =========================================================================== */
(function () {
  const RED = "#E21B3C", BLUE = "#1368CE", YEL = "#FFA602", GRN = "#26890C", WHT = "#FFFFFF";

  // [x%, y%, النوع, اللون, الحجم, الدوران, الشفافية, wide(بس للشاشات العريضة)]
  const SHAPES = [
    [9, 10, "circle", YEL, 5.6, 0, .9],     [80, 7, "tri", WHT, 7, 12, .85],
    [86, 21, "square", RED, 5, 18, .9],     [16, 25, "circle", WHT, 3, 0, .7],
    [7, 39, "tri", YEL, 7.5, -18, .9],      [88, 44, "circle", RED, 4, 0, .9],
    [6, 56, "square", WHT, 4.5, 25, .8],    [89, 58, "square", YEL, 5.5, -12, .9],
    [12, 77, "circle", BLUE, 6.5, 0, .9],   [78, 78, "tri", RED, 7.5, 8, .9],
    [40, 93, "square", GRN, 5.5, 15, .9],   [67, 92, "circle", YEL, 5, 0, .9],
    [9, 91, "tri", BLUE, 7, -10, .9],       [87, 92, "circle", GRN, 4, 0, .9],
    // إضافية للشاشة الكبيرة
    [20, 16, "tri", WHT, 5, 14, .85, 1],    [26, 30, "circle", WHT, 2.2, 0, .7, 1],
    [24, 70, "square", WHT, 4, 24, .8, 1],  [22, 86, "tri", BLUE, 6, 8, .9, 1],
    [74, 18, "tri", WHT, 5, -12, .85, 1],   [76, 34, "circle", WHT, 2.2, 0, .7, 1],
    [74, 72, "square", WHT, 4, -20, .8, 1], [70, 88, "square", BLUE, 5, 15, .9, 1]
  ];

  let root = null, numEl = null, labelEl = null, timer = null;

  // لو صفحة الـ HTML ما فيهاش <link> للـ CSS، نحمّله بنفسنا من فولدر CSS (جنب فولدر JS)
  const SCRIPT_SRC = document.currentScript && document.currentScript.src;
  function ensureCss() {
    if (document.querySelector('link[href*="countdown.css"]') || !SCRIPT_SRC) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SCRIPT_SRC.replace(/\/JS\/countdown\.js.*$/i, "/CSS/countdown.css");
    document.head.appendChild(link);
  }

  function build() {
    if (root) return;
    ensureCss();
    root = document.createElement("div");
    root.hidden = true;                 // مخفية لحد ما العدّ يبدأ (حتى لو الـ CSS ما اتحمّلش)
    root.className = "cd-overlay";
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");

    const shapes = SHAPES.map(([x, y, type, c, s, r, o, wide]) =>
      `<span class="cd-shape cd-${type}${wide ? " cd-wide" : ""}" aria-hidden="true" ` +
      `style="left:${x}%;top:${y}%;--c:${c};--s:${s};--r:${r}deg;--o:${o}"></span>`).join("");

    root.innerHTML = `
      ${shapes}
      <div class="cd-title">Get Ready!</div>
      <div class="cd-ring-box">
        <svg class="cd-ring" viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r="88" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
          <path d="M185 34.74 A110 110 0 1 1 75 34.74" fill="none" stroke="#fff" stroke-width="9"
                stroke-linecap="round" stroke-dasharray="0.1 17"/>
        </svg>
        <span class="cd-number">3</span>
      </div>
      <p class="cd-label"></p>`;
    document.body.appendChild(root);
    numEl = root.querySelector(".cd-number");
    labelEl = root.querySelector(".cd-label");
  }

  function setNumber(n) {
    numEl.textContent = n;
    numEl.classList.remove("cd-pop");
    void numEl.offsetWidth;            // إعادة تشغيل الأنيميشن
    numEl.classList.add("cd-pop");
  }

  function start(seconds = 3, opts = {}) {
    build();
    clearInterval(timer);
    let n = Math.max(1, Math.round(Number(seconds) || 3));
    labelEl.textContent = opts.number ? `Question ${opts.number}` : "";
    root.hidden = false;
    root.classList.add("cd-on");
    document.body.classList.add("cd-active");
    setNumber(n);
    timer = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(timer); timer = null; return; } // بنسيب آخر رقم لحد ما السؤال يوصل
      setNumber(n);
    }, 1000);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    document.body.classList.remove("cd-active");
    if (root) { root.classList.remove("cd-on"); root.hidden = true; }
  }

  window.Countdown = { start, stop };
})();