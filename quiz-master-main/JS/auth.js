"use strict";

/* ============================================================
   register.js — إنشاء حساب جديد
   مربوط مباشرة بالباك إند عبر Api.auth.register
   ============================================================ */

const registerForm = document.getElementById("registerForm");
const passwordField = document.getElementById("password");
const passwordToggle = document.getElementById("togglePassword");
const authMessage = document.getElementById("authMessage");

function showMessage(message, type = "error") {
  if (!authMessage) return;

  authMessage.textContent = message;
  authMessage.className = `auth-message show ${type}`;
}

// إظهار / إخفاء كلمة المرور
if (passwordField && passwordToggle) {
  passwordToggle.addEventListener("click", () => {
    const show = passwordField.type === "password";
    passwordField.type = show ? "text" : "password";

    passwordToggle.setAttribute(
      "aria-label",
      show ? "Hide password" : "Show password"
    );

    passwordToggle.setAttribute("aria-pressed", String(show));
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");

    const fullName = fullNameInput ? fullNameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const password = passwordField ? passwordField.value : "";

    const requestedRole = registerForm.querySelector(
      'input[name="requestedRole"]:checked'
    )?.value;

    // التحقق من المدخلات الأساسية
    if (!fullName || !email || !password) {
      showMessage("من فضلك املأ كل البيانات المطلوب.");
      return;
    }

    if (!requestedRole) {
      showMessage("من فضلك اختر نوع الحساب (Creator أو Player).");
      return;
    }

    if (!["Creator", "Player"].includes(requestedRole)) {
      showMessage("اختيار نوع الحساب غير صحيح.");
      return;
    }

    try {
      showMessage("جاري الاتصال بالسيرفر وإنشاء الحساب...", "info");

      // إرسال الطلب إلى C# API عبر طبقة Api الموحدة
      await window.Api.auth.register({
        fullName: fullName,
        email: email,
        password: password,
        requestedRole: requestedRole
      });

      showMessage(
        requestedRole === "Creator"
          ? "تم إنشاء الحساب بنجاح! طلب Creator يحتاج لموافقة Admin."
          : "تم إنشاء حسابك بنجاح! جاري التوجيه لصفحة الدخول...",
        "success"
      );

      // التوجيه لصفحة تسجيل الدخول تلقائياً بعد ثانية ونصف
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (error) {
      console.error("Registration Error:", error);
      const errorText = error.message || "حدث خطأ أثناء إنشاء الحساب. تأكد من تشغيل الباك إند.";
      showMessage(errorText, "error");
    }
  });
}