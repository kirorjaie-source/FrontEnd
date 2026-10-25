"use strict";

/* ============================================================
   admin.js — لوحة التحكم
   تعتمد بالكامل على window.Api (المعرف في api.js).
   ============================================================ */

// التحقق من تسجيل الدخول والتوجيه لصفحة loginn.html عند الحاجة
const AUTH_OK = window.Api ? window.Api.auth.requireLogin("loginn.html") : true;

const $ = (id) => document.getElementById(id);

/* ============================================================
   اللغة (عربي / English) — كل نصوص الصفحة بتتغير من هنا
   المفاتيح موجودة في data-i18n داخل adminn.html
   ============================================================ */
const I18N = {
 "en": {
  "brand.name": "Kokquiz",
  "brand.sub": "ADMIN PANEL",
  "menu.workspace": "WORKSPACE",
  "nav.dashboard": "Dashboard",
  "nav.home": "Home",
  "home.tagline": "Learn · Play · Grow",
  "home.sub": "Test your knowledge and grow together in faith.",
  "nav.create": "Create Quiz",
  "nav.quizzes": "My Quizzes",
  "nav.explore": "Quizzes",
  "nav.participants": "Participants",
  "nav.results": "Results",
  "nav.leaderboard": "Leaderboard",
  "nav.settings": "Settings",
  "nav.back": "← Back to website",
  "crumb.admin": "Admin",
  "user.default": "Admin",
  "dash.eyebrow": "YOUR COMMUNITY, YOUR QUIZZES",
  "dash.welcome": "Welcome to your dashboard.",
  "dash.intro": "Create meaningful quiz experiences and help your community grow together.",
  "dash.createBtn": "＋ Create a quiz",
  "stat.total": "Total quizzes",
  "stat.totalNote": "Quizzes created",
  "common.questions": "Questions",
  "stat.questionsNote": "Across your quizzes",
  "stat.participantsNote": "Demo records",
  "common.avg": "Average score",
  "stat.avgNote": "Based on saved results",
  "dash.recent": "Recent quizzes",
  "dash.recentSub": "Manage your latest quiz activities.",
  "common.viewAll": "View all →",
  "th.quizName": "Quiz name",
  "th.created": "Created",
  "th.action": "Action",
  "dash.noQuizzes": "No quizzes yet",
  "dash.noQuizzesSub": "Your created quizzes will appear here.",
  "dash.createFirst": "Create your first quiz",
  "studio.exit": "Exit",
  "studio.save": "Save",
  "studio.props": "⚙ Properties",
  "studio.propsTitle": "Show/Hide Properties",
  "studio.add": "＋ Add Question",
  "studio.upload": "＋ Upload image",
  "studio.removeImg": "Remove image",
  "studio.titlePh": "Enter quiz title...",
  "studio.questionPh": "Start typing your question",
  "studio.ansPh": "Add answer {n}",
  "studio.menu": "Show/Hide menu",
  "prop.type": "Question type",
  "type.mcq": "Quiz",
  "type.tf": "True or false",
  "prop.time": "Time limit",
  "prop.points": "Points",
  "points.standard": "Standard",
  "points.double": "Double points",
  "points.none": "No points",
  "studio.duplicate": "Duplicate",
  "common.delete": "Delete",
  "modal.title": "Quiz Settings",
  "modal.sub": "Add the final details before saving.",
  "modal.category": "Category (Fetched from API)",
  "modal.cancel": "Cancel",
  "modal.name": "Quiz name",
  "modal.done": "Done",
  "slide.question": "Question...",
  "slide.sec": "{n}s",
  "slide.tf": "True/False",
  "slide.quiz": "Quiz",
  "time.n": "{n} seconds",
  "time.5": "5 seconds",
  "time.10": "10 seconds",
  "time.20": "20 seconds",
  "time.30": "30 seconds",
  "time.60": "1 minute",
  "time.90": "90 seconds",
  "time.120": "2 minutes",
  "time.240": "4 minutes",
  "time.300": "5 minutes",
  "time.600": "10 minutes",
  "time.900": "15 minutes",
  "time.1800": "30 minutes",
  "time.3600": "1 hour",
  "time.10800": "3 hours (max)",
  "myq.title": "My quizzes",
  "myq.sub": "View and manage all your quizzes.",
  "myq.new": "＋ New quiz",
  "myq.searchPh": "Search quizzes...",
  "th.category": "Category",
  "myq.empty": "No matching quizzes",
  "myq.emptySub": "Create a quiz to get started.",
  "explore.title": "Quizzes",
  "explore.sub": "Discover quizzes shared by other creators and host them live.",
  "explore.searchPh": "Search quizzes by name...",
  "explore.host": "▶ Host live",
  "explore.empty": "No quizzes found",
  "explore.emptySub": "Try a different name, or check back later.",
  "explore.loading": "Loading quizzes...",
  "explore.by": "by {name}",
  "explore.badge": "Quiz",
  "menu.host": "Host live",
  "menu.edit": "Edit",
  "menu.delete": "Delete",
  "common.edit": "Edit",
  "common.today": "Today",
  "common.general": "General",
  "part.sub": "View participant records saved in this browser.",
  "th.name": "Name",
  "th.quiz": "Quiz",
  "th.score": "Score",
  "th.time": "Time",
  "th.date": "Date",
  "th.participant": "Participant",
  "th.percentage": "Percentage",
  "part.empty": "No participants yet",
  "part.emptySub": "Saved quiz results will be listed here.",
  "res.sub": "Review saved quiz scores and export a report.",
  "res.export": "↓ Export CSV",
  "res.attempts": "Attempts",
  "res.attemptsNote": "Saved attempts",
  "res.avgNote": "Across saved results",
  "res.best": "Best score",
  "res.bestNote": "Highest percentage",
  "res.unique": "Unique players",
  "res.uniqueNote": "Names recorded locally",
  "res.empty": "No results yet",
  "res.emptySub": "Results will appear when quiz attempts are saved.",
  "lb.sub": "Top 3 participants by their best quiz percentage.",
  "lb.refresh": "↻ Refresh",
  "lb.loading": "Loading...",
  "lb.r1": "1ST PLACE",
  "lb.r2": "2ND PLACE",
  "lb.r3": "3RD PLACE",
  "lb.note": "Showing each participant's best saved result. All attempts remain in Results.",
  "lb.emptySub": "Finished live games will appear here.",
  "common.participant": "Participant",
  "common.churchQuiz": "Church Quiz",
  "set.sub": "Configure the basic details of your workspace.",
  "set.section": "Workspace settings",
  "set.sectionSub": "These details are stored locally in this demo.",
  "set.name": "Your name",
  "set.namePh": "Enter your name",
  "set.church": "Church or organization name",
  "set.churchPh": "Church name",
  "set.email": "Contact email",
  "set.lang": "Dashboard language",
  "set.hint": "Authentication is not configured yet.",
  "set.save": "Save settings",
  "set.logout": "Log out",
  "set.saved": "Settings saved.",
  "sup.title": "Support",
  "sup.sub": "Need help? Contact one of our support team on WhatsApp.",
  "sup.contact": "Contact info",
  "sup.notSet": "This support number has not been set yet.",
  "host.mode": "Classic Mode",
  "host.classic": "Classic",
  "host.b1": "Up to 40 participants",
  "host.b2": "Competition",
  "host.b3": "Assessment",
  "host.desc": "Bring friendly competition to this kahoot. Participants need to answer quickly and correctly to secure a top spot on the podium.",
  "host.start": "Start",
  "host.quizTitle": "Quiz Title",
  "footer.a": "Church Quiz Admin",
  "footer.b": "Learn, Play, Grow",
  "msg.deleted": "Quiz deleted.",
  "msg.confirmDelete": "Delete \"{title}\"?",
  "msg.notFound": "Quiz not found.",
  "msg.sessionCreated": "Session created! Opening Lobby...",
  "msg.minOne": "The quiz must have at least one question.",
  "msg.nameRequired": "Please enter a quiz name.",
  "msg.partialQuiz": "The server did not send this quiz's questions yet. You can edit the quiz info and add new questions only.",
  "msg.unsaved": "You have unsaved changes. Leave anyway?",
  "msg.saved": "Quiz saved successfully! 🚀",
  "msg.qText": "Question {n}: write the question text.",
  "msg.qAnswers": "Question {n}: fill all 4 answers (or switch to True/False).",
  "msg.qCorrect": "Question {n}: mark the correct answer.",
  "msg.noExport": "There are no results to export.",
  "msg.generic": "Something went wrong.",
  "err.STORAGE_FULL": "Storage is full. Remove some images or quizzes and try again.",
  "err.LAST_QUESTION": "A quiz must keep at least one question. Delete the quiz instead.",
  "err.FILE_TOO_LARGE": "Image is too large (max 10 MB).",
  "err.NOT_AN_IMAGE": "Please choose an image file.",
  "err.QUIZ_EMPTY": "This quiz has no questions. Add questions first.",
  "err.QUIZ_NOT_FOUND": "Quiz not found.",
  "csv.file": "church-quiz-results.csv",
  "csv.date": "Date",
  "csv.total": "Total",
  "csv.seconds": "Time (seconds)"
 },
 "ar": {
  "brand.name": "كوك كويز",
  "brand.sub": "لوحة التحكم",
  "menu.workspace": "مساحة العمل",
  "nav.dashboard": "لوحة المعلومات",
  "nav.home": "الرئيسية",
  "home.tagline": "تعلّم · العب · انمُ",
  "home.sub": "اختبر معلوماتك وانمُ مع إخوتك في الإيمان.",
  "nav.create": "إنشاء مسابقة",
  "nav.quizzes": "مسابقاتي",
  "nav.explore": "المسابقات",
  "nav.participants": "المشاركون",
  "nav.results": "النتائج",
  "nav.leaderboard": "لوحة الصدارة",
  "nav.settings": "الإعدادات",
  "nav.back": "→ العودة للموقع",
  "crumb.admin": "الأدمن",
  "user.default": "الأدمن",
  "dash.eyebrow": "مجتمعك، مسابقاتك",
  "dash.welcome": "أهلاً بك في لوحة التحكم.",
  "dash.intro": "أنشئ مسابقات هادفة وساعد مجتمعك على النمو معاً.",
  "dash.createBtn": "＋ إنشاء مسابقة",
  "stat.total": "إجمالي المسابقات",
  "stat.totalNote": "مسابقات تم إنشاؤها",
  "common.questions": "الأسئلة",
  "stat.questionsNote": "في كل مسابقاتك",
  "stat.participantsNote": "سجلات تجريبية",
  "common.avg": "متوسط الدرجات",
  "stat.avgNote": "بناءً على النتائج المحفوظة",
  "dash.recent": "أحدث المسابقات",
  "dash.recentSub": "تابع آخر أنشطة مسابقاتك.",
  "common.viewAll": "عرض الكل ←",
  "th.quizName": "اسم المسابقة",
  "th.created": "تاريخ الإنشاء",
  "th.action": "الإجراء",
  "dash.noQuizzes": "لا توجد مسابقات بعد",
  "dash.noQuizzesSub": "ستظهر المسابقات التي تنشئها هنا.",
  "dash.createFirst": "أنشئ أول مسابقة",
  "studio.exit": "خروج",
  "studio.save": "حفظ",
  "studio.props": "⚙ الخصائص",
  "studio.propsTitle": "إظهار/إخفاء الخصائص",
  "studio.add": "＋ إضافة سؤال",
  "studio.upload": "＋ رفع صورة",
  "studio.removeImg": "حذف الصورة",
  "studio.titlePh": "اكتب عنوان المسابقة...",
  "studio.questionPh": "اكتب سؤالك هنا",
  "studio.ansPh": "أضف الإجابة {n}",
  "studio.menu": "إظهار/إخفاء القائمة",
  "prop.type": "نوع السؤال",
  "type.mcq": "اختيار من متعدد",
  "type.tf": "صح أم خطأ",
  "prop.time": "الوقت المحدد",
  "prop.points": "النقاط",
  "points.standard": "عادي",
  "points.double": "نقاط مضاعفة",
  "points.none": "بدون نقاط",
  "studio.duplicate": "تكرار",
  "common.delete": "حذف",
  "modal.title": "إعدادات المسابقة",
  "modal.sub": "أضف التفاصيل الأخيرة قبل الحفظ.",
  "modal.category": "التصنيف (من السيرفر)",
  "modal.cancel": "إلغاء",
  "modal.name": "اسم المسابقة",
  "modal.done": "تم",
  "slide.question": "السؤال...",
  "slide.sec": "{n}ث",
  "slide.tf": "صح/خطأ",
  "slide.quiz": "اختيار",
  "time.n": "{n} ثانية",
  "time.5": "5 ثوانٍ",
  "time.10": "10 ثوانٍ",
  "time.20": "20 ثانية",
  "time.30": "30 ثانية",
  "time.60": "دقيقة واحدة",
  "time.90": "90 ثانية",
  "time.120": "دقيقتان",
  "time.240": "4 دقائق",
  "time.300": "5 دقائق",
  "time.600": "10 دقائق",
  "time.900": "15 دقيقة",
  "time.1800": "30 دقيقة",
  "time.3600": "ساعة واحدة",
  "time.10800": "3 ساعات (الحد الأقصى)",
  "myq.title": "مسابقاتي",
  "myq.sub": "اعرض وأدر كل مسابقاتك.",
  "myq.new": "＋ مسابقة جديدة",
  "myq.searchPh": "ابحث في المسابقات...",
  "th.category": "التصنيف",
  "myq.empty": "لا توجد مسابقات مطابقة",
  "myq.emptySub": "أنشئ مسابقة للبدء.",
  "explore.title": "المسابقات",
  "explore.sub": "اكتشف المسابقات التي شاركها صُنّاع آخرون وابدأ بها جلسة مباشرة.",
  "explore.searchPh": "ابحث عن مسابقة بالاسم...",
  "explore.host": "▶ ابدأ جلسة مباشرة",
  "explore.empty": "لم يتم العثور على مسابقات",
  "explore.emptySub": "جرّب اسماً آخر أو عد لاحقاً.",
  "explore.loading": "جاري تحميل المسابقات...",
  "explore.by": "بواسطة {name}",
  "explore.badge": "مسابقة",
  "menu.host": "بدء جلسة مباشرة",
  "menu.edit": "تعديل",
  "menu.delete": "حذف",
  "common.edit": "تعديل",
  "common.today": "اليوم",
  "common.general": "عام",
  "part.sub": "اعرض سجلات المشاركين المحفوظة.",
  "th.name": "الاسم",
  "th.quiz": "المسابقة",
  "th.score": "الدرجة",
  "th.time": "الوقت",
  "th.date": "التاريخ",
  "th.participant": "المشارك",
  "th.percentage": "النسبة",
  "part.empty": "لا يوجد مشاركون بعد",
  "part.emptySub": "ستظهر نتائج المسابقات المحفوظة هنا.",
  "res.sub": "راجع درجات المسابقات المحفوظة وصدّر تقريراً.",
  "res.export": "↓ تصدير CSV",
  "res.attempts": "المحاولات",
  "res.attemptsNote": "محاولات محفوظة",
  "res.avgNote": "عبر النتائج المحفوظة",
  "res.best": "أفضل درجة",
  "res.bestNote": "أعلى نسبة",
  "res.unique": "عدد اللاعبين",
  "res.uniqueNote": "أسماء مسجلة محلياً",
  "res.empty": "لا توجد نتائج بعد",
  "res.emptySub": "ستظهر النتائج عند حفظ محاولات المسابقات.",
  "lb.sub": "أفضل 3 مشاركين حسب أعلى نسبة.",
  "lb.refresh": "↻ تحديث",
  "lb.loading": "جاري التحميل...",
  "lb.r1": "المركز الأول",
  "lb.r2": "المركز الثاني",
  "lb.r3": "المركز الثالث",
  "lb.note": "يتم عرض أفضل نتيجة محفوظة لكل مشارك. كل المحاولات متاحة في صفحة النتائج.",
  "lb.emptySub": "ستظهر الألعاب المباشرة المنتهية هنا.",
  "common.participant": "مشارك",
  "common.churchQuiz": "كويز الكنيسة",
  "set.sub": "اضبط التفاصيل الأساسية لمساحة عملك.",
  "set.section": "إعدادات مساحة العمل",
  "set.sectionSub": "يتم حفظ هذه البيانات محلياً في هذه النسخة التجريبية.",
  "set.name": "اسمك",
  "set.namePh": "اكتب اسمك",
  "set.church": "اسم الكنيسة أو الجهة",
  "set.churchPh": "اسم الكنيسة",
  "set.email": "البريد الإلكتروني",
  "set.lang": "لغة لوحة التحكم",
  "set.hint": "لم يتم إعداد المصادقة بعد.",
  "set.save": "حفظ الإعدادات",
  "set.logout": "تسجيل الخروج",
  "set.saved": "تم حفظ الإعدادات.",
  "sup.title": "الدعم",
  "sup.sub": "تحتاج مساعدة؟ تواصل مع أحد فريق الدعم عبر واتساب.",
  "sup.contact": "معلومات التواصل",
  "sup.notSet": "لم يتم إضافة رقم الدعم بعد.",
  "host.mode": "النمط الكلاسيكي",
  "host.classic": "كلاسيكي",
  "host.b1": "حتى 40 مشاركاً",
  "host.b2": "منافسة",
  "host.b3": "تقييم",
  "host.desc": "أضف روح المنافسة إلى هذه المسابقة. على المشاركين الإجابة بسرعة وبشكل صحيح لحجز مركز على منصة التتويج.",
  "host.start": "ابدأ",
  "host.quizTitle": "عنوان المسابقة",
  "footer.a": "لوحة كويز الكنيسة",
  "footer.b": "اتعلّم • العب • انمُ",
  "msg.deleted": "تم حذف المسابقة.",
  "msg.confirmDelete": "هل تريد حذف \"{title}\"؟",
  "msg.notFound": "لم يتم العثور على المسابقة.",
  "msg.sessionCreated": "تم إنشاء الجلسة! جاري فتح اللوبي...",
  "msg.minOne": "يجب أن تحتوي المسابقة على سؤال واحد على الأقل.",
  "msg.nameRequired": "من فضلك اكتب اسم المسابقة.",
  "msg.partialQuiz": "السيرفر لم يرسل أسئلة هذه المسابقة بعد. يمكنك تعديل بيانات المسابقة وإضافة أسئلة جديدة فقط.",
  "msg.unsaved": "لديك تغييرات غير محفوظة. هل تريد المغادرة؟",
  "msg.saved": "تم حفظ المسابقة بنجاح! 🚀",
  "msg.qText": "السؤال {n}: اكتب نص السؤال.",
  "msg.qAnswers": "السؤال {n}: املأ الإجابات الأربع (أو غيّر النوع إلى صح/خطأ).",
  "msg.qCorrect": "السؤال {n}: حدّد الإجابة الصحيحة.",
  "msg.noExport": "لا توجد نتائج للتصدير.",
  "msg.generic": "حدث خطأ ما.",
  "err.STORAGE_FULL": "مساحة التخزين ممتلئة. احذف بعض الصور أو المسابقات وحاول مرة أخرى.",
  "err.LAST_QUESTION": "يجب أن تبقى في المسابقة سؤال واحد على الأقل. احذف المسابقة بدلاً من ذلك.",
  "err.FILE_TOO_LARGE": "الصورة كبيرة جداً (الحد الأقصى 10 ميجا).",
  "err.NOT_AN_IMAGE": "من فضلك اختر ملف صورة.",
  "err.QUIZ_EMPTY": "هذه المسابقة لا تحتوي على أسئلة. أضف أسئلة أولاً.",
  "err.QUIZ_NOT_FOUND": "لم يتم العثور على المسابقة.",
  "csv.file": "church-quiz-results.csv",
  "csv.date": "التاريخ",
  "csv.total": "المجموع",
  "csv.seconds": "الوقت (بالثواني)"
 }
};

const LANG_KEY = "kokLang";   // نفس المفتاح في كل الصفحات (اللاعب، المدرّس، اللوبي، التسجيل)
let currentLang = localStorage.getItem(LANG_KEY) === "ar" ? "ar" : "en";
let currentPage = "home";      // الرئيسية هي أول صفحة بتفتح

function t(key, vars) {
  let text = (I18N[currentLang] && I18N[currentLang][key]) ?? I18N.en[key] ?? key;
  if (vars) Object.keys(vars).forEach((k) => { text = text.split(`{${k}}`).join(vars[k]); });
  return text;
}

function nQuestions(n) {
  if (currentLang === "ar") {
    if (n === 1) return "سؤال واحد";
    if (n === 2) return "سؤالان";
    return n >= 3 && n <= 10 ? `${n} أسئلة` : `${n} سؤالاً`;
  }
  return n === 1 ? "1 question" : `${n} questions`;
}

const dateLocale = () => (currentLang === "ar" ? "ar-EG" : undefined);

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh, { n: el.dataset.n });
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });

  const heading = $("page-heading");
  if (heading) heading.textContent = t(`nav.${currentPage}`);

  // زرار اللغة بيعرض اللغة التانية
  const langLabel = $("lang-label");
  if (langLabel) langLabel.textContent = currentLang === "ar" ? "English" : "العربية";
}

function renderAllPages() {
  renderUserBadge();
  renderSupport();
  renderSlidesList();
  const jobs = [renderDashboard, renderQuizzes, renderParticipants, renderResults, renderLeaderboard];
  if (currentPage === "explore") jobs.push(() => renderExplore({ refetch: false }));
  jobs.forEach((job) => job().catch(showError));
}

function setLanguage(lang, { rerender = true } = {}) {
  currentLang = lang === "ar" ? "ar" : "en";
  localStorage.setItem(LANG_KEY, currentLang);
  if ($("dashboard-language")) $("dashboard-language").value = currentLang;
  applyStaticTranslations();
  if (rerender) renderAllPages();
}

/* ============================================================
   بيانات الحساب (الاسم فوق على اليمين)
   ============================================================ */
const CLAIM_NAME = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
const CLAIM_EMAIL = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

function decodeJwt(token) {
  try {
    const payload = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(payload).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(json);
  } catch { return {}; }
}

function getAccountInfo() {
  const s = (window.Api && Api.auth.getSession()) || {};
  const c = decodeJwt(s.token);
  const first = (...v) => v.map((x) => String(x ?? "").trim()).find(Boolean) || "";
  const email = first(s.email, c.email, c[CLAIM_EMAIL]);
  const name = first(s.fullName, s.userName, s.name, s.displayName, c.fullName, c.name, c.unique_name, c[CLAIM_NAME]);
  return { name, email, key: first(email, s.id, c.sub, name) };
}

// الإعدادات بتتخزن للمتصفح كله، فبنربطها بصاحب الحساب عشان ما يظهرش اسم حد تاني
let userSettings = {};

function renderUserBadge() {
  const info = getAccountInfo();
  const name = (userSettings.name || "").trim() || info.name || (info.email ? info.email.split("@")[0] : "") || t("user.default");
  if ($("user-name")) $("user-name").textContent = name;
  if ($("user-avatar")) $("user-avatar").textContent = [...name][0]?.toUpperCase() || "A";
}

/* ============================================================
   الدعم (Support) — الأسماء والأرقام في contacts.js
   ============================================================ */

const WA_ICON = `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.9 9.9 0 0 0 4.77 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.05c-.25.7-1.45 1.34-2 1.4-.52.06-1.17.09-1.88-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.9-4.27-5.05-4.47-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1.01 2.09 1.32 2.39 1.47.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42z"/></svg>`;

function renderSupport() {
  const grid = $("support-grid");
  if (!grid) return;
  // الكروت جنب بعض (عمودين)، ولو الشاشة ضيقة بتنزل تحت بعض
  grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;width:100%;";
  grid.innerHTML = SUPPORT_CONTACTS.map((p) => {
    const digits = String(p.phone || "").replace(/\D/g, "");
    return `
      <div class="support-person support-row" style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#f4f4f6;color:#1d3557;border-radius:14px;padding:16px 18px;min-height:72px;">
        <b class="support-name" style="font-weight:600;color:#1d3557;">${escapeHTML(p.name)}</b>
        <a class="support-contact wa-circle" style="background:#25D366;color:#fff;border-radius:50%;width:48px;height:48px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;" href="${digits ? `https://wa.me/${digits}` : "#"}"
           target="_blank" rel="noopener noreferrer" data-phone="${digits}"
           aria-label="${t("sup.contact")}" title="${t("sup.contact")}"${digits ? "" : ' aria-disabled="true"'}>${WA_ICON}</a>
      </div>`;
  }).join("");
}

/* ============================================================
   فتح / قفل القايمة الشمال
   ============================================================ */
const SIDEBAR_KEY = "churchQuizSidebarCollapsed";
const isMobileView = () => window.matchMedia("(max-width: 900px)").matches;

function toggleSidebar() {
  if (isMobileView()) {
    $("sidebar")?.classList.toggle("open");
  } else {
    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[c]);
}

function toast(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 6000);
}

const showError = (err) => toast(I18N.en[`err.${err?.code}`] ? t(`err.${err.code}`) : (err?.message || t("msg.generic")));

/* ---------------- الصفحات ---------------- */

function showPage(name) {
  const page = $(`page-${name}`);
  if (!page) return;

  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  page.classList.add("active");

  document.querySelectorAll(".nav-link").forEach((b) => b.classList.toggle("active", b.dataset.page === name));

  const activeButton = document.querySelector(`.nav-link[data-page="${name}"]`);
  currentPage = name;
  if ($("page-heading") && activeButton) $("page-heading").textContent = t(`nav.${name}`);

  $("sidebar")?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  const renderers = {
    dashboard: renderDashboard,
    quizzes: renderQuizzes,
    explore: renderExplore,
    participants: renderParticipants,
    results: renderResults,
    leaderboard: renderLeaderboard
  };
  renderers[name]?.().catch(showError);
}

/* ---------------- تاريخ إنشاء المسابقة (من السيرفر) ---------------- */

function formatQuizDate(q) {
  const raw = q.createdAt ?? q.createdOn ?? q.createdDate ?? q.dateCreated ?? q.created;
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? String(raw)
    : d.toLocaleDateString(dateLocale(), { year: "numeric", month: "short", day: "numeric" });
}

/* ---------------- Dashboard ---------------- */

async function renderDashboard() {
  const [quizzes, results] = await Promise.all([Api.quizzes.list(), Api.results.list()]);
  const totalQuestions = quizzes.reduce((sum, q) => sum + (Number(q.questionCount || (q.questions ? q.questions.length : 0)) || 0), 0);

  if ($("stat-quizzes")) $("stat-quizzes").textContent = quizzes.length;
  if ($("stat-questions")) $("stat-questions").textContent = totalQuestions;
  if ($("stat-participants")) $("stat-participants").textContent = results.length;

  const normalized = normalizeResults(results);
  if ($("stat-average")) {
    $("stat-average").textContent = normalized.length
      ? `${Math.round(normalized.reduce((s, r) => s + r.percentage, 0) / normalized.length)}%`
      : "—";
  }

  const recent = quizzes.slice().reverse().slice(0, 5);
  if ($("recent-quizzes")) {
    $("recent-quizzes").innerHTML = recent.map((quiz) => `
      <tr>
        <td><span class="table-title">${escapeHTML(quiz.title)}</span></td>
        <td>${Number(quiz.questionCount || (quiz.questions ? quiz.questions.length : 0)) || 0}</td>
        <td>${escapeHTML(formatQuizDate(quiz))}</td>
        <td><button class="table-action" data-action="edit" data-id="${escapeHTML(quiz.id)}">${t("common.edit")}</button></td>
      </tr>
    `).join("");
  }
  if ($("recent-empty")) $("recent-empty").hidden = recent.length > 0;
}

/* ---------------- My quizzes ---------------- */

async function renderQuizzes() {
  const searchInput = $("quiz-search");
  const search = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const list = (await Api.quizzes.list()).filter((q) => String(q.title || "").toLowerCase().includes(search));

  if ($("quizzes-table")) {
    $("quizzes-table").innerHTML = list.map((quiz) => {
      const id = escapeHTML(quiz.id);
      return `
      <tr>
        <td><span class="table-title">${escapeHTML(quiz.title)}</span></td>
        <td>${escapeHTML(quiz.category || t("common.general"))}</td>
        <td>${Number(quiz.questionCount || (quiz.questions ? quiz.questions.length : 0)) || 0}</td>
        <td>
          <div class="dropdown-container">
            <button class="btn-more-options" data-action="toggle-menu" aria-label="Quiz actions">⋮</button>
            <div class="dropdown-menu">
              <button class="dropdown-item" data-action="host" data-id="${id}"><span>▶</span> ${t("menu.host")}</button>
              <button class="dropdown-item" data-action="edit" data-id="${id}"><span>✏️</span> ${t("menu.edit")}</button>
              <button class="dropdown-item text-danger" data-action="delete-quiz" data-id="${id}"><span>🗑️</span> ${t("menu.delete")}</button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join("");
  }

  if ($("quizzes-empty")) $("quizzes-empty").hidden = list.length > 0;
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-container.active").forEach((m) => m.classList.remove("active"));
}

async function deleteQuiz(id) {
  const quiz = await Api.quizzes.get(id);
  if (!quiz || !confirm(t("msg.confirmDelete", { title: quiz.title }))) return;
  try {
    await Api.quizzes.remove(id);
    toast(t("msg.deleted"));
    await Promise.all([renderQuizzes(), renderDashboard()]);
  } catch (err) { showError(err); }
}

/* ---------------- Host live ---------------- */

let hostingQuizId = null;

async function openHostModal(quizId) {
  // مسابقات الآخرين (صفحة Quizzes) مش موجودة في /mine، فبناخد بياناتها من القايمة العامة
  const quiz = publicQuizCache.get(String(quizId)) || await Api.quizzes.get(quizId);
  if (!quiz) return toast(t("msg.notFound"));
  hostingQuizId = quizId;
  if ($("host-selected-quiz-title")) $("host-selected-quiz-title").textContent = quiz.title;
  if ($("host-options-modal")) $("host-options-modal").style.display = "flex";
}

function closeHostModal() {
  if ($("host-options-modal")) $("host-options-modal").style.display = "none";
  hostingQuizId = null;
}

async function startHosting() {
  if (!hostingQuizId) return;
  const quizId = hostingQuizId;

  const tab = window.open("about:blank", "_blank");
  try {
    await Api.game.create(quizId);
    closeHostModal();
    toast(t("msg.sessionCreated"));
    if (tab) tab.location.href = "lobbyn.html";
    else window.location.href = "lobbyn.html";
  } catch (err) {
    tab?.close();
    closeHostModal();
    showError(err);
  }
}

/* ============================================================
   STUDIO (منشئ المسابقات)
   ============================================================ */

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `q_${Date.now()}_${Math.random()}`);

function createBlankQuestion(type = "mcq") {
  return {
    id: newId(),
    type,
    text: "",
    image: null,
    timeLimit: 20,
    points: "standard",
    answers: type === "tf" ? ["True", "False"] : ["", "", "", ""],
    correct: 0
  };
}

function createBlankQuiz() {
  return {
    id: null,
    title: "",
    description: "",
    category: "Bible Knowledge",
    status: "Ready",
    questions: [createBlankQuestion("mcq")]
  };
}

let studioQuiz = createBlankQuiz();
let activeQuestionIndex = 0;
let studioDirty = false;
const markDirty = () => { studioDirty = true; };

async function openStudio(quizId = null) {
  try {
    if (quizId) {
      const existing = await Api.quizzes.get(quizId);
      if (!existing) return toast(t("msg.notFound"));
      studioQuiz = JSON.parse(JSON.stringify(existing));
      if (existing._partial) toast(t("msg.partialQuiz"));
      if (!studioQuiz.questions || !studioQuiz.questions.length) {
        studioQuiz.questions = [createBlankQuestion("mcq")];
      }
    } else {
      studioQuiz = createBlankQuiz();
    }
  } catch (err) { return showError(err); }

  activeQuestionIndex = 0;
  studioDirty = false;
  if ($("studio-quiz-title")) $("studio-quiz-title").value = studioQuiz.title;
  loadQuestionToCanvas(0);
  showPage("create");
}

function renderSlidesList() {
  const container = $("slides-list");
  if (!container) return;
  container.innerHTML = studioQuiz.questions.map((q, idx) => `
    <div class="slide-card ${idx === activeQuestionIndex ? "active" : ""}" data-slide-index="${idx}">
      <div class="slide-header">
        <span>${idx + 1} ${q.type === "tf" ? t("slide.tf") : t("slide.quiz")}</span>
        <span>⏱ ${t("slide.sec", { n: q.timeLimit })}</span>
      </div>
      <div class="slide-title">${escapeHTML(q.text || t("slide.question"))}</div>
    </div>
  `).join("");
}

function ensureTimeOption(seconds) {
  const select = $("prop-time-limit");
  if (!select) return;
  if (![...select.options].some((o) => Number(o.value) === seconds)) {
    const opt = new Option(t("time.n", { n: seconds }), String(seconds));
    select.add(opt);
  }
}

function loadQuestionToCanvas(index) {
  if (index < 0 || index >= studioQuiz.questions.length) return;
  activeQuestionIndex = index;
  const q = studioQuiz.questions[index];

  if ($("canvas-question-text")) $("canvas-question-text").value = q.text || "";
  if ($("prop-question-type")) $("prop-question-type").value = q.type || "mcq";
  ensureTimeOption(Number(q.timeLimit) || 20);
  if ($("prop-time-limit")) $("prop-time-limit").value = String(q.timeLimit || 20);
  if ($("prop-points-multiplier")) $("prop-points-multiplier").value = q.points === "zero" ? "none" : q.points || "standard";

  if ($("media-placeholder")) $("media-placeholder").style.display = q.image ? "none" : "flex";
  if ($("media-preview-container")) $("media-preview-container").style.display = q.image ? "flex" : "none";
  if ($("question-image-preview")) $("question-image-preview").src = q.image || "";

  const isTF = q.type === "tf";
  const grid = $("canvas-answers-grid");
  if (grid) {
    grid.classList.toggle("mode-tf", isTF);
    grid.classList.toggle("mode-mcq", !isTF);
  }

  for (let i = 0; i < 4; i++) {
    const input = $(`ans-text-${i}`);
    if (input) {
      input.readOnly = isTF && i < 2;
      input.value = isTF ? (i < 2 ? q.answers[i] || (i ? "False" : "True") : "") : q.answers[i] || "";
    }
    $(`toggle-${i}`)?.classList.toggle("is-correct", Number(q.correct) === i);
  }

  renderSlidesList();
}

function syncCurrentQuestionFromInputs() {
  const q = studioQuiz.questions[activeQuestionIndex];
  if (!q) return;

  if ($("canvas-question-text")) q.text = $("canvas-question-text").value.trim();
  if ($("prop-question-type")) q.type = $("prop-question-type").value;
  if ($("prop-time-limit")) q.timeLimit = Number($("prop-time-limit").value) || 20;
  if ($("prop-points-multiplier")) q.points = $("prop-points-multiplier").value;

  if (q.type === "tf") {
    q.answers = ["True", "False"];
    if (q.correct > 1) q.correct = 0;
  } else {
    q.answers = [0, 1, 2, 3].map((i) => $(`ans-text-${i}`)?.value.trim() || "");
  }

  const title = document.querySelector(`.slide-card[data-slide-index="${activeQuestionIndex}"] .slide-title`);
  if (title) title.textContent = q.text || t("slide.question");
  markDirty();
}

function findQuizProblem(quiz) {
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const n = i + 1;
    if (!q.text) return { index: i, message: t("msg.qText", { n }) };
    if (q.type !== "tf" && q.answers.some((a) => !a)) {
      return { index: i, message: t("msg.qAnswers", { n }) };
    }
    if (q.correct < 0 || q.correct >= q.answers.length) {
      return { index: i, message: t("msg.qCorrect", { n }) };
    }
  }
  return null;
}

function bindStudio() {
  $("toggle-properties-btn")?.addEventListener("click", () => $("studio-right-panel")?.classList.toggle("collapsed"));

  $("studio-exit-btn")?.addEventListener("click", () => {
    if (studioDirty && !confirm(t("msg.unsaved"))) return;
    studioDirty = false;
    showPage("dashboard");
  });

  $("btn-add-slide")?.addEventListener("click", () => {
    syncCurrentQuestionFromInputs();
    studioQuiz.questions.push(createBlankQuestion("mcq"));
    loadQuestionToCanvas(studioQuiz.questions.length - 1);
  });

  $("slides-list")?.addEventListener("click", (e) => {
    const card = e.target.closest(".slide-card");
    if (!card) return;
    syncCurrentQuestionFromInputs();
    loadQuestionToCanvas(Number(card.dataset.slideIndex));
  });

  $("canvas-question-text")?.addEventListener("input", syncCurrentQuestionFromInputs);
  $("studio-quiz-title")?.addEventListener("input", markDirty);

  $("media-placeholder")?.addEventListener("click", () => $("question-image-upload")?.click());

  $("question-image-upload")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      studioQuiz.questions[activeQuestionIndex].image = await Api.media.upload(file);
      markDirty();
      loadQuestionToCanvas(activeQuestionIndex);
    } catch (err) { showError(err); }
  });

  $("btn-remove-media")?.addEventListener("click", (e) => {
    e.stopPropagation();
    studioQuiz.questions[activeQuestionIndex].image = null;
    markDirty();
    loadQuestionToCanvas(activeQuestionIndex);
  });

  for (let i = 0; i < 4; i++) {
    $(`ans-text-${i}`)?.addEventListener("input", syncCurrentQuestionFromInputs);
    $(`toggle-${i}`)?.addEventListener("click", () => {
      studioQuiz.questions[activeQuestionIndex].correct = i;
      markDirty();
      loadQuestionToCanvas(activeQuestionIndex);
    });
  }

  $("prop-question-type")?.addEventListener("change", (e) => {
    const q = studioQuiz.questions[activeQuestionIndex];
    const newType = e.target.value;
    if (q.type === newType) return;
    q.type = newType;
    q.answers = newType === "tf" ? ["True", "False"] : ["", "", "", ""];
    q.correct = 0;
    markDirty();
    loadQuestionToCanvas(activeQuestionIndex);
  });

  $("prop-time-limit")?.addEventListener("change", () => { syncCurrentQuestionFromInputs(); renderSlidesList(); });
  $("prop-points-multiplier")?.addEventListener("change", syncCurrentQuestionFromInputs);

  $("btn-duplicate-question")?.addEventListener("click", () => {
    syncCurrentQuestionFromInputs();
    const cloned = JSON.parse(JSON.stringify(studioQuiz.questions[activeQuestionIndex]));
    cloned.id = newId();
    studioQuiz.questions.splice(activeQuestionIndex + 1, 0, cloned);
    loadQuestionToCanvas(activeQuestionIndex + 1);
  });

  $("btn-delete-question")?.addEventListener("click", () => {
    if (studioQuiz.questions.length <= 1) return toast(t("msg.minOne"));
    studioQuiz.questions.splice(activeQuestionIndex, 1);
    markDirty();
    loadQuestionToCanvas(Math.max(0, activeQuestionIndex - 1));
  });

  $("studio-save-btn")?.addEventListener("click", () => {
    syncCurrentQuestionFromInputs();
    const problem = findQuizProblem(studioQuiz);
    if (problem) {
      loadQuestionToCanvas(problem.index);
      toast(problem.message);
      // نعلّم الخانات الفاضية بالأحمر ونحط المؤشر على أول واحدة
      let firstEmpty = null;
      for (let i = 0; i < 4; i++) {
        const input = $(`ans-text-${i}`);
        if (!input || input.readOnly) continue;
        if (!input.value.trim()) {
          input.style.outline = "2px solid #ef4444";
          input.addEventListener("input", () => { input.style.outline = ""; }, { once: true });
          if (!firstEmpty) firstEmpty = input;
        }
      }
      if (firstEmpty) firstEmpty.focus();
      else if (!studioQuiz.questions[problem.index].text) $("canvas-question-text")?.focus();
      return;
    }
    const isEdit = studioQuiz.id != null;
    if ($("modal-quiz-name")) $("modal-quiz-name").value = ($("studio-quiz-title")?.value || studioQuiz.title || "").trim();
    if ($("modal-category-field")) $("modal-category-field").style.display = isEdit ? "none" : "";
    const categorySelect = $("modal-quiz-category");
    if (categorySelect && !isEdit) {
      categorySelect.value = studioQuiz.category || "";
      if (categorySelect.selectedIndex < 0) categorySelect.selectedIndex = 0;   // لو التصنيف مش في القايمة نختار أول واحد
    }
    if ($("studio-save-modal")) $("studio-save-modal").style.display = "flex";
    if ($("modal-quiz-name") && !$("modal-quiz-name").value) $("modal-quiz-name").focus();
  });

  $("modal-cancel-btn")?.addEventListener("click", () => {
    if ($("studio-save-modal")) $("studio-save-modal").style.display = "none";
  });

  $("modal-confirm-save-btn")?.addEventListener("click", async () => {
    const quizName = ($("modal-quiz-name")?.value || "").trim();
    if (!quizName) {
      toast(t("msg.nameRequired"));
      $("modal-quiz-name")?.focus();
      return;
    }
    studioQuiz.title = quizName;
    if ($("studio-quiz-title")) $("studio-quiz-title").value = quizName;
    // المسابقة الموجودة بتحتفظ بتصنيفها، والجديدة بتاخد اللي اتختار
    if (studioQuiz.id == null) studioQuiz.category = $("modal-quiz-category")?.value || "General";
    studioQuiz.status = "Ready";

    try {
      const saved = await Api.quizzes.save(studioQuiz);
      if (saved && saved.id) studioQuiz.id = saved.id;
      studioDirty = false;
      if ($("studio-save-modal")) $("studio-save-modal").style.display = "none";
      toast(t("msg.saved"));
      showPage("quizzes");
    } catch (err) { showError(err); }
  });

  window.addEventListener("beforeunload", (e) => {
    if (studioDirty && $("page-create")?.classList.contains("active")) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

/* ---------------- Quizzes (مسابقات متاحة من مستخدمين تانيين) ---------------- */

let publicQuizzes = [];
const publicQuizCache = new Map();

async function loadPublicQuizzes() {
  // بنجمع: مسابقاتي (GET /Quizzes/mine) + المسابقات العامة بتاعت غيري (GET /Quizzes/public)
  const hasPublic = typeof Api.quizzes.listPublic === "function";
  const [mine, pub] = await Promise.all([
    Api.quizzes.list().catch((e) => { console.warn("mine failed", e); return []; }),
    hasPublic ? Api.quizzes.listPublic().catch((e) => { console.warn("public failed", e); return []; }) : Promise.resolve([])
  ]);

  const byId = new Map();
  [...(Array.isArray(mine) ? mine : []), ...(Array.isArray(pub) ? pub : [])].forEach((q) => byId.set(String(q.id), q));

  publicQuizzes = [...byId.values()].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));   // الأحدث الأول
  publicQuizCache.clear();
  publicQuizzes.forEach((q) => publicQuizCache.set(String(q.id), q));
}

function coverTone(seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4;
}

function quizCardHTML(q) {
  const count = Number(q.questionCount ?? (q.questions ? q.questions.length : 0)) || 0;
  const creator = q.creatorName || q.ownerName || q.createdBy || q.author || q.userName || "";
  const cover = q.imageUrl || q.coverImage || q.image || "";
  return `
    <article class="quiz-card">
      <div class="quiz-cover tone-${coverTone(q.title || q.id)}">
        ${cover ? `<img src="${escapeHTML(cover)}" alt="" loading="lazy">` : `<span class="quiz-cover-icon">✝</span>`}
        <span class="quiz-badge">${t("explore.badge")}</span>
        <span class="quiz-count">▤ ${nQuestions(count)}</span>
      </div>
      <div class="quiz-card-body">
        <h3 class="quiz-card-title">${escapeHTML(q.title)}</h3>
        <p class="quiz-card-meta">${escapeHTML(q.category || t("common.general"))}${creator ? ` · ${t("explore.by", { name: escapeHTML(creator) })}` : ""}</p>
        <button type="button" class="button gold-button quiz-host-btn" data-action="host" data-id="${escapeHTML(q.id)}">${t("explore.host")}</button>
      </div>
    </article>`;
}

async function renderExplore({ refetch = true } = {}) {
  const grid = $("explore-grid");
  if (!grid) return;

  if (refetch) {
    grid.innerHTML = `<p class="explore-loading">${t("explore.loading")}</p>`;
    $("explore-empty").hidden = true;
    await loadPublicQuizzes();
  }

  const term = ($("explore-search")?.value || "").trim().toLowerCase();
  const list = publicQuizzes.filter((q) => String(q.title || "").toLowerCase().includes(term));
  grid.innerHTML = list.map(quizCardHTML).join("");
  $("explore-empty").hidden = list.length > 0;
}

/* ---------------- Results / Participants / Leaderboard ---------------- */

function normalizeResults(results) {
  return results.map((item) => ({
    name: String(item.name || item.fullName || t("common.participant")).trim() || t("common.participant"),
    quizTitle: item.quizTitle || t("common.churchQuiz"),
    score: Number(item.score) || 0,
    total: Number(item.total) || 0,
    percentage: Math.max(0, Math.min(100, Number(item.percentage ?? (item.total ? (item.score / item.total) * 100 : 0)) || 0)),
    time: Number(item.time) || 0,
    date: item.date ? new Date(item.date).toLocaleDateString(dateLocale()) : "—"
  }));
}

async function renderParticipants() {
  const list = normalizeResults(await Api.results.list());
  if ($("participants-table")) {
    $("participants-table").innerHTML = list.map((r) => `
      <tr>
        <td><span class="table-title">${escapeHTML(r.name)}</span></td>
        <td>${escapeHTML(r.quizTitle)}</td>
        <td>${r.score}/${r.total}</td>
        <td>${r.time}s</td>
        <td>${escapeHTML(r.date)}</td>
      </tr>
    `).join("");
  }
  if ($("participants-empty")) $("participants-empty").hidden = list.length > 0;
}

async function renderResults() {
  const list = normalizeResults(await Api.results.list());

  if ($("results-attempts")) $("results-attempts").textContent = list.length;
  if ($("results-players")) $("results-players").textContent = new Set(list.map((r) => r.name.toLowerCase())).size;
  if ($("results-average")) {
    $("results-average").textContent = list.length
      ? `${Math.round(list.reduce((s, r) => s + r.percentage, 0) / list.length)}%` : "—";
  }
  if ($("results-best")) {
    $("results-best").textContent = list.length
      ? `${Math.round(Math.max(...list.map((r) => r.percentage)))}%` : "—";
  }

  if ($("results-table")) {
    $("results-table").innerHTML = list
      .slice()
      .sort((a, b) => b.percentage - a.percentage)
      .map((r) => `
        <tr>
          <td><span class="table-title">${escapeHTML(r.name)}</span></td>
          <td>${r.score}/${r.total}</td>
          <td>${Math.round(r.percentage)}%</td>
          <td>${r.time}s</td>
          <td>${escapeHTML(r.date)}</td>
        </tr>
      `).join("");
  }
  if ($("results-empty")) $("results-empty").hidden = list.length > 0;
}

async function renderLeaderboard() {
  const container = $("admin-leaderboard-content");
  if (!container) return;

  const best = new Map();
  normalizeResults(await Api.results.list()).filter((r) => r.total > 0).forEach((r) => {
    const key = r.name.toLowerCase();
    const prev = best.get(key);
    if (!prev || r.percentage > prev.percentage || (r.percentage === prev.percentage && r.score > prev.score)) best.set(key, r);
  });
  const top = [...best.values()]
    .sort((a, b) => b.percentage - a.percentage || b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 3);

  if (!top.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <b>${t("res.empty")}</b>
        <p>${t("lb.emptySub")}</p>
      </div>`;
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const ranks = [t("lb.r1"), t("lb.r2"), t("lb.r3")];
  container.innerHTML = `
    <div class="admin-top-three">
      ${top.map((p, i) => `
        <article class="admin-top-card">
          <div class="admin-top-medal">${medals[i]}</div>
          <div class="admin-top-rank">${ranks[i]}</div>
          <h3>${escapeHTML(p.name)}</h3>
          <strong>${p.percentage.toFixed(1)}%</strong>
        </article>`).join("")}
    </div>
    <p class="admin-leaderboard-note">${t("lb.note")}</p>`;
}

async function exportResults() {
  const list = normalizeResults(await Api.results.list());
  if (!list.length) return toast(t("msg.noExport"));

  const rows = [
    [t("common.participant"), t("th.quiz"), t("th.score"), t("csv.total"), t("th.percentage"), t("csv.seconds"), t("csv.date")],
    ...list.map((r) => [r.name, r.quizTitle, r.score, r.total, Math.round(r.percentage), r.time, r.date])
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "church-quiz-results.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/* ---------------- Settings & Categories ---------------- */

async function loadSettings() {
  const stored = (await Api.settings.get()) || {};
  const info = getAccountInfo();
  // لو الإعدادات دي لحساب تاني على نفس المتصفح بنتجاهلها
  userSettings = !stored.owner || stored.owner === info.key ? stored : {};

  if ($("user-display-name")) $("user-display-name").value = userSettings.name || info.name || "";
  if ($("church-name")) $("church-name").value = userSettings.churchName || "";
  if ($("admin-email")) $("admin-email").value = userSettings.email || info.email || "";

  const lang = userSettings.language || currentLang;
  if (lang !== currentLang) setLanguage(lang);
  else if ($("dashboard-language")) $("dashboard-language").value = currentLang;
  renderUserBadge();
}

async function saveSettings(event) {
  event.preventDefault();
  const data = {
    owner: getAccountInfo().key,
    name: $("user-display-name")?.value.trim() || "",
    churchName: $("church-name")?.value.trim() || "",
    email: $("admin-email")?.value.trim() || "",
    language: $("dashboard-language")?.value || "en"
  };
  try {
    await Api.settings.save(data);
    userSettings = data;
    setLanguage(data.language);
    toast(t("set.saved"));
  } catch (err) { showError(err); }
}

function logout() {
  Api.auth.logout();
  window.location.href = "loginn.html";
}

async function loadCategories() {
  const select = $("modal-quiz-category");
  if (!select) return;
  try {
    const categories = await Api.categories.list();
    select.innerHTML = categories.map((c) => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("");
  } catch {
    select.innerHTML = `<option value="General">${t("common.general")}</option>`;
  }
}

/* ---------------- Init ---------------- */

const ACTIONS = {
  "toggle-menu": (el) => {
    const container = el.closest(".dropdown-container");
    const wasActive = container.classList.contains("active");
    closeAllDropdowns();
    if (!wasActive) container.classList.add("active");
  },
  host: (el) => openHostModal(el.dataset.id),
  edit: (el) => openStudio(el.dataset.id),
  "delete-quiz": (el) => deleteQuiz(el.dataset.id)
};

function init() {
  if (!AUTH_OK) return;

  if (localStorage.getItem(SIDEBAR_KEY) === "1") document.body.classList.add("sidebar-collapsed");
  applyStaticTranslations();
  bindStudio();

  document.addEventListener("click", (event) => {
    const el = event.target.closest("[data-action]");
    if (!el || el.dataset.action !== "toggle-menu") closeAllDropdowns();
    if (el && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el);
  });

  $("btn-start-host-final")?.addEventListener("click", startHosting);
  $("close-host-modal")?.addEventListener("click", closeHostModal);

  const goTo = (page) => (page === "create" ? openStudio(null) : showPage(page));
  document.querySelectorAll(".nav-link[data-page]").forEach((b) => b.addEventListener("click", () => goTo(b.dataset.page)));
  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => goTo(b.dataset.go)));

  $("menu-toggle")?.addEventListener("click", toggleSidebar);
  $("studio-menu-toggle")?.addEventListener("click", toggleSidebar);
  $("logout-btn")?.addEventListener("click", logout);
  $("dashboard-language")?.addEventListener("change", (e) => setLanguage(e.target.value));
  $("lang-toggle")?.addEventListener("click", () => setLanguage(currentLang === "ar" ? "en" : "ar"));
  $("explore-search")?.addEventListener("input", () => renderExplore({ refetch: false }).catch(showError));
  $("support-grid")?.addEventListener("click", (e) => {
    const link = e.target.closest(".support-contact");
    if (link && !link.dataset.phone) { e.preventDefault(); toast(t("sup.notSet")); }
  });
  $("settings-form")?.addEventListener("submit", saveSettings);
  $("quiz-search")?.addEventListener("input", () => renderQuizzes().catch(showError));
  $("export-results")?.addEventListener("click", () => exportResults().catch(showError));
  $("admin-leaderboard-refresh")?.addEventListener("click", () => renderLeaderboard().catch(showError));

  loadCategories();
  loadSettings().catch(showError);
  renderDashboard().catch(showError);
  renderQuizzes().catch(showError);
  renderSupport();
  renderUserBadge();
  renderParticipants().catch(showError);
  renderResults().catch(showError);
  renderLeaderboard().catch(showError);
}

document.addEventListener("DOMContentLoaded", init);