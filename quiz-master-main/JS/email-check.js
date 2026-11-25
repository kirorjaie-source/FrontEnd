"use strict";

/* ===========================================================================
   email-check.js — التحقق من البريد الإلكتروني (صفحة التسجيل، وتنفع لصفحة الدخول).
   1) شكل البريد: بيرفض name@gmail أو name@@x.com أو النقط المتكررة، ويقترح تصحيح للأخطاء الشايعة (gmial.com ← gmail.com)
   2) هل البريد مسجّل قبل كده؟ (التسجيل بس) عن طريق Api.auth.emailExists — محتاج endpoint في الباك إند
   الاستخدام:
       const guard = KokEmail.attach(emailInput, { checkExists: true });
       const state = await guard.validateNow();   // { ok, reason, message }
   =========================================================================== */
(function () {
  const TEXT = {
    en: {
      empty: "Please enter your email address.",
      format: "This email address doesn't look right. Example: name@gmail.com",
      suggest: (s) => `Did you mean ${s}?`,
      exists: "This email is already registered. Please log in instead.",
      available: "Email is available ✓",
      checking: "Checking email…"
    },
    ar: {
      empty: "من فضلك اكتب بريدك الإلكتروني.",
      format: "شكل البريد الإلكتروني غير صحيح. مثال: name@gmail.com",
      suggest: (s) => `هل تقصد ${s}؟`,
      exists: "هذا البريد مسجّل بالفعل. برجاء تسجيل الدخول.",
      available: "البريد متاح ✓",
      checking: "جاري التحقق من البريد…"
    }
  };

  const lang = () => (localStorage.getItem("kokLang") === "ar" ? "ar" : "en");

  // local@domain.tld — الجزء الأخير (TLD) حرفين على الأقل
  const FORMAT = /^[A-Za-z0-9](?:[A-Za-z0-9._%+\-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

  // أخطاء كتابة شايعة في الدومينات المشهورة
  const DOMAIN_FIXES = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gamil.com": "gmail.com",
    "gmaill.com": "gmail.com", "gmail.co": "gmail.com", "gmail.cm": "gmail.com", "gmail.con": "gmail.com",
    "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmail.con": "hotmail.com", "hotmail.co": "hotmail.com",
    "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.con": "yahoo.com", "yahoo.co": "yahoo.com",
    "outlok.com": "outlook.com", "outlook.con": "outlook.com", "iclod.com": "icloud.com", "icloud.con": "icloud.com"
  };

  function suggest(email) {
    const at = email.lastIndexOf("@");
    if (at < 1) return null;
    const local = email.slice(0, at);
    const domain = email.slice(at + 1).toLowerCase();
    if (DOMAIN_FIXES[domain]) return `${local}@${DOMAIN_FIXES[domain]}`;
    if (/\.con$/.test(domain)) return `${local}@${domain.replace(/\.con$/, ".com")}`;
    return null;
  }

  function validate(raw) {
    const email = String(raw ?? "").trim();
    if (!email) return { ok: false, reason: "empty" };
    if (!FORMAT.test(email) || email.includes("..") || email.length > 254) {
      return { ok: false, reason: "format", suggestion: suggest(email) };
    }
    const fix = suggest(email);
    return fix ? { ok: false, reason: "typo", suggestion: fix } : { ok: true };
  }

  function messageFor(result) {
    const T = TEXT[lang()];
    if (result.reason === "empty") return T.empty;
    if (result.reason === "typo") return T.suggest(result.suggestion);
    return T.format + (result.suggestion ? " " + T.suggest(result.suggestion) : "");
  }

  // خطأ "البريد مستخدم" جاي من السيرفر (Identity بيقول DuplicateEmail / Email 'x' is already taken)
  function isDuplicateError(err) {
    if (!err) return false;
    if (err.code === "DUPLICATE_EMAIL") return true;
    const m = String(err.message || "");
    return /duplicateemail|email[^|]*(already|taken|exists|in use)|(already|taken)[^|]*email|البريد[^|]*(مسجل|مستخدم|موجود)/i.test(m);
  }

  function injectStyles() {
    if (document.getElementById("kq-email-style")) return;
    const s = document.createElement("style");
    s.id = "kq-email-style";
    s.textContent = `
      .kq-email-msg { display: none; margin: 6px 2px 0; font-size: 13px; font-weight: 700; line-height: 1.4; }
      .kq-email-msg[data-state="error"] { color: #ff6b6b; }
      .kq-email-msg[data-state="ok"]    { color: #7CDAA0; }
      .kq-email-msg[data-state="hint"]  { color: #FFD966; }
    `;
    document.head.appendChild(s);
  }

  function attach(input, { checkExists = false } = {}) {
    injectStyles();
    const box = document.createElement("div");
    box.className = "kq-email-msg";
    box.setAttribute("role", "alert");
    input.insertAdjacentElement("afterend", box);

    let seq = 0;
    const show = (text, state) => {
      box.textContent = text || "";
      box.dataset.state = state || "";
      box.style.display = text ? "block" : "none";
    };

    async function validateNow() {
      const mine = ++seq;
      const T = TEXT[lang()];
      const r = validate(input.value);
      if (!r.ok) {
        const message = messageFor(r);
        show(message, "error");
        return { ...r, message };
      }
      if (!checkExists || !(window.Api && Api.auth && Api.auth.emailExists)) { show("", ""); return { ok: true }; }

      show(T.checking, "hint");
      const exists = await Api.auth.emailExists(input.value.trim().toLowerCase());
      if (mine !== seq) return validateNow();           // اليوزر غيّر البريد أثناء الفحص
      if (exists === true) { show(T.exists, "error"); return { ok: false, reason: "exists", message: T.exists }; }
      if (exists === false) { show(T.available, "ok"); return { ok: true, exists: false }; }
      show("", "");                                     // الباك إند مفيهوش الفحص: نكمّل عادي
      return { ok: true };
    }

    input.addEventListener("input", () => { seq++; if (box.dataset.state === "error") show("", ""); });
    input.addEventListener("blur", () => { if (input.value.trim()) validateNow(); });
    return { validateNow, show };
  }

  window.KokEmail = { validate, messageFor, isDuplicateError, attach };
})();