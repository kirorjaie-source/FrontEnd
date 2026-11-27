"use strict";

/* ============================================================
   churches.js — صفحة الكنايس في لوحة التحكم
   كل البيانات من ChurchesController (api/Churches/...)
   بتتحمّل بعد adminn.js وبتعتمد على window.Api
   ============================================================ */
(function () {
  if (!window.Api) return;

  const API_BASE = (Api.config && Api.config.API_BASE) || "https://localhost:7152/api";
  const root = () => document.getElementById("kc-root");
  const $ = (id) => document.getElementById(id);
  const isAr = () => localStorage.getItem("kokLang") === "ar";
  const tr = (ar, en) => (isAr() ? ar : en);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const say = (m) => { if (typeof toast === "function") toast(m); };
  const showErr = (err) => say((err && err.message) || tr("حدث خطأ ما.", "Something went wrong."));
  const PHONE_RE = /^(010|011|012|015)\d{8}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_LOGO = 2 * 1024 * 1024; // 2MB
  const ORIGIN = API_BASE.replace(/\/api\/?$/, "");
  const logoSrc = (u) => (u ? (/^https?:/i.test(u) ? u : ORIGIN + u) : "");
  const toArr = (r) => (Array.isArray(r) ? r : r?.items || r?.data || r?.$values || []);

  /* ============================================================
     ⚙ إعدادات الـ Enums — مطابقة تماماً للباك (Domain.Contract)
     ChurchStage: KG=1, Primary=2, Preparatory=3, Secondary=4, University=5, External=6
     ChurchRole:
       Member = 0, Ameen = 1, GeneralAmeen = 2, AssistantAmeen = 3,
       Servant = 4, FollowUpServant = 5, Secretary = 6
     ============================================================ */
  const ORD_AR = ["أولى", "تانية", "تالتة", "رابعة", "خامسة", "سادسة"];
  const MAIN = [
    { v: 1, key: "kg", ar: "حضانة", en: "KG", n: 0 },
    { v: 2, key: "primary", ar: "ابتدائي", en: "Primary", n: 6 },
    { v: 3, key: "preparatory", ar: "إعدادي", en: "Prep", n: 3 },
    { v: 4, key: "secondary", ar: "ثانوي", en: "Secondary", n: 3 },
    { v: 5, key: "university", ar: "جامعة", en: "University", n: 0 },
    { v: 6, key: "external", ar: "خريجين", en: "Graduates", n: 0 }
  ];
  const STATUSES = ["Pending", "Approved", "Rejected", "Revoked"]; // MemberStatus
  const ROLE_DEFS = [
    { v: 0, key: "Member", ar: "عضو", en: "Member", badge: "info", ico: "👤" },
    { v: 1, key: "Ameen", ar: "أمين", en: "Ameen", badge: "ok", ico: "✝" },
    { v: 2, key: "GeneralAmeen", ar: "أمين عام", en: "General Ameen", badge: "ok", ico: "👑" },
    { v: 3, key: "AssistantAmeen", ar: "أمين مساعد", en: "Assistant Ameen", badge: "ok", ico: "⭐" },
    { v: 4, key: "Servant", ar: "خادم", en: "Servant", badge: "warn", ico: "🤝" },
    { v: 5, key: "FollowUpServant", ar: "خادم افتقاد", en: "Follow-Up Servant", badge: "warn", ico: "📞" },
    { v: 6, key: "Secretary", ar: "سكرتير", en: "Secretary", badge: "info", ico: "📋" }
  ];
  const ROLES = ROLE_DEFS.map((r) => r.key);

  const OUTCOMES = [
    { v: "Reached", ar: "تم التواصل والرد", en: "Reached" },
    { v: "NoAnswer", ar: "لم يرد", en: "No Answer" },
    { v: "Visited", ar: "زيارة منزلية", en: "Home Visit" },
    { v: "MessageSent", ar: "تم إرسال رسالة", en: "Message Sent" }
  ];
  /* ============================================================ */

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const TILES = [
    { k: "churches", icon: "⛪", ar: "كل الكنايس & كنايسي", en: "All & My Churches" },
    { k: "members", icon: "👥", ar: "الأعضاء والطلبات", en: "Members & Requests" },
    { k: "attendance", icon: "✅", ar: "الغياب اليومي", en: "Daily Attendance" },
    { k: "groups", icon: "🗂️", ar: "مجموعات الافتقاد", en: "Follow-up Groups" },
    { k: "followup", icon: "📞", ar: "الافتقاد والتقارير", en: "Follow-up & Reports" },
    { k: "events", icon: "📅", ar: "الإيفنتس", en: "Events" },
    { k: "ameens", icon: "✝", ar: "الفريق وأمناء الخدمة", en: "Team & Ameens" },
    { k: "settings", icon: "⚙", ar: "إعدادات الكنيسة", en: "Church Settings" }
  ];

  /* ---------------- Auth + API ---------------- */
  function getToken() {
    const s = (Api.auth && Api.auth.getSession && Api.auth.getSession()) || JSON.parse(localStorage.getItem("churchQuizSession") || "{}");
    return s.token || localStorage.getItem("token") || localStorage.getItem("churchQuizToken") || "";
  }

  function isAdmin() {
    try {
      if (Api.auth && typeof Api.auth.isAdmin === "function") return Api.auth.isAdmin();
      const s = (Api.auth && Api.auth.getSession && Api.auth.getSession()) || {};
      const c = typeof decodeJwt === "function" ? decodeJwt(s.token) : {};
      const role = s.role || c.role || c["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
      return String(role).toLowerCase() === "admin" || role === 0 || role === "0";
    } catch { return false; }
  }

  async function api(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        Authorization: "Bearer " + getToken()
      }
    });
    if (!res.ok) {
      let msg = `Server error (${res.status})`;
      let raw = "";
      try { raw = await res.text(); } catch {}
      try {
        const d = JSON.parse(raw);
        if (d && d.message) msg = d.message;
        else if (d && d.errors) msg = Object.values(d.errors).flat()[0] || msg;
        else if (d && d.title) msg = `${d.title} (${res.status})`;
      } catch {
        if (raw && raw.length < 300) msg = `${msg}: ${raw}`;
      }
      console.error("Churches API error", res.status, path, raw);
      throw new Error(msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /* ---------------- Formatting ---------------- */
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const locale = () => (isAr() ? "ar-EG" : undefined);
  const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { dateStyle: "medium", timeStyle: "short" }) : "—");
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(locale(), { year: "numeric", month: "short", day: "numeric" }) : "—");
  const toLocalInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const withSeconds = (v) => (v ? (v.length === 16 ? v + ":00" : v) : null);

  function enumName(v, names) {
    if (v == null) return "";
    if (typeof v === "string" && v !== "" && isNaN(Number(v))) return v;
    return names[Number(v)] ?? String(v);
  }
  const dayIdx = (v) => {
    if (v == null || v === "") return 0;
    if (typeof v === "string" && isNaN(Number(v))) return Math.max(0, DAY_NAMES.indexOf(v));
    return Number(v);
  };
  const dayLabel = (v) => (isAr() ? DAYS_AR : DAY_NAMES)[dayIdx(v)] || "—";
  const timeHM = (v) => String(v || "").slice(0, 5);
  const fmtTime = (v) => {
    const [h, m] = String(v || "").split(":");
    if (!h) return "—";
    const H = Number(h);
    return `${H % 12 || 12}:${m || "00"} ${H >= 12 ? tr("م", "PM") : tr("ص", "AM")}`;
  };
  const statusKey = (v) => enumName(v, STATUSES).toLowerCase();
  const norm = (x) => String(x ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const findRole = (v) => {
    if (v == null || v === "") return null;
    if (!isNaN(Number(v))) return ROLE_DEFS.find((r) => r.v === Number(v)) || null;
    return ROLE_DEFS.find((r) => norm(r.key) === norm(v)) || null;
  };
  const roleKey = (v) => {
    const r = findRole(v);
    return r ? r.key.toLowerCase() : enumName(v, ROLES).toLowerCase();
  };

  /* ---- المراحل والصفوف ---- */
  const findStage = (v) => MAIN.find((s) => String(s.v) === String(v) || (v != null && v !== "" && s.key === norm(v)));
  const gradesOf = (v) => { const s = findStage(v); return s ? s.n : 0; };
  const stageLabel = (v, g) => {
    const s = findStage(v);
    if (!s) return String(v ?? "—");
    if (g && s.n) return isAr() ? `${ORD_AR[g - 1] || g} ${s.ar}` : `${s.en} ${g}`;
    return isAr() ? s.ar : s.en;
  };
  const stagesBadgesHTML = (stages) => {
    const arr = toArr(stages);
    if (!arr.length) return `<span style="opacity:.65">${tr("الكل / غير محدد", "All / Unassigned")}</span>`;
    return arr.map((st) => `<span class="kc-badge info" style="margin:2px">${esc(stageLabel(st))}</span>`).join(" ");
  };
  const stageOptions = (withAll) =>
    (withAll ? [{ value: "", label: tr("كل المراحل", "All stages") }] : [])
      .concat(MAIN.map((s) => ({ value: s.v, label: isAr() ? s.ar : s.en })));
  const gradeOptsHTML = (stageV, val) => {
    const n = gradesOf(stageV);
    let h = `<option value="">${tr("اختر الصف", "Select grade")}</option>`;
    for (let i = 1; i <= n; i++) h += `<option value="${i}" ${String(val) === String(i) ? "selected" : ""}>${esc(stageLabel(stageV, i))}</option>`;
    return h;
  };

  const STATUS_LBL = {
    pending: ["قيد المراجعة", "Pending", "warn"],
    approved: ["مقبول", "Approved", "ok"],
    rejected: ["مرفوض", "Rejected", "no"],
    revoked: ["ملغي", "Revoked", "no"]
  };
  function statusBadge(v) {
    const l = STATUS_LBL[statusKey(v)];
    return l ? `<span class="kc-badge ${l[2]}">${isAr() ? l[0] : l[1]}</span>` : `<span class="kc-badge info">${esc(v ?? "—")}</span>`;
  }
  function roleLabel(v) {
    const r = findRole(v);
    if (r) return isAr() ? r.ar : r.en;
    return enumName(v, ROLES) || "—";
  }
  function roleBadge(v) {
    const r = findRole(v);
    if (r) return `<span class="kc-badge ${r.badge}">${r.ico} ${isAr() ? r.ar : r.en}</span>`;
    return `<span class="kc-badge info">${esc(roleLabel(v))}</span>`;
  }
  function outcomeBadge(v) {
    const o = OUTCOMES.find((x) => norm(x.v) === norm(v));
    const lbl = o ? (isAr() ? o.ar : o.en) : (v || "—");
    const cls = norm(v) === "noanswer" ? "warn" : "ok";
    return `<span class="kc-badge ${cls}">${esc(lbl)}</span>`;
  }

  const statusOptions = () => [{ value: "", label: tr("كل الحالات", "All statuses") }]
    .concat(STATUSES.map((n, i) => { const l = STATUS_LBL[n.toLowerCase()]; return { value: i, label: l ? (isAr() ? l[0] : l[1]) : n }; }));
  const roleOptions = () => [{ value: "", label: tr("كل الأدوار", "All roles") }]
    .concat(ROLE_DEFS.map((r) => ({ value: r.v, label: isAr() ? r.ar : r.en })));

  const selHTML = (attrs, opts, val) => {
    let html = "";
    let grp = null;
    opts.forEach((o) => {
      const g = o.group || null;
      if (g !== grp) {
        if (grp) html += "</optgroup>";
        if (g) html += `<optgroup label="${esc(g)}">`;
        grp = g;
      }
      html += `<option value="${esc(o.value)}" ${String(o.value) === String(val) ? "selected" : ""}>${esc(o.label)}</option>`;
    });
    if (grp) html += "</optgroup>";
    return `<select ${attrs}>${html}</select>`;
  };
  const phoneHTML = (p) => (p ? `<a class="kc-link" dir="ltr" href="tel:${esc(p)}">${esc(p)}</a>` : "—");
  const waDigits = (p) => {
    let d = String(p || "").replace(/\D/g, "");
    if (/^0\d{10}$/.test(d)) d = "2" + d;
    return d;
  };
  const waHTML = (p) => {
    const d = waDigits(p);
    return d ? `<a class="kc-wa" dir="ltr" href="https://wa.me/${d}" target="_blank" rel="noopener noreferrer">💬 ${esc(p)}</a>` : "—";
  };
  const waBtn = (p) => {
    const d = waDigits(p);
    return d ? `<a class="kc-btn wa" href="https://wa.me/${d}" target="_blank" rel="noopener noreferrer">💬 ${tr("واتساب", "WhatsApp")}</a>` : "";
  };
  const followHint = (c) => `<div class="kc-hint">📞 ${tr(
    `الافتقاد = متابعة الأعضاء اللي غابوا ${c.followUpAfterDays ?? "—"} يوم أو أكتر عن الاجتماع. كلّمهم أو ابعتلهم واتساب، وبعدها دوس «تم الافتقاد» وسجّل النتيجة والملاحظة.`,
    `Follow-up = checking on members absent for ${c.followUpAfterDays ?? "—"}+ days. Call or WhatsApp them, then press “Done” and record the outcome.`
  )}</div>`;
  const empty = (icon, msg) => `<div class="kc-empty"><div>${icon}</div><b>${esc(msg)}</b></div>`;
  const table = (heads, rows) =>
    `<div class="kc-card"><div class="kc-scroll"><table class="kc-table"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div></div>`;

  /* ---------------- State ---------------- */
  const S = {
    view: "churches",
    scope: "all",
    all: [],
    mine: [],
    churchId: localStorage.getItem("kcChurch") || "",
    seq: 0,
    mf: { status: "", stage: "", role: "" },
    att: { date: todayStr(), stage: "" },
    grp: { stage: "" },
    fu: { tab: "absent", stage: "", from: "", to: "" },
    sheet: null,
    members: [],
    groups: [],
    team: [],
    events: [],
    ameens: [],
    followups: [],
    reports: [],
    servantsStatus: [],
    servantsFollowup: []
  };

  const selectable = () => (isAdmin() ? S.all : S.mine);
  const current = () => selectable().find((c) => String(c.id) === String(S.churchId)) || selectable()[0] || null;
  const isApprovedMember = (c) => !!(c && c.myStatus != null && statusKey(c.myStatus) === "approved");

  // أي دور قيادي أو خدمي غير Member العادي (Ameen=1, GeneralAmeen=2, AssistantAmeen=3, Servant=4, FollowUpServant=5, Secretary=6)
  const isServantOrAmeen = (c) => {
    if (isAdmin()) return true;
    if (!isApprovedMember(c)) return false;
    const r = findRole(c.myRole);
    return r ? r.v >= 1 : roleKey(c.myRole) !== "member";
  };

  // الأدوار الإدارية (Ameen=1, GeneralAmeen=2, AssistantAmeen=3, Secretary=6)
  const canManage = (c) => {
    if (isAdmin()) return true;
    if (!isApprovedMember(c)) return false;
    const r = findRole(c.myRole);
    if (r) return [1, 2, 3, 6].includes(r.v);
    const k = roleKey(c.myRole);
    return k.includes("ameen") || k.includes("secretary");
  };

  async function loadChurches() {
    const [all, mine] = await Promise.all([api("/Churches"), api("/Churches/mine")]);
    S.all = all || [];
    S.mine = mine || [];
  }

  /* ---------------- Modal ---------------- */
  function closeModal() { const m = $("kc-modal"); if (m) m.remove(); }

  function fieldHTML(f) {
    const id = `kcf-${f.name}`;
    const v = f.value ?? "";
    let input;
    if (f.type === "select") {
      input = selHTML(`id="${id}" name="${f.name}"`, f.options, v);
    } else if (f.type === "stage") {
      const st = findStage(f.value);
      const sv = st ? st.v : "";
      const first = { value: "", label: f.allowEmpty ? tr("— بدون تغيير —", "— no change —") : tr("اختر المرحلة", "Select stage") };
      const opts = [first].concat(MAIN.map((s) => ({ value: s.v, label: isAr() ? s.ar : s.en })));
      input = selHTML(`id="${id}" name="stage" data-stage-main`, opts, sv)
        + `<select name="grade" data-stage-grade style="margin-top:8px;${gradesOf(sv) ? "" : "display:none"}">${gradeOptsHTML(sv, f.grade ?? "")}</select>`;
    } else if (f.type === "stages-check") {
      const selected = new Set(toArr(f.value).map((x) => { const st = findStage(x); return st ? String(st.v) : String(x); }));
      input = `<div style="display:flex;flex-wrap:wrap;gap:8px;padding:6px 0">${MAIN.map((s) => `
        <label style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid rgba(148,163,184,.35);border-radius:10px;cursor:pointer;font-weight:600">
          <input type="checkbox" name="${f.name}" value="${s.v}" ${selected.has(String(s.v)) ? "checked" : ""}>
          <span>${isAr() ? s.ar : s.en}</span>
        </label>`).join("")}</div>`;
    } else if (f.type === "members-check") {
      const list = f.members || [];
      if (!list.length) {
        input = `<div class="kc-note">${tr("لا يوجد أعضاء متاحين للاختيار.", "No members available to select.")}</div>`;
      } else {
        input = `<div style="max-height:220px;overflow-y:auto;border:1px solid rgba(148,163,184,.3);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:6px">
          ${list.map((m) => `
            <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;border-radius:8px;cursor:pointer">
              <span style="display:inline-flex;align-items:center;gap:8px">
                <input type="checkbox" name="${f.name}" value="${esc(m.id ?? m.memberId)}" ${f.checkedAll ? "checked" : ""}>
                <b>${esc(m.fullName)}</b>
              </span>
              <small style="opacity:.75">${esc(stageLabel(m.stage, m.grade))}</small>
            </label>`).join("")}
        </div>`;
      }
    } else if (f.type === "checkbox") {
      input = `<label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;padding:6px 0">
        <input id="${id}" name="${f.name}" type="checkbox" ${f.checked ? "checked" : ""}>
        <span>${esc(f.boxLabel || "")}</span>
      </label>`;
    } else if (f.type === "file") {
      input = `<input id="${id}" name="${f.name}" type="file" accept="image/png,image/jpeg,image/webp" style="height:auto;padding:10px">`;
    } else if (f.type === "textarea") {
      input = `<textarea id="${id}" name="${f.name}" ${f.maxlength ? `maxlength="${f.maxlength}"` : ""}>${esc(v)}</textarea>`;
    } else {
      input = `<input id="${id}" name="${f.name}" type="${f.type || "text"}" value="${esc(v)}" ${f.min != null ? `min="${f.min}"` : ""} ${f.max != null ? `max="${f.max}"` : ""} ${f.maxlength ? `maxlength="${f.maxlength}"` : ""} ${f.ltr ? 'dir="ltr"' : ""} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""} ${f.readonly ? "readonly" : ""}>`;
    }
    return `<div class="kc-field"><label for="${id}">${esc(f.label)}${f.required ? " *" : ""}</label>${input}</div>`;
  }

  function openModal({ title, sub, fields, submitLabel, onSubmit, onOpen }) {
    closeModal();
    const wrap = document.createElement("div");
    wrap.className = "kc-modal";
    wrap.id = "kc-modal";
    wrap.innerHTML = `
      <div class="kc-modal-box" role="dialog" aria-modal="true">
        <div class="kc-modal-head">
          <div><h3>${esc(title)}</h3>${sub ? `<p>${esc(sub)}</p>` : ""}</div>
          <button type="button" class="kc-x" data-close aria-label="Close">✕</button>
        </div>
        <form class="kc-form" novalidate>
          ${fields.map(fieldHTML).join("")}
          <div class="kc-err" id="kc-modal-err"></div>
          <div class="kc-actions">
            <button type="button" class="kc-btn ghost" data-close>${tr("إلغاء", "Cancel")}</button>
            <button type="submit" class="kc-btn primary">${esc(submitLabel || tr("حفظ", "Save"))}</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(wrap);

    wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-close]")) closeModal(); });
    const form = wrap.querySelector("form");
    const errBox = wrap.querySelector("#kc-modal-err");
    const first = form.querySelector("input:not([readonly]):not([type=checkbox]),select,textarea");
    if (first) first.focus();

    const mainSel = form.querySelector("[data-stage-main]");
    if (mainSel) {
      mainSel.addEventListener("change", () => {
        const g = form.querySelector("[data-stage-grade]");
        g.innerHTML = gradeOptsHTML(mainSel.value, "");
        g.style.display = gradesOf(mainSel.value) ? "" : "none";
      });
    }

    if (typeof onOpen === "function") onOpen(form, errBox);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const vals = {};
      for (const f of fields) {
        if (f.type === "file") { vals[f.name] = form.elements[f.name].files[0] || null; continue; }
        if (f.type === "checkbox") { vals[f.name] = Boolean(form.elements[f.name]?.checked); continue; }
        if (f.type === "stages-check" || f.type === "members-check") {
          vals[f.name] = Array.from(form.querySelectorAll(`input[name="${f.name}"]:checked`)).map((el) =>
            /^\d+$/.test(el.value) ? Number(el.value) : el.value
          );
          if (f.required && !vals[f.name].length) {
            errBox.textContent = tr(`اختر عنصراً واحداً على الأقل في ${f.label}.`, `Select at least one item in ${f.label}.`);
            return;
          }
          continue;
        }
        const v = String(form.elements[f.name].value || "").trim();
        if (f.required && !v) { errBox.textContent = tr(`${f.label} مطلوب.`, `${f.label} is required.`); form.elements[f.name].focus(); return; }
        if (f.pattern && v && !f.pattern.test(v)) { errBox.textContent = f.patternMsg || tr("قيمة غير صحيحة.", "Invalid value."); form.elements[f.name].focus(); return; }
        vals[f.name] = v;
        if (f.type === "stage") {
          const g = String(form.elements.grade.value || "");
          if (v && gradesOf(v) && !g) { errBox.textContent = tr("اختر الصف الدراسي.", "Select the grade."); form.elements.grade.focus(); return; }
          vals.grade = v && gradesOf(v) ? g : "";
        }
      }
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      errBox.textContent = "";
      try {
        await onSubmit(vals);
        closeModal();
      } catch (err) {
        errBox.textContent = err.message || tr("حدث خطأ ما.", "Something went wrong.");
        btn.disabled = false;
      }
    });
  }

  function openInfo({ title, sub, html }) {
    closeModal();
    const wrap = document.createElement("div");
    wrap.className = "kc-modal";
    wrap.id = "kc-modal";
    wrap.innerHTML = `
      <div class="kc-modal-box" role="dialog" aria-modal="true">
        <div class="kc-modal-head">
          <div><h3>${esc(title)}</h3>${sub ? `<p>${esc(sub)}</p>` : ""}</div>
          <button type="button" class="kc-x" data-close aria-label="Close">✕</button>
        </div>
        <div class="kc-form">${html}</div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-close]")) closeModal(); });
  }

  const phoneField = (value = "", required = true) => ({
    name: "phone", label: tr("رقم الموبايل", "Phone"), type: "tel", value, required, maxlength: 11, ltr: true, placeholder: "01xxxxxxxxx",
    pattern: PHONE_RE, patternMsg: tr("رقم الموبايل غير صحيح (11 رقم يبدأ بـ 01)", "Invalid phone (11 digits starting with 010/011/012/015).")
  });

  /* ---------------- Panels ---------------- */
  const PANELS = {};
  const lockedPanel = () => empty("🔒", tr("هذا القسم للأمناء والأدمن فقط.", "This section is for Ameens and admins only."));
  const servantLockedPanel = () => empty("🔒", tr("هذا القسم للخدام والأمناء والأدمن فقط.", "This section is for Servants, Ameens, and admins only."));

  // 1) كل الكنايس & كنايسي
  PANELS.churches = async () => {
    await loadChurches();
    const list = S.scope === "mine" ? S.mine : S.all;
    const admin = isAdmin();
    const head = `
      <div class="kc-head">
        <div class="kc-seg">
          <button type="button" data-scope="all" class="${S.scope === "all" ? "on" : ""}">⛪ ${tr("كل الكنايس", "All churches")}</button>
          <button type="button" data-scope="mine" class="${S.scope === "mine" ? "on" : ""}">⭐ ${tr("كنايسي", "My churches")}</button>
        </div>
        ${admin ? `<button type="button" class="kc-btn primary" data-act="add-church">＋ ${tr("إضافة كنيسة", "Add church")}</button>` : ""}
      </div>`;
    if (!list.length) return head + empty("⛪", S.scope === "mine" ? tr("مش مشترك في أي كنيسة لسه.", "You haven't joined any church yet.") : tr("لا توجد كنايس.", "No churches yet."));
    return head + `<div class="kc-cards">${list.map(churchCard).join("")}</div>`;
  };

  function churchCard(c) {
    const admin = isAdmin();
    const st = c.myStatus == null ? "" : statusKey(c.myStatus);
    let actions = `<button type="button" class="kc-btn ghost" data-act="contact" data-id="${c.id}">📞 ${tr("التواصل", "Contact")}</button>`;
    if (admin || st === "approved") actions += `<button type="button" class="kc-btn primary" data-act="open" data-id="${c.id}">${tr("فتح", "Open")}</button>`;
    if (!admin && (!st || st === "rejected" || st === "revoked")) actions += `<button type="button" class="kc-btn gold" data-act="join" data-id="${c.id}">${tr("انضم", "Join")}</button>`;
    if (st === "approved") actions += `<button type="button" class="kc-btn ghost" data-act="my-profile" data-id="${c.id}">${tr("بياناتي", "My profile")}</button>`;
    if (admin) actions += `<button type="button" class="kc-btn ghost" data-act="edit-church" data-id="${c.id}">✎ ${tr("تعديل", "Edit")}</button>`;
    const counts = c.approvedMembersCount != null
      ? `<span class="kc-badge info">👥 ${c.approvedMembersCount}</span>${c.pendingRequestsCount ? `<span class="kc-badge warn">⏳ ${c.pendingRequestsCount}</span>` : ""}`
      : "";
    return `
      <article class="kc-church kc-clickable" data-act="contact" data-id="${c.id}" title="${tr("اضغط لعرض معلومات التواصل", "Click for contact info")}">
        <div class="kc-church-top">
          <span class="kc-church-ico">${c.logoUrl ? `<img src="${esc(logoSrc(c.logoUrl))}" alt="">` : "⛪"}</span>
          <div>
            <h3>${esc(c.name)}</h3>
            <small>${esc(c.city || "")}</small>
          </div>
        </div>
        ${c.description ? `<p class="kc-desc">${esc(c.description)}</p>` : ""}
        <div class="kc-meta">
          <span>📅 ${dayLabel(c.meetingDay)} ${esc(fmtTime(c.meetingTime))}</span>
          ${c.myStatus != null ? statusBadge(c.myStatus) : ""}
          ${c.myRole != null && st === "approved" ? roleBadge(c.myRole) : ""}
          ${counts}
        </div>
        <div class="kc-card-actions">${actions}</div>
      </article>`;
  }

  // 2) الأعضاء والطلبات
  PANELS.members = async () => {
    const c = current();
    const manage = canManage(c);
    if (!manage) return lockedPanel();
    const q = new URLSearchParams();
    Object.entries(S.mf).forEach(([k, v]) => { if (v !== "") q.set(k, v); });
    S.members = (await api(`/Churches/${c.id}/members${q.toString() ? "?" + q : ""}`)) || [];

    const filters = `
      <div class="kc-head">
        <div class="kc-filters">
          ${selHTML('data-filter="status"', statusOptions(), S.mf.status)}
          ${selHTML('data-filter="stage"', stageOptions(true), S.mf.stage)}
          ${selHTML('data-filter="role"', roleOptions(), S.mf.role)}
        </div>
        ${manage ? `<button type="button" class="kc-btn primary" data-act="add-member">＋ ${tr("إضافة عضو", "Add member")}</button>` : ""}
      </div>`;
    if (!S.members.length) return filters + empty("👥", tr("لا يوجد أعضاء.", "No members found."));

    const rows = S.members.map((m, i) => {
      const st = statusKey(m.status);
      const rObj = findRole(m.role);
      const isTargetAmeen = rObj ? [1, 2, 3].includes(rObj.v) : roleKey(m.role).includes("ameen");
      let acts = "";
      if (st === "pending") acts += `<button class="kc-mini ok" data-act="decide" data-do="approve" data-m="${m.id}">✓ ${tr("قبول", "Approve")}</button><button class="kc-mini danger" data-act="decide" data-do="reject" data-m="${m.id}">✕ ${tr("رفض", "Reject")}</button>`;
      else if (st === "approved") acts += `<button class="kc-mini danger" data-act="decide" data-do="revoke" data-m="${m.id}">⛔ ${tr("إلغاء العضوية", "Revoke")}</button>`;
      else acts += `<button class="kc-mini ok" data-act="decide" data-do="approve" data-m="${m.id}">✓ ${tr("قبول", "Approve")}</button>`;

      if (st === "approved") {
        acts += `<button class="kc-mini" data-act="set-role" data-m="${m.id}">🎖 ${tr("الدور", "Role")}</button>`;
      }
      if (!isTargetAmeen || isAdmin()) {
        acts += `<button class="kc-mini" data-act="edit-member" data-m="${m.id}">✎ ${tr("تعديل", "Edit")}</button>`;
        acts += `<button class="kc-mini danger" data-act="del-member" data-m="${m.id}">🗑 ${tr("حذف", "Delete")}</button>`;
      }
      return `<tr>
        <td>${i + 1}</td>
        <td><b>${esc(m.fullName)}</b></td>
        <td>${phoneHTML(m.phone)}</td>
        <td>${esc(m.email || "—")}</td>
        <td>${esc(stageLabel(m.stage, m.grade))}</td>
        <td>${roleBadge(m.role)}</td>
        <td>${statusBadge(m.status)}</td>
        <td>${esc(fmtDate(m.requestedAt))}</td>
        <td class="kc-acts">${acts}</td>
      </tr>`;
    }).join("");
    return filters + table(["#", tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("الإيميل", "Email"), tr("المرحلة", "Stage"), tr("الدور", "Role"), tr("الحالة", "Status"), tr("تاريخ الطلب", "Requested"), tr("إجراءات", "Actions")], rows);
  };

  // 3) الغياب اليومي
  PANELS.attendance = async () => {
    const c = current();
    if (!isServantOrAmeen(c)) return servantLockedPanel();
    const q = new URLSearchParams({ date: S.att.date });
    if (S.att.stage !== "") q.set("stage", S.att.stage);
    S.sheet = await api(`/Churches/${c.id}/attendance?${q}`);
    return attendanceHTML();
  };

  function attendanceHTML() {
    const s = S.sheet;
    const allowEdit = isServantOrAmeen(current());
    if (!s) return empty("✅", tr("لا توجد بيانات.", "No data."));
    const members = s.members || [];
    const head = `
      <div class="kc-head">
        <div class="kc-filters">
          <input type="date" id="kc-att-date" value="${esc(S.att.date)}">
          ${selHTML('id="kc-att-stage"', stageOptions(true), S.att.stage)}
        </div>
        <div class="kc-stats">
          <span class="kc-badge ok">✅ ${s.presentCount}/${s.totalCount}</span>
          <span class="kc-badge info">📅 ${dayLabel(s.meetingDay)} ${esc(fmtTime(s.meetingTime))}</span>
        </div>
      </div>`;
    if (!members.length) return head + empty("✅", tr("لا يوجد أعضاء في القائمة.", "No members in the list."));
    const rows = members.map((m, i) => `
      <tr class="${m.isPresent ? "present" : ""}">
        <td>${i + 1}</td>
        <td><b>${esc(m.fullName)}</b></td>
        <td>${phoneHTML(m.phone)}</td>
        <td>${esc(stageLabel(m.stage, m.grade))}</td>
        <td>${roleLabel(m.role)}</td>
        <td>${allowEdit
          ? `<button type="button" class="kc-toggle ${m.isPresent ? "on" : ""}" data-act="toggle-att" data-m="${m.memberId}">${m.isPresent ? "✅ " + tr("حاضر", "Present") : "⬜ " + tr("غائب", "Absent")}</button>`
          : `<span class="kc-badge ${m.isPresent ? "ok" : ""}">${m.isPresent ? "✅ " + tr("حاضر", "Present") : "⬜ " + tr("غائب", "Absent")}</span>`}</td>
      </tr>`).join("");
    return head + table(["#", tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("المرحلة", "Stage"), tr("الدور", "Role"), tr("الحضور", "Attendance")], rows);
  }

  // 4) مجموعات الافتقاد والتقسيم التلقائي
  PANELS.groups = async () => {
    const c = current();
    if (!isServantOrAmeen(c)) return servantLockedPanel();
    const manage = canManage(c);
    const q = S.grp.stage !== "" ? `?stage=${encodeURIComponent(S.grp.stage)}` : "";
    S.groups = toArr(await api(`/Churches/${c.id}/groups${q}`));

    const head = `
      <div class="kc-head">
        <div class="kc-filters">
          ${selHTML('id="kc-grp-stage"', stageOptions(true), S.grp.stage)}
          <span class="kc-badge info">🗂️ ${S.groups.length}</span>
        </div>
        ${manage ? `<div class="kc-actions" style="margin:0">
          <button type="button" class="kc-btn gold" data-act="auto-split-groups">⚡ ${tr("تقسيم تلقائي", "Auto Split")}</button>
          <button type="button" class="kc-btn primary" data-act="add-group">＋ ${tr("مجموعة جديدة", "New Group")}</button>
        </div>` : ""}
      </div>`;

    if (!S.groups.length) {
      return head + empty("🗂️", tr("لا توجد مجموعات افتقاد بعد. يمكنك إنشاء مجموعة أو استخدام التقسيم التلقائي.", "No follow-up groups yet. Create one or use Auto Split."));
    }

    return head + `<div class="kc-cards">${S.groups.map((g) => {
      const count = g.membersCount ?? (Array.isArray(g.members) ? g.members.length : 0);
      const servantName = g.followUpServantName || g.servantName || g.leaderName || g.assignedServantName || tr("غير محدد", "Unassigned");
      return `
        <article class="kc-church">
          <div class="kc-church-top">
            <span class="kc-church-ico">🗂️</span>
            <div>
              <h3>${esc(g.name || g.title || tr("مجموعة", "Group"))}</h3>
              <small>${esc(stageLabel(g.stage))}${g.grade ? " — " + esc(stageLabel(g.stage, g.grade)) : ""}</small>
            </div>
          </div>
          <div class="kc-meta">
            <span class="kc-badge info">📞 ${tr("خادم الافتقاد:", "Servant:")} ${esc(servantName)}</span>
            <span class="kc-badge ok">👥 ${count} ${tr("عضو", "members")}</span>
          </div>
          ${g.description ? `<p class="kc-desc">${esc(g.description)}</p>` : ""}
          <div class="kc-card-actions">
            <button type="button" class="kc-btn primary" data-act="view-group-members" data-g="${g.id}">👥 ${tr("الأعضاء", "Members")}</button>
            ${manage ? `
              <button type="button" class="kc-btn ghost" data-act="assign-group-members" data-g="${g.id}">＋ ${tr("إضافة أعضاء", "Add members")}</button>
              <button type="button" class="kc-btn ghost" data-act="edit-group" data-g="${g.id}">✎ ${tr("تعديل", "Edit")}</button>
              <button type="button" class="kc-btn danger" data-act="del-group" data-g="${g.id}">🗑 ${tr("حذف", "Delete")}</button>
            ` : ""}
          </div>
        </article>`;
    }).join("")}</div>`;
  };

  // 5) الافتقاد والتقارير وافتقاد الخدام
  PANELS.followup = async () => {
    const c = current();
    if (!isServantOrAmeen(c)) return servantLockedPanel();
    const manage = canManage(c);

    const tabs = `
      <div class="kc-head">
        <div class="kc-seg">
          <button type="button" data-futab="absent" class="${S.fu.tab === "absent" ? "on" : ""}">📞 ${tr("المطلوب افتقادهم", "Needs Follow-up")}</button>
          <button type="button" data-futab="reports" class="${S.fu.tab === "reports" ? "on" : ""}">📋 ${tr("سجل التقارير", "Reports Log")}</button>
          ${manage ? `<button type="button" data-futab="servants" class="${S.fu.tab === "servants" ? "on" : ""}">🤝 ${tr("متابعة وافتقاد الخدام", "Servants Follow-up")}</button>` : ""}
        </div>
      </div>`;

    if (S.fu.tab === "absent") {
      const q = S.fu.stage !== "" ? `?stage=${encodeURIComponent(S.fu.stage)}` : "";
      S.followups = toArr(await api(`/Churches/${c.id}/follow-up${q}`));
      const head = tabs + followHint(c) + `
        <div class="kc-head">
          <div class="kc-filters">${selHTML('id="kc-fu-stage"', stageOptions(true), S.fu.stage)}</div>
          <span class="kc-badge warn">📞 ${S.followups.length}</span>
        </div>`;
      if (!S.followups.length) return head + empty("🙏", tr("مفيش حد محتاج افتقاد دلوقتي.", "No one needs follow-up right now."));
      const rows = S.followups.map((m) => `
        <tr>
          <td><b>${esc(m.fullName)}</b></td>
          <td>${phoneHTML(m.phone)}</td>
          <td>${waHTML(m.whatsAppPhone)}</td>
          <td>${esc(stageLabel(m.stage, m.grade))}</td>
          <td>${esc(fmtDate(m.lastAttendedDate))}</td>
          <td><span class="kc-badge ${m.daysAbsent >= 28 ? "no" : "warn"}">${m.daysAbsent} ${tr("يوم", "days")}</span></td>
          <td>${esc(fmtDate(m.lastFollowUpAt))}</td>
          <td class="kc-note-cell">${esc(m.lastNote || "—")}</td>
          <td><button type="button" class="kc-mini ok" data-act="do-followup" data-m="${m.memberId}">📞 ${tr("تم الافتقاد", "Done")}</button></td>
        </tr>`).join("");
      return head + table([tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("واتساب", "WhatsApp"), tr("المرحلة", "Stage"), tr("آخر حضور", "Last attended"), tr("الغياب", "Absent"), tr("آخر افتقاد", "Last follow-up"), tr("آخر ملاحظة", "Last note"), tr("إجراء", "Action")], rows);
    }

    if (S.fu.tab === "reports") {
      const p = new URLSearchParams();
      if (S.fu.from) p.set("from", S.fu.from);
      if (S.fu.to) p.set("to", S.fu.to);
      S.reports = toArr(await api(`/Churches/${c.id}/follow-up/reports${p.toString() ? "?" + p : ""}`));
      const head = tabs + `
        <div class="kc-head">
          <div class="kc-filters">
            <label style="display:inline-flex;align-items:center;gap:6px">${tr("من", "From")} <input type="date" id="kc-fu-from" value="${esc(S.fu.from)}"></label>
            <label style="display:inline-flex;align-items:center;gap:6px">${tr("إلى", "To")} <input type="date" id="kc-fu-to" value="${esc(S.fu.to)}"></label>
          </div>
          <span class="kc-badge info">📋 ${S.reports.length}</span>
        </div>`;
      if (!S.reports.length) return head + empty("📋", tr("لا توجد تقارير افتقاد مسجلة في هذه الفترة.", "No follow-up reports recorded in this period."));
      const rows = S.reports.map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${esc(r.memberName || r.fullName || "—")}</b></td>
          <td>${outcomeBadge(r.outcome)}</td>
          <td class="kc-note-cell">${esc(r.note || "—")}</td>
          <td>${esc(r.reporterName || r.servantName || "—")}</td>
          <td>${esc(fmtDateTime(r.createdAt || r.reportedAt || r.date))}</td>
        </tr>`).join("");
      return head + table(["#", tr("المخدوم", "Member"), tr("النتيجة", "Outcome"), tr("الملاحظة", "Note"), tr("الخادم", "Servant"), tr("التاريخ", "Date")], rows);
    }

    if (!manage) return tabs + lockedPanel();
    const q = S.fu.stage !== "" ? `?stage=${encodeURIComponent(S.fu.stage)}` : "";
    const [statusList, servantsFu] = await Promise.all([
      api(`/Churches/${c.id}/follow-up/servants-status`).catch(() => []),
      api(`/Churches/${c.id}/follow-up/servants${q}`).catch(() => [])
    ]);
    S.servantsStatus = toArr(statusList);
    S.servantsFollowup = toArr(servantsFu);

    const statusSection = S.servantsStatus.length
      ? `<h4 style="margin:12px 0 8px">📊 ${tr("نشاط الخدام في الافتقاد", "Servants Follow-up Activity")}</h4>` +
        table(
          [tr("الخادم", "Servant"), tr("الدور", "Role"), tr("الموبايل", "Phone"), tr("مراحل الخدمة", "Stages"), tr("عدد التقارير", "Reports"), tr("آخر افتقاد قام به", "Last Activity")],
          S.servantsStatus.map((s) => `
            <tr>
              <td><b>${esc(s.fullName || s.name)}</b></td>
              <td>${roleBadge(s.role)}</td>
              <td>${phoneHTML(s.phone)}</td>
              <td>${stagesBadgesHTML(s.serviceStages)}</td>
              <td><span class="kc-badge info">${s.reportsCount ?? s.totalReports ?? 0}</span></td>
              <td>${esc(fmtDateTime(s.lastReportAt || s.lastFollowUpAt))}</td>
            </tr>`).join("")
        )
      : "";

    const absentServantsHead = `
      <div class="kc-head" style="margin-top:16px">
        <div class="kc-filters">
          <b>🤝 ${tr("خدام غائبون ويحتاجون افتقاد", "Absent Servants Needing Follow-up")}</b>
          ${selHTML('id="kc-fu-stage"', stageOptions(true), S.fu.stage)}
        </div>
        <span class="kc-badge warn">${S.servantsFollowup.length}</span>
      </div>`;

    const absentServantsBody = S.servantsFollowup.length
      ? table(
          [tr("الخادم", "Servant"), tr("الدور", "Role"), tr("الموبايل", "Phone"), tr("واتساب", "WhatsApp"), tr("أيام الغياب", "Days Absent"), tr("آخر ملاحظة", "Last Note"), tr("إجراء", "Action")],
          S.servantsFollowup.map((m) => `
            <tr>
              <td><b>${esc(m.fullName)}</b></td>
              <td>${roleBadge(m.role)}</td>
              <td>${phoneHTML(m.phone)}</td>
              <td>${waHTML(m.whatsAppPhone || m.phone)}</td>
              <td><span class="kc-badge warn">${m.daysAbsent ?? "—"} ${tr("يوم", "days")}</span></td>
              <td class="kc-note-cell">${esc(m.lastNote || "—")}</td>
              <td><button type="button" class="kc-mini ok" data-act="do-followup" data-m="${m.memberId || m.id}">📞 ${tr("تسجيل افتقاد", "Record")}</button></td>
            </tr>`).join("")
        )
      : empty("🙏", tr("جميع الخدام منتظمون ولا يوجد خادم يحتاج افتقاد حالياً.", "All servants are active; no servant needs follow-up right now."));

    return tabs + statusSection + absentServantsHead + absentServantsBody;
  };

  // 6) الإيفنتس
  PANELS.events = async () => {
    const c = current();
    const manage = canManage(c);
    S.events = ((await api(`/Churches/${c.id}/events`)) || []).slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    const head = manage ? `<div class="kc-head"><span></span><button type="button" class="kc-btn primary" data-act="add-event">＋ ${tr("إضافة إيفنت", "Add event")}</button></div>` : "";
    if (!S.events.length) return head + empty("📅", tr("لا توجد إيفنتس.", "No events yet."));
    return head + `<div class="kc-cards">${S.events.map((ev) => `
      <article class="kc-church kc-event">
        <div class="kc-church-top">
          <span class="kc-church-ico">📅</span>
          <div><h3>${esc(ev.title)}</h3><small>${esc(fmtDateTime(ev.startsAt))}${ev.endsAt ? " → " + esc(fmtDateTime(ev.endsAt)) : ""}</small></div>
        </div>
        ${ev.location ? `<p class="kc-desc">📍 ${esc(ev.location)}</p>` : ""}
        ${ev.description ? `<p class="kc-desc">${esc(ev.description)}</p>` : ""}
        ${manage ? `<div class="kc-card-actions">
          <button type="button" class="kc-btn ghost" data-act="edit-event" data-e="${ev.id}">✎ ${tr("تعديل", "Edit")}</button>
          <button type="button" class="kc-btn danger" data-act="del-event" data-e="${ev.id}">🗑 ${tr("حذف", "Delete")}</button>
        </div>` : ""}
      </article>`).join("")}</div>`;
  };

  // 7) الفريق وأمناء الخدمة ومراحل الخدمة
  PANELS.ameens = async () => {
    const c = current();
    const admin = isAdmin();
    const manage = canManage(c);
    const [ameensRes, teamRes] = await Promise.all([
      api(`/Churches/${c.id}/ameens`).catch(() => []),
      api(`/Churches/${c.id}/team`).catch(() => [])
    ]);
    S.ameens = toArr(ameensRes);
    S.team = toArr(teamRes);

    const ameensHead = `<div class="kc-head"><span class="kc-badge info">✝ ${tr("أمناء الخدمة:", "Ameens:")} ${S.ameens.length}</span>${admin ? `<button type="button" class="kc-btn primary" data-act="assign-ameen">＋ ${tr("تعيين أمين", "Assign Ameen")}</button>` : ""}</div>`;
    const ameensTable = S.ameens.length
      ? table(
          ["#", tr("الاسم", "Name"), tr("الدور", "Role"), tr("الموبايل", "Phone"), tr("واتساب", "WhatsApp")].concat(admin ? [tr("إجراءات", "Actions")] : []),
          S.ameens.map((a, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><b>${esc(a.fullName)}</b></td>
              <td>${roleBadge(a.role ?? "GeneralAmeen")}</td>
              <td>${phoneHTML(a.phone)}</td>
              <td>${waHTML(a.whatsAppPhone)}</td>
              ${admin ? `<td class="kc-acts"><button class="kc-mini danger" data-act="remove-ameen" data-m="${a.memberId}">🗑 ${tr("إزالة", "Remove")}</button></td>` : ""}
            </tr>`).join("")
        )
      : empty("✝", tr("لا يوجد أمناء لهذه الكنيسة.", "No Ameens for this church."));

    const teamTitle = `<div class="kc-head" style="margin-top:18px"><span class="kc-badge warn">🤝 ${tr("فريق الخدمة والأدوار والمراحل:", "Service Team, Roles & Stages:")} ${S.team.length}</span></div>`;
    const teamTable = S.team.length
      ? table(
          ["#", tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("الدور", "Role"), tr("مراحل الخدمة", "Service Stages")].concat(manage ? [tr("إجراءات", "Actions")] : []),
          S.team.map((t, i) => {
            const mid = t.memberId ?? t.id;
            return `<tr>
              <td>${i + 1}</td>
              <td><b>${esc(t.fullName)}</b></td>
              <td>${phoneHTML(t.phone)}</td>
              <td>${roleBadge(t.role)}</td>
              <td>${stagesBadgesHTML(t.serviceStages)}</td>
              ${manage ? `<td class="kc-acts"><button class="kc-mini" data-act="set-team-role" data-m="${mid}">✎ ${tr("الدور والمراحل", "Role & Stages")}</button></td>` : ""}
            </tr>`;
          }).join("")
        )
      : empty("🤝", tr("لا يوجد فريق خدمة معيّن بعد. يمكنك تعيين الأدوار من تبويب «الأعضاء والطلبات».", "No team members assigned yet. Assign roles from “Members & Requests”."));

    return ameensHead + ameensTable + teamTitle + teamTable;
  };

  // 8) إعدادات الكنيسة
  PANELS.settings = async () => {
    await loadChurches();
    const c = current();
    if (!canManage(c)) {
      return `
        <div class="kc-card kc-settings">
          <h3>⚙ ${esc(c.name)}</h3>
          <div class="kc-meta">📅 ${dayLabel(c.meetingDay)} ${esc(fmtTime(c.meetingTime))}</div>
          <div class="kc-meta">📞 ${tr("الافتقاد بعد", "Follow-up after")} ${esc(c.followUpAfterDays ?? "—")} ${tr("يوم غياب", "days absent")}</div>
          <div class="kc-note">${tr("تعديل إعدادات الكنيسة للأمناء والأدمن فقط.", "Only Ameens and admins can edit church settings.")}</div>
        </div>`;
    }
    const days = DAY_NAMES.map((_, i) => ({ value: i, label: (isAr() ? DAYS_AR : DAY_NAMES)[i] }));

    const parts = timeHM(c.meetingTime).split(":").map(Number);
    const h24 = parts[0] || 0;
    const mm = parts[1] || 0;
    const h12 = h24 % 12 || 12;
    const isPm = h24 >= 12;
    const mins = [...new Set(Array.from({ length: 12 }, (_, i) => i * 5).concat(mm))].sort((a, b) => a - b);

    return `
      <form id="kc-settings-form" class="kc-card kc-settings" novalidate>
        <h3>⚙ ${tr("إعدادات", "Settings of")} ${esc(c.name)}</h3>
        <div class="kc-field"><label>${tr("يوم الاجتماع", "Meeting day")}</label>${selHTML('name="meetingDay"', days, dayIdx(c.meetingDay))}</div>
        <div class="kc-field"><label>${tr("ميعاد الاجتماع", "Meeting time")}</label>
          <div style="display:flex;gap:8px">
            ${selHTML('name="mHour"', Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) })), h12)}
            ${selHTML('name="mMin"', mins.map((x) => ({ value: x, label: pad(x) })), mm)}
            ${selHTML('name="mAmPm"', [{ value: "am", label: tr("صباحًا", "AM") }, { value: "pm", label: tr("مساءً", "PM") }], isPm ? "pm" : "am")}
          </div>
        </div>
        <div class="kc-field"><label>${tr("الافتقاد بعد (أيام غياب)", "Follow-up after (days absent)")}</label><input type="number" name="followUpAfterDays" min="1" max="365" value="${esc(c.followUpAfterDays ?? 14)}" required></div>
        <div class="kc-err" id="kc-settings-err"></div>
        <div class="kc-actions"><button type="submit" class="kc-btn primary">${tr("حفظ الإعدادات", "Save settings")}</button></div>
      </form>`;
  };

  /* ---------------- Render ---------------- */
  function tilesHTML() {
    return `<div class="kc-tiles">${TILES.map((t) => `
      <button type="button" class="kc-tile ${S.view === t.k ? "active" : ""}" data-tile="${t.k}">
        <span class="ico">${t.icon}</span><b>${isAr() ? t.ar : t.en}</b>
      </button>`).join("")}</div>`;
  }

  function renderBar() {
    const bar = $("kc-bar");
    if (!bar) return;
    if (S.view === "churches") { bar.innerHTML = ""; return; }
    const list = selectable();
    if (!list.length) {
      bar.innerHTML = `<div class="kc-note">${tr("لا توجد كنيسة متاحة لك. انضم لكنيسة من «كل الكنايس & كنايسي».", "No church available to you. Join one from “All & My Churches”.")}</div>`;
      return;
    }
    const c = current();
    S.churchId = c.id;
    localStorage.setItem("kcChurch", String(c.id));
    bar.innerHTML = `<div class="kc-bar"><label for="kc-church-select">⛪ ${tr("الكنيسة", "Church")}</label>${selHTML('id="kc-church-select"', list.map((x) => ({ value: x.id, label: x.name })), c.id)}</div>`;
  }

  async function loadPanel() {
    const panel = $("kc-panel");
    if (!panel) return;
    const my = ++S.seq;
    if (S.view !== "churches" && !current()) { panel.innerHTML = ""; return; }
    panel.innerHTML = `<div class="kc-loading">${tr("جاري التحميل...", "Loading...")}</div>`;
    try {
      const html = await PANELS[S.view]();
      if (my === S.seq) panel.innerHTML = html;
    } catch (err) {
      if (my === S.seq) panel.innerHTML = `<div class="kc-error">${esc(err.message)}</div>`;
    }
  }

  function render() {
    const r = root();
    if (!r) return;
    r.innerHTML = tilesHTML() + `<div id="kc-bar"></div><div id="kc-panel" class="kc-panel"></div>`;
    renderBar();
    loadPanel();
  }

  /* ---------------- Actions ---------------- */
  const reload = () => loadPanel();
  const churchById = (id) => S.all.find((c) => String(c.id) === String(id)) || S.mine.find((c) => String(c.id) === String(id));
  const churchFields = (c = {}) => [
    { name: "name", label: tr("اسم الكنيسة", "Name"), value: c.name, required: true, maxlength: 120 },
    { name: "city", label: tr("المدينة", "City"), value: c.city, maxlength: 80 },
    { name: "description", label: tr("الوصف", "Description"), type: "textarea", value: c.description, maxlength: 400 }
  ];
  const logoField = () => ({ name: "logo", label: tr("شعار الكنيسة (اختياري)", "Church logo (optional)"), type: "file" });
  async function uploadLogo(churchId, file) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    await api(`/Churches/${churchId}/logo`, { method: "POST", body: fd });
  }
  const churchBody = (v) => JSON.stringify({ name: v.name, city: v.city || null, description: v.description || null });
  const gradeVal = (v) => (v.grade ? Number(v.grade) : null);

  async function bindMemberEmailAutoFill(form) {
    const emailInp = form.elements.email;
    const nameInp = form.elements.fullName;
    if (!emailInp || !nameInp || !isAdmin()) return;
    let usersCache = null;
    emailInp.addEventListener("blur", async () => {
      const em = emailInp.value.trim().toLowerCase();
      if (!em || !EMAIL_RE.test(em)) return;
      try {
        if (!usersCache) usersCache = (await api("/Auth/users")) || [];
        const matched = usersCache.find((u) => String(u.email || "").toLowerCase() === em);
        if (matched && !nameInp.value.trim()) {
          nameInp.value = matched.userName || "";
        }
      } catch {}
    });
  }

  function openRoleModal(member) {
    const c = current();
    const mid = member.memberId ?? member.id;
    const rObj = findRole(member.role);
    openModal({
      title: tr("تحديد الدور ومراحل الخدمة", "Set Role & Service Stages"),
      sub: member.fullName,
      fields: [
        {
          name: "role",
          label: tr("الدور في الكنيسة", "Church Role"),
          type: "select",
          value: rObj ? rObj.v : 0,
          options: ROLE_DEFS.map((r) => ({ value: r.v, label: isAr() ? r.ar : r.en }))
        },
        {
          name: "serviceStages",
          label: tr("مراحل الخدمة (للخادم والأمين)", "Service Stages (for Servant / Ameen)"),
          type: "stages-check",
          value: member.serviceStages || []
        }
      ],
      onSubmit: async (v) => {
        await api(`/Churches/${c.id}/members/${mid}/role`, {
          method: "PUT",
          body: JSON.stringify({
            role: Number(v.role),
            serviceStages: v.serviceStages
          })
        });
        say(tr("تم تحديث الدور ومراحل الخدمة ✓", "Role & stages updated ✓"));
        reload();
      }
    });
  }

  async function openGroupModal(group = null) {
    const c = current();
    const team = S.team.length ? S.team : toArr(await api(`/Churches/${c.id}/team`).catch(() => []));
    const servantOpts = [{ value: "", label: tr("— بدون خادم محدد —", "— No assigned servant —") }].concat(
      team.map((t) => ({ value: t.memberId ?? t.id, label: `${t.fullName} (${roleLabel(t.role)})` }))
    );
    openModal({
      title: group ? tr("تعديل مجموعة افتقاد", "Edit Follow-up Group") : tr("إنشاء مجموعة افتقاد", "Create Follow-up Group"),
      sub: c.name,
      fields: [
        { name: "name", label: tr("اسم المجموعة", "Group Name"), value: group?.name || group?.title || "", required: true, maxlength: 100 },
        { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", value: group?.stage || "", grade: group?.grade || "", allowEmpty: true },
        { name: "followUpServantMemberId", label: tr("خادم الافتقاد المسؤول", "Assigned Follow-Up Servant"), type: "select", value: group?.followUpServantMemberId ?? group?.servantMemberId ?? "", options: servantOpts }
      ],
      onSubmit: async (v) => {
        const payload = JSON.stringify({
          name: v.name,
          stage: v.stage === "" ? null : Number(v.stage),
          followUpServantMemberId: v.followUpServantMemberId === "" ? null : Number(v.followUpServantMemberId)
        });
        if (group) await api(`/Churches/${c.id}/groups/${group.id}`, { method: "PUT", body: payload });
        else await api(`/Churches/${c.id}/groups`, { method: "POST", body: payload });
        say(tr("تم حفظ المجموعة ✓", "Group saved ✓"));
        reload();
      }
    });
  }

  const ACTIONS = {
    contact: async (b) => {
      const c = churchById(b.dataset.id);
      if (!c) return;
      const ameens = (await api(`/Churches/${c.id}/ameens`)) || [];
      const info = `<div class="kc-contact-meta">${c.city ? "📍 " + esc(c.city) + " · " : ""}📅 ${dayLabel(c.meetingDay)} ${esc(fmtTime(c.meetingTime))}</div>`;
      const rows = ameens.length
        ? ameens.map((a) => `
            <div class="kc-contact">
              <div class="kc-contact-name">✝ ${esc(a.fullName)}</div>
              <div class="kc-contact-actions">
                ${a.phone ? `<a class="kc-btn ghost" dir="ltr" href="tel:${esc(a.phone)}">📞 ${esc(a.phone)}</a>` : ""}
                ${waBtn(a.whatsAppPhone || a.phone)}
              </div>
            </div>`).join("")
        : `<div class="kc-empty"><div>✝</div><b>${tr("لا يوجد أمين لهذه الكنيسة بعد.", "This church has no Ameen yet.")}</b></div>`;
      openInfo({ title: tr("معلومات التواصل — أمناء الكنيسة", "Contact info — Church Ameens"), sub: c.name, html: info + rows });
    },

    "add-church": async () => openModal({
      title: tr("إضافة كنيسة", "Add church"),
      fields: churchFields().concat([logoField()]),
      onSubmit: async (v) => {
        if (v.logo && v.logo.size > MAX_LOGO) throw new Error(tr("الصورة أكبر من 2MB.", "Image is larger than 2MB."));
        const created = await api("/Churches", { method: "POST", body: churchBody(v) });
        const newId = created && typeof created === "object" ? (created.id ?? created.Id) : created;
        if (v.logo && newId) await uploadLogo(newId, v.logo);
        say(tr("تمت إضافة الكنيسة ✓", "Church added ✓"));
        reload();
      }
    }),

    "edit-church": async (b) => {
      const c = churchById(b.dataset.id);
      if (!c) return;
      openModal({
        title: tr("تعديل الكنيسة", "Edit church"),
        fields: churchFields(c).concat([logoField()]),
        onSubmit: async (v) => {
          if (v.logo && v.logo.size > MAX_LOGO) throw new Error(tr("الصورة أكبر من 2MB.", "Image is larger than 2MB."));
          await api(`/Churches/${c.id}`, { method: "PUT", body: churchBody(v) });
          await uploadLogo(c.id, v.logo);
          say(tr("تم الحفظ ✓", "Saved ✓"));
          reload();
        }
      });
    },

    open: async (b) => {
      S.churchId = b.dataset.id;
      localStorage.setItem("kcChurch", String(S.churchId));
      const c = churchById(S.churchId);
      S.view = canManage(c) ? "members" : (isServantOrAmeen(c) ? "attendance" : "events");
      render();
    },

    join: async (b) => {
      const c = churchById(b.dataset.id);
      if (!c) return;
      openModal({
        title: tr("طلب انضمام", "Join request"), sub: c.name, submitLabel: tr("إرسال الطلب", "Send request"),
        fields: [
          phoneField(),
          { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", required: true }
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/join`, { method: "POST", body: JSON.stringify({ stage: Number(v.stage), grade: gradeVal(v), phone: v.phone }) });
          say(tr("تم إرسال طلب الانضمام ✓", "Join request sent ✓"));
          reload();
        }
      });
    },

    "my-profile": async (b) => {
      const c = churchById(b.dataset.id);
      if (!c) return;
      openModal({
        title: tr("بياناتي في الكنيسة", "My church profile"), sub: c.name,
        fields: [
          { name: "fullName", label: tr("الاسم", "Full name"), maxlength: 100 },
          phoneField(),
          { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", allowEmpty: true }
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/my-profile`, {
            method: "PUT",
            body: JSON.stringify({ phone: v.phone, stage: v.stage === "" ? null : Number(v.stage), grade: v.stage === "" ? null : gradeVal(v), fullName: v.fullName || null })
          });
          say(tr("تم تحديث بياناتك ✓", "Profile updated ✓"));
        }
      });
    },

    decide: async (b) => {
      const c = current();
      await api(`/Churches/${c.id}/members/${b.dataset.m}/${b.dataset.do}`, { method: "POST" });
      say(tr("تم ✓", "Done ✓"));
      reload();
    },

    "set-role": async (b) => {
      const m = S.members.find((x) => String(x.id) === String(b.dataset.m));
      if (m) openRoleModal(m);
    },

    "set-team-role": async (b) => {
      const t = S.team.find((x) => String(x.memberId ?? x.id) === String(b.dataset.m));
      if (t) openRoleModal(t);
    },

    "add-member": async () => {
      const c = current();
      openModal({
        title: tr("إضافة عضو", "Add member"), sub: c.name,
        fields: [
          {
            name: "email",
            label: tr("الإيميل (اختياري — لو مسجل هيجيب اسمه تلقائي)", "Email (optional — auto-fills name if registered)"),
            type: "email",
            ltr: true,
            placeholder: "example@gmail.com",
            pattern: EMAIL_RE,
            patternMsg: tr("صيغة الإيميل غير صحيحة.", "Invalid email format.")
          },
          {
            name: "fullName",
            label: tr("الاسم (مطلوب فقط لو بدون إيميل)", "Full name (required only if no email)"),
            maxlength: 100,
            placeholder: tr("يتملأ تلقائياً لو الإيميل مسجل", "Auto-filled if email is registered")
          },
          phoneField(),
          { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", required: true }
        ],
        onOpen: bindMemberEmailAutoFill,
        onSubmit: async (v) => {
          if (!v.email && !v.fullName) {
            throw new Error(tr("اكتب الاسم أو الإيميل المسجل.", "Enter full name or registered email."));
          }
          await api(`/Churches/${c.id}/members`, {
            method: "POST",
            body: JSON.stringify({
              fullName: v.fullName || null,
              email: v.email || null,
              phone: v.phone,
              stage: Number(v.stage),
              grade: gradeVal(v)
            })
          });
          say(tr("تمت إضافة العضو ✓", "Member added ✓"));
          reload();
        }
      });
    },

    "edit-member": async (b) => {
      const c = current();
      const m = S.members.find((x) => String(x.id) === String(b.dataset.m));
      if (!m) return;
      openModal({
        title: tr("تعديل عضو", "Edit member"), sub: c.name,
        fields: [
          {
            name: "email",
            label: tr("الإيميل (اختياري)", "Email (optional)"),
            type: "email",
            value: m.email || "",
            ltr: true,
            readonly: m.userId != null && !!m.email,
            placeholder: "example@gmail.com",
            pattern: EMAIL_RE,
            patternMsg: tr("صيغة الإيميل غير صحيحة.", "Invalid email format.")
          },
          { name: "fullName", label: tr("الاسم", "Full name"), value: m.fullName, required: true, maxlength: 100 },
          phoneField(m.phone),
          { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", value: m.stage, grade: m.grade, required: true }
        ],
        onOpen: bindMemberEmailAutoFill,
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/members/${m.id}`, {
            method: "PUT",
            body: JSON.stringify({
              fullName: v.fullName,
              email: v.email || null,
              phone: v.phone,
              stage: Number(v.stage),
              grade: gradeVal(v)
            })
          });
          say(tr("تم الحفظ ✓", "Saved ✓"));
          reload();
        }
      });
    },

    "del-member": async (b) => {
      const c = current();
      const m = S.members.find((x) => String(x.id) === String(b.dataset.m));
      if (!m) return;
      if (!confirm(tr(`حذف العضو «${m.fullName}» من الكنيسة نهائياً؟`, `Permanently remove "${m.fullName}" from this church?`))) return;
      b.disabled = true;
      try {
        await api(`/Churches/${c.id}/members/${m.id}`, { method: "DELETE" });
        say(tr("تم حذف العضو ✓", "Member deleted ✓"));
        reload();
      } catch (err) {
        b.disabled = false;
        throw err;
      }
    },

    "toggle-att": async (b) => {
      const c = current();
      b.disabled = true;
      try {
        await api(`/Churches/${c.id}/attendance/${b.dataset.m}?date=${encodeURIComponent(S.att.date)}`, { method: "PUT" });
        const q = new URLSearchParams({ date: S.att.date });
        if (S.att.stage !== "") q.set("stage", S.att.stage);
        S.sheet = await api(`/Churches/${c.id}/attendance?${q}`);
        $("kc-panel").innerHTML = attendanceHTML();
      } catch (err) { b.disabled = false; throw err; }
    },

    /* ---- مجموعات الافتقاد ---- */
    "add-group": async () => openGroupModal(null),
    "edit-group": async (b) => {
      const g = S.groups.find((x) => String(x.id) === String(b.dataset.g));
      if (g) openGroupModal(g);
    },
    "del-group": async (b) => {
      const c = current();
      const g = S.groups.find((x) => String(x.id) === String(b.dataset.g));
      if (!g || !confirm(tr(`حذف مجموعة «${g.name || g.title}»؟`, `Delete group "${g.name || g.title}"?`))) return;
      await api(`/Churches/${c.id}/groups/${g.id}`, { method: "DELETE" });
      say(tr("تم حذف المجموعة ✓", "Group deleted ✓"));
      reload();
    },
    "auto-split-groups": async () => {
      const c = current();
      openModal({
        title: tr("تقسيم مجموعات الافتقاد تلقائياً", "Auto-Split Follow-up Groups"),
        sub: c.name,
        submitLabel: tr("بدء التقسيم", "Split Now"),
        fields: [
          { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", required: true },
          { name: "groupSize", label: tr("عدد الأعضاء في كل مجموعة", "Members per group"), type: "number", value: 10, min: 2, max: 100, required: true },
          { name: "onlyUnassigned", label: tr("نطاق التقسيم", "Scope"), type: "checkbox", checked: true, boxLabel: tr("تقسيم الأعضاء غير الموزعين على مجموعات فقط", "Only split unassigned members") }
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/groups/auto-split`, {
            method: "POST",
            body: JSON.stringify({
              stage: Number(v.stage),
              groupSize: Number(v.groupSize),
              onlyUnassigned: v.onlyUnassigned
            })
          });
          say(tr("تم تقسيم المجموعات تلقائياً ✓", "Groups auto-split successfully ✓"));
          reload();
        }
      });
    },
    "view-group-members": async (b) => {
      const c = current();
      const g = S.groups.find((x) => String(x.id) === String(b.dataset.g));
      if (!g) return;
      const members = toArr(await api(`/Churches/${c.id}/groups/${g.id}/members`));
      const manage = canManage(c);
      if (!members.length) {
        openInfo({
          title: g.name || tr("أعضاء المجموعة", "Group Members"),
          sub: stageLabel(g.stage),
          html: empty("👥", tr("لا يوجد أعضاء في هذه المجموعة بعد.", "No members in this group yet."))
        });
        return;
      }
      if (manage) {
        openModal({
          title: `${tr("أعضاء:", "Members:")} ${g.name || ""}`,
          sub: tr("حدد الأعضاء لإزالتهم من المجموعة", "Select members to remove from group"),
          submitLabel: tr("إزالة المحددين", "Remove Selected"),
          fields: [
            { name: "memberIds", label: tr("الأعضاء الحاليون", "Current Members"), type: "members-check", members, required: true }
          ],
          onSubmit: async (v) => {
            await api(`/Churches/${c.id}/groups/${g.id}/members/remove`, {
              method: "POST",
              body: JSON.stringify({ memberIds: v.memberIds })
            });
            say(tr("تمت إزالة الأعضاء المحددين ✓", "Selected members removed ✓"));
            reload();
          }
        });
      } else {
        openInfo({
          title: g.name || tr("أعضاء المجموعة", "Group Members"),
          sub: stageLabel(g.stage),
          html: members.map((m) => `
            <div class="kc-contact">
              <div class="kc-contact-name">👤 ${esc(m.fullName)} <small style="opacity:.7">(${esc(stageLabel(m.stage, m.grade))})</small></div>
              <div class="kc-contact-actions">${phoneHTML(m.phone)} ${waBtn(m.phone)}</div>
            </div>`).join("")
        });
      }
    },
    "assign-group-members": async (b) => {
      const c = current();
      const g = S.groups.find((x) => String(x.id) === String(b.dataset.g));
      if (!g) return;
      const q = new URLSearchParams({ status: "1" });
      if (g.stage) q.set("stage", g.stage);
      const allApproved = toArr(await api(`/Churches/${c.id}/members?${q}`));
      openModal({
        title: `${tr("إضافة أعضاء إلى:", "Add members to:")} ${g.name || ""}`,
        sub: stageLabel(g.stage),
        submitLabel: tr("إضافة المحددين", "Assign Selected"),
        fields: [
          { name: "memberIds", label: tr("اختر الأعضاء", "Select Members"), type: "members-check", members: allApproved, required: true }
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/groups/${g.id}/members`, {
            method: "POST",
            body: JSON.stringify({ memberIds: v.memberIds })
          });
          say(tr("تمت إضافة الأعضاء للمجموعة ✓", "Members assigned to group ✓"));
          reload();
        }
      });
    },

    /* ---- تسجيل الافتقاد وتقاريره ---- */
    "do-followup": async (b) => {
      const c = current();
      const mid = b.dataset.m;
      const m = S.followups.find((x) => String(x.memberId) === String(mid))
        || S.servantsFollowup.find((x) => String(x.memberId ?? x.id) === String(mid));
      openModal({
        title: tr("تسجيل تقرير افتقاد", "Record Follow-up Report"),
        sub: m ? m.fullName : "",
        fields: [
          {
            name: "outcome",
            label: tr("نتيجة الافتقاد", "Follow-up Outcome"),
            type: "select",
            value: "Reached",
            required: true,
            options: OUTCOMES.map((o) => ({ value: o.v, label: isAr() ? o.ar : o.en }))
          },
          { name: "note", label: tr("ملاحظة (اختياري)", "Note (optional)"), type: "textarea", maxlength: 500 }
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/follow-up/reports`, {
            method: "POST",
            body: JSON.stringify({
              memberId: /^\d+$/.test(String(mid)) ? Number(mid) : mid,
              outcome: v.outcome,
              note: v.note || ""
            })
          });
          say(tr("تم تسجيل تقرير الافتقاد ✓", "Follow-up report saved ✓"));
          reload();
        }
      });
    },

    "add-event": async () => eventModal(null),
    "edit-event": async (b) => eventModal(S.events.find((x) => String(x.id) === String(b.dataset.e))),

    "del-event": async (b) => {
      const c = current();
      const ev = S.events.find((x) => String(x.id) === String(b.dataset.e));
      if (!ev || !confirm(tr(`حذف «${ev.title}»؟`, `Delete "${ev.title}"?`))) return;
      await api(`/Churches/${c.id}/events/${ev.id}`, { method: "DELETE" });
      say(tr("تم الحذف ✓", "Deleted ✓"));
      reload();
    },

    "assign-ameen": async () => {
      const c = current();
      openModal({
        title: tr("تعيين أمين", "Assign Ameen"), sub: c.name,
        fields: [
          { name: "email", label: tr("الإيميل", "Email"), type: "email", required: true, ltr: true, pattern: EMAIL_RE, patternMsg: tr("إيميل غير صحيح.", "Invalid email.") },
          phoneField()
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/ameen`, { method: "POST", body: JSON.stringify({ email: v.email, phone: v.phone }) });
          say(tr("تم تعيين الأمين ✓", "Ameen assigned ✓"));
          reload();
        }
      });
    },

    "remove-ameen": async (b) => {
      const c = current();
      const a = S.ameens.find((x) => String(x.memberId) === String(b.dataset.m));
      if (!a || !confirm(tr(`إزالة ${a.fullName} من الأمناء؟`, `Remove ${a.fullName} as Ameen?`))) return;
      await api(`/Churches/${c.id}/ameen/${a.memberId}`, { method: "DELETE" });
      say(tr("تمت الإزالة ✓", "Removed ✓"));
      reload();
    }
  };

  function eventModal(ev) {
    const c = current();
    openModal({
      title: ev ? tr("تعديل إيفنت", "Edit event") : tr("إضافة إيفنت", "Add event"), sub: c.name,
      fields: [
        { name: "title", label: tr("العنوان", "Title"), value: ev && ev.title, required: true, maxlength: 140 },
        { name: "location", label: tr("المكان", "Location"), value: ev && ev.location, maxlength: 160 },
        { name: "description", label: tr("الوصف", "Description"), type: "textarea", value: ev && ev.description, maxlength: 1000 },
        { name: "startsAt", label: tr("يبدأ", "Starts"), type: "datetime-local", value: ev ? toLocalInput(ev.startsAt) : "", required: true },
        { name: "endsAt", label: tr("ينتهي (اختياري)", "Ends (optional)"), type: "datetime-local", value: ev ? toLocalInput(ev.endsAt) : "" }
      ],
      onSubmit: async (v) => {
        const body = JSON.stringify({
          title: v.title,
          description: v.description || null,
          location: v.location || null,
          startsAt: withSeconds(v.startsAt),
          endsAt: withSeconds(v.endsAt)
        });
        if (ev) await api(`/Churches/${c.id}/events/${ev.id}`, { method: "PUT", body });
        else await api(`/Churches/${c.id}/events`, { method: "POST", body });
        say(tr("تم الحفظ ✓", "Saved ✓"));
        reload();
      }
    });
  }

  /* ---------------- Events binding (delegation) ---------------- */
  const r0 = root();
  if (r0) {
    r0.addEventListener("click", (e) => {
      const tile = e.target.closest("[data-tile]");
      if (tile) { S.view = tile.dataset.tile; render(); return; }

      const sc = e.target.closest("[data-scope]");
      if (sc) { S.scope = sc.dataset.scope; loadPanel(); return; }

      const futab = e.target.closest("[data-futab]");
      if (futab) { S.fu.tab = futab.dataset.futab; loadPanel(); return; }

      const b = e.target.closest("[data-act]");
      if (!b) return;
      const fn = ACTIONS[b.dataset.act];
      if (fn) fn(b).catch(showErr);
    });

    r0.addEventListener("change", (e) => {
      const t = e.target;
      if (t.id === "kc-church-select") { S.churchId = t.value; localStorage.setItem("kcChurch", t.value); loadPanel(); return; }
      if (t.dataset && t.dataset.filter) { S.mf[t.dataset.filter] = t.value; loadPanel(); return; }
      if (t.id === "kc-att-date") { S.att.date = t.value || todayStr(); loadPanel(); return; }
      if (t.id === "kc-att-stage") { S.att.stage = t.value; loadPanel(); return; }
      if (t.id === "kc-grp-stage") { S.grp.stage = t.value; loadPanel(); return; }
      if (t.id === "kc-fu-stage") { S.fu.stage = t.value; loadPanel(); return; }
      if (t.id === "kc-fu-from") { S.fu.from = t.value; loadPanel(); return; }
      if (t.id === "kc-fu-to") { S.fu.to = t.value; loadPanel(); }
    });

    r0.addEventListener("submit", async (e) => {
      if (e.target.id !== "kc-settings-form") return;
      e.preventDefault();
      const f = e.target;
      const err = $("kc-settings-err");
      const days = Number(f.elements.followUpAfterDays.value);
      if (!(days >= 1 && days <= 365)) { err.textContent = tr("عدد الأيام لازم يكون بين 1 و 365.", "Days must be between 1 and 365."); return; }
      const h = (Number(f.elements.mHour.value) % 12) + (f.elements.mAmPm.value === "pm" ? 12 : 0);
      const time = `${pad(h)}:${pad(Number(f.elements.mMin.value))}:00`;
      err.textContent = "";
      const btn = f.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await api(`/Churches/${current().id}/settings`, {
          method: "PUT",
          body: JSON.stringify({ meetingDay: Number(f.elements.meetingDay.value), meetingTime: time, followUpAfterDays: days })
        });
        say(tr("تم حفظ إعدادات الكنيسة ✓", "Church settings saved ✓"));
        reload();
      } catch (ex) {
        err.textContent = ex.message;
      } finally { btn.disabled = false; }
    });
  }

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------------- Public hooks (adminn.js) ---------------- */
  window.KokChurches = {
    async onShow() {
      try { await loadChurches(); } catch (err) { showErr(err); }
      render();
    },
    refresh() {
      const page = $("page-churches");
      if (page && page.classList.contains("active")) render();
    }
  };
})();