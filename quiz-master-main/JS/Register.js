"use strict";

(function () {
  const registerForm = document.getElementById("registerForm");
  const passwordField = document.getElementById("password");
  const passwordToggle = document.getElementById("togglePassword");
  const authMessage = document.getElementById("authMessage");
  const VERIFY_PAGE = "verify-emailn.html";
  const ROLE = "Creator";

  function showError(message) {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.className = "auth-message show error";
  }

  function hideMessage() {
    if (!authMessage) return;
    authMessage.textContent = "";
    authMessage.className = "auth-message";
  }

  if (passwordField && passwordToggle) {
    passwordToggle.addEventListener("click", () => {
      const show = passwordField.type === "password";
      passwordField.type = show ? "text" : "password";
      passwordToggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      passwordToggle.setAttribute("aria-pressed", String(show));
    });
  }

  if (!registerForm) return;

  document.addEventListener("submit", async (event) => {
    if (event.target !== registerForm) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    hideMessage();

    const fullName = (document.getElementById("fullName")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim().toLowerCase();
    const password = passwordField ? passwordField.value : "";

    if (!fullName || !email || !password) {
      showError("من فضلك املأ كل البيانات المطلوبة.");
      return;
    }

    const btn = document.getElementById("register_btn");
    if (btn) btn.disabled = true;

    try {
      await window.Api.auth.register({ fullName, email, password, requestedRole: ROLE });

      sessionStorage.setItem("kokPendingEmail", email);
      sessionStorage.setItem("verifyEmail", email);
      localStorage.setItem("verifyEmail", email);
      localStorage.setItem(`kokResendAt:${email}`, String(Date.now()));

      // تحويل فوري بدون انتظار
      window.location.href = `${VERIFY_PAGE}?email=${encodeURIComponent(email)}`;
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء إنشاء الحساب.");
      if (btn) btn.disabled = false;
    }
  }, true);
})();