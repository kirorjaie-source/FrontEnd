"use strict";

/* ============================================================
   loginn.js — تسجيل الدخول مع رسائل مترجمة (عربي / English)
   ============================================================ */

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginMessage = document.getElementById("loginMessage");
const langToggleBtn = document.getElementById("langToggleBtn");
const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

let lastMsgKey = "";
let lastRawError = null;
let lastMsgType = "";

function t(key) {
  return window.KokI18n ? KokI18n.t(key) : key;
}

function showMessage(message, type, msgKey = "", rawError = null) {
  if (!loginMessage) return;
  lastMsgKey = msgKey;
  lastRawError = rawError;
  lastMsgType = type;
  loginMessage.textContent = message;
  loginMessage.className = type ? `message ${type}` : "message";
}

if (langToggleBtn) {
  langToggleBtn.addEventListener("click", () => {
    if (window.KokI18n) KokI18n.toggleLang();
  });
}

window.addEventListener("kok:langchange", () => {
  document.title = KokI18n.isAr() ? "تسجيل الدخول | كوك كويز" : "Sign In | Kokquiz";
  if (submitBtn && !submitBtn.disabled) {
    submitBtn.textContent = t("login.submit");
  }
  if (lastMsgKey) {
    showMessage(t(lastMsgKey), lastMsgType, lastMsgKey, null);
  } else if (lastRawError) {
    showMessage(KokI18n.translateError(lastRawError), lastMsgType, "", lastRawError);
  }
});

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.setAttribute("aria-label", t(isHidden ? "login.hidePwd" : "login.showPwd"));
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("", "");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
      showMessage(t("login.msgEmpty"), "error", "login.msgEmpty");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(t("login.msgInvalidEmail"), "error", "login.msgInvalidEmail");
      emailInput?.focus();
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = t("login.submitting");
      }

      showMessage(t("login.msgConnecting"), "info", "login.msgConnecting");

      await window.Api.auth.login(email, password);

      showMessage(t("login.msgSuccess"), "success", "login.msgSuccess");

      setTimeout(() => {
        window.location.href = "adminn.html";
      }, 500);

    } catch (error) {
      console.error("Login Error:", error);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = t("login.submit");
      }

      const translated = window.KokI18n
        ? KokI18n.translateError(error)
        : (error.message || "Login failed.");

      showMessage(translated, "error", "", error);
    }
  });
}