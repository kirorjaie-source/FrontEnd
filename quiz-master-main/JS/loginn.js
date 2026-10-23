"use strict";

/* ============================================================
   loginn.js — تسجيل الدخول عن طريق Api.auth الموحدة
   ============================================================ */

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginMessage = document.getElementById("loginMessage");
const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

function showMessage(message, type) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.className = `message ${type}`;
}

// إظهار وإخفاء كلمة المرور
if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("", "");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
      showMessage("من فضلك ادخل الإيميل والباسورد.", "error");
      return;
    }

    try {
      // تعطيل الزر مؤقتاً أثناء الاتصال بالسيرفر
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = "جاري التحقق...";
      }

      showMessage("جاري الاتصال بالسيرفر...", "info");

      // استدعاء Api.auth.login المربوط بالباك إند
      await window.Api.auth.login(email, password);

      showMessage("تم تسجيل الدخول بنجاح! جاري التحويل...", "success");

      // التوجيه لصفحة لوحة التحكم (admin.html)
      setTimeout(() => {
        window.location.href = "adminn.html";
      }, 500);

    } catch (error) {
      console.error("Login Error:", error);

      // إعادة تفعيل الزر عند حدوث خطأ
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || "Sign In";
      }

      // معالجة تفصيلية لأنواع الأخطاء
      if (error.code === "INVALID_CREDENTIALS") {
        showMessage("الإيميل أو الباسورد غير صحيح.", "error");
      } else if (error.code === "NETWORK_ERROR") {
        showMessage("تعذر الاتصال بالسيرفر. تأكد من تشغيل الباك إند (C# API).", "error");
      } else if (error.code === "SECURE_CONTEXT_REQUIRED") {
        showMessage("شغّل الموقع باستخدام Live Server ثم جرّب مرة أخرى.", "error");
      } else {
        showMessage(error.message || "حصلت مشكلة أثناء تسجيل الدخول. حاول مرة أخرى.", "error");
      }
    }
  });
}