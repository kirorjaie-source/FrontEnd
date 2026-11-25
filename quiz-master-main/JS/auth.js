"use strict";

/* ============================================================
   Register.js — إنشاء حساب جديد مع الترجمة والتحقق الكامل
   ============================================================ */

const registerForm = document.getElementById("registerForm");
const passwordField = document.getElementById("password");
const passwordToggle = document.getElementById("togglePassword");
const authMessage = document.getElementById("authMessage");
const registerBtn = document.getElementById("register_btn");

const chipLen = document.getElementById("chipLen");
const chipUpper = document.getElementById("chipUpper");
const chipLower = document.getElementById("chipLower");
const chipDigit = document.getElementById("chipDigit");
const chipSpecial = document.getElementById("chipSpecial");

let lastMsgKey = "";
let lastRawError = null;
let lastMsgType = "";

function t(key) {
  return window.KokI18n ? KokI18n.t(key) : key;
}

function showMessage(message, type = "error", msgKey = "", rawError = null) {
  if (!authMessage) return;
  lastMsgKey = msgKey;
  lastRawError = rawError;
  lastMsgType = type;

  if (!message) {
    authMessage.textContent = "";
    authMessage.className = "auth-message";
    return;
  }
  authMessage.textContent = message;
  authMessage.className = `auth-message show ${type}`;
}

function checkPasswordStrength(pwd) {
  const okLen = pwd.length >= 8;
  const okUpper = /[A-Z]/.test(pwd);
  const okLower = /[a-z]/.test(pwd);
  const okDigit = /[0-9]/.test(pwd);
  const okSpecial = /[^A-Za-z0-9]/.test(pwd);

  chipLen?.classList.toggle("ok", okLen);
  chipUpper?.classList.toggle("ok", okUpper);
  chipLower?.classList.toggle("ok", okLower);
  chipDigit?.classList.toggle("ok", okDigit);
  chipSpecial?.classList.toggle("ok", okSpecial);

  return okLen && okUpper && okLower && okDigit && okSpecial;
}

passwordField?.addEventListener("input", () => {
  checkPasswordStrength(passwordField.value);
});

// مزامنة زرار اللغة الأساسي (من scriptn.js) مع نظام KokI18n
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || btn.id === "togglePassword" || btn.type === "submit") return;
  const txt = (btn.textContent || "").trim();
  if (txt.includes("العربية") || txt.includes("English")) {
    setTimeout(() => {
      const docLang = document.documentElement.lang === "ar" ? "ar" : "en";
      if (window.KokI18n && KokI18n.getLang() !== docLang) {
        KokI18n.setLang(docLang);
      }
    }, 0);
  }
});

window.addEventListener("kok:langchange", () => {
  document.title = KokI18n.isAr() ? "إنشاء حساب جديد | كوك كويز" : "Create Account | Kokquiz";
  if (registerBtn && !registerBtn.disabled) {
    registerBtn.textContent = t("reg.submit");
  }
  if (lastMsgKey) {
    showMessage(t(lastMsgKey), lastMsgType, lastMsgKey, null);
  } else if (lastRawError) {
    showMessage(KokI18n.translateError(lastRawError), lastMsgType, "", lastRawError);
  }
});

// إظهار / إخفاء كلمة المرور
if (passwordField && passwordToggle) {
  passwordToggle.addEventListener("click", () => {
    const show = passwordField.type === "password";
    passwordField.type = show ? "text" : "password";
    passwordToggle.setAttribute("aria-label", t(show ? "login.hidePwd" : "login.showPwd"));
    passwordToggle.setAttribute("aria-pressed", String(show));
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    showMessage("", "");

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");

    const fullName = fullNameInput ? fullNameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const password = passwordField ? passwordField.value : "";
    const requestedRole = registerForm.querySelector('input[name="requestedRole"]:checked')?.value || "Creator";

    if (!fullName || !email || !password) {
      showMessage(t("reg.msgEmpty"), "error", "reg.msgEmpty");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(t("reg.msgInvalidEmail"), "error", "reg.msgInvalidEmail");
      emailInput?.focus();
      return;
    }

    if (!checkPasswordStrength(password)) {
      showMessage(t("reg.msgWeakPwd"), "error", "reg.msgWeakPwd");
      passwordField?.focus();
      return;
    }

    try {
      if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.textContent = t("reg.submitting");
      }

      showMessage(t("reg.msgConnecting"), "info", "reg.msgConnecting");

      await window.Api.auth.register({
        fullName,
        email,
        password,
        requestedRole
      });

      sessionStorage.setItem("verifyEmail", email);
      localStorage.setItem("verifyEmail", email);

      showMessage(t("reg.msgSuccess"), "success", "reg.msgSuccess");

      setTimeout(() => {
        window.location.href = `verify-email.html?email=${encodeURIComponent(email)}`;
      }, 1200);

    } catch (error) {
      console.error("Registration Error:", error);

      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = t("reg.submit");
      }

      const translated = window.KokI18n
        ? KokI18n.translateError(error)
        : (error.message || t("reg.msgGeneric"));

      showMessage(translated, "error", "", error);
    }
  }, true);
}