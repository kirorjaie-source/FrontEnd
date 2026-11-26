"use strict";

/* ============================================================
   admin.js — لوحة التحكم
   تعتمد بالكامل على window.Api (المعرف في apin.js).
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
  "nav.churches": "Churches",
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
  "nav.manageRoles": "Manage Roles",
  "nav.back": "← Back to website",
  "crumb.admin": "Admin",
  "user.default": "Admin",
  "dash.eyebrow": "YOUR COMMUNITY, YOUR QUIZZES",
  "dash.welcome": "Welcome to your Kokquiz",
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
  "modal.visibility": "Visibility",
  "modal.public": "Public (Visible to everyone)",
  "modal.private": "Private (Only me)",
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
  "common.churchQuiz": "Kokquiz",
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
  "footer.a": "Kokquiz Admin",
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
  "csv.seconds": "Time (seconds)",
  "theme.toLight": "Switch to light mode",
  "theme.toDark": "Switch to dark mode",
  "email.title": "Login email",
  "email.sub": "Change the email you use to sign in.",
  "email.current": "Current email",
  "email.new": "New email",
  "email.password": "Current password",
  "email.passwordPh": "Enter your password to confirm",
  "email.save": "Change email",
  "email.invalid": "Enter a valid email address.",
  "email.same": "The new email is the same as the current one.",
  "email.needPwd": "Enter your current password.",
  "email.done": "Email changed. Please sign in again.",
  "email.fail": "Could not change the email.",
  "email.sendCode": "Send verification code",
  "email.code": "Verification code",
  "email.codePh": "Code sent to the new email",
  "email.confirm": "Confirm change",
  "email.codeSent": "We sent a code to the new email. Enter it below.",
  "email.needCode": "Enter the verification code."
 },
 "ar": {
  "brand.name": "كوك كويز",
  "brand.sub": "لوحة التحكم",
  "menu.workspace": "مساحة العمل",
  "nav.dashboard": "لوحة المعلومات",
  "nav.churches": "الكنايس",
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
  "nav.manageRoles": "إدارة الصلاحيات",
  "nav.back": "→ العودة للموقع",
  "crumb.admin": "الأدمن",
  "user.default": "الأدمن",
  "dash.eyebrow": "مجتمعك، مسابقاتك",
  "dash.welcome": "أهلاً بك في Kokquiz",
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
  "modal.visibility": "حالة الظهور",
  "modal.public": "عامة (تظهر للجميع)",
  "modal.private": "خاصة (لي أنا فقط)",
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
  "common.churchQuiz": "Kokquiz",
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
  "footer.a": "لوحة Kokquiz",
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
  "csv.seconds": "الوقت (بالثواني)",
  "theme.toLight": "التبديل للوضع النهاري",
  "theme.toDark": "التبديل للوضع الليلي",
  "email.title": "إيميل تسجيل الدخول",
  "email.sub": "غيّر الإيميل اللي بتدخل بيه.",
  "email.current": "الإيميل الحالي",
  "email.new": "الإيميل الجديد",
  "email.password": "كلمة السر الحالية",
  "email.passwordPh": "اكتب كلمة السر للتأكيد",
  "email.save": "تغيير الإيميل",
  "email.invalid": "اكتب إيميل صحيح.",
  "email.same": "الإيميل الجديد هو نفسه الحالي.",
  "email.needPwd": "اكتب كلمة السر الحالية.",
  "email.done": "تم تغيير الإيميل. سجّل الدخول من جديد.",
  "email.fail": "تعذّر تغيير الإيميل.",
  "email.sendCode": "إرسال كود التأكيد",
  "email.code": "كود التأكيد",
  "email.codePh": "الكود اللي وصل للإيميل الجديد",
  "email.confirm": "تأكيد التغيير",
  "email.codeSent": "بعتنا كود للإيميل الجديد. اكتبه تحت.",
  "email.needCode": "اكتب كود التأكيد."
 }
};

const LANG_KEY = "kokLang";   // نفس المفتاح في كل الصفحات (اللاعب، المدرّس، اللوبي، التسجيل)
let currentLang = localStorage.getItem(LANG_KEY) === "ar" ? "ar" : "en";
let currentPage = "home";      // الرئيسية هي أول صفحة بتفتح

/* ===== آية اليوم: بتتغير تلقائي كل يوم (بتفضل ثابتة طول اليوم) ===== */
const DAILY_VERSES = [
  { en: "The Lord is my shepherd; I shall not want. — Psalm 23:1",
    ar: "الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ. — مزمور ٢٣: ١" },
  { en: "I can do all things through Christ who strengthens me. — Philippians 4:13",
    ar: "أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِّينِي. — فيلبي ٤: ١٣" },
  { en: "Be strong and of good courage; the Lord your God is with you wherever you go. — Joshua 1:9",
    ar: "تَشَدَّدْ وَتَشَجَّعْ، لأَنَّ الرَّبَّ إِلهَكَ مَعَكَ حَيْثُمَا تَذْهَبُ. — يشوع ١: ٩" },
  { en: "Trust in the Lord with all your heart, and lean not on your own understanding. — Proverbs 3:5",
    ar: "تَوَكَّلْ عَلَى الرَّبِّ بِكُلِّ قَلْبِكَ، وَعَلَى فَهْمِكَ لاَ تَعْتَمِدْ. — أمثال ٣: ٥" },
  { en: "Your word is a lamp to my feet and a light to my path. — Psalm 119:105",
    ar: "سِرَاجٌ لِرِجْلِي كَلاَمُكَ وَنُورٌ لِسَبِيلِي. — مزمور ١١٩: ١٠٥" },
  { en: "Fear not, for I am with you; I will strengthen you, yes, I will help you. — Isaiah 41:10",
    ar: "لاَ تَخَفْ لأَنِّي مَعَكَ. قَدْ أَيَّدْتُكَ وَأَعَنْتُكَ. — إشعياء ٤١: ١٠" },
  { en: "Come to me, all you who labor and are heavy laden, and I will give you rest. — Matthew 11:28",
    ar: "تَعَالَوْا إِلَيَّ يَا جَمِيعَ الْمُتْعَبِينَ وَالثَّقِيلِي الأَحْمَالِ وَأَنَا أُرِيحُكُمْ. — متى ١١: ٢٨" },
  { en: "Grow in grace and in the knowledge of our Lord and Savior Jesus Christ. — 2 Peter 3:18",
    ar: "وَانْمُوا فِي النِّعْمَةِ وَفِي مَعْرِفَةِ رَبِّنَا وَمُخَلِّصِنَا يَسُوعَ الْمَسِيحِ. — ٢ بطرس ٣: ١٨" },
  { en: "Faith, hope, love abide, these three; but the greatest of these is love. — 1 Corinthians 13:13",
    ar: "يَثْبُتُ: الإِيمَانُ وَالرَّجَاءُ وَالْمَحَبَّةُ، وَلكِنَّ أَعْظَمَهُنَّ الْمَحَبَّةُ. — ١ كورنثوس ١٣: ١٣" },
  { en: "A wise man will hear and increase in learning. — Proverbs 1:5",
    ar: "يَسْمَعُ الْحَكِيمُ فَيَزْدَادُ عِلْمًا. — أمثال ١: ٥" },
  { en: "All things work together for good to those who love God. — Romans 8:28",
    ar: "كُلُّ الأَشْيَاءِ تَعْمَلُ مَعًا لِلْخَيْرِ لِلَّذِينَ يُحِبُّونَ اللهَ. — رومية ٨: ٢٨" },
  { en: "God is our refuge and strength, a very present help in trouble. — Psalm 46:1",
    ar: "اللهُ لَنَا مَلْجَأٌ وَقُوَّةٌ، عَوْنًا فِي الضِّيقَاتِ وُجِدَ شَدِيدًا. — مزمور ٤٦: ١" },
  { en: "I am the way, the truth, and the life. — John 14:6",
    ar: "أَنَا هُوَ الطَّرِيقُ وَالْحَقُّ وَالْحَيَاةُ. — يوحنا ١٤: ٦" },
  { en: "I am the light of the world. He who follows Me shall not walk in darkness, but have the light of life. — John 8:12",
    ar: "أَنَا هُوَ نُورُ الْعَالَمِ. مَنْ يَتْبَعْنِي فَلاَ يَمْشِي فِي الظُّلْمَةِ بَلْ يَكُونُ لَهُ نُورُ الْحَيَاةِ. — يوحنا ٨: ١٢" },
  { en: "The Lord is my light and my salvation; whom shall I fear? — Psalm 27:1",
    ar: "الرَّبُّ نُورِي وَخَلاَصِي، مِمَّنْ أَخَافُ؟ — مزمور ٢٧: ١" },
  { en: "My help comes from the Lord, who made heaven and earth. — Psalm 121:2",
    ar: "مَعُونَتِي مِنْ عِنْدِ الرَّبِّ، صَانِعِ السَّمَاوَاتِ وَالأَرْضِ. — مزمور ١٢١: ٢" },
  { en: "Commit your works to the Lord, and your thoughts will be established. — Proverbs 16:3",
    ar: "أَلْقِ عَلَى الرَّبِّ أَعْمَالَكَ فَتَثْبُتَ أَفْكَارُكَ. — أمثال ١٦: ٣" },
  { en: "Rejoice always, pray without ceasing, in everything give thanks. — 1 Thessalonians 5:16-18",
    ar: "افْرَحُوا كُلَّ حِينٍ. صَلُّوا بِلاَ انْقِطَاعٍ. اشْكُرُوا فِي كُلِّ شَيْءٍ. — ١ تسالونيكي ٥: ١٦-١٨" },
  { en: "Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God. — Philippians 4:6",
    ar: "لاَ تَهْتَمُّوا بِشَيْءٍ، بَلْ فِي كُلِّ شَيْءٍ بِالصَّلاَةِ وَالدُّعَاءِ مَعَ الشُّكْرِ لِتُعْلَمْ طِلْبَاتُكُمْ لَدَى اللهِ. — فيلبي ٤: ٦" },
  { en: "Rejoicing in hope, patient in tribulation, continuing steadfastly in prayer. — Romans 12:12",
    ar: "فَرِحِينَ فِي الرَّجَاءِ، صَابِرِينَ فِي الضِّيقِ، مُواظِبِينَ عَلَى الصَّلاَةِ. — رومية ١٢: ١٢" },
  { en: "Let us not grow weary while doing good, for in due season we shall reap if we do not lose heart. — Galatians 6:9",
    ar: "فَلاَ نَفْشَلْ فِي عَمَلِ الْخَيْرِ، لأَنَّنَا سَنَحْصُدُ فِي وَقْتِهِ إِنْ كُنَّا لاَ نَكِلُّ. — غلاطية ٦: ٩" },
  { en: "Faith is the substance of things hoped for, the evidence of things not seen. — Hebrews 11:1",
    ar: "وَأَمَّا الإِيمَانُ فَهُوَ الثِّقَةُ بِمَا يُرْجَى وَالإِيقَانُ بِأُمُورٍ لاَ تُرَى. — عبرانيين ١١: ١" },
  { en: "If any of you lacks wisdom, let him ask of God, who gives to all liberally. — James 1:5",
    ar: "إِنْ كَانَ أَحَدُكُمْ تُعْوِزُهُ حِكْمَةٌ، فَلْيَطْلُبْ مِنَ اللهِ الَّذِي يُعْطِي الْجَمِيعَ بِسَخَاءٍ. — يعقوب ١: ٥" },
  { en: "God is love. — 1 John 4:8",
    ar: "اللهُ مَحَبَّةٌ. — ١ يوحنا ٤: ٨" },
  { en: "Oh, taste and see that the Lord is good; blessed is the man who trusts in Him. — Psalm 34:8",
    ar: "ذُوقُوا وَانْظُرُوا مَا أَطْيَبَ الرَّبَّ! طُوبَى لِلرَّجُلِ الْمُتَوَكِّلِ عَلَيْهِ. — مزمور ٣٤: ٨" },
  { en: "I know the thoughts that I think toward you, thoughts of peace and not of evil, to give you a future and a hope. — Jeremiah 29:11",
    ar: "أَفْكَارَ سَلاَمٍ لاَ شَرٍّ، لأُعْطِيَكُمْ آخِرَةً وَرَجَاءً. — إرميا ٢٩: ١١" },
  { en: "Seek first the kingdom of God and His righteousness, and all these things shall be added to you. — Matthew 6:33",
    ar: "اطْلُبُوا أَوَّلاً مَلَكُوتَ اللهِ وَبِرَّهُ، وَهذِهِ كُلُّهَا تُزَادُ لَكُمْ. — متى ٦: ٣٣" },
  { en: "No one knows the things of God except the Spirit of God. — 1 Corinthians 2:11",
    ar: "أُمُورُ اللهِ لاَ يَعْرِفُهَا أَحَدٌ إِلاَّ رُوحُ اللهِ. — ١ كورنثوس ٢: ١١" },
  { en: "As for me and my house, we will serve the Lord. — Joshua 24:15",
    ar: "أَمَّا أَنَا وَبَيْتِي فَنَعْبُدُ الرَّبَّ. — يشوع ٢٤: ١٥" },
  { en: "No one knows God's purposes except God.",
    ar: "مقاصد الله لا يعلمها إلا الله." },
  { en: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life. — John 3:16",
    ar: "لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونَ لَهُ الْحَيَاةُ الأَبَدِيَّةُ. — يوحنا ٣: ١٦" },
  { en: "Delight yourself also in the Lord, and He shall give you the desires of your heart. — Psalm 37:4",
    ar: "وَتَلَذَّذْ بِالرَّبِّ فَيُعْطِيَكَ سُؤْلَ قَلْبِكَ. — مزمور ٣٧: ٤" },
  { en: "The name of the Lord is a strong tower; the righteous run to it and are safe. — Proverbs 18:10",
    ar: "اسْمُ الرَّبِّ بُرْجٌ حَصِينٌ، يَرْكُضُ إِلَيْهِ الصِّدِّيقُ وَيَتَمَنَّعُ. — أمثال ١٨: ١٠" },
  { en: "Those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles. — Isaiah 40:31",
    ar: "وَأَمَّا مُنْتَظِرُو الرَّبِّ فَيُجَدِّدُونَ قُوَّةً. يَرْفَعُونَ أَجْنِحَةً كَالنُّسُورِ. — إشعياء ٤٠: ٣١" },
  { en: "He who dwells in the secret place of the Most High shall abide under the shadow of the Almighty. — Psalm 91:1",
    ar: "الْجَالِسُ فِي سِتْرِ الْعَلِيِّ فِي ظِلِّ الْقَدِيرِ يَبِيتُ. — مزمور ٩١: ١" },
  { en: "Let your light so shine before men, that they may see your good works and glorify your Father in heaven. — Matthew 5:16",
    ar: "فَلْيُضِئْ نُورُكُمْ هكَذَا قُدَّامَ النَّاسِ، لِكَيْ يَرَوْا أَعْمَالَكُمُ الْحَسَنَةَ، وَيُمَجِّدُوا أَبَاكُمُ الَّذِي فِي السَّمَاوَاتِ. — متى ٥: ١٦" },
  { en: "I am the vine, you are the branches. Without Me you can do nothing. — John 15:5",
    ar: "أَنَا هُوَ الْكَرْمَةُ وَأَنْتُمُ الأَغْصَانُ. لأَنَّكُمْ بِدُونِي لاَ تَقْدِرُونَ أَنْ تَفْعَلُوا شَيْئًا. — يوحنا ١٥: ٥" },
  { en: "I am the good shepherd. The good shepherd gives His life for the sheep. — John 10:11",
    ar: "أَنَا هُوَ الرَّاعِي الصَّالِحُ، وَالرَّاعِي الصَّالِحُ يَبْذِلُ نَفْسَهُ عَنِ الْخِرَافِ. — يوحنا ١٠: ١١" },
  { en: "And lo, I am with you always, even to the end of the age. — Matthew 28:20",
    ar: "وَهَا أَنَا مَعَكُمْ كُلَّ الأَيَّامِ إِلَى انْقِضَاءِ الدَّهْرِ. — متى ٢٨: ٢٠" },
  { en: "This is the day the Lord has made; we will rejoice and be glad in it. — Psalm 118:24",
    ar: "هذَا هُوَ الْيَوْمُ الَّذِي صَنَعَهُ الرَّبُّ، فَلْنَبْتَهِجْ وَنَفْرَحْ فِيهِ. — مزمور ١١٨: ٢٤" },
  { en: "Bless the Lord, O my soul, and forget not all His benefits. — Psalm 103:2",
    ar: "بَارِكِي يَا نَفْسِي الرَّبَّ، وَلاَ تَنْسَيْ كُلَّ حَسَنَاتِهِ. — مزمور ١٠٣: ٢" },
  { en: "Train up a child in the way he should go, and when he is old he will not depart from it. — Proverbs 22:6",
    ar: "رَبِّ الْوَلَدَ فِي طَرِيقِهِ، فَمَتَى شَاخَ أَيْضًا لاَ يَحِيدُ عَنْهُ. — أمثال ٢٢: ٦" },
  { en: "To everything there is a season, a time for every purpose under heaven. — Ecclesiastes 3:1",
    ar: "لِكُلِّ شَيْءٍ زَمَانٌ، وَلِكُلِّ أَمْرٍ تَحْتَ السَّمَاوَاتِ وَقْتٌ. — الجامعة ٣: ١" },
  { en: "Do justly, love mercy, and walk humbly with your God. — Micah 6:8",
    ar: "أَنْ تَصْنَعَ الْحَقَّ وَتُحِبَّ الرَّحْمَةَ وَتَسْلُكَ مُتَوَاضِعًا مَعَ إِلهِكَ. — ميخا ٦: ٨" },
  { en: "God demonstrates His own love toward us, in that while we were still sinners, Christ died for us. — Romans 5:8",
    ar: "وَلكِنَّ اللهَ بَيَّنَ مَحَبَّتَهُ لَنَا، لأَنَّهُ وَنَحْنُ بَعْدُ خُطَاةٌ مَاتَ الْمَسِيحُ لأَجْلِنَا. — رومية ٥: ٨" },
  { en: "By grace you have been saved through faith, and that not of yourselves; it is the gift of God. — Ephesians 2:8",
    ar: "لأَنَّكُمْ بِالنِّعْمَةِ مُخَلَّصُونَ، بِالإِيمَانِ، وَذلِكَ لَيْسَ مِنْكُمْ. هُوَ عَطِيَّةُ اللهِ. — أفسس ٢: ٨" },
  { en: "Whatever you do, do it heartily, as to the Lord and not to men. — Colossians 3:23",
    ar: "وَكُلُّ مَا فَعَلْتُمْ، فَاعْمَلُوا مِنَ الْقَلْبِ، كَمَا لِلرَّبِّ لَيْسَ لِلنَّاسِ. — كولوسي ٣: ٢٣" },
  { en: "God has not given us a spirit of fear, but of power and of love and of a sound mind. — 2 Timothy 1:7",
    ar: "لأَنَّ اللهَ لَمْ يُعْطِنَا رُوحَ الْفَشَلِ، بَلْ رُوحَ الْقُوَّةِ وَالْمَحَبَّةِ وَالنُّصْحِ. — ٢ تيموثاوس ١: ٧" },
  { en: "Jesus Christ is the same yesterday, today, and forever. — Hebrews 13:8",
    ar: "يَسُوعُ الْمَسِيحُ هُوَ هُوَ أَمْسًا وَالْيَوْمَ وَإِلَى الأَبَدِ. — عبرانيين ١٣: ٨" },
  { en: "Cast all your care upon Him, for He cares for you. — 1 Peter 5:7",
    ar: "مُلْقِينَ كُلَّ هَمِّكُمْ عَلَيْهِ، لأَنَّهُ هُوَ يَعْتَنِي بِكُمْ. — ١ بطرس ٥: ٧" },
  { en: "Draw near to God and He will draw near to you. — James 4:8",
    ar: "اقْتَرِبُوا إِلَى اللهِ فَيَقْتَرِبَ إِلَيْكُمْ. — يعقوب ٤: ٨" },
  { en: "The heavens declare the glory of God; and the firmament shows His handiwork. — Psalm 19:1",
    ar: "اَلسَّمَاوَاتُ تُحَدِّثُ بِمَجْدِ اللهِ، وَالْفَلَكُ يُخْبِرُ بِعَمَلِ يَدَيْهِ. — مزمور ١٩: ١" },
  { en: "I will praise You, for I am fearfully and wonderfully made. — Psalm 139:14",
    ar: "أَحْمَدُكَ مِنْ أَجْلِ أَنِّي قَدِ امْتَزْتُ عَجَبًا. — مزمور ١٣٩: ١٤" },
  { en: "A soft answer turns away wrath, but a harsh word stirs up anger. — Proverbs 15:1",
    ar: "الْجَوَابُ اللَّيِّنُ يَصْرِفُ الْغَضَبَ، وَالْكَلاَمُ الْمُوجِعُ يُهَيِّجُ السَّخَطَ. — أمثال ١٥: ١" },
  { en: "For with God nothing will be impossible. — Luke 1:37",
    ar: "لأَنَّهُ لَيْسَ شَيْءٌ غَيْرَ مُمْكِنٍ لَدَى اللهِ. — لوقا ١: ٣٧" },
  { en: "Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you. — Luke 11:9",
    ar: "اسْأَلُوا تُعْطَوْا. اطْلُبُوا تَجِدُوا. اقْرَعُوا يُفْتَحْ لَكُمْ. — لوقا ١١: ٩" },
  { en: "A new commandment I give to you, that you love one another; as I have loved you. — John 13:34",
    ar: "وَصِيَّةً جَدِيدَةً أَنَا أُعْْطِيكُمْ: أَنْ تُحِبُّوا بَعْضُكُمْ بَعْضًا. كَمَا أَحْبَبْتُكُمْ أَنَا. — يوحنا ١٣: ٣٤" },
  { en: "Enter into His gates with thanksgiving, and into His courts with praise. — Psalm 100:4",
    ar: "ادْخُلُوا أَبْوَابَهُ بِحَمْدٍ، دِيَارَهُ بِالتَّسْبِيحِ. — مزمور ١٠٠: ٤" },
  { en: "Let all that you do be done with love. — 1 Corinthians 16:14",
    ar: "لِتَصِرْ كُلُّ أُمُورِكُمْ فِي مَحَبَّةٍ. — ١ كورنثوس ١٦: ١٤" },
  { en: "Rejoice in the Lord always. Again I will say, rejoice! — Philippians 4:4",
    ar: "افْرَحُوا فِي الرَّبِّ كُلَّ حِينٍ، وَأَقُولُ أَيْضًا: افْرَحُوا. — فيلبي ٤: ٤" }
];

function dailyVerse() {
  const d = new Date();
  const dayNumber = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const v = DAILY_VERSES[dayNumber % DAILY_VERSES.length];
  return v[currentLang] || v.en;
}

function t(key, vars) {
  if (key === "home.sub") return dailyVerse();
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
  if (window.KokChurches && typeof KokChurches.refresh === "function") KokChurches.refresh();
}

function setLanguage(lang, { rerender = true } = {}) {
  currentLang = lang === "ar" ? "ar" : "en";
  localStorage.setItem(LANG_KEY, currentLang);
  if ($("dashboard-language")) $("dashboard-language").value = currentLang;
  applyStaticTranslations();
  applyTheme(getTheme());
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

let userSettings = {};

function renderUserBadge() {
  const info = getAccountInfo();
  const name = (userSettings.name || "").trim() || info.name || (info.email ? info.email.split("@")[0] : "") || t("user.default");
  const email = (userSettings.email || "").trim() || info.email || "";
  if ($("user-name")) $("user-name").textContent = name;
  if ($("user-avatar")) $("user-avatar").textContent = [...name][0]?.toUpperCase() || "A";
  if ($("dropdown-user-name")) $("dropdown-user-name").textContent = name;
  if ($("dropdown-user-email")) $("dropdown-user-email").textContent = email;
}

/* ============================================================
   الدعم (Support) — الأسماء والأرقام في contacts.js
   ============================================================ */

const WA_ICON = `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.9 9.9 0 0 0 4.77 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.05c-.25.7-1.45 1.34-2 1.4-.52.06-1.17.09-1.88-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.9-4.27-5.05-4.47-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1.01 2.09 1.32 2.39 1.47.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42z"/></svg>`;

function renderSupport() {
  const grid = $("support-grid");
  if (!grid) return;
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
    churches: async () => { if (window.KokChurches) await KokChurches.onShow(); },
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

  const grid = $("my-quizzes-grid");
  if (grid) {
    grid.innerHTML = list.map((quiz) => {
      const id = escapeHTML(quiz.id);
      const count = Number(quiz.questionCount ?? (quiz.questions ? quiz.questions.length : 0)) || 0;
      const cover = quiz.imageUrl || quiz.coverImage || quiz.image || "";
      return `
      <article class="quiz-card my-quiz-card">
        <div class="quiz-cover tone-${coverTone(quiz.title || quiz.id)}">
          ${cover ? `<img src="${escapeHTML(cover)}" alt="" loading="lazy">` : `<span class="quiz-cover-icon">✝</span>`}
          <span class="quiz-badge">${escapeHTML(quiz.category || t("common.general"))}</span>
          <span class="quiz-count">▤ ${nQuestions(count)}</span>
        </div>
        <div class="quiz-card-body">
          <h3 class="quiz-card-title">${escapeHTML(quiz.title)}</h3>
          <div class="my-quiz-actions">
            <button type="button" class="button gold-button quiz-host-btn" data-action="host" data-id="${id}">${t("explore.host")}</button>
            <button type="button" class="icon-btn" data-action="edit" data-id="${id}" title="${t("menu.edit")}" aria-label="${t("menu.edit")}">✏️</button>
            <button type="button" class="icon-btn icon-btn-danger" data-action="delete-quiz" data-id="${id}" title="${t("menu.delete")}" aria-label="${t("menu.delete")}">🗑️</button>
          </div>
        </div>
      </article>`;
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

  try {
    await Api.game.create(quizId);
    closeHostModal();
    toast(t("msg.sessionCreated"));
    window.location.href = "lobbyn.html";
  } catch (err) {
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
    isPublic: true,
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
      if (typeof studioQuiz.isPublic !== "boolean") studioQuiz.isPublic = true;
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
      if (categorySelect.selectedIndex < 0) categorySelect.selectedIndex = 0;
    }
    if ($("modal-quiz-public")) {
      $("modal-quiz-public").value = studioQuiz.isPublic === false ? "false" : "true";
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
    if (studioQuiz.id == null) studioQuiz.category = $("modal-quiz-category")?.value || "General";
    if ($("modal-quiz-public")) {
      studioQuiz.isPublic = $("modal-quiz-public").value === "true";
    }
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
  const hasPublic = typeof Api.quizzes.listPublic === "function";
  if (hasPublic) {
    const pub = await Api.quizzes.listPublic();
    const list = Array.isArray(pub) ? pub : [];
    publicQuizzes = list.slice().sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  } else {
    const mine = await Api.quizzes.list();
    publicQuizzes = (Array.isArray(mine) ? mine : []).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }
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

/* ============================================================
   الوضع الليلي (Dark mode) — الزرار فوق جنب اللغة، والاختيار بيتحفظ
   ============================================================ */
const THEME_KEY = "kokTheme";
const getTheme = () => (localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0A1626" : "#0B1E36");
  const btn = $("theme-toggle");
  if (btn) {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    const label = t(theme === "dark" ? "theme.toLight" : "theme.toDark");
    btn.title = label;
    btn.setAttribute("aria-label", label);
  }
}

function mountThemeToggle() {
  const box = document.querySelector(".top-actions");
  if (!box || $("theme-toggle")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "theme-toggle";
  btn.className = "lang-btn";
  btn.style.fontSize = "16px";
  btn.addEventListener("click", () => applyTheme(getTheme() === "dark" ? "light" : "dark"));
  box.insertBefore(btn, $("lang-toggle") || box.firstChild);
  applyTheme(getTheme());
}
// نطبّق الوضع المحفوظ فورًا عشان مفيش وميض أبيض
document.documentElement.setAttribute("data-theme", getTheme());

/* ============================================================
   تغيير إيميل الدخول (كارت جوه صفحة الإعدادات)
   بيكلم الباك: PUT {API}/Auth/change-email  { newEmail, currentPassword }
   ============================================================ */
const ADMIN_API_BASE = (window.Api && Api.config && Api.config.API_BASE) || "https://localhost:7152/api";

let emailStep = 1;   // 1 = إرسال الكود، 2 = تأكيد الكود

function mountEmailCard() {
  const page = $("page-settings");
  if (!page || $("email-card")) return;
  const card = document.createElement("div");
  card.className = "card form-card";
  card.id = "email-card";
  card.innerHTML = `
    <div class="form-section-title">
      <span>✉</span>
      <div>
        <h3 data-i18n="email.title">Login email</h3>
        <p data-i18n="email.sub">Change the email you use to sign in.</p>
      </div>
    </div>
    <form id="email-form" novalidate>
      <div class="field">
        <label for="email-current" data-i18n="email.current">Current email</label>
        <input id="email-current" type="email" readonly dir="ltr">
      </div>
      <div class="field">
        <label for="email-new" data-i18n="email.new">New email</label>
        <input id="email-new" type="email" placeholder="new@example.com" autocomplete="email" dir="ltr">
      </div>
      <div class="field" id="email-pwd-field">
        <label for="email-password" data-i18n="email.password">Current password</label>
        <input id="email-password" type="password" data-i18n-ph="email.passwordPh" autocomplete="current-password">
      </div>
      <div class="field" id="email-code-field" style="display:none">
        <label for="email-code" data-i18n="email.code">Verification code</label>
        <input id="email-code" type="text" inputmode="numeric" maxlength="8" data-i18n-ph="email.codePh" autocomplete="one-time-code" dir="ltr">
      </div>
      <p id="email-msg" role="status" style="min-height:20px;margin:0 0 12px;font-size:13px;font-weight:700"></p>
      <button class="button gold-button" type="submit" id="email-save-btn"></button>
    </form>`;
  const support = page.querySelector(".support-card");
  page.insertBefore(card, support || null);
  $("email-current").value = getAccountInfo().email || "";
  $("email-save-btn").textContent = t("email.sendCode");
  $("email-form").addEventListener("submit", changeLoginEmail);
}

function emailAuthHeaders() {
  const s = (window.Api && Api.auth.getSession()) || {};
  const token = s.token || localStorage.getItem("token") || localStorage.getItem("churchQuizToken") || "";
  return { "Content-Type": "application/json", Authorization: "Bearer " + token };
}

async function changeLoginEmail(event) {
  event.preventDefault();
  const msg = $("email-msg");
  const show = (text, ok) => { msg.textContent = text; msg.style.color = ok ? "#15803d" : "#dc2626"; };
  const newEmail = $("email-new").value.trim();
  const btn = $("email-save-btn");

  if (emailStep === 1) {
    const password = $("email-password").value;
    const current = getAccountInfo().email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return show(t("email.invalid"));
    if (current && newEmail.toLowerCase() === current.toLowerCase()) return show(t("email.same"));
    if (!password) return show(t("email.needPwd"));
    btn.disabled = true; show("", true);
    try {
      const res = await fetch(`${ADMIN_API_BASE}/Auth/change-email/request`, {
        method: "POST", headers: emailAuthHeaders(),
        body: JSON.stringify({ newEmail, currentPassword: password })
      });
      if (!res.ok) {
        let m = t("email.fail");
        try { const d = await res.json(); if (d && d.message) m = d.message; } catch { /* ignore */ }
        return show(m);
      }
      emailStep = 2;
      $("email-pwd-field").style.display = "none";
      $("email-code-field").style.display = "";
      $("email-new").readOnly = true;
      btn.textContent = t("email.confirm");
      show(t("email.codeSent"), true);
    } catch { show(t("email.fail")); }
    finally { btn.disabled = false; }
    return;
  }

  const code = $("email-code").value.trim();
  if (!code) return show(t("email.needCode"));
  btn.disabled = true; show("", true);
  try {
    const res = await fetch(`${ADMIN_API_BASE}/Auth/change-email/confirm`, {
      method: "POST", headers: emailAuthHeaders(),
      body: JSON.stringify({ newEmail, code })
    });
    if (!res.ok) {
      let m = t("email.fail");
      try { const d = await res.json(); if (d && d.message) m = d.message; } catch { /* ignore */ }
      return show(m);
    }
    show(t("email.done"), true);
    toast(t("email.done"));
    setTimeout(logout, 1800);   // الإيميل جزء من التوكن، فلازم دخول جديد
  } catch { show(t("email.fail")); }
  finally { btn.disabled = false; }
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
  mountEmailCard();
  mountThemeToggle();
  applyStaticTranslations();
  applyTheme(getTheme());
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

  const rolesLink = document.getElementById("nav-manage-roles");
  if (rolesLink) {
    let isAdmin = false;
    try {
      if (window.Api?.auth?.isAdmin) {
        isAdmin = Api.auth.isAdmin();
      } else {
        const s = (window.Api && Api.auth.getSession()) || JSON.parse(localStorage.getItem("churchQuizSession") || "{}");
        const token = s.token || localStorage.getItem("token") || localStorage.getItem("churchQuizToken");
        const c = token ? decodeJwt(token) : {};
        const role = s.role || c.role || c["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
        isAdmin = String(role).toLowerCase() === "admin" || role === 0 || role === "0";
      }
    } catch { /* ignore */ }

    if (isAdmin) {
      rolesLink.hidden = false;
      rolesLink.style.display = "";
    }
  }

  // فتح التبويب المطلوب لو جاي من صفحة Manage Roles عبر ?page=...
  const requestedPage = new URLSearchParams(window.location.search).get("page");
  if (requestedPage) {
    goTo(requestedPage);
    window.history.replaceState({}, "", "adminn.html");
  }

  // قائمة الحساب (Account Dropdown)
  const userWrap = $("user-menu-wrap");
  const userBtn = $("user-menu-btn");
  const userDrop = $("user-dropdown");

  const closeUserMenu = () => {
    userWrap?.classList.remove("open");
    if (userDrop) userDrop.hidden = true;
    userBtn?.setAttribute("aria-expanded", "false");
  };

  userBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = userWrap?.classList.toggle("open");
    if (userDrop) userDrop.hidden = !isOpen;
    userBtn.setAttribute("aria-expanded", String(Boolean(isOpen)));
  });

  $("drop-settings-btn")?.addEventListener("click", () => {
    closeUserMenu();
    showPage("settings");
  });

  $("drop-logout-btn")?.addEventListener("click", () => {
    closeUserMenu();
    logout();
  });

  document.addEventListener("click", (e) => {
    if (userWrap && !userWrap.contains(e.target)) closeUserMenu();
  });
}

document.addEventListener("DOMContentLoaded", init);