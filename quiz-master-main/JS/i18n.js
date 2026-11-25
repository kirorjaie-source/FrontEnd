"use strict";

(function () {
  const LANG_KEY = "kokLang";

  const DICT = {
    en: {
      "lang.switch": "العربية",

      // صفحة تسجيل الدخول (loginn.html)
      "login.backHome": "← Back to Home",
      "login.eyebrowTag": "LEARN • PLAY • GROW",
      "login.welcome": "WELCOME BACK",
      "login.subtitle": "Sign in to continue your journey.",
      "login.emailLabel": "Email address *",
      "login.emailPh": "you@example.com",
      "login.pwdLabel": "Password *",
      "login.pwdPh": "Enter your password",
      "login.submit": "Sign In",
      "login.submitting": "Checking...",
      "login.noAccount": "Don't have an account?",
      "login.createAccount": "Create Account",
      "login.showPwd": "Show password",
      "login.hidePwd": "Hide password",

      // رسائل تسجيل الدخول
      "login.msgEmpty": "Please enter your email and password.",
      "login.msgInvalidEmail": "Please enter a valid email address.",
      "login.msgConnecting": "Connecting to server...",
      "login.msgSuccess": "Signed in successfully! Redirecting...",
      "login.msgNotFound": "This account does not exist.",
      "login.msgInvalidCreds": "Incorrect email or password.",
      "login.msgNotVerified": "Your account is not verified yet. Please verify your email or contact an Admin.",
      "login.msgNetwork": "Unable to connect to the server. Please try again shortly.",
      "login.msgSecure": "Please open the site via a local server and try again.",
      "login.msgGeneric": "Something went wrong while signing in. Please try again.",

      // صفحة إنشاء الحساب (indexn.html)
      "reg.eyebrow": "LEARN • PLAY • GROW",
      "reg.title": "Create Your Account",
      "reg.subtitle": "Create your account and grow together in faith.",
      "reg.nameLabel": "Your name *",
      "reg.namePh": "Enter your full name",
      "reg.emailLabel": "Email address *",
      "reg.emailPh": "Enter your email",
      "reg.pwdLabel": "Password *",
      "reg.pwdPh": "Create a strong password",
      "reg.submit": "Create Account →",
      "reg.submitting": "Creating Account...",
      "reg.haveAccount": "Already have an account?",
      "reg.loginLink": "Log in",
      "reg.supportTitle": "Need help?",
      "reg.msgEmpty": "Please fill in all required fields.",
      "reg.msgInvalidEmail": "Please enter a valid email address.",
      "reg.msgWeakPwd": "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      "reg.msgConnecting": "Creating your account...",
      "reg.msgSuccess": "Account created! Verification code sent to your email. Redirecting...",
      "reg.msgDuplicate": "This email is already registered. Try logging in instead.",
      "reg.msgGeneric": "Something went wrong while creating your account. Please try again.",

      // صفحة إدارة الصلاحيات (manage-roles.html)
      "roles.panelSub": "ADMIN PANEL",
      "roles.workspace": "WORKSPACE",
      "roles.navDash": "Dashboard",
      "roles.navRoles": "Manage Roles",
      "roles.crumb": "Kokquiz / Admin / Roles",
      "roles.pageTitle": "Manage User Roles",
      "roles.backDash": "← Back to Dashboard",
      "roles.heroTitle": "Kokquiz Member Permissions",
      "roles.heroSub": "Promote members, verify accounts, or reset non-admin passwords.",
      "roles.total": "Total:",
      "roles.admins": "Admins:",
      "roles.creators": "Creators:",
      "roles.searchPh": "Search by name or email...",
      "roles.thUser": "User",
      "roles.thEmail": "Email",
      "roles.thStatus": "Account Status",
      "roles.thRole": "Role",
      "roles.thPwd": "Password",
      "roles.verified": "✓ Verified",
      "roles.unverified": "✕ Unverified",
      "roles.protected": "🔒 Protected",
      "roles.resetBtn": "🔑 Reset",
      "roles.modalTitle": "Change User Password",
      "roles.newPwdPh": "New password",
      "roles.confirmPwdPh": "Confirm new password",
      "roles.savePwd": "Save Password",
      "roles.cancel": "Cancel",
      "roles.ruleLen": "At least 8 characters",
      "roles.ruleUpper": "One uppercase letter (A-Z)",
      "roles.ruleLower": "One lowercase letter (a-z)",
      "roles.ruleDigit": "One number (0-9)",
      "roles.ruleSpecial": "One special character (@, #, $, !, ...)"
    },

    ar: {
      "lang.switch": "English",

      // صفحة تسجيل الدخول (loginn.html)
      "login.backHome": "→ العودة للرئيسية",
      "login.eyebrowTag": "تعلّم • العب • انمُ",
      "login.welcome": "أهلاً بعودتك",
      "login.subtitle": "سجّل الدخول لمتابعة رحلتك.",
      "login.emailLabel": "البريد الإلكتروني *",
      "login.emailPh": "you@example.com",
      "login.pwdLabel": "كلمة السر *",
      "login.pwdPh": "أدخل كلمة السر",
      "login.submit": "تسجيل الدخول",
      "login.submitting": "جاري التحقق...",
      "login.noAccount": "ليس لديك حساب؟",
      "login.createAccount": "إنشاء حساب جديد",
      "login.showPwd": "إظهار كلمة السر",
      "login.hidePwd": "إخفاء كلمة السر",

      // رسائل تسجيل الدخول
      "login.msgEmpty": "من فضلك أدخل البريد الإلكتروني وكلمة السر.",
      "login.msgInvalidEmail": "من فضلك أدخل بريداً إلكترونياً صحيحاً.",
      "login.msgConnecting": "جاري الاتصال بالسيرفر...",
      "login.msgSuccess": "تم تسجيل الدخول بنجاح! جاري التحويل...",
      "login.msgNotFound": "هذا الحساب غير موجود.",
      "login.msgInvalidCreds": "البريد الإلكتروني أو كلمة السر غير صحيحة.",
      "login.msgNotVerified": "حسابك غير مفعّل بعد. من فضلك فعّل بريدك الإلكتروني أو تواصل مع الأدمن.",
      "login.msgNetwork": "تعذر الاتصال بالسيرفر حالياً. حاول مرة أخرى بعد قليل.",
      "login.msgSecure": "افتح الموقع من خلال السيرفر المحلي ثم جرّب مرة أخرى.",
      "login.msgGeneric": "حدثت مشكلة أثناء تسجيل الدخول. حاول مرة أخرى.",

      // صفحة إنشاء الحساب (indexn.html)
      "reg.eyebrow": "تعلّم • العب • انمُ",
      "reg.title": "إنشاء حساب جديد",
      "reg.subtitle": "أنشئ حسابك وانمُ معنا في الإيمان والمعرفة.",
      "reg.nameLabel": "الاسم بالكامل *",
      "reg.namePh": "أدخل اسمك بالكامل",
      "reg.emailLabel": "البريد الإلكتروني *",
      "reg.emailPh": "أدخل بريدك الإلكتروني",
      "reg.pwdLabel": "كلمة السر *",
      "reg.pwdPh": "اختر كلمة سر قوية",
      "reg.submit": "← إنشاء الحساب",
      "reg.submitting": "جاري إنشاء الحساب...",
      "reg.haveAccount": "لديك حساب بالفعل؟",
      "reg.loginLink": "تسجيل الدخول",
      "reg.supportTitle": "تحتاج مساعدة؟",
      "reg.msgEmpty": "من فضلك املأ جميع البيانات المطلوبة.",
      "reg.msgInvalidEmail": "من فضلك أدخل بريداً إلكترونياً صحيحاً.",
      "reg.msgWeakPwd": "كلمة السر يجب ألا تقل عن 8 أحرف وتحتوي على حرف كبير وصغير ورقم ورمز خاص.",
      "reg.msgConnecting": "جاري إنشاء حسابك...",
      "reg.msgSuccess": "تم إنشاء الحساب وإرسال كود التفعيل لبريدك الإلكتروني! جاري التحويل...",
      "reg.msgDuplicate": "هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة.",
      "reg.msgGeneric": "حدثت مشكلة أثناء إنشاء الحساب. حاول مرة أخرى.",

      // صفحة إدارة الصلاحيات (manage-roles.html)
      "roles.panelSub": "لوحة التحكم",
      "roles.workspace": "مساحة العمل",
      "roles.navDash": "لوحة المعلومات",
      "roles.navRoles": "إدارة الصلاحيات",
      "roles.crumb": "كوك كويز / الأدمن / الصلاحيات",
      "roles.pageTitle": "إدارة صلاحيات المستخدمين",
      "roles.backDash": "→ رجوع للوحة التحكم",
      "roles.heroTitle": "التحكم في صلاحيات أعضاء Kokquiz",
      "roles.heroSub": "يمكنك ترقية الأعضاء، تفعيل الحسابات، أو إعادة تعيين كلمات السر.",
      "roles.total": "الإجمالي:",
      "roles.admins": "Admins:",
      "roles.creators": "Creators:",
      "roles.searchPh": "ابحث بالاسم أو البريد الإلكتروني...",
      "roles.thUser": "المستخدم",
      "roles.thEmail": "البريد الإلكتروني",
      "roles.thStatus": "حالة الحساب",
      "roles.thRole": "الصلاحية (Role)",
      "roles.thPwd": "كلمة السر",
      "roles.verified": "✓ مفعّل",
      "roles.unverified": "✕ غير مفعّل",
      "roles.protected": "🔒 محمي",
      "roles.resetBtn": "🔑 تغيير",
      "roles.modalTitle": "تغيير كلمة سر المستخدم",
      "roles.newPwdPh": "كلمة السر الجديدة",
      "roles.confirmPwdPh": "تأكيد كلمة السر الجديدة",
      "roles.savePwd": "حفظ كلمة السر",
      "roles.cancel": "إلغاء",
      "roles.ruleLen": "8 أحرف على الأقل",
      "roles.ruleUpper": "حرف كبير واحد على الأقل (A-Z)",
      "roles.ruleLower": "حرف صغير واحد على الأقل (a-z)",
      "roles.ruleDigit": "رقم واحد على الأقل (0-9)",
      "roles.ruleSpecial": "رمز خاص واحد على الأقل (@, #, $, !, ...)"
    }
  };

  const ERROR_PATTERNS = [
    {
      keys: ["account not found", "user not found", "not exist", "غير موجود"],
      key: "login.msgNotFound"
    },
    {
      keys: ["invalid email or password", "invalid credentials", "wrong password", "email or password", "incorrect password"],
      key: "login.msgInvalidCreds"
    },
    {
      keys: ["verify your email", "email not confirmed", "not verified", "unverified", "confirm your email"],
      key: "login.msgNotVerified"
    },
    {
      keys: ["failed to fetch", "networkerror", "network error", "err_connection"],
      key: "login.msgNetwork"
    },
    {
      keys: ["already registered", "email already exists", "already in use", "duplicate"],
      key: "reg.msgDuplicate"
    },
    {
      keys: ["invalid or expired", "verification code", "code expired", "invalid code"],
      en: "Invalid or expired verification code.",
      ar: "كود التفعيل غير صحيح أو انتهت صلاحيته."
    },
    {
      keys: ["current password is incorrect", "old password"],
      en: "Current password is incorrect.",
      ar: "كلمة السر الحالية غير صحيحة."
    },
    {
      keys: ["at least 8 characters", "password must be at least 8", "uppercase, lowercase", "special character"],
      key: "reg.msgWeakPwd"
    },
    {
      keys: ["passwords do not match", "not match"],
      en: "Passwords do not match.",
      ar: "كلمتا السر غير متطابقتين."
    },
    {
      keys: ["cannot change another admin", "cannot modify admin"],
      en: "Cannot change another Admin's password.",
      ar: "لا يمكنك تغيير كلمة سر أدمن آخر."
    },
    {
      keys: ["ليس لديك صلاحية", "must be admin or creator", "admin or creator", "forbidden", "403"],
      en: "Incorrect email or password.",
      ar: "البريد الإلكتروني أو كلمة السر غير صحيحة."
    }
  ];

  const KokI18n = {
    getLang() {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "ar" || saved === "en") return saved;
      localStorage.setItem(LANG_KEY, "en");
      return "en";
    },
    isAr() {
      return this.getLang() === "ar";
    },
    t(key) {
      const lang = this.getLang();
      return DICT[lang]?.[key] ?? DICT.en[key] ?? key;
    },
    translateError(error) {
      const lang = this.getLang();
      if (error?.code === "NETWORK_ERROR") return this.t("login.msgNetwork");
      if (error?.code === "SECURE_CONTEXT_REQUIRED") return this.t("login.msgSecure");

      const raw = typeof error === "string" ? error : (error?.message || "");
      const lower = String(raw).trim().toLowerCase();

      for (const item of ERROR_PATTERNS) {
        if (item.keys.some((k) => lower.includes(k))) {
          return item.key ? this.t(item.key) : item[lang];
        }
      }

      if (error?.code === "INVALID_CREDENTIALS") return this.t("login.msgInvalidCreds");
      return raw || this.t("login.msgGeneric");
    },
    apply(root = document) {
      const lang = this.getLang();
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

      root.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = this.t(el.dataset.i18n);
      });
      root.querySelectorAll("[data-i18n-ph]").forEach((el) => {
        el.placeholder = this.t(el.dataset.i18nPh);
      });
      root.querySelectorAll("[data-i18n-label]").forEach((el) => {
        el.setAttribute("aria-label", this.t(el.dataset.i18nLabel));
      });
    },
    setLang(lang) {
      localStorage.setItem(LANG_KEY, lang === "ar" ? "ar" : "en");
      this.apply();
      window.dispatchEvent(new CustomEvent("kok:langchange", { detail: { lang: this.getLang() } }));
    },
    toggleLang() {
      this.setLang(this.isAr() ? "en" : "ar");
    }
  };

  window.KokI18n = KokI18n;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => KokI18n.apply());
  } else {
    KokI18n.apply();
  }
})();