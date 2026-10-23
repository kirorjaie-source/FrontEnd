"use strict";

/* ============================================================
   script.js — صفحة البداية وإنشاء الحساب (index.html)
   مربوط مباشرة مع C# API عبر window.Api.auth.register
   ============================================================ */

const $ = (id) => document.getElementById(id);

const translations = {
  "en": {
    "eyebrow": "LEARN • PLAY • GROW",
    "welcome": "Create Your Account",
    "intro": "Create your account and grow together in faith.",
    "nameLabel": "Your name",
    "emailLabel": "Email address",
    "passwordLabel": "Password",
    "roleLabel": "Choose Your Role",
    "creator": "Creator",
    "creatorDesc": "Create quizzes",
    "player": "Player",
    "playerDesc": "Play quizzes",
    "createAccount": "Create Account",
    "loginPrompt": "Already have an account?",
    "login": "Log in",
    "showPassword": "Show password",
    "hidePassword": "Hide password",
    "nameRequired": "Please enter your name.",
    "emailRequired": "Please enter a valid email address.",
    "passwordRequired": "Please enter a password.",
    "roleRequired": "Please select Creator or Player.",
    "duplicateEmail": "You already have an account. Please log in.",
    "accountCreated": "Account created successfully! Redirecting to login...",
    "creatorPending": "Account created! Your Creator request is waiting for Admin approval.",
    "registrationError": "Could not create your account. Check server connection."
  },
  "ar": {
    "eyebrow": "اتعلّم • العب • انمُ",
    "welcome": "إنشاء حساب جديد",
    "intro": "أنشئ حسابك وابدأ رحلتك في Church Quiz.",
    "nameLabel": "الاسم",
    "emailLabel": "البريد الإلكتروني",
    "passwordLabel": "كلمة المرور",
    "roleLabel": "اختار نوع الحساب",
    "creator": "Creator",
    "creatorDesc": "إنشاء الاختبارات",
    "player": "Player",
    "playerDesc": "حل الاختبارات",
    "createAccount": "إنشاء الحساب",
    "loginPrompt": "لديك حساب بالفعل؟",
    "login": "تسجيل الدخول",
    "showPassword": "إظهار كلمة المرور",
    "hidePassword": "إخفاء كلمة المرور",
    "nameRequired": "من فضلك اكتب اسمك.",
    "emailRequired": "من فضلك اكتب بريدًا إلكترونيًا صحيحًا.",
    "passwordRequired": "من فضلك اكتب كلمة المرور.",
    "roleRequired": "من فضلك اختار Creator أو Player.",
    "duplicateEmail": "لديك حساب بالفعل، برجاء تسجيل الدخول.",
    "accountCreated": "تم إنشاء الحساب بنجاح! جاري التوجيه لصفحة الدخول...",
    "creatorPending": "تم إنشاء الحساب! طلب Creator في انتظار موافقة Admin.",
    "registrationError": "تعذر إنشاء الحساب. تأكد من تشغيل السيرفر."
  }
};

let language = "en";
let toastTimeout = null;

function showToast(message) {
  const toast = $("toast");
  if (!toast) { alert(message); return; }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

function showAuthMessage(message, type = "error") {
  const box = $("authMessage");
  if (!box) { showToast(message); return; }
  box.textContent = message;
  box.className = `auth-message show ${type}`;
  box.style.color = type === "success" ? "#7CDAA0" : "#ff6b6b";
}

function initializePasswordToggle() {
  const passwordField = $("password");
  const toggleButton = $("togglePassword");
  if (!passwordField || !toggleButton) return;
  if (toggleButton.dataset.initialized === "true") return;
  toggleButton.dataset.initialized = "true";

  toggleButton.addEventListener("click", () => {
    const show = passwordField.type === "password";
    passwordField.type = show ? "text" : "password";
    const text = translations[language];
    toggleButton.setAttribute("aria-label", show ? text.hidePassword : text.showPassword);
    toggleButton.setAttribute("aria-pressed", String(show));
  });
}

function initializeRegistration() {
  const registerForm = $("registerForm");
  const fullNameInput = $("fullName");
  const emailInput = $("email");
  const passwordInput = $("password");

  if (!registerForm || !fullNameInput || !emailInput || !passwordInput || !$("authMessage")) return;
  if (registerForm.dataset.registrationInitialized === "true") return;
  registerForm.dataset.registrationInitialized = "true";

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showAuthMessage("", "success");

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const selectedRole = registerForm.querySelector('input[name="requestedRole"]:checked');
    const t = translations[language];

    // التحقق من صحة المدخلات
    if (!fullName) { showAuthMessage(t.nameRequired); fullNameInput.focus(); return; }
    if (!emailInput.validity.valid || !email) { showAuthMessage(t.emailRequired); emailInput.focus(); return; }
    if (!password) { showAuthMessage(t.passwordRequired); passwordInput.focus(); return; }
    if (password.length < 6) {
      showAuthMessage(language === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل." : "Password must be at least 6 characters.");
      passwordInput.focus();
      return;
    }
    if (!selectedRole) { showAuthMessage(t.roleRequired); return; }

    const submitButton = $("register_btn");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = language === "ar" ? "جاري إنشاء الحساب..." : "Creating Account...";
    }

    try {
      // إرسال الطلب عبر طبقة Api الموحدة
      await window.Api.auth.register({
        fullName,
        email,
        password,
        requestedRole: selectedRole.value
      });

      const successMsg = selectedRole.value === "Creator" ? t.creatorPending : t.accountCreated;
      showAuthMessage(successMsg, "success");

      // التوجيه لصفحة تسجيل الدخول تلقائياً بعد ثانية ونصف
      setTimeout(() => {
        window.location.href = "loginn.html";
      }, 1600);

    } catch (error) {
      console.error("Registration failed:", error);

      if (error.code === "DUPLICATE_EMAIL") {
        showAuthMessage(t.duplicateEmail);
        emailInput.focus();
      } else if (error.code === "NETWORK_ERROR") {
        showAuthMessage(language === "ar" ? "تعذر الاتصال بالسيرفر. تأكد من تشغيل الباك إند." : "Network Error. Make sure backend is running.");
      } else {
        showAuthMessage(error.message || t.registrationError);
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `${t.createAccount} <span>→</span>`;
      }
    }
  });
}

function applyLanguage() {
  const t = translations[language];

  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

  if ($("eyebrow")) $("eyebrow").textContent = t.eyebrow;
  if ($("welcome_title")) $("welcome_title").textContent = t.welcome;
  if ($("welcome_text")) $("welcome_text").textContent = t.intro;
  if ($("register_btn")) $("register_btn").innerHTML = `${t.createAccount} <span>→</span>`;
  if ($("language_btn")) $("language_btn").textContent = language === "en" ? "عربي / EN" : "EN / عربي";

  const formLabels = document.querySelectorAll("#registerForm > label");
  if (formLabels.length >= 3) {
    formLabels[0].textContent = `${t.nameLabel} *`;
    formLabels[1].textContent = `${t.emailLabel} *`;
    formLabels[2].textContent = `${t.passwordLabel} *`;
  }

  const roleHeading = document.querySelector(".role-heading");
  if (roleHeading) roleHeading.textContent = `${t.roleLabel} *`;

  const roleOptions = document.querySelectorAll(".role-option");
  if (roleOptions.length >= 2) {
    const set = (el, sel, text) => { const n = el.querySelector(sel); if (n) n.textContent = text; };
    set(roleOptions[0], "strong", t.creator);
    set(roleOptions[0], "small", t.creatorDesc);
    set(roleOptions[1], "strong", t.player);
    set(roleOptions[1], "small", t.playerDesc);
  }

  const loginLink = document.querySelector(".login-link");
  if (loginLink) loginLink.innerHTML = `${t.loginPrompt} <a href="loginn.html">${t.login}</a>`;

  if ($("togglePassword")) {
    $("togglePassword").setAttribute("aria-label", $("password")?.type === "password" ? t.showPassword : t.hidePassword);
  }
}

function toggleLanguage() {
  language = language === "en" ? "ar" : "en";
  applyLanguage();
}

function initializeApp() {
  initializePasswordToggle();
  initializeRegistration();
  $("language_btn")?.addEventListener("click", toggleLanguage);
  applyLanguage();
}

document.addEventListener("DOMContentLoaded", initializeApp);