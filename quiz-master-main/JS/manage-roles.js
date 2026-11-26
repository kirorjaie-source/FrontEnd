"use strict";

(function () {
  if (!window.Api || !Api.auth.requireLogin("loginn.html")) return;

  const API_BASE = (window.Api && Api.config && Api.config.API_BASE) || "https://localhost:7152/api";
  const isAr = () => localStorage.getItem("kokLang") === "ar";

  function getToken() {
    const s = Api.auth.getSession() || JSON.parse(localStorage.getItem("churchQuizSession") || "{}");
    return s.token || localStorage.getItem("token") || localStorage.getItem("churchQuizToken") || "";
  }

  function checkIsAdmin() {
    try {
      if (typeof Api.auth.isAdmin === "function") return Api.auth.isAdmin();
      const s = Api.auth.getSession() || JSON.parse(localStorage.getItem("churchQuizSession") || "{}");
      const token = getToken();
      let role = s.role || "";
      if (!role && token) {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        role = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
      }
      return String(role).toLowerCase() === "admin" || role === 0 || role === "0";
    } catch {
      return false;
    }
  }

  if (!checkIsAdmin()) {
    location.replace("adminn.html");
    return;
  }

  function friendlyMsg(raw) {
    if (window.KokI18n && typeof KokI18n.translateError === "function") {
      return KokI18n.translateError(raw);
    }
    const lower = String(raw || "").toLowerCase();
    if (lower.includes("invalid admin") || lower.includes("x-admin") || lower.includes("401") || lower.includes("403")) {
      return isAr() ? "مفتاح X-Admin غير صحيح." : "Invalid X-Admin key.";
    }
    if (lower.includes("user not found")) {
      return isAr() ? "البريد الإلكتروني غير موجود." : "User email not found.";
    }
    return raw || (isAr() ? "حدث خطأ غير متوقع." : "Something went wrong.");
  }

  async function apiFetchUsers() {
    if (typeof Api.auth.getUsers === "function") return Api.auth.getUsers();
    const res = await fetch(`${API_BASE}/Auth/users`, {
      headers: { Authorization: "Bearer " + getToken() }
    });
    if (!res.ok) throw new Error(`Server error (${res.status})`);
    return res.json();
  }

  async function apiUpdateRole(userId, newRole, adminKey = "") {
    if (!adminKey && typeof Api.auth.updateUserRole === "function") {
      return Api.auth.updateUserRole(userId, newRole);
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    };
    if (adminKey) headers["X-Admin"] = adminKey;

    const res = await fetch(`${API_BASE}/Auth/users/${userId}/role`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ role: Number(newRole) })
    });
    if (!res.ok) {
      let msg = res.status === 401 || res.status === 403
        ? (isAr() ? "مفتاح تأكيد الهوية (X-Admin) غير صحيح." : "Invalid X-Admin key.")
        : `Server error (${res.status})`;
      try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
      throw new Error(msg);
    }
  }

  async function apiUpdateVerification(userId, emailConfirmed) {
    const res = await fetch(`${API_BASE}/Auth/users/${userId}/verify`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken()
      },
      body: JSON.stringify({ emailConfirmed: Boolean(emailConfirmed) })
    });
    if (!res.ok) {
      let msg = `Server error (${res.status})`;
      try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
      throw new Error(msg);
    }
  }

  async function apiChangePassword(userId, newPassword) {
    const res = await fetch(`${API_BASE}/Auth/users/${userId}/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken()
      },
      body: JSON.stringify({ newPassword })
    });
    if (!res.ok) {
      let msg = `Server error (${res.status})`;
      try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
      throw new Error(msg);
    }
  }

  async function apiDeleteUser(userId, adminKey) {
    const res = await fetch(`${API_BASE}/Auth/users/${userId}`, {
      method: "DELETE",
      headers: {
        "X-Admin": adminKey,
        Authorization: "Bearer " + getToken()
      }
    });
    if (!res.ok) {
      let msg = res.status === 401 || res.status === 403
        ? (isAr() ? "مفتاح تأكيد الهوية (X-Admin) غير صحيح." : "Invalid X-Admin key.")
        : `Server error (${res.status})`;
      try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
      throw new Error(msg);
    }
  }

  async function apiSuperResetPassword(adminKey, email, newPassword) {
    const res = await fetch(`${API_BASE}/Auth/admin/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin": adminKey,
        Authorization: "Bearer " + getToken()
      },
      body: JSON.stringify({ email, newPassword })
    });
    if (!res.ok) {
      let msg = res.status === 401 || res.status === 403
        ? "Invalid X-Admin key."
        : `Server error (${res.status})`;
      try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
      throw new Error(msg);
    }
  }

  // =====================================================
  // ===== مودال تأكيد الهوية الاحترافي (X-Admin Key) =====
  // =====================================================
  function createVerifyModal() {
    const overlay = document.createElement("div");
    overlay.id = "xAdminVerifyModal";
    overlay.hidden = true;
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:9999; background:rgba(15,23,42,.62);
      backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:16px;
    `;
    overlay.innerHTML = `
      <div style="
        background:var(--card, #ffffff); color:var(--text, #0f172a);
        width:100%; max-width:420px; border-radius:20px; padding:24px;
        box-shadow:0 24px 60px rgba(0,0,0,.28); border:1px solid rgba(148,163,184,.22);
        font-family:inherit; position:relative; animation:popIn .18s ease-out;
      ">
        <button type="button" id="xAdminCloseX" style="
          position:absolute; top:14px; inset-inline-end:14px; width:32px; height:32px;
          border-radius:50%; border:none; background:rgba(148,163,184,.16);
          color:inherit; font-size:16px; cursor:pointer; display:grid; place-items:center;
        ">✕</button>

        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
          <div style="
            width:44px; height:44px; border-radius:14px; flex-shrink:0;
            background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff;
            display:grid; place-items:center; font-size:20px; box-shadow:0 8px 20px rgba(37,99,235,.3);
          ">🔐</div>
          <div>
            <h3 id="xAdminTitle" style="margin:0; font-size:17px; font-weight:800;"></h3>
            <p id="xAdminSubtitle" style="margin:3px 0 0; font-size:13px; opacity:.75;"></p>
          </div>
        </div>

        <form id="xAdminForm" style="margin-top:16px;">
          <label id="xAdminLabel" for="xAdminKeyInput" style="display:block; font-size:13px; font-weight:700; margin-bottom:6px;"></label>
          <div style="position:relative; display:flex; align-items:center;">
            <input
              id="xAdminKeyInput"
              type="password"
              autocomplete="off"
              style="
                width:100%; padding:11px 42px 11px 14px; border-radius:12px;
                border:1.5px solid rgba(148,163,184,.4); background:var(--bg, #f8fafc);
                color:inherit; font-size:14px; outline:none; transition:border-color .15s;
              "
            />
            <button type="button" id="xAdminToggleEye" title="Show/Hide" style="
              position:absolute; inset-inline-end:10px; background:none; border:none;
              cursor:pointer; font-size:16px; opacity:.7; padding:4px;
            ">👁</button>
          </div>

          <p id="xAdminErr" style="
            margin:8px 0 0; font-size:12.5px; font-weight:700; color:#dc2626; min-height:18px;
          "></p>

          <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px;">
            <button type="button" id="xAdminCancelBtn" style="
              padding:10px 18px; border-radius:12px; border:1px solid rgba(148,163,184,.35);
              background:transparent; color:inherit; font-weight:700; font-size:13.5px; cursor:pointer;
            "></button>
            <button type="submit" id="xAdminConfirmBtn" style="
              padding:10px 20px; border-radius:12px; border:none;
              background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff;
              font-weight:700; font-size:13.5px; cursor:pointer; box-shadow:0 6px 16px rgba(37,99,235,.28);
            "></button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement("style");
    style.textContent = `@keyframes popIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } } #xAdminVerifyModal[hidden]{ display:none !important; }`;
    document.head.appendChild(style);
    return overlay;
  }

  const verifyOverlay = createVerifyModal();
  const xAdminTitle = document.getElementById("xAdminTitle");
  const xAdminSubtitle = document.getElementById("xAdminSubtitle");
  const xAdminLabel = document.getElementById("xAdminLabel");
  const xAdminKeyInput = document.getElementById("xAdminKeyInput");
  const xAdminToggleEye = document.getElementById("xAdminToggleEye");
  const xAdminErr = document.getElementById("xAdminErr");
  const xAdminCancelBtn = document.getElementById("xAdminCancelBtn");
  const xAdminCloseX = document.getElementById("xAdminCloseX");
  const xAdminConfirmBtn = document.getElementById("xAdminConfirmBtn");
  const xAdminForm = document.getElementById("xAdminForm");

  let activeVerifyHandler = null;
  let activeCancelHandler = null;

  function closeVerifyModal(cancelled = false) {
    verifyOverlay.hidden = true;
    xAdminKeyInput.value = "";
    xAdminErr.textContent = "";
    xAdminConfirmBtn.disabled = false;
    const cancelCb = activeCancelHandler;
    activeVerifyHandler = null;
    activeCancelHandler = null;
    if (cancelled && typeof cancelCb === "function") cancelCb();
  }

  xAdminToggleEye.addEventListener("click", () => {
    xAdminKeyInput.type = xAdminKeyInput.type === "password" ? "text" : "password";
  });
  xAdminKeyInput.addEventListener("input", () => { xAdminErr.textContent = ""; });
  xAdminCancelBtn.addEventListener("click", () => closeVerifyModal(true));
  xAdminCloseX.addEventListener("click", () => closeVerifyModal(true));
  verifyOverlay.addEventListener("click", (e) => { if (e.target === verifyOverlay) closeVerifyModal(true); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !verifyOverlay.hidden) closeVerifyModal(true);
  });

  xAdminForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = xAdminKeyInput.value.trim();
    if (!key) {
      xAdminErr.textContent = isAr() ? "من فضلك أدخل مفتاح X-Admin السري." : "Please enter the secret X-Admin key.";
      xAdminKeyInput.focus();
      return;
    }
    if (!activeVerifyHandler) return;

    xAdminConfirmBtn.disabled = true;
    const origText = xAdminConfirmBtn.textContent;
    xAdminConfirmBtn.textContent = isAr() ? "جاري التحقق..." : "Verifying...";
    xAdminErr.textContent = "";

    try {
      await activeVerifyHandler(key);
      closeVerifyModal(false);
    } catch (err) {
      xAdminErr.textContent = friendlyMsg(err.message);
      xAdminKeyInput.focus();
      xAdminKeyInput.select();
    } finally {
      xAdminConfirmBtn.disabled = false;
      xAdminConfirmBtn.textContent = origText;
    }
  });

  /**
   * يفتح مودال تأكيد الهوية وينفذ العملية المطلوبة بالمفتاح المدخل.
   * إذا كان المفتاح خاطئاً يبقى المودال مفتوحاً ويعرض الخطأ داخله.
   */
  function openIdentityVerifyModal({ title, subtitle, danger = false, confirmText, onConfirm, onCancel }) {
    xAdminTitle.textContent = title;
    xAdminSubtitle.textContent = subtitle;
    xAdminLabel.textContent = isAr() ? "مفتاح X-Admin السري" : "Secret X-Admin Key";
    xAdminKeyInput.placeholder = isAr() ? "أدخل مفتاح الأدمن السري..." : "Enter secret admin key...";
    xAdminKeyInput.value = "";
    xAdminKeyInput.type = "password";
    xAdminErr.textContent = "";
    xAdminCancelBtn.textContent = isAr() ? "إلغاء" : "Cancel";
    xAdminConfirmBtn.textContent = confirmText || (isAr() ? "تأكيد" : "Confirm");
    xAdminConfirmBtn.style.background = danger
      ? "linear-gradient(135deg, #ef4444, #dc2626)"
      : "linear-gradient(135deg, #2563eb, #1d4ed8)";
    xAdminConfirmBtn.style.boxShadow = danger
      ? "0 6px 16px rgba(239,68,68,.3)"
      : "0 6px 16px rgba(37,99,235,.28)";

    activeVerifyHandler = onConfirm;
    activeCancelHandler = onCancel;
    verifyOverlay.hidden = false;
    setTimeout(() => xAdminKeyInput.focus(), 30);
  }

  // =====================================================
  const tbody = document.getElementById("usersBody");
  const searchInput = document.getElementById("searchUser");
  const statusMsg = document.getElementById("statusMsg");

  // مودال تغيير باسورد المستخدم العادي
  const pwdModal = document.getElementById("pwdModal");
  const pwdModalUser = document.getElementById("pwdModalUser");
  const pwdForm = document.getElementById("pwdForm");
  const newPwdInput = document.getElementById("newPwdInput");
  const confirmPwdInput = document.getElementById("confirmPwdInput");
  const togglePwdBtn = document.getElementById("togglePwdBtn");
  const cancelPwdBtn = document.getElementById("cancelPwdBtn");
  const closePwdXBtn = document.getElementById("closePwdXBtn");
  const savePwdBtn = document.getElementById("savePwdBtn");
  const pwdModalErr = document.getElementById("pwdModalErr");

  // مودال Super Reset (X-Admin)
  const openSuperResetBtn = document.getElementById("openSuperResetBtn");
  const superModal = document.getElementById("superModal");
  const superForm = document.getElementById("superForm");
  const superAdminKey = document.getElementById("superAdminKey");
  const toggleSuperKeyBtn = document.getElementById("toggleSuperKeyBtn");
  const superEmailInput = document.getElementById("superEmailInput");
  const allUsersEmails = document.getElementById("allUsersEmails");
  const superNewPwd = document.getElementById("superNewPwd");
  const toggleSuperPwdBtn = document.getElementById("toggleSuperPwdBtn");
  const superConfirmPwd = document.getElementById("superConfirmPwd");
  const cancelSuperBtn = document.getElementById("cancelSuperBtn");
  const closeSuperXBtn = document.getElementById("closeSuperXBtn");
  const saveSuperBtn = document.getElementById("saveSuperBtn");
  const superModalErr = document.getElementById("superModalErr");

  let allUsers = [];
  let selectedUserForPwd = null;

  function validateStrength(pwd, ids) {
    const checks = {
      len: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      digit: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd)
    };
    document.getElementById(ids.len)?.classList.toggle("valid", checks.len);
    document.getElementById(ids.upper)?.classList.toggle("valid", checks.upper);
    document.getElementById(ids.lower)?.classList.toggle("valid", checks.lower);
    document.getElementById(ids.digit)?.classList.toggle("valid", checks.digit);
    document.getElementById(ids.special)?.classList.toggle("valid", checks.special);
    return checks.len && checks.upper && checks.lower && checks.digit && checks.special;
  }

  const normalRuleIds = { len: "ruleLen", upper: "ruleUpper", lower: "ruleLower", digit: "ruleDigit", special: "ruleSpecial" };
  const superRuleIds = { len: "sRuleLen", upper: "sRuleUpper", lower: "sRuleLower", digit: "sRuleDigit", special: "sRuleSpecial" };

  function setStatus(text, type = "ok") {
    if (!statusMsg) return;
    if (!text) {
      statusMsg.className = "status-banner";
      statusMsg.textContent = "";
      return;
    }
    statusMsg.textContent = text;
    statusMsg.className = `status-banner show ${type}`;
  }

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function updateStats() {
    document.getElementById("countAll").textContent = allUsers.length;
    document.getElementById("countAdmin").textContent = allUsers.filter((u) => Number(u.role) === 0).length;
    document.getElementById("countCreator").textContent = allUsers.filter((u) => Number(u.role) === 2).length;
    if (allUsersEmails) {
      allUsersEmails.innerHTML = allUsers
        .map((u) => `<option value="${esc(u.email)}">${esc(u.userName)} (${Number(u.role) === 0 ? "Admin" : Number(u.role) === 2 ? "Creator" : "Player"})</option>`)
        .join("");
    }
  }

  function getFilteredUsers() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) =>
      String(u.userName || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q)
    );
  }

  function render(list) {
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7">No matching users found.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map((u) => {
      const initial = esc((u.userName || u.email || "?").trim().charAt(0).toUpperCase());
      const roleNum = Number(u.role);
      const isVerified = Boolean(u.emailConfirmed);
      const isTargetAdmin = roleNum === 0;

      const pwdCell = isTargetAdmin
        ? '<span class="pwd-protected" title="Use Super Reset with X-Admin Key">🔒 Protected</span>'
        : `<button type="button" class="pwd-btn" data-user-id="${u.id}">🔑 Reset</button>`;

      const deleteCell = isTargetAdmin
        ? '<span class="pwd-protected">—</span>'
        : `<button type="button" class="mini-btn danger delete-user-btn" data-user-id="${u.id}">🗑 ${isAr() ? "حذف" : "Delete"}</button>`;

      return `
        <tr>
          <td>${u.id}</td>
          <td>
            <div class="user-cell">
              <span class="user-avatar">${initial}</span>
              <span>${esc(u.userName)}</span>
            </div>
          </td>
          <td>${esc(u.email)}</td>
          <td>
            <button
              type="button"
              class="badge verify-btn ${isVerified ? "badge-ok" : "badge-no"}"
              data-user-id="${u.id}"
              data-verified="${isVerified ? "1" : "0"}"
              title="Click to toggle verification status"
            >
              ${isVerified ? "✓ Verified" : "✕ Unverified"}
            </button>
          </td>
          <td>
            <select class="role-select" data-user-id="${u.id}" data-role="${roleNum}">
              <option value="0" ${roleNum === 0 ? "selected" : ""}>Admin</option>
              <option value="1" ${roleNum === 1 ? "selected" : ""}>Player</option>
              <option value="2" ${roleNum === 2 ? "selected" : ""}>Creator</option>
            </select>
          </td>
          <td>${pwdCell}</td>
          <td>${deleteCell}</td>
        </tr>
      `;
    }).join("");
  }

  // ---- مودال تغيير باسورد المستخدم العادي ----
  function openPwdModal(user) {
    selectedUserForPwd = user;
    pwdModalUser.textContent = `${user.userName} (${user.email})`;
    newPwdInput.value = "";
    confirmPwdInput.value = "";
    newPwdInput.type = "password";
    confirmPwdInput.type = "password";
    pwdModalErr.textContent = "";
    validateStrength("", normalRuleIds);
    pwdModal.hidden = false;
    newPwdInput.focus();
  }

  function closePwdModal() {
    pwdModal.hidden = true;
    selectedUserForPwd = null;
  }

  newPwdInput?.addEventListener("input", () => {
    validateStrength(newPwdInput.value, normalRuleIds);
    pwdModalErr.textContent = "";
  });

  confirmPwdInput?.addEventListener("input", () => { pwdModalErr.textContent = ""; });

  togglePwdBtn?.addEventListener("click", () => {
    const next = newPwdInput.type === "password" ? "text" : "password";
    newPwdInput.type = next;
    confirmPwdInput.type = next;
  });

  cancelPwdBtn?.addEventListener("click", closePwdModal);
  closePwdXBtn?.addEventListener("click", closePwdModal);
  pwdModal?.addEventListener("click", (e) => { if (e.target === pwdModal) closePwdModal(); });

  pwdForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedUserForPwd) return;

    const pwd = newPwdInput.value;
    if (!validateStrength(pwd, normalRuleIds)) {
      pwdModalErr.textContent = isAr()
        ? "كلمة السر لا تحقق جميع الشروط المطلوبة."
        : "Password does not meet all security rules above.";
      return;
    }
    if (pwd !== confirmPwdInput.value) {
      pwdModalErr.textContent = isAr() ? "كلمتا السر غير متطابقتين." : "Passwords do not match.";
      return;
    }

    savePwdBtn.disabled = true;
    pwdModalErr.textContent = "";

    try {
      await apiChangePassword(selectedUserForPwd.id, pwd);
      const name = selectedUserForPwd.userName;
      closePwdModal();
      setStatus(isAr() ? `تم تحديث كلمة السر لـ ${name} ✓` : `Password updated for ${name} ✓`, "ok");
    } catch (err) {
      pwdModalErr.textContent = friendlyMsg(err.message);
    } finally {
      savePwdBtn.disabled = false;
    }
  });

  // ---- مودال Super Reset (X-Admin Key) ----
  function openSuperModal() {
    superAdminKey.value = "";
    superAdminKey.type = "password";
    superEmailInput.value = "";
    superNewPwd.value = "";
    superNewPwd.type = "password";
    superConfirmPwd.value = "";
    superConfirmPwd.type = "password";
    superModalErr.textContent = "";
    validateStrength("", superRuleIds);
    superModal.hidden = false;
    superAdminKey.focus();
  }

  function closeSuperModal() {
    superModal.hidden = true;
    superAdminKey.value = "";
  }

  openSuperResetBtn?.addEventListener("click", openSuperModal);
  cancelSuperBtn?.addEventListener("click", closeSuperModal);
  closeSuperXBtn?.addEventListener("click", closeSuperModal);
  superModal?.addEventListener("click", (e) => { if (e.target === superModal) closeSuperModal(); });

  toggleSuperKeyBtn?.addEventListener("click", () => {
    superAdminKey.type = superAdminKey.type === "password" ? "text" : "password";
  });

  toggleSuperPwdBtn?.addEventListener("click", () => {
    const next = superNewPwd.type === "password" ? "text" : "password";
    superNewPwd.type = next;
    superConfirmPwd.type = next;
  });

  superNewPwd?.addEventListener("input", () => {
    validateStrength(superNewPwd.value, superRuleIds);
    superModalErr.textContent = "";
  });

  superConfirmPwd?.addEventListener("input", () => { superModalErr.textContent = ""; });

  superForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = superAdminKey.value.trim();
    const email = superEmailInput.value.trim();
    const pwd = superNewPwd.value;

    if (!key) {
      superModalErr.textContent = isAr() ? "من فضلك أدخل مفتاح X-Admin." : "Please enter your X-Admin key.";
      superAdminKey.focus();
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      superModalErr.textContent = isAr() ? "من فضلك أدخل بريداً إلكترونياً صحيحاً." : "Please enter a valid email address.";
      superEmailInput.focus();
      return;
    }
    if (!validateStrength(pwd, superRuleIds)) {
      superModalErr.textContent = isAr()
        ? "كلمة السر لا تحقق جميع الشروط المطلوبة."
        : "Password does not meet all security rules above.";
      superNewPwd.focus();
      return;
    }
    if (pwd !== superConfirmPwd.value) {
      superModalErr.textContent = isAr() ? "كلمتا السر غير متطابقتين." : "Passwords do not match.";
      superConfirmPwd.focus();
      return;
    }

    saveSuperBtn.disabled = true;
    superModalErr.textContent = "";

    try {
      await apiSuperResetPassword(key, email, pwd);
      closeSuperModal();
      setStatus(
        isAr() ? `تم تحديث كلمة السر للحساب ${email} بنجاح ✓` : `Password reset successfully for ${email} ✓`,
        "ok"
      );
    } catch (err) {
      superModalErr.textContent = friendlyMsg(err.message);
    } finally {
      saveSuperBtn.disabled = false;
    }
  });

  // ---- أحداث الجدول ----
  tbody.addEventListener("change", async (e) => {
    const select = e.target.closest(".role-select");
    if (!select) return;

    const userId = Number(select.dataset.userId);
    const oldRole = Number(select.dataset.role);
    const newRole = Number(select.value);
    const targetUser = allUsers.find((u) => u.id === userId);

    const executeRoleChange = async (adminKey = "") => {
      select.disabled = true;
      setStatus(isAr() ? "جاري حفظ الصلاحية..." : "Saving role...", "info");
      try {
        await apiUpdateRole(userId, newRole, adminKey);
        if (targetUser) targetUser.role = newRole;
        select.dataset.role = String(newRole);
        updateStats();
        render(getFilteredUsers());
        setStatus(isAr() ? "تم تحديث الصلاحية بنجاح ✓" : "Role updated successfully ✓", "ok");
      } finally {
        select.disabled = false;
      }
    };

    // إذا كان الحساب المستهدف Admin أو يتم ترقيته إلى Admin -> افتح المودال الاحترافي
    if (oldRole === 0 || newRole === 0) {
      openIdentityVerifyModal({
        title: isAr() ? "تأكيد الهوية لتعديل الصلاحية" : "Admin Identity Verification",
        subtitle: isAr()
          ? `تعديل صلاحية الحساب: ${targetUser?.userName || ""}`
          : `Modifying Admin role for: ${targetUser?.userName || ""}`,
        danger: false,
        confirmText: isAr() ? "تأكيد التغيير" : "Confirm Change",
        onConfirm: async (key) => {
          await executeRoleChange(key);
        },
        onCancel: () => {
          select.value = String(oldRole);
        }
      });
      return;
    }

    try {
      await executeRoleChange("");
    } catch (err) {
      select.value = String(oldRole);
      setStatus(friendlyMsg(err.message), "err");
      await loadUsers();
    }
  });

  tbody.addEventListener("click", async (e) => {
    const pwdBtn = e.target.closest(".pwd-btn");
    if (pwdBtn) {
      const userId = Number(pwdBtn.dataset.userId);
      const user = allUsers.find((u) => u.id === userId);
      if (user && Number(user.role) !== 0) openPwdModal(user);
      return;
    }

    const delBtn = e.target.closest(".delete-user-btn");
    if (delBtn) {
      const userId = Number(delBtn.dataset.userId);
      const user = allUsers.find((u) => u.id === userId);
      if (!user || Number(user.role) === 0) return;

      openIdentityVerifyModal({
        title: isAr() ? "تأكيد حذف الحساب نهائياً" : "Confirm Account Deletion",
        subtitle: isAr()
          ? `سيتم حذف "${user.userName}" وجميع بياناته نهائياً.`
          : `Permanently delete "${user.userName}" and all related data.`,
        danger: true,
        confirmText: isAr() ? "🗑 حذف نهائي" : "🗑 Delete User",
        onConfirm: async (key) => {
          delBtn.disabled = true;
          setStatus(isAr() ? "جاري حذف الحساب..." : "Deleting user...", "info");
          try {
            await apiDeleteUser(userId, key);
            allUsers = allUsers.filter((u) => u.id !== userId);
            updateStats();
            render(getFilteredUsers());
            setStatus(isAr() ? `تم حذف الحساب ${user.userName} بنجاح ✓` : `User ${user.userName} deleted ✓`, "ok");
          } catch (err) {
            delBtn.disabled = false;
            setStatus("");
            throw err; // يبقي المودال مفتوحاً ويعرض الخطأ داخله
          }
        }
      });
      return;
    }

    const btn = e.target.closest(".verify-btn");
    if (!btn) return;

    const userId = Number(btn.dataset.userId);
    const nextVerified = btn.dataset.verified !== "1";
    btn.disabled = true;
    setStatus(isAr() ? "جاري تحديث حالة الحساب..." : "Updating account status...", "info");

    try {
      await apiUpdateVerification(userId, nextVerified);
      const target = allUsers.find((u) => u.id === userId);
      if (target) target.emailConfirmed = nextVerified;
      render(getFilteredUsers());
      setStatus(
        isAr()
          ? `تم تغيير حالة الحساب إلى ${nextVerified ? "مفعّل" : "غير مفعّل"} ✓`
          : `Account marked as ${nextVerified ? "Verified" : "Unverified"} ✓`,
        "ok"
      );
    } catch (err) {
      setStatus(friendlyMsg(err.message), "err");
      btn.disabled = false;
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => render(getFilteredUsers()));
  }

  async function loadUsers() {
    try {
      allUsers = await apiFetchUsers();
      updateStats();
      render(getFilteredUsers());
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:#b91c1c; font-weight:700;">${esc(friendlyMsg(err.message))}</td></tr>`;
    }
  }

  loadUsers();

  // =====================================================
  // ================= الأمناء / Ameens ==================
  // =====================================================
  const t = (ar, en) => (isAr() ? ar : en);
  const PHONE_RE = /^(010|011|012|015)\d{8}$/;

  const rolesPane = document.getElementById("rolesPane");
  const ameensPane = document.getElementById("ameensPane");
  const tabRolesBtn = document.getElementById("tabRolesBtn");
  const tabAmeensBtn = document.getElementById("tabAmeensBtn");

  const ameensBody = document.getElementById("ameensBody");
  const searchAmeen = document.getElementById("searchAmeen");
  const ameenChurchFilter = document.getElementById("ameenChurchFilter");
  const ameenStatus = document.getElementById("ameenStatus");
  const openAddAmeenBtn = document.getElementById("openAddAmeenBtn");

  const ameenModal = document.getElementById("ameenModal");
  const ameenModalSub = document.getElementById("ameenModalSub");
  const ameenForm = document.getElementById("ameenForm");
  const ameenChurchSelect = document.getElementById("ameenChurchSelect");
  const ameenNameField = document.getElementById("ameenNameField");
  const ameenNameInput = document.getElementById("ameenNameInput");
  const ameenEmailInput = document.getElementById("ameenEmailInput");
  const ameenPhoneInput = document.getElementById("ameenPhoneInput");
  const ameenModalErr = document.getElementById("ameenModalErr");
  const saveAmeenBtn = document.getElementById("saveAmeenBtn");

  let churches = [];
  let ameenRows = [];
  let ameensLoaded = false;
  let editingAmeen = null; // null = add mode

  function setAmeenStatus(text, type = "ok") {
    if (!ameenStatus) return;
    if (!text) {
      ameenStatus.className = "status-banner";
      ameenStatus.textContent = "";
      return;
    }
    ameenStatus.textContent = text;
    ameenStatus.className = `status-banner show ${type}`;
  }

  async function churchFetch(path, opts = {}) {
    const res = await fetch(`${API_BASE}/Churches${path}`, {
      ...opts,
      headers: {
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        Authorization: "Bearer " + getToken(),
        ...(opts.headers || {})
      }
    });
    if (!res.ok) {
      let msg = `Server error (${res.status})`;
      let raw = "";
      try { raw = await res.text(); } catch {}
      try {
        const d = JSON.parse(raw);
        if (d?.message) msg = d.message;
        else if (d?.errors) msg = Object.values(d.errors).flat()[0] || msg;
        else if (d?.title) msg = `${d.title} (${res.status})`;
        else if (d?.detail) msg = d.detail;
      } catch {
        if (raw && raw.length < 300) msg = `${msg}: ${raw}`;
      }
      console.error("Churches API error", res.status, path, raw);
      throw new Error(msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // ---- Tabs ----
  function showTab(name) {
    const isAmeens = name === "ameens";
    rolesPane.hidden = isAmeens;
    ameensPane.hidden = !isAmeens;
    tabRolesBtn.classList.toggle("active", !isAmeens);
    tabAmeensBtn.classList.toggle("active", isAmeens);
    tabRolesBtn.setAttribute("aria-selected", String(!isAmeens));
    tabAmeensBtn.setAttribute("aria-selected", String(isAmeens));
    try { history.replaceState(null, "", isAmeens ? "?tab=ameens" : location.pathname); } catch {}
    if (isAmeens && !ameensLoaded) loadAmeens();
  }

  tabRolesBtn?.addEventListener("click", () => showTab("roles"));
  tabAmeensBtn?.addEventListener("click", () => showTab("ameens"));

  // ---- Load all churches + their ameens ----
  async function loadAmeens() {
    ameensBody.innerHTML = `<tr><td colspan="7">${t("جاري التحميل...", "Loading...")}</td></tr>`;
    try {
      churches = (await churchFetch("")) || [];

      const perChurch = await Promise.all(churches.map(async (c) => {
        const [ameens, members] = await Promise.all([
          churchFetch(`/${c.id}/ameens`),
          churchFetch(`/${c.id}/members`).catch(() => [])
        ]);
        const byId = new Map((members || []).map((m) => [m.id, m]));
        return (ameens || []).map((a) => {
          const m = byId.get(a.memberId) || {};
          return {
            churchId: c.id,
            churchName: c.name,
            memberId: a.memberId,
            fullName: a.fullName,
            phone: a.phone,
            whatsApp: a.whatsAppPhone,
            email: m.email || "",
            stage: m.stage
          };
        });
      }));

      ameenRows = perChurch.flat();
      ameensLoaded = true;
      fillChurchSelects();
      updateAmeenStats();
      renderAmeens();
    } catch (err) {
      ameensBody.innerHTML = `<tr><td colspan="7" style="color:#b91c1c; font-weight:700;">${esc(friendlyMsg(err.message))}</td></tr>`;
    }
  }

  function fillChurchSelects() {
    const opts = churches.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    const keep = ameenChurchFilter.value;
    ameenChurchFilter.innerHTML = `<option value="">${t("كل الكنائس", "All churches")}</option>` + opts;
    ameenChurchFilter.value = keep && churches.some((c) => String(c.id) === keep) ? keep : "";
    ameenChurchSelect.innerHTML = opts;
  }

  function updateAmeenStats() {
    document.getElementById("countAmeens").textContent = ameenRows.length;
    document.getElementById("countChurches").textContent = churches.length;
  }

  function getFilteredAmeens() {
    const q = (searchAmeen?.value || "").trim().toLowerCase();
    const churchId = ameenChurchFilter?.value || "";
    return ameenRows.filter((r) => {
      if (churchId && String(r.churchId) !== churchId) return false;
      if (!q) return true;
      return [r.fullName, r.phone, r.whatsApp, r.email, r.churchName]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }

  function renderAmeens() {
    const list = getFilteredAmeens();
    if (!list.length) {
      ameensBody.innerHTML = `<tr><td colspan="7">${t("لا يوجد أمناء.", "No Ameens found.")}</td></tr>`;
      return;
    }
    ameensBody.innerHTML = list.map((r, i) => {
      const initial = esc((r.fullName || "?").trim().charAt(0).toUpperCase());
      return `
        <tr>
          <td>${i + 1}</td>
          <td>
            <div class="user-cell">
              <span class="user-avatar">${initial}</span>
              <span>${esc(r.fullName)}</span>
            </div>
          </td>
          <td>${esc(r.churchName)}</td>
          <td dir="ltr">${esc(r.phone)}</td>
          <td dir="ltr">${esc(r.whatsApp)}</td>
          <td>${esc(r.email) || "—"}</td>
          <td>
            <button type="button" class="mini-btn" data-act="edit" data-church="${r.churchId}" data-member="${r.memberId}">✎ ${t("تعديل", "Edit")}</button>
            <button type="button" class="mini-btn danger" data-act="remove" data-church="${r.churchId}" data-member="${r.memberId}">🗑 ${t("إزالة", "Remove")}</button>
          </td>
        </tr>`;
    }).join("");
  }

  searchAmeen?.addEventListener("input", renderAmeens);
  ameenChurchFilter?.addEventListener("change", renderAmeens);

  // ---- Modal (add / edit) ----
  function openAmeenModal(row) {
    editingAmeen = row || null;
    ameenModalErr.textContent = "";
    const isEdit = !!row;

    ameenModalSub.textContent = isEdit
      ? `${row.fullName} — ${row.churchName}`
      : t("تعيين أمين جديد لكنيسة", "Assign a new Ameen to a church");

    ameenChurchSelect.value = isEdit ? String(row.churchId) : (ameenChurchFilter.value || (churches[0] ? String(churches[0].id) : ""));
    ameenChurchSelect.disabled = isEdit;

    ameenNameField.hidden = !isEdit;
    ameenNameInput.value = isEdit ? row.fullName || "" : "";

    ameenEmailInput.value = isEdit ? row.email || "" : "";
    ameenEmailInput.readOnly = isEdit && !!row.email;
    ameenPhoneInput.value = isEdit ? row.phone || "" : "";

    ameenModal.hidden = false;
    (isEdit ? ameenPhoneInput : ameenEmailInput).focus();
  }

  function closeAmeenModal() {
    ameenModal.hidden = true;
    editingAmeen = null;
  }

  openAddAmeenBtn?.addEventListener("click", () => {
    if (!churches.length) {
      setAmeenStatus(t("لا توجد كنائس بعد.", "No churches available yet."), "err");
      return;
    }
    openAmeenModal(null);
  });
  document.getElementById("cancelAmeenBtn")?.addEventListener("click", closeAmeenModal);
  document.getElementById("closeAmeenXBtn")?.addEventListener("click", closeAmeenModal);
  ameenModal?.addEventListener("click", (e) => { if (e.target === ameenModal) closeAmeenModal(); });
  ameenPhoneInput?.addEventListener("input", () => {
    ameenPhoneInput.value = ameenPhoneInput.value.replace(/\D/g, "");
    ameenModalErr.textContent = "";
  });

  ameenForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const phone = ameenPhoneInput.value.trim();
    const email = ameenEmailInput.value.trim();
    const churchId = Number(ameenChurchSelect.value);

    if (!PHONE_RE.test(phone)) {
      ameenModalErr.textContent = t("رقم الموبايل غير صحيح (11 رقم يبدأ بـ 01)", "Invalid phone (11 digits starting with 010/011/012/015).");
      ameenPhoneInput.focus();
      return;
    }

    saveAmeenBtn.disabled = true;
    ameenModalErr.textContent = "";

    try {
      if (!editingAmeen) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          ameenModalErr.textContent = t("من فضلك أدخل بريداً إلكترونياً صحيحاً.", "Please enter a valid email address.");
          ameenEmailInput.focus();
          return;
        }
        await churchFetch(`/${churchId}/ameen`, { method: "POST", body: JSON.stringify({ email, phone }) });
        closeAmeenModal();
        setAmeenStatus(t("تم تعيين الأمين بنجاح ✓", "Ameen assigned successfully ✓"), "ok");
      } else {
        const name = ameenNameInput.value.trim();
        if (!name) {
          ameenModalErr.textContent = t("الاسم مطلوب.", "Name is required.");
          ameenNameInput.focus();
          return;
        }
        try {
          await churchFetch(`/${editingAmeen.churchId}/members/${editingAmeen.memberId}`, {
            method: "PUT",
            body: JSON.stringify({ fullName: name, phone, stage: editingAmeen.stage })
          });
        } catch (firstErr) {
          const mail = editingAmeen.email || email;
          if (!mail) throw firstErr;
          try {
            await churchFetch(`/${editingAmeen.churchId}/ameen`, { method: "POST", body: JSON.stringify({ email: mail, phone }) });
          } catch {
            throw firstErr;
          }
        }
        closeAmeenModal();
        setAmeenStatus(t("تم تحديث بيانات الأمين ✓", "Ameen updated ✓"), "ok");
      }
      await loadAmeens();
    } catch (err) {
      ameenModalErr.textContent = friendlyMsg(err.message);
    } finally {
      saveAmeenBtn.disabled = false;
    }
  });

  // ---- Add Church ----
  const churchModal = document.getElementById("churchModal");
  const churchForm = document.getElementById("churchForm");
  const churchNameInput = document.getElementById("churchNameInput");
  const churchCityInput = document.getElementById("churchCityInput");
  const churchDescInput = document.getElementById("churchDescInput");
  const churchModalErr = document.getElementById("churchModalErr");
  const saveChurchBtn = document.getElementById("saveChurchBtn");

  function openChurchModal() {
    churchNameInput.value = "";
    churchCityInput.value = "";
    churchDescInput.value = "";
    churchModalErr.textContent = "";
    churchModal.hidden = false;
    churchNameInput.focus();
  }

  function closeChurchModal() { churchModal.hidden = true; }

  document.getElementById("openAddChurchBtn")?.addEventListener("click", openChurchModal);
  document.getElementById("cancelChurchBtn")?.addEventListener("click", closeChurchModal);
  document.getElementById("closeChurchXBtn")?.addEventListener("click", closeChurchModal);
  churchModal?.addEventListener("click", (e) => { if (e.target === churchModal) closeChurchModal(); });
  churchNameInput?.addEventListener("input", () => { churchModalErr.textContent = ""; });

  churchForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = churchNameInput.value.trim();
    if (!name) {
      churchModalErr.textContent = t("اسم الكنيسة مطلوب.", "Church name is required.");
      churchNameInput.focus();
      return;
    }

    saveChurchBtn.disabled = true;
    churchModalErr.textContent = "";
    try {
      await churchFetch("", {
        method: "POST",
        body: JSON.stringify({
          name,
          city: churchCityInput.value.trim() || null,
          description: churchDescInput.value.trim() || null
        })
      });
      closeChurchModal();
      setAmeenStatus(t("تمت إضافة الكنيسة ✓", "Church added ✓"), "ok");
      await loadAmeens();
    } catch (err) {
      churchModalErr.textContent = friendlyMsg(err.message);
    } finally {
      saveChurchBtn.disabled = false;
    }
  });

  // ---- Row actions ----
  ameensBody?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const churchId = Number(btn.dataset.church);
    const memberId = Number(btn.dataset.member);
    const row = ameenRows.find((r) => r.churchId === churchId && r.memberId === memberId);
    if (!row) return;

    if (btn.dataset.act === "edit") {
      openAmeenModal(row);
      return;
    }

    if (btn.dataset.act === "remove") {
      const ok = confirm(t(`إزالة ${row.fullName} من أمناء ${row.churchName}؟`, `Remove ${row.fullName} as Ameen of ${row.churchName}?`));
      if (!ok) return;
      btn.disabled = true;
      setAmeenStatus(t("جاري الإزالة...", "Removing..."), "info");
      try {
        await churchFetch(`/${churchId}/ameen/${memberId}`, { method: "DELETE" });
        await loadAmeens();
        setAmeenStatus(t("تمت إزالة الأمين ✓", "Ameen removed ✓"), "ok");
      } catch (err) {
        btn.disabled = false;
        setAmeenStatus(friendlyMsg(err.message), "err");
      }
    }
  });

  if (new URLSearchParams(location.search).get("tab") === "ameens") showTab("ameens");
})();