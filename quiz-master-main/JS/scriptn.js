"use strict";

/* ===========================================================================
   i18n.js — تغيير اللغة (عربي / English) في أي صفحة.
   الاستخدام: ضيف السطر ده كأول <script> قبل </body> في أي صفحة:
       <script src="../JS/i18n.js"></script>
   - بيحط زرار 🌐 فوق على اليمين لوحده (أو جوه أي عنصر عليه data-lang-slot).
   - بيترجم النصوص الظاهرة في الصفحة (حتى اللي بتتكتب من JS) من القاموس تحت.
   - بيبدّل اتجاه الصفحة (RTL / LTR). لو صفحة معيّنة شكلها اتبوظ في العربي،
     ضيف على <html> الخاصية data-keep-dir وهتفضل LTR مع ترجمة النصوص.
   - في الـ Console: I18n.missing() بيطلّع النصوص الإنجليزي اللي لسه ماتترجمتش.
   =========================================================================== */
(function () {
  const STORAGE_KEY = "kokLang";
  const DEFAULT_LANG = "en";      // غيّرها لـ "ar" لو عاوز العربي هو الأساسي

  /* ---------------- القاموس: English → العربية ----------------
     المفتاح هو النص من غير الرموز اللي على الأطراف (زي * أو → أو ! أو ...)،
     وبيتقارن من غير حساسية لحالة الحروف. ضيف هنا أي نص ناقص. */
  const DICT = {
    // --- عناوين الصفحات ---
    "Admin Home | Kokquiz": "الرئيسية | Kokquiz",
    "Admin Dashboard | Church Quiz": "لوحة التحكم | مسابقة الكنيسة",
    "Host Game | Church Quiz": "إدارة اللعبة | مسابقة الكنيسة",
    "Game Lobby | Church Quiz": "غرفة الانتظار | مسابقة الكنيسة",
    "Play | Kokquiz": "لعب | Kokquiz",
    "Church Quiz": "مسابقة الكنيسة",

    // --- الصفحة الرئيسية ---
    "Test your knowledge and grow together in faith.": "اختبر معلوماتك وانمُ مع إخوتك في الإيمان.",
    "Learn · Play · Grow": "تعلّم · العب · انمُ",

    // --- القايمة الجانبية ولوحة التحكم ---
    "Dashboard": "لوحة التحكم",
    "Create Quiz": "إنشاء مسابقة",
    "My Quizzes": "مسابقاتي",
    "Question Bank": "بنك الأسئلة",
    "Participants": "المشاركون",
    "Results": "النتائج",
    "Leaderboard": "لوحة الصدارة",
    "Settings": "الإعدادات",
    "Back to website": "العودة للموقع",
    "Admin Panel": "لوحة الإدارة",
    "Workspace": "مساحة العمل",
    "Admin workspace": "مساحة الإدارة",
    "Edit": "تعديل",
    "Host live": "ابدأ لعبة مباشرة",
    "Export": "تصدير",

    // --- استوديو إنشاء المسابقة ---
    "New quiz": "مسابقة جديدة",
    "New Church Quiz": "مسابقة كنيسة جديدة",
    "Properties": "الخصائص",
    "Exit": "خروج",
    "Save": "حفظ",
    "Cancel": "إلغاء",
    "Save Quiz": "حفظ المسابقة",
    "Question Type": "نوع السؤال",
    "Time Limit": "المدة",
    "Points": "النقاط",
    "Quiz": "اختيار من متعدد",
    "True/False": "صح / خطأ",
    "True / False": "صح / خطأ",
    "Standard": "عادي",
    "Double points": "نقاط مضاعفة",
    "No points": "بدون نقاط",
    "Duplicate": "نسخ",
    "Delete": "حذف",
    "Start typing your question": "اكتب سؤالك هنا",
    "Upload image": "رفع صورة",
    "Add Question": "إضافة سؤال",
    "Question": "سؤال",
    "Quiz Settings": "إعدادات المسابقة",
    "Add the final details before saving.": "أضف التفاصيل الأخيرة قبل الحفظ.",
    "Category (Fetched from API)": "التصنيف",

    // --- رسائل التنبيه ---
    "Quiz saved successfully": "تم حفظ المسابقة بنجاح",
    "Quiz deleted.": "تم حذف المسابقة.",
    "Question deleted.": "تم حذف السؤال.",
    "Settings saved.": "تم حفظ الإعدادات.",
    "Quiz not found.": "المسابقة غير موجودة.",
    "Something went wrong.": "حدث خطأ ما.",
    "Session created! Opening Lobby...": "تم إنشاء الجلسة! جارٍ فتح غرفة الانتظار...",
    "The quiz must have at least one question.": "يجب أن تحتوي المسابقة على سؤال واحد على الأقل.",

    // --- تسجيل الدخول وإنشاء الحساب ---
    "Welcome back": "أهلاً بعودتك",
    "Sign in to continue your journey.": "سجّل الدخول لمتابعة رحلتك.",
    "Email address": "البريد الإلكتروني",
    "Password": "كلمة المرور",
    "Sign in": "تسجيل الدخول",
    "Don't have an account?": "ليس لديك حساب؟",
    "Create Account": "إنشاء حساب",
    "Back to Home": "العودة للرئيسية",
    "Your name": "اسمك",
    "Choose Your Role": "اختر دورك",
    "Creator": "منشئ مسابقات",
    "Create quizzes": "أنشئ المسابقات",
    "Player": "لاعب",
    "Play quizzes": "العب المسابقات",
    "Already have an account?": "لديك حساب بالفعل؟",
    "Log in": "تسجيل الدخول",

    // --- صفحة اللاعب ---
    "Enter your nickname": "اكتب اسمك المستعار",
    "Choose your character": "اختر شخصيتك",
    "Game PIN": "رمز اللعبة",
    "Game PIN:": "رمز اللعبة:",
    "OK, go!": "تمام، يلا!",
    "Name": "الاسم",
    "You're in! See your nickname": "تم دخولك! شايف اسمك",
    "on screen?": "على الشاشة؟",
    "Get Ready!": "استعد!",
    "Loading...": "جارٍ التحميل...",
    "Answer sent!": "تم إرسال الإجابة!",
    "Waiting for other players...": "في انتظار باقي اللاعبين...",
    "Correct": "إجابة صحيحة",
    "Incorrect": "إجابة خاطئة",
    "Time's up": "انتهى الوقت",
    "Game Over": "انتهت اللعبة",
    "Thanks for playing!": "شكراً للعبك معنا!",
    "You're on the podium!": "أنت على المنصة!",
    "Oops!": "حدث خطأ!",

    // --- شاشة المدرّس ---
    "Answers": "إجابات",
    "Top 5": "أفضل 5",
    "Podium": "منصة التتويج",
    "Return to Dashboard": "العودة للوحة التحكم",
    "Next": "التالي",
    "Skip": "تخطي",
    "Finish": "إنهاء",

    // --- اللوبي ---
    "Get ready to join": "استعد للانضمام",
    "Loading Game PIN...": "جارٍ تحميل رمز اللعبة...",
    "Join at": "انضم من",
    "or scan the QR code": "أو امسح رمز QR",
    "with Game PIN:": "برمز اللعبة:",
    "Waiting for participants...": "في انتظار المشاركين...",
    "Start": "ابدأ"
  };

  /* نصوص بتتغيّر أرقامها (سؤال 3، 20 ثانية، ترتيبك...) */
  const PATTERNS = [
    [/^Question (\d+)(?: \/ (\d+))?$/i, (m) => (m[2] ? `سؤال ${m[1]} / ${m[2]}` : `سؤال ${m[1]}`)],
    [/^Add answer (\d+)$/i, (m) => `أضف الإجابة ${m[1]}`],
    [/^(\d+) seconds?$/i, (m) => `${m[1]} ثانية`],
    [/^(\d+) minutes?$/i, (m) => `${m[1]} دقيقة`],
    [/^You're #(\d+) of (\d+)([\s\S]*)$/, (m) => `ترتيبك #${m[1]} من ${m[2]}${m[3]}`],
    [/^You finished #(\d+) of (\d+)$/, (m) => `انتهيت في المركز #${m[1]} من ${m[2]}`],
    [/^(\d+) pts$/i, (m) => `${m[1]} نقطة`],
    [/^(\d+) questions?$/i, (m) => `${m[1]} سؤال`],
    [/^(\d+) options$/i, (m) => `${m[1]} اختيارات`]
  ];

  const LOWER = new Map(Object.entries(DICT).map(([k, v]) => [k.toLowerCase(), v]));
  const ATTRS = ["placeholder", "title", "aria-label", "alt"];
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);

  const memo = new WeakMap();      // text node → { en, ar, lead, trail }
  const missing = new Set();
  let lang = DEFAULT_LANG;
  let observer = null;
  let button = null;

  /* قسّم النص: رموز على الأطراف (+ * → ! ...) / النص الأساسي / رموز في الآخر */
  function split(s) {
    const m = s.match(/^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}]*)$/u);
    return m ? [m[1], m[2], m[3]] : ["", s, ""];
  }

  function arabicFor(core) {
    const hit = LOWER.get(core.toLowerCase());
    if (hit) return hit;
    for (const [re, fn] of PATTERNS) {
      const m = core.match(re);
      if (m) return fn(m);
    }
    return null;
  }

  /* ---------------- ترجمة نص ---------------- */
  function translateText(node) {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    if (node.parentElement && node.parentElement.closest("[data-i18n-skip]")) return;
    if (node.parentElement && SKIP_TAGS.has(node.parentElement.tagName)) return;

    const trimmed = raw.trim();
    const rec = memo.get(node);

    if (rec && (trimmed === rec.en || trimmed === rec.ar)) {      // نص احنا اللي ترجمناه
      const want = lang === "ar" ? rec.ar : rec.en;
      if (trimmed !== want) node.nodeValue = rec.lead + want + rec.trail;
      return;
    }
    if (lang !== "ar") return;

    const [pre, core, suf] = split(trimmed);
    const ar = arabicFor(core);
    if (ar) {
      const out = pre + ar + suf;
      const lead = raw.match(/^\s*/)[0];
      const trail = raw.match(/\s*$/)[0];
      memo.set(node, { en: trimmed, ar: out, lead, trail });
      node.nodeValue = lead + out + trail;
    } else if (/[A-Za-z]{2,}/.test(core)) {
      missing.add(trimmed);
    }
  }

  /* ---------------- ترجمة attributes (placeholder, title...) ---------------- */
  function translateAttrs(el) {
    for (const name of ATTRS) {
      if (!el.hasAttribute || !el.hasAttribute(name)) continue;
      el.__i18n = el.__i18n || {};
      const cur = el.getAttribute(name);
      let rec = el.__i18n[name];

      if (rec && (cur === rec.en || cur === rec.ar)) {
        const want = lang === "ar" ? rec.ar : rec.en;
        if (cur !== want) el.setAttribute(name, want);
        continue;
      }
      if (lang !== "ar") continue;

      const [pre, core, suf] = split(cur.trim());
      const ar = arabicFor(core);
      if (ar) {
        rec = { en: cur, ar: pre + ar + suf };
        el.__i18n[name] = rec;
        el.setAttribute(name, rec.ar);
      } else if (/[A-Za-z]{2,}/.test(core)) {
        missing.add(cur.trim());
      }
    }
  }

  function walk(node) {
    if (node.nodeType === 3) return translateText(node);
    if (node.nodeType !== 1) return;
    if (SKIP_TAGS.has(node.tagName) || node.hasAttribute("data-i18n-skip")) return;
    translateAttrs(node);
    for (let c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  /* ---------------- تطبيق اللغة ---------------- */
  function applyDocument() {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    if (!html.hasAttribute("data-keep-dir")) html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    if (lang === "ar" && !document.getElementById("kq-ar-font")) {
      const link = document.createElement("link");
      link.id = "kq-ar-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap";
      document.head.appendChild(link);
    }
    if (button) button.querySelector(".kq-lang-label").textContent = lang === "ar" ? "English" : "العربية";
  }

  function setLang(next) {
    lang = next === "ar" ? "ar" : "en";
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    applyDocument();
    walk(document.documentElement);
    document.dispatchEvent(new CustomEvent("kq:lang", { detail: { lang } }));
  }

  /* ---------------- زرار اللغة ---------------- */
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      html[lang="ar"] *:not(.kok-word) { font-family: "Cairo", "Montserrat", sans-serif !important; }
      .kq-lang {
        display: inline-flex; align-items: center; gap: 8px;
        height: 38px; padding: 0 14px; border-radius: 999px;
        border: 1px solid rgba(255,255,255,.35);
        background: rgba(11,30,54,.78); color: #fff; cursor: pointer;
        font: 700 13px "Montserrat", "Cairo", sans-serif; letter-spacing: .02em;
        -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
        box-shadow: 0 6px 18px rgba(5,25,70,.35);
        transition: transform .1s, background .15s;
      }
      .kq-lang:hover { background: rgba(11,30,54,.92); }
      .kq-lang:active { transform: scale(.96); }
      .kq-lang svg { flex: none; }
      .kq-lang:not(.kq-lang--inline) { position: fixed; top: 14px; inset-inline-end: 16px; z-index: 99998; }
    `;
    document.head.appendChild(style);
  }

  function mountButton() {
    button = document.createElement("button");
    button.type = "button";
    button.className = "kq-lang";
    button.setAttribute("data-i18n-skip", "");
    button.setAttribute("aria-label", "Language");
    button.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>' +
      '<span class="kq-lang-label"></span>';
    button.addEventListener("click", () => setLang(lang === "ar" ? "en" : "ar"));

    const slot = document.querySelector("[data-lang-slot]");
    if (slot) { button.classList.add("kq-lang--inline"); slot.appendChild(button); }
    else document.body.appendChild(button);
  }

  /* ---------------- تشغيل ---------------- */
  function init() {
    try { lang = localStorage.getItem(STORAGE_KEY) === "ar" ? "ar" : (localStorage.getItem(STORAGE_KEY) === "en" ? "en" : DEFAULT_LANG); }
    catch { lang = DEFAULT_LANG; }

    injectStyles();
    mountButton();
    applyDocument();
    walk(document.documentElement);

    // أي نص بيتضاف بعد كده من JS بيتترجم لوحده
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData") translateText(m.target);
        else m.addedNodes.forEach(walk);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  window.I18n = {
    get lang() { return lang; },
    set: setLang,
    toggle: () => setLang(lang === "ar" ? "en" : "ar"),
    t: (text) => {
      if (lang !== "ar") return text;
      const [pre, core, suf] = split(String(text).trim());
      const ar = arabicFor(core);
      return ar ? pre + ar + suf : text;
    },
    missing: () => [...missing]
  };

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();