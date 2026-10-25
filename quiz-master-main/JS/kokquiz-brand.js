"use strict";

/* ===========================================================================
   kokquiz-brand.js — بيرسم لوجو Kokquiz جوه أي عنصر عليه الكلاس kq-brand.
   بيحمّل خط Pacifico لوحده لو الصفحة مش محمّلاه.
   مثال:  <span class="kq-brand kq-md kq-stack" data-tagline></span>
   =========================================================================== */
(function () {
  const FONT_HREF = "https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Pacifico&display=swap";
  let counter = 0;

  function ensureFont() {
    if (document.querySelector('link[href*="family=Pacifico"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }

  function render(el) {
    if (el.dataset.kqDone) return;
    el.dataset.kqDone = "1";

    const id = "kqGold" + ++counter;   // id مختلف لكل لوجو عشان الـ gradient ما يتعارضش
    el.innerHTML =
      `<svg class="kq-cross" viewBox="0 0 60 90" aria-hidden="true">
         <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0" stop-color="#FFF3B0"/><stop offset="1" stop-color="#E4B93C"/>
         </linearGradient></defs>
         <rect x="23" y="2" width="14" height="86" rx="7" fill="url(#${id})"/>
         <rect x="4" y="24" width="52" height="14" rx="7" fill="url(#${id})"/>
       </svg>
       <span class="kq-text"><span class="kq-word"></span></span>`;

    el.querySelector(".kq-word").textContent = el.dataset.name || "Kokquiz";

    if (el.dataset.tagline !== undefined) {
      const tag = document.createElement("span");
      tag.className = "kq-tagline";
      tag.textContent = "Learn · Play · Grow";
      el.querySelector(".kq-text").appendChild(tag);
    }
    el.setAttribute("aria-label", el.dataset.name || "Kokquiz");
  }

  function init() {
    ensureFont();
    document.querySelectorAll(".kq-brand").forEach(render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.KokBrand = { init };
})();