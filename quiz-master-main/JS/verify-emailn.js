"use strict";

/* ===========================================================================
   verify-emailn.js — صفحة تأكيد البريد الإلكتروني (6 أرقام)
   مربوطة بـ Api.auth.confirmEmail و Api.auth.resendCode
   =========================================================================== */
(function () {
  const $ = (id) => document.getElementById(id);
  const LOGIN_PAGE = "loginn.html";
  const REGISTER_PAGE = "indexn.html";
  const RESEND_SECONDS = 60;
  const CODE_LENGTH = 6;

  const params = new URLSearchParams(location.search);
  let email = (
    params.get("email") ||
    sessionStorage.getItem("kokPendingEmail") ||
    sessionStorage.getItem("verifyEmail") ||
    localStorage.getItem("verifyEmail") ||
    ""
  ).trim().toLowerCase();

  if (!email) {
    location.replace(REGISTER_PAGE);
    return;
  }

  try {
    sessionStorage.setItem("kokPendingEmail", email);
    sessionStorage.setItem("verifyEmail", email);
  } catch { /* ignore */ }

  const boxes = [...document.querySelectorAll("#otp input")];
  const msg = $("msg");
  const verifyBtn = $("btn-verify");
  const resendBtn = $("btn-resend");

  const T = (key) => (window.I18n ? I18n.t(key) : key);

  function maskEmail(value) {
    const [local, domain] = value.split("@");
    if (!domain) return value;
    return `${local.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(5, local.length - 1)))}@${domain}`;
  }

  const emailShown = $("email-shown");
  if (emailShown) emailShown.textContent = maskEmail(email);

  function show(text, state) {
    if (!msg) return;
    msg.textContent = text ? T(text) : "";
    msg.dataset.state = text ? state : "";
  }

  const getCode = () => boxes.map((b) => b.value).join("");
  const clearBoxes = () => {
    boxes.forEach((b) => { b.value = ""; });
    if (boxes[0]) boxes[0].focus();
  };

  /* ---------------- خانات الكود ---------------- */
  boxes.forEach((box, i) => {
    box.addEventListener("input", () => {
      box.value = box.value.replace(/\D/g, "").slice(-1);
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      if (getCode().length === CODE_LENGTH) submit();
    });

    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !box.value && i > 0) {
        boxes[i - 1].focus();
        boxes[i - 1].value = "";
      } else if (e.key === "ArrowLeft" && i > 0) {
        boxes[i - 1].focus();
      } else if (e.key === "ArrowRight" && i < boxes.length - 1) {
        boxes[i + 1].focus();
      } else if (e.key === "Enter") {
        submit();
      }
    });

    box.addEventListener("focus", () => box.select());

    box.addEventListener("paste", (e) => {
      const digits = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, CODE_LENGTH);
      if (!digits) return;
      e.preventDefault();
      boxes.forEach((b, j) => { b.value = digits[j] || ""; });
      boxes[Math.min(digits.length, boxes.length - 1)].focus();
      if (digits.length === CODE_LENGTH) submit();
    });
  });

  /* ---------------- التأكيد ---------------- */
  let busy = false;
  async function submit() {
    if (busy) return;
    const code = getCode();
    if (code.length !== CODE_LENGTH) {
      show("Enter the 6-digit code.", "error");
      return;
    }

    busy = true;
    if (verifyBtn) verifyBtn.disabled = true;
    show("Verifying...", "info");

    try {
      await Api.auth.confirmEmail(email, code);
      show("Email verified! Redirecting to login...", "success");
      sessionStorage.removeItem("kokPendingEmail");
      sessionStorage.removeItem("verifyEmail");
      localStorage.removeItem("verifyEmail");
      setTimeout(() => { location.href = LOGIN_PAGE; }, 1300);
    } catch (err) {
      console.error("confirm failed:", err);
      if (err.code === "HTTP_429") {
        show("Too many attempts. Try again later.", "error");
      } else if (err.code === "NETWORK_ERROR") {
        show(err.message, "error");
      } else {
        show(err.message || "Invalid or expired code.", "error");
      }

      const otp = $("otp");
      if (otp) {
        otp.classList.remove("vf-shake");
        void otp.offsetWidth;
        otp.classList.add("vf-shake");
      }
      clearBoxes();
      busy = false;
      if (verifyBtn) verifyBtn.disabled = false;
    }
  }

  if (verifyBtn) verifyBtn.addEventListener("click", submit);

  /* ---------------- إعادة الإرسال ---------------- */
  const stampKey = `kokResendAt:${email}`;
  let cooldownTimer = null;

  function secondsLeft() {
    const at = Number(localStorage.getItem(stampKey)) || 0;
    return Math.max(0, Math.ceil((at + RESEND_SECONDS * 1000 - Date.now()) / 1000));
  }

  function renderResend() {
    if (!resendBtn) return;
    const left = secondsLeft();
    resendBtn.disabled = left > 0;
    resendBtn.textContent = T(left > 0 ? `Resend in ${left}s` : "Resend code");
    if (left <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }

  function startCooldown() {
    renderResend();
    if (!cooldownTimer && secondsLeft() > 0) {
      cooldownTimer = setInterval(renderResend, 1000);
    }
  }

  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      if (secondsLeft() > 0) return;
      resendBtn.disabled = true;
      show("Sending code...", "info");

      try {
        await Api.auth.resendCode(email);
        localStorage.setItem(stampKey, String(Date.now()));
        startCooldown();
        show("Code sent again.", "success");
      } catch (err) {
        console.error("resend failed:", err);
        resendBtn.disabled = false;
        show(err.message || "Could not send the code. Try again.", "error");
      }
    });
  }

  document.addEventListener("kq:lang", () => { renderResend(); });
  startCooldown();
  if (boxes[0]) boxes[0].focus();
})();