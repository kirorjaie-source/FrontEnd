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

  /* ============================================================
     ⚙ إعدادات الـ Enums — لازم تطابق الباك (Domain.Entities)
     ChurchStage: KG=1, Primary=2, Preparatory=3, Secondary=4, University=5, External=6
     n = عدد الصفوف جوه المرحلة (الصف بيتبعت في حقل grade لوحده)
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
  const ROLES = ["Member", "Ameen", "GeneralAmeen", "AssistantAmeen", "Servant", "FollowUpServant", "Secretary"]; // ChurchRole (الترتيب = قيمة الـenum)
  /* ============================================================ */

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const TILES = [
    { k: "churches", icon: "⛪", ar: "كل الكنايس & كنايسي", en: "All & My Churches" },
    { k: "stages", icon: "🏫", ar: "مراحل الكنيسة", en: "Church Stages" },
    { k: "members", icon: "👥", ar: "الأعضاء والطلبات", en: "Members & Requests" },
    { k: "team", icon: "🤝", ar: "الفريق والأدوار", en: "Team & Roles" },
    { k: "attendance", icon: "✅", ar: "الغياب اليومي", en: "Daily Attendance" },
    { k: "followup", icon: "📞", ar: "الافتقاد", en: "Follow-up" },
    { k: "groups", icon: "🗂", ar: "مجموعات الافتقاد", en: "Follow-up Groups" },
    { k: "events", icon: "📅", ar: "الإيفنتس", en: "Events" },
    { k: "ameens", icon: "✝", ar: "أمناء الخدمة", en: "Church Ameens" },
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
  const roleKey = (v) => enumName(v, ROLES).toLowerCase();

  /* ---- المراحل والصفوف ---- */
  const norm = (x) => String(x ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const findStage = (v) => MAIN.find((s) => String(s.v) === String(v) || (v != null && v !== "" && s.key === norm(v)));
  // إعدادات مراحل الكنيسة الحالية (من الباك): { قيمة المرحلة: عدد السنين }
  const STAGE_ICO = { 1: "🧸", 2: "📚", 3: "🎒", 4: "🧑‍🏫", 5: "🏛", 6: "🎓" };
  const gradesOf = (v) => {
    const s = findStage(v);
    if (!s) return 0;
    if (S.cfg) return S.cfg[s.v] ?? 0;
    return s.n;
  };
  const enabledStages = () => (S.cfg ? MAIN.filter((s) => s.v in S.cfg) : MAIN);
  const stageLabel = (v, g) => {
    const s = findStage(v);
    if (!s) return String(v ?? "—");
    if (g && gradesOf(s.v)) return isAr() ? `${ORD_AR[g - 1] || g} ${s.ar}` : `${s.en} ${g}`;
    return isAr() ? s.ar : s.en;
  };
  const stageOptions = (withAll) =>
    (withAll ? [{ value: "", label: tr("كل المراحل", "All stages") }] : [])
      .concat(enabledStages().map((s) => ({ value: s.v, label: isAr() ? s.ar : s.en })));
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
  const ROLE_LBL = {
    member: ["مخدوم", "Member"],
    ameen: ["أمين", "Ameen"],
    generalameen: ["أمين عام", "General Ameen"],
    assistantameen: ["أمين مساعد", "Assistant Ameen"],
    servant: ["خادم", "Servant"],
    followupservant: ["خادم افتقاد", "Follow-up Servant"],
    secretary: ["سكرتارية", "Secretary"]
  };
  function roleLabel(v) {
    const l = ROLE_LBL[roleKey(v)];
    return l ? (isAr() ? l[0] : l[1]) : (enumName(v, ROLES) || "—");
  }
  const roleBadge = (v) => { const k = roleKey(v); return `<span class="kc-badge ${k === "member" ? "" : "info"}">${esc(roleLabel(v))}</span>`; };
  const stagesText = (arr, g) => (arr && arr.length ? arr.map((x) => stageLabel(x, arr.length === 1 && g ? g : 0)).join("، ") : "");

  /* ---- الصلاحيات (مرآة لـ ChurchPermissions.cs في الباك — الباك هو اللي بيفرض فعلياً) ---- */
  const RANK = { generalameen: 50, ameen: 40, assistantameen: 30, secretary: 20, followupservant: 10, servant: 10, member: 0 };
  const GA = "generalameen", AM = "ameen", AS = "assistantameen", SE = "secretary", SV = "servant", FU = "followupservant";
  const MATRIX = {
    roles: [GA, AM], approve: [GA, AM, AS], viewMembers: [GA, AM, AS, SE], attendance: [GA, AM, AS, SE, SV],
    followUp: [GA, AM, AS, FU], followServants: [GA, AM, AS], stages: [GA], viewPhones: [GA, AM, AS, SE, FU],
    events: [GA, AM, AS], groups: [GA, AM, AS], reports: [GA, AM, AS], settings: [GA, AM]
  };
  const myKey = (c) => (c && c.myStatus != null && statusKey(c.myStatus) === "approved" ? roleKey(c.myRole) : "");
  const can = (k, c) => isAdmin() || !!(c && MATRIX[k].includes(myKey(c)));
  const myRank = (c) => (isAdmin() ? 100 : RANK[myKey(c)] || 0);
  const assignableRoles = (c) => {
    if (isAdmin()) return [GA, AM, AS, SE, FU, SV, "member"];
    const k = myKey(c);
    if (k === GA) return [AM, AS, SE, FU, SV, "member"];
    if (k === AM) return [FU, SV, "member"];
    return [];
  };
  const outranks = (c, targetRole) => myRank(c) > (RANK[roleKey(targetRole)] || 0);
  const roleVal = (key) => ROLES.findIndex((r) => r.toLowerCase() === key);
  const statusOptions = () => [{ value: "", label: tr("كل الحالات", "All statuses") }]
    .concat(STATUSES.map((n, i) => { const l = STATUS_LBL[n.toLowerCase()]; return { value: i, label: l ? (isAr() ? l[0] : l[1]) : n }; }));
  const roleOptions = () => [{ value: "", label: tr("كل الأدوار", "All roles") }]
    .concat(ROLES.map((n, i) => ({ value: i, label: roleLabel(i) })));

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
  const phoneHTML = (p, wa) => {
    if (!p) return "—";
    let h = `<a class="kc-link" dir="ltr" href="tel:${esc(p)}">${esc(p)}</a>`;
    const d = wa && wa !== p ? waDigits(wa) : "";
    if (d) h += ` <a class="kc-wa-ic" dir="ltr" title="${tr("واتساب", "WhatsApp")}${wa && wa !== p ? " " + esc(wa) : ""}" href="https://wa.me/${d}" target="_blank" rel="noopener noreferrer">💬</a>`;
    return h;
  };
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
    `الافتقاد = متابعة الأعضاء اللي غابوا ${c.followUpAfterDays ?? "—"} يوم أو أكتر عن الاجتماع. كلّمهم أو ابعتلهم واتساب، وبعدها دوس «تم الافتقاد» وسجّل ملاحظة.`,
    `Follow-up = checking on members absent for ${c.followUpAfterDays ?? "—"}+ days. Call or WhatsApp them, then press “Done” and add a note.`
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
    fu: { stage: "", tab: "" },
    gr: { stage: "" },
    team: [],
    groups: [],
    cfg: null,
    cfgList: [],
    stageSel: null,
    mfGrade: "",
    sheet: null,
    members: [],
    events: [],
    ameens: [],
    followups: []
  };

  const selectable = () => (isAdmin() || S.view === "stages" ? S.all : S.mine);
  const current = () => selectable().find((c) => String(c.id) === String(S.churchId)) || selectable()[0] || null;
  const canManage = (c) => can("approve", c);

  async function loadChurches() {
    const [all, mine] = await Promise.all([api("/Churches"), api("/Churches/mine")]);
    S.all = all || [];
    S.mine = mine || [];
  }

  async function loadStageCfg(churchId) {
    try {
      const list = (await api(`/Churches/${churchId}/stages`)) || [];
      S.cfgList = list;
      S.cfg = {};
      list.forEach((x) => { const st = findStage(x.stage); if (st) S.cfg[st.v] = Number(x.gradesCount) || 0; });
    } catch { S.cfg = null; S.cfgList = []; }
  }

  /* ---------------- Modal ---------------- */
  function closeModal() { const m = $("kc-modal"); if (m) m.remove(); }

  const CONTACT_TYPES = () => [
    { value: "whatsapp", label: tr("واتساب (رقم)", "WhatsApp (number)") },
    { value: "phone", label: tr("اتصال تليفون (رقم)", "Phone call (number)") },
    { value: "link", label: tr("لينك (فورم / موقع)", "Link (form / site)") }
  ];
  const contactRowHTML = (type = "whatsapp", value = "") => {
    const t = String(type || "whatsapp").toLowerCase();
    return `<div class="kc-crow">${selHTML('data-c-type', CONTACT_TYPES(), t)}<input data-c-val dir="ltr" value="${esc(value)}" maxlength="500" placeholder="${t === "link" ? "https://forms.gle/..." : "01xxxxxxxxx"}"><button type="button" class="kc-x" data-c-del aria-label="Remove">✕</button></div>`;
  };

  function fieldHTML(f) {
    const id = `kcf-${f.name}`;
    const v = f.value ?? "";
    let input;
    if (f.type === "select") {
      input = selHTML(`id="${id}" name="${f.name}"`, f.options, v);
    } else if (f.type === "stage" && f.locked) {
      const st = findStage(f.value);
      return `<div class="kc-field"><label>${esc(f.label)}</label><div class="kc-locked">${esc(stageLabel(st ? st.v : f.value, f.grade ? Number(f.grade) : 0))}</div><input type="hidden" name="stage" value="${esc(st ? st.v : f.value)}"><input type="hidden" name="grade" value="${esc(f.grade || "")}"></div>`;
    } else if (f.type === "stage") {
      const st = findStage(f.value);
      const sv = st ? st.v : "";
      const first = { value: "", label: f.allowEmpty ? tr("— بدون تغيير —", "— no change —") : tr("اختر المرحلة", "Select stage") };
      const opts = [first].concat(enabledStages().map((s) => ({ value: s.v, label: isAr() ? s.ar : s.en })));
      input = selHTML(`id="${id}" name="stage" data-stage-main`, opts, sv)
        + `<select name="grade" data-stage-grade style="margin-top:8px;${gradesOf(sv) ? "" : "display:none"}">${gradeOptsHTML(sv, f.grade ?? "")}</select>`;
    } else if (f.type === "rolestage") {
      input = "";
      return `<div class="kc-field"><label for="kcf-role">${tr("الدور", "Role")} *</label>${selHTML('id="kcf-role" name="role" data-role-sel', f.options, f.value ?? "")}</div>
        <div class="kc-field" data-stage-box style="display:none"><label data-stage-label></label><div class="kc-checks">${MAIN.map((s) => `<label class="kc-check"><input type="checkbox" name="svc" value="${s.v}" ${(f.stages || []).some((x) => findStage(x) && findStage(x).v === s.v) ? "checked" : ""}><span>${isAr() ? s.ar : s.en}</span></label>`).join("")}</div>
        <select name="svcgrade" data-svc-grade data-init="${esc(f.serviceGrade ?? "")}" style="display:none;margin-top:10px"></select></div>`;
    } else if (f.type === "contacts") {
      return `<div class="kc-field"><label>${esc(f.label)}</label><div class="kc-contacts" data-contacts>${(f.value || []).map((c) => contactRowHTML(c.type, c.value)).join("")}</div><button type="button" class="kc-mini" data-add-contact>＋ ${tr("إضافة وسيلة حجز", "Add booking method")}</button></div>`;
    } else if (f.type === "wa") {
      const same = !!f.same;
      input = `<label class="kc-same"><input type="checkbox" data-wa-same ${same ? "checked" : ""}><span>${tr("نفس رقم التليفون", "Same as phone")}</span></label>`
        + `<input id="${id}" name="${f.name}" type="tel" value="${same ? "" : esc(v)}" maxlength="11" dir="ltr" placeholder="01xxxxxxxxx" style="${same ? "display:none" : ""}">`;
    } else if (f.type === "file") {
      input = `<input id="${id}" name="${f.name}" type="file" accept="image/png,image/jpeg,image/webp" style="height:auto;padding:10px">`;
    } else if (f.type === "textarea") {
      input = `<textarea id="${id}" name="${f.name}" ${f.maxlength ? `maxlength="${f.maxlength}"` : ""}>${esc(v)}</textarea>`;
    } else {
      input = `<input id="${id}" name="${f.name}" type="${f.type || "text"}" value="${esc(v)}" ${f.maxlength ? `maxlength="${f.maxlength}"` : ""} ${f.ltr ? 'dir="ltr"' : ""} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""} ${f.readonly ? "readonly" : ""}>`;
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
    const first = form.querySelector("input:not([readonly]),select,textarea");
    if (first) first.focus();

    const cBox = form.querySelector("[data-contacts]");
    if (cBox) {
      form.querySelector("[data-add-contact]").addEventListener("click", () => {
        if (cBox.children.length >= 5) { errBox.textContent = tr("الحد الأقصى 5 وسائل حجز.", "Maximum 5 booking methods."); return; }
        cBox.insertAdjacentHTML("beforeend", contactRowHTML("whatsapp", ""));
      });
      cBox.addEventListener("click", (e) => { const d = e.target.closest("[data-c-del]"); if (d) d.closest(".kc-crow").remove(); });
      cBox.addEventListener("change", (e) => {
        if (!e.target.matches("[data-c-type]")) return;
        const inp = e.target.closest(".kc-crow").querySelector("[data-c-val]");
        inp.placeholder = e.target.value === "link" ? "https://forms.gle/..." : "01xxxxxxxxx";
      });
    }

    form.querySelectorAll("[data-wa-same]").forEach((cb) => {
      const inp = cb.closest(".kc-field").querySelector("input[type=tel]");
      const sync = () => { if (cb.checked) inp.value = ""; inp.style.display = cb.checked ? "none" : ""; if (!cb.checked) inp.focus(); };
      cb.addEventListener("change", sync);
    });

    const mainSel = form.querySelector("[data-stage-main]");
    if (mainSel) {
      mainSel.addEventListener("change", () => {
        const g = form.querySelector("[data-stage-grade]");
        g.innerHTML = gradeOptsHTML(mainSel.value, "");
        g.style.display = gradesOf(mainSel.value) ? "" : "none";
      });
    }

    const roleSel = form.querySelector("[data-role-sel]");
    if (roleSel) {
      const box = form.querySelector("[data-stage-box]");
      const lbl = form.querySelector("[data-stage-label]");
      const sync = () => {
        const rk = (ROLES[Number(roleSel.value)] || "").toLowerCase();
        const multi = rk === AM || rk === AS;
        const single = rk === SV || rk === FU || rk === SE;
        box.style.display = multi || single ? "" : "none";
        lbl.textContent = multi ? tr("مراحل الخدمة (واحدة أو أكتر)", "Service stages (one or more)")
          : rk === SE ? tr("مرحلة السكرتارية (واحدة) — وممكن تحدد سنة بعينها", "Secretary stage (one) — optionally one year")
          : tr("مرحلة الخدمة (واحدة فقط)", "Service stage (one only)");
        const inputs = box.querySelectorAll("input[name=svc]");
        if (single) {
          let seen = false;
          inputs.forEach((i) => { i.type = "radio"; if (i.checked) { if (seen) i.checked = false; seen = true; } });
        } else inputs.forEach((i) => { i.type = "checkbox"; });
        syncGrade();
      };
      const gradeSel = form.querySelector("[data-svc-grade]");
      const syncGrade = () => {
        if (!gradeSel) return;
        const rk = (ROLES[Number(roleSel.value)] || "").toLowerCase();
        const picked = box.querySelector("input[name=svc]:checked");
        const n = rk === SE && picked ? gradesOf(Number(picked.value)) : 0;
        if (!n) { gradeSel.style.display = "none"; gradeSel.value = ""; return; }
        const keep = gradeSel.value || gradeSel.dataset.init || "";
        let h = `<option value="">${tr("كل السنين (المرحلة كلها)", "All years (whole stage)")}</option>`;
        for (let i = 1; i <= n; i++) h += `<option value="${i}" ${String(keep) === String(i) ? "selected" : ""}>${esc(stageLabel(Number(picked.value), i))}</option>`;
        gradeSel.innerHTML = h;
        gradeSel.dataset.init = "";
        gradeSel.style.display = "";
      };
      box.addEventListener("change", (e) => { if (e.target.name === "svc") { gradeSel && (gradeSel.dataset.init = ""); if (gradeSel) gradeSel.value = ""; syncGrade(); } });
      roleSel.addEventListener("change", sync);
      sync();
    }

    if (typeof onOpen === "function") onOpen(form, errBox);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const vals = {};
      for (const f of fields) {
        if (f.type === "file") { vals[f.name] = form.elements[f.name].files[0] || null; continue; }
        if (f.type === "contacts") {
          const out = [];
          for (const row of form.querySelectorAll(".kc-crow")) {
            const t = row.querySelector("[data-c-type]").value;
            const val = row.querySelector("[data-c-val]").value.trim();
            if (!val) continue;
            if ((t === "whatsapp" || t === "phone") && !PHONE_RE.test(val.replace(/\D/g, ""))) { errBox.textContent = tr("رقم غير صحيح (11 رقم يبدأ بـ 01).", "Invalid number (11 digits starting with 01)."); return; }
            out.push({ type: t, value: val });
          }
          vals[f.name] = out;
          continue;
        }
        if (f.type === "rolestage") {
          const rk = (ROLES[Number(form.elements.role.value)] || "").toLowerCase();
          const svc = Array.from(form.querySelectorAll('input[name="svc"]:checked')).map((x) => Number(x.value));
          if (form.elements.role.value === "") { errBox.textContent = tr("اختر الدور.", "Select a role."); return; }
          if ((rk === AM || rk === AS) && svc.length < 1) { errBox.textContent = tr("اختر مرحلة واحدة على الأقل.", "Select at least one stage."); return; }
          if ((rk === SV || rk === FU || rk === SE) && svc.length !== 1) { errBox.textContent = tr("اختر مرحلة واحدة بالظبط.", "Select exactly one stage."); return; }
          vals.role = Number(form.elements.role.value);
          vals.stages = [AM, AS, SE, SV, FU].includes(rk) ? svc : [];
          const gs = form.elements.svcgrade;
          vals.svcGrade = rk === SE && gs && gs.value ? Number(gs.value) : null;
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

  const waField = (phone = "", wa = "") => ({
    name: "whatsapp", label: tr("رقم الواتساب", "WhatsApp number"), type: "wa",
    value: wa, same: !wa || waDigits(wa) === waDigits(phone),
    pattern: PHONE_RE, patternMsg: tr("رقم الواتساب غير صحيح (11 رقم يبدأ بـ 01)", "Invalid WhatsApp number (11 digits starting with 01).")
  });

  /* ---------------- Panels ---------------- */
  const PANELS = {};
  const lockedPanel = () => empty("🔒", tr("هذا القسم للأمين والأدمن فقط.", "This section is for Ameens and admins only."));

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
    actions += `<button type="button" class="kc-btn primary" data-act="open" data-id="${c.id}">${tr("فتح", "Open")}</button>`;
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
          ${c.myRole != null && st === "approved" ? `<span class="kc-badge info">${roleLabel(c.myRole)}</span>` : ""}
          ${counts}
        </div>
        <div class="kc-card-actions">${actions}</div>
      </article>`;
  }

  // مراحل الكنيسة (الشاشة اللي بتظهر بعد دخول الكنيسة)
  PANELS.stages = async () => {
    const c = current();
    const st = c.myStatus == null ? "" : statusKey(c.myStatus);
    const admin = isAdmin();
    const manage = can("approve", c);
    const manageBtn = can("stages", c) ? `<button type="button" class="kc-btn primary" data-act="manage-stages">⚙ ${tr("إدارة المراحل", "Manage stages")}</button>` : "";
    if (!S.cfgList.length) return `<div class="kc-head"><span></span>${manageBtn}</div>` + empty("🏫", tr("لا توجد مراحل.", "No stages."));

    // مخدوم معتمد: يشوف مرحلته وسنته بس
    const onlyMine = !admin && st === "approved" && myKey(c) === "member";
    if (onlyMine && S.cfgList.length === 1 && S.stageSel == null) S.stageSel = String((findStage(S.cfgList[0].stage) || {}).v ?? "");

    // ---- الخطوة 2: جوه المرحلة — السنين ----
    const sel = S.stageSel != null ? findStage(S.stageSel) : null;
    const selCfg = sel ? S.cfgList.find((x) => (findStage(x.stage) || {}).v === sel.v) : null;
    if (sel && selCfg) {
      const n = Number(selCfg.gradesCount) || 0;
      let years = n ? Array.from({ length: n }, (_, i) => i + 1) : [0];
      if (onlyMine && n && selCfg.myGrade != null) years = [Number(selCfg.myGrade)];
      const head = `<div class="kc-head">
          ${onlyMine ? "<span></span>" : `<button type="button" class="kc-btn ghost" data-act="back-stages">← ${tr("كل المراحل", "All stages")}</button>`}
          <span class="kc-badge info">${STAGE_ICO[sel.v] || "🏫"} ${isAr() ? sel.ar : sel.en} — ${esc(c.name)}</span>
        </div>`;
      const cards = years.map((g) => {
        let actions = "";
        if ((!st || st === "rejected" || st === "revoked")) actions += `<button type="button" class="kc-btn gold" data-act="join" data-id="${c.id}" data-stage="${sel.v}" data-grade="${g || ""}">${tr("انضم", "Join")}</button>`;
        if (st === "pending") actions += `<span class="kc-badge warn">⏳ ${tr("طلبك قيد المراجعة", "Request pending")}</span>`;
        if (manage) actions += `<button type="button" class="kc-btn primary" data-act="add-member" data-stage="${sel.v}" data-grade="${g || ""}">＋ ${tr("إضافة عضو", "Add member")}</button>`;
        if (can("viewMembers", c)) actions += `<button type="button" class="kc-btn ghost" data-act="stage-members" data-stage="${sel.v}" data-grade="${g || ""}">👥 ${tr("الأعضاء", "Members")}</button>`;
        const cnt = g ? ((selCfg.gradeCounts || {})[g] ?? 0) : (selCfg.membersCount ?? 0);
        return `<article class="kc-church kc-stage">
          <div class="kc-church-top">
            <span class="kc-church-ico">${STAGE_ICO[sel.v] || "🏫"}</span>
            <div><h3>${esc(g ? stageLabel(sel.v, g) : (isAr() ? sel.ar : sel.en))}</h3><small>${esc(c.name)}</small></div>
          </div>
          <div class="kc-meta"><span class="kc-badge info">👥 ${cnt} ${tr("عضو", cnt === 1 ? "member" : "members")}</span></div>
          <div class="kc-card-actions">${actions}</div>
        </article>`;
      }).join("");
      return head + `<div class="kc-cards">${cards}</div>`;
    }

    // ---- الخطوة 1: المراحل ----
    const head = `<div class="kc-hint">🏫 ${tr("دي المراحل الموجودة في الكنيسة. افتح المرحلة واختار سنتك.", "These are the stages in this church. Open a stage and pick your year.")}</div>
      <div class="kc-head"><span class="kc-badge info">${esc(c.name)}</span>${manageBtn}</div>`;
    const cards = S.cfgList.map((x) => {
      const sg = findStage(x.stage);
      if (!sg) return "";
      const n = Number(x.gradesCount) || 0;
      const chips = n ? Array.from({ length: n }, (_, i) => i + 1)
        .filter((g) => !(onlyMine && x.myGrade != null && g !== Number(x.myGrade)))
        .map((g) => `<span class="kc-chip">${esc(stageLabel(sg.v, g))}</span>`).join("") : "";
      return `<article class="kc-church kc-stage kc-clickable" data-act="pick-stage" data-stage="${sg.v}">
        <div class="kc-church-top">
          <span class="kc-church-ico">${STAGE_ICO[sg.v] || "🏫"}</span>
          <div><h3>${isAr() ? sg.ar : sg.en}</h3><small>${n ? tr(`${n} سنين`, `${n} year(s)`) : tr("بدون صفوف", "No grades")}</small></div>
        </div>
        ${chips ? `<div class="kc-chips">${chips}</div>` : ""}
        <div class="kc-meta"><span class="kc-badge info">👥 ${x.membersCount ?? 0}</span></div>
        <div class="kc-card-actions"><button type="button" class="kc-btn primary" data-act="pick-stage" data-stage="${sg.v}">${tr("فتح المرحلة", "Open stage")} ←</button></div>
      </article>`;
    }).join("");
    return head + `<div class="kc-cards">${cards}</div>`;
  };

  function manageStagesModal() {
    const c = current();
    const cur = S.cfg || {};
    const rows = MAIN.map((sg) => `
      <div class="kc-stagerow">
        <label class="kc-check"><input type="checkbox" data-st-on="${sg.v}" ${sg.v in cur ? "checked" : ""}><span>${STAGE_ICO[sg.v]} ${isAr() ? sg.ar : sg.en}</span></label>
        <label class="kc-years">${tr("عدد السنين", "Years")}
          <input type="number" min="0" max="12" data-st-n="${sg.v}" value="${sg.v in cur ? cur[sg.v] : sg.n}">
        </label>
      </div>`).join("");
    openInfo({
      title: tr("إدارة مراحل الكنيسة", "Manage church stages"), sub: c.name,
      html: `<p class="kc-sub">${tr("فعّل المراحل الموجودة في الكنيسة وحدد عدد سنين كل مرحلة (0 = من غير صفوف).", "Enable the stages in this church and set the number of years for each (0 = no grades).")}</p>
        ${rows}
        <div class="kc-err" id="kc-st-err"></div>
        <div class="kc-actions"><button type="button" class="kc-btn ghost" data-close>${tr("إلغاء", "Cancel")}</button><button type="button" class="kc-btn primary" data-st-save>${tr("حفظ", "Save")}</button></div>`
    });
    const modal = $("kc-modal");
    modal.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-st-save]");
      if (!btn) return;
      const stages = [];
      MAIN.forEach((sg) => {
        if (modal.querySelector(`[data-st-on="${sg.v}"]`).checked) stages.push({ stage: sg.v, gradesCount: Math.max(0, Math.min(12, Number(modal.querySelector(`[data-st-n="${sg.v}"]`).value) || 0)) });
      });
      const err = modal.querySelector("#kc-st-err");
      if (!stages.length) { err.textContent = tr("فعّل مرحلة واحدة على الأقل.", "Enable at least one stage."); return; }
      btn.disabled = true;
      try {
        await api(`/Churches/${c.id}/stages`, { method: "PUT", body: JSON.stringify({ stages }) });
        closeModal();
        say(tr("تم حفظ المراحل ✓", "Stages saved ✓"));
        reload();
      } catch (ex) { err.textContent = ex.message; btn.disabled = false; }
    });
  }

  // 2) الأعضاء والطلبات
  PANELS.members = async () => {
    const c = current();
    const manage = canManage(c);
    if (!can("viewMembers", c)) return lockedPanel();
    const q = new URLSearchParams();
    Object.entries(S.mf).forEach(([k, v]) => { if (v !== "") q.set(k, v); });
    S.members = (await api(`/Churches/${c.id}/members${q.toString() ? "?" + q : ""}`)) || [];
    if (S.mfGrade !== "") S.members = S.members.filter((m) => String(m.grade) === String(S.mfGrade));

    const filters = `
      <div class="kc-head">
        <div class="kc-filters">
          ${selHTML('data-filter="status"', statusOptions(), S.mf.status)}
          ${selHTML('data-filter="stage"', stageOptions(true), S.mf.stage)}
          ${selHTML('data-filter="role"', roleOptions(), S.mf.role)}
        </div>
        ${S.mfGrade !== "" && S.mf.stage !== "" ? `<button type="button" class="kc-btn ghost" data-act="clear-grade">✕ ${esc(stageLabel(S.mf.stage, Number(S.mfGrade)))}</button>` : ""}
        ${manage ? `<button type="button" class="kc-btn primary" data-act="add-member">＋ ${tr("إضافة عضو", "Add member")}</button>` : ""}
      </div>`;
    if (!S.members.length) return filters + empty("👥", tr("لا يوجد أعضاء.", "No members found."));

    const rows = S.members.map((m, i) => {
      const st = statusKey(m.status);
      const higher = !isAdmin() && !outranks(c, m.role); // مفيش تعديل على نفس الرتبة أو أعلى
      let acts = "";
      if (!manage) { /* عرض فقط */ }
      else if (st === "pending") acts += `<button class="kc-mini ok" data-act="decide" data-do="approve" data-m="${m.id}">✓ ${tr("قبول", "Approve")}</button><button class="kc-mini danger" data-act="decide" data-do="reject" data-m="${m.id}">✕ ${tr("رفض", "Reject")}</button>`;
      else if (st === "approved") acts += `<button class="kc-mini danger" data-act="decide" data-do="revoke" data-m="${m.id}">⛔ ${tr("إلغاء العضوية", "Revoke")}</button>`;
      else acts += `<button class="kc-mini ok" data-act="decide" data-do="approve" data-m="${m.id}">✓ ${tr("قبول", "Approve")}</button>`;
      if (manage && !higher && m.pendingStage != null) {
        acts += `<button class="kc-mini ok" data-act="move" data-do="approve" data-m="${m.id}">✓ ${tr("موافقة النقل", "Approve move")}</button><button class="kc-mini danger" data-act="move" data-do="reject" data-m="${m.id}">✕ ${tr("رفض النقل", "Reject move")}</button>`;
      }
      if (manage && !higher) {
        acts += `<button class="kc-mini" data-act="edit-member" data-m="${m.id}">✎ ${tr("تعديل", "Edit")}</button>`;
        acts += `<button class="kc-mini danger" data-act="del-member" data-m="${m.id}">🗑 ${tr("حذف", "Delete")}</button>`;
      }
      if (can("roles", c) && st === "approved" && !higher && assignableRoles(c).length) acts += `<button class="kc-mini" data-act="set-role" data-m="${m.id}">🎖 ${tr("الدور", "Role")}</button>`;
      return `<tr>
        <td>${i + 1}</td>
        <td><b>${esc(m.fullName)}</b></td>
        <td>${phoneHTML(m.phone)}</td>
        <td>${m.phone ? waHTML(m.whatsAppPhone || m.phone) : "—"}</td>
        <td>${esc(m.email || "—")}</td>
        <td>${esc(stageLabel(m.stage, m.grade))}${m.pendingStage != null ? `<div class="kc-sub">⇄ ${tr("طلب نقل إلى", "Move request to")} <b>${esc(stageLabel(m.pendingStage, m.pendingGrade))}</b></div>` : ""}</td>
        <td>${roleBadge(m.role)}${stagesText(m.serviceStages, m.serviceGrade) ? `<div class="kc-sub">${esc(stagesText(m.serviceStages, m.serviceGrade))}</div>` : ""}</td>
        <td>${statusBadge(m.status)}</td>
        <td>${esc(fmtDate(m.requestedAt))}</td>
        ${manage ? `<td class="kc-acts">${acts}</td>` : ""}
      </tr>`;
    }).join("");
    return filters + table(["#", tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("واتساب", "WhatsApp"), tr("الإيميل", "Email"), tr("المرحلة", "Stage"), tr("الدور", "Role"), tr("الحالة", "Status"), tr("تاريخ الطلب", "Requested")].concat(manage ? [tr("إجراءات", "Actions")] : []), rows);
  };

  // 3) الغياب اليومي
  PANELS.attendance = async () => {
    const c = current();
    if (!can("attendance", c)) return lockedPanel();
    const q = new URLSearchParams({ date: S.att.date });
    if (S.att.stage !== "") q.set("stage", S.att.stage);
    S.sheet = await api(`/Churches/${c.id}/attendance?${q}`);
    return attendanceHTML();
  };

  function attendanceHTML() {
    const s = S.sheet;
    const manage = can("attendance", current());
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
        <td>${phoneHTML(m.phone, m.whatsAppPhone)}</td>
        <td>${esc(stageLabel(m.stage, m.grade))}</td>
        <td>${roleBadge(m.role)}</td>
        <td>${manage
          ? `<button type="button" class="kc-toggle ${m.isPresent ? "on" : ""}" data-act="toggle-att" data-m="${m.memberId}">${m.isPresent ? "✅ " + tr("حاضر", "Present") : "⬜ " + tr("غائب", "Absent")}</button>`
          : `<span class="kc-badge ${m.isPresent ? "ok" : ""}">${m.isPresent ? "✅ " + tr("حاضر", "Present") : "⬜ " + tr("غائب", "Absent")}</span>`}</td>
      </tr>`).join("");
    return head + table(["#", tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("المرحلة", "Stage"), tr("الدور", "Role"), tr("الحضور", "Attendance")], rows);
  }

  // 4) الافتقاد — تبويبات: المخدومين / الخدام / التقارير / حالة خدام الافتقاد
  const OUTCOMES = ["", "Contacted", "Visited", "NoAnswer"]; // FollowUpOutcome
  const OUTCOME_LBL = {
    contacted: ["تم الاتصال", "Contacted", "ok"],
    visited: ["تمت الزيارة", "Visited", "ok"],
    noanswer: ["لم يرد", "No answer", "warn"]
  };
  const outcomeBadge = (v) => {
    const l = OUTCOME_LBL[norm(enumName(v, OUTCOMES))];
    return l ? `<span class="kc-badge ${l[2]}">${isAr() ? l[0] : l[1]}</span>` : `<span class="kc-badge">${esc(v ?? "—")}</span>`;
  };
  const reportHint = () => `<div class="kc-hint">📞 ${tr(
    "كلّم المخدوم أو ابعتله واتساب أو زوره، وبعدها سجّل تقرير الافتقاد: النتيجة + ملاحظة (إجباري). التقرير هو اللي بيثبت إنك افتقدت.",
    "Call, WhatsApp or visit the member, then submit the follow-up report: outcome + note (mandatory). The report is what proves the follow-up was done."
  )}</div>`;

  const FU_TABS = {};

  FU_TABS.members = async (c) => {
    const q = S.fu.stage !== "" ? `?stage=${encodeURIComponent(S.fu.stage)}` : "";
    S.followups = (await api(`/Churches/${c.id}/follow-up${q}`)) || [];
    const head = `${reportHint()}
      <div class="kc-head">
        <div class="kc-filters">${selHTML('id="kc-fu-stage"', stageOptions(true), S.fu.stage)}</div>
        <span class="kc-badge warn">📞 ${S.followups.length}</span>
      </div>`;
    if (!S.followups.length) return head + empty("🙏", tr("مفيش حد محتاج افتقاد دلوقتي.", "No one needs follow-up right now."));
    const rows = S.followups.map((m) => `
      <tr>
        <td><b>${esc(m.fullName)}</b></td>
        <td>${phoneHTML(m.phone, m.whatsAppPhone)}</td>
        <td>${waHTML(m.whatsAppPhone)}</td>
        <td>${esc(stageLabel(m.stage, m.grade))}</td>
        <td>${esc(fmtDate(m.lastAttendedDate))}</td>
        <td><span class="kc-badge ${m.daysAbsent >= 28 ? "no" : "warn"}">${m.daysAbsent} ${tr("يوم", "days")}</span></td>
        <td>${esc(fmtDate(m.lastFollowUpAt))}</td>
        <td class="kc-note-cell">${esc(m.lastNote || "—")}</td>
        <td><button type="button" class="kc-mini ok" data-act="report-followup" data-src="members" data-m="${m.memberId}">📝 ${tr("تقرير افتقاد", "Report")}</button></td>
      </tr>`).join("");
    return head + table([tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("واتساب", "WhatsApp"), tr("المرحلة", "Stage"), tr("آخر حضور", "Last attended"), tr("الغياب", "Absent"), tr("آخر افتقاد", "Last follow-up"), tr("آخر ملاحظة", "Last note"), tr("إجراء", "Action")], rows);
  };

  FU_TABS.servants = async (c) => {
    const q = S.fu.stage !== "" ? `?stage=${encodeURIComponent(S.fu.stage)}` : "";
    S.fuServants = (await api(`/Churches/${c.id}/follow-up/servants${q}`)) || [];
    const head = `<div class="kc-hint">🧑‍🏫 ${tr("افتقاد الخدام والسكرتارية نفسهم — بيتسجّل بنفس التقرير الإجباري.", "Follow-up of servants and secretaries — recorded with the same mandatory report.")}</div>
      <div class="kc-head">
        <div class="kc-filters">${selHTML('id="kc-fu-stage"', stageOptions(true), S.fu.stage)}</div>
        <span class="kc-badge warn">📞 ${S.fuServants.length}</span>
      </div>`;
    if (!S.fuServants.length) return head + empty("🙏", tr("مفيش خدام محتاجين افتقاد.", "No servants need follow-up."));
    const rows = S.fuServants.map((x) => {
      const m = x.info || {};
      return `<tr>
        <td><b>${esc(m.fullName)}</b></td>
        <td>${roleBadge(x.role)}</td>
        <td>${phoneHTML(m.phone, m.whatsAppPhone)}</td>
        <td>${waHTML(m.whatsAppPhone)}</td>
        <td>${esc(fmtDate(m.lastAttendedDate))}</td>
        <td><span class="kc-badge ${m.daysAbsent >= 28 ? "no" : "warn"}">${m.daysAbsent} ${tr("يوم", "days")}</span></td>
        <td>${esc(fmtDate(m.lastFollowUpAt))}</td>
        <td><button type="button" class="kc-mini ok" data-act="report-followup" data-src="servants" data-m="${m.memberId}">📝 ${tr("تقرير افتقاد", "Report")}</button></td>
      </tr>`;
    }).join("");
    return head + table([tr("الاسم", "Name"), tr("الدور", "Role"), tr("الموبايل", "Phone"), tr("واتساب", "WhatsApp"), tr("آخر حضور", "Last attended"), tr("الغياب", "Absent"), tr("آخر افتقاد", "Last follow-up"), tr("إجراء", "Action")], rows);
  };

  FU_TABS.reports = async (c) => {
    const list = ((await api(`/Churches/${c.id}/follow-up/reports`)) || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const head = `<div class="kc-head"><span class="kc-badge info">📝 ${list.length}</span></div>`;
    if (!list.length) return head + empty("📝", tr("لا توجد تقارير لسه.", "No reports yet."));
    const rows = list.map((r) => `
      <tr>
        <td>${esc(fmtDateTime(r.createdAt))}</td>
        <td><b>${esc(r.memberName)}</b><div class="kc-sub">${esc(roleLabel(r.memberRole))} · ${esc(stageLabel(r.memberStage))}</div></td>
        <td>${esc(r.reporterName || "—")}</td>
        <td>${outcomeBadge(r.outcome)}</td>
        <td class="kc-note-cell">${esc(r.note || "")}</td>
      </tr>`).join("");
    return head + table([tr("التاريخ", "Date"), tr("المفتقَد", "Member"), tr("خادم الافتقاد", "Reporter"), tr("النتيجة", "Outcome"), tr("الملاحظة", "Note")], rows);
  };

  FU_TABS.status = async (c) => {
    const list = (await api(`/Churches/${c.id}/follow-up/servants-status`)) || [];
    const head = `<div class="kc-hint">📊 ${tr("كل خادم افتقاد: عنده كام مخدوم غايب، افتقد منهم كام، ولسه كام.", "Per follow-up servant: absent members, how many were followed up, and how many are pending.")}</div>
      <div class="kc-head"><span class="kc-badge info">🧑‍🏫 ${list.length}</span></div>`;
    if (!list.length) return head + empty("🧑‍🏫", tr("لا يوجد خدام افتقاد.", "No follow-up servants."));
    const rows = list.map((s) => {
      const pct = s.absentCount ? Math.round((s.followedCount / s.absentCount) * 100) : 100;
      return `<tr>
        <td><b>${esc(s.fullName)}</b></td>
        <td>${phoneHTML(s.phone)}</td>
        <td>${s.serviceStage != null ? esc(stageLabel(s.serviceStage)) : "—"}</td>
        <td>${s.groupsCount}</td>
        <td>${s.membersCount}</td>
        <td><span class="kc-badge ${s.absentCount ? "warn" : "ok"}">${s.absentCount}</span></td>
        <td><span class="kc-badge ok">${s.followedCount}</span></td>
        <td><span class="kc-badge ${s.pendingCount ? "no" : "ok"}">${s.pendingCount}</span></td>
        <td style="min-width:130px"><div class="kc-progress"><i style="width:${pct}%"></i></div><small>${pct}%</small></td>
        <td>${esc(fmtDate(s.lastReportAt))}</td>
      </tr>`;
    }).join("");
    return head + table([tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("المرحلة", "Stage"), tr("مجموعات", "Groups"), tr("مخدومين", "Members"), tr("غايبين", "Absent"), tr("افتقد", "Done"), tr("لسه", "Pending"), tr("التقدّم", "Progress"), tr("آخر تقرير", "Last report")], rows);
  };

  PANELS.followup = async () => {
    const c = current();
    const tabs = [];
    if (can("followUp", c)) tabs.push(["members", "👥", tr("المخدومين", "Members")]);
    if (can("followServants", c)) tabs.push(["servants", "🧑‍🏫", tr("الخدام", "Servants")]);
    if (can("followUp", c) || can("reports", c)) tabs.push(["reports", "📝", tr("التقارير", "Reports")]);
    if (can("reports", c)) tabs.push(["status", "📊", tr("حالة خدام الافتقاد", "Servants status")]);
    if (!tabs.length) return lockedPanel();
    if (!tabs.some((t) => t[0] === S.fu.tab)) S.fu.tab = tabs[0][0];
    const seg = `<div class="kc-head"><div class="kc-seg kc-seg-wrap">${tabs.map((t) => `<button type="button" data-futab="${t[0]}" class="${S.fu.tab === t[0] ? "on" : ""}">${t[1]} ${t[2]}</button>`).join("")}</div></div>`;
    return seg + (await FU_TABS[S.fu.tab](c));
  };

  // الفريق والأدوار
  PANELS.team = async () => {
    const c = current();
    if (!can("viewMembers", c)) return lockedPanel();
    S.team = (await api(`/Churches/${c.id}/team`)) || [];
    const canRole = can("roles", c) && assignableRoles(c).length > 0;
    const head = `<div class="kc-hint">🧑‍🏫 ${tr(
      "اللي أعلى بس يقدر يغيّر اللي أقل. الأمين والمساعد ليهم مرحلة أو أكتر، والخادم وخادم الافتقاد مرحلة واحدة بالظبط.",
      "Only a higher role can change a lower one. Ameens/Assistants serve one or more stages; Servants/Follow-up servants exactly one."
    )}</div>
      <div class="kc-head"><span class="kc-badge info">🤝 ${S.team.length}</span>${canRole ? `<button type="button" class="kc-btn primary" data-act="promote">＋ ${tr("تعيين من المخدومين", "Assign from members")}</button>` : ""}</div>`;
    if (!S.team.length) return head + empty("🤝", tr("لا يوجد خدام بعد.", "No team members yet."));
    const rows = S.team.map((m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><b>${esc(m.fullName)}</b></td>
        <td>${phoneHTML(m.phone, m.whatsAppPhone)}</td>
        <td>${roleBadge(m.role)}</td>
        <td>${esc(stagesText(m.serviceStages, m.serviceGrade) || "—")}</td>
        ${canRole ? `<td class="kc-acts">${(isAdmin() || outranks(c, m.role)) ? `<button class="kc-mini" data-act="set-role" data-m="${m.id}">🎖 ${tr("تغيير الدور", "Change role")}</button>` : ""}</td>` : ""}
      </tr>`).join("");
    return head + table(["#", tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("الدور", "Role"), tr("مراحل الخدمة", "Service stages")].concat(canRole ? [tr("إجراءات", "Actions")] : []), rows);
  };

  // مجموعات الافتقاد
  PANELS.groups = async () => {
    const c = current();
    if (!can("groups", c)) return lockedPanel();
    const q = S.gr.stage !== "" ? `?stage=${encodeURIComponent(S.gr.stage)}` : "";
    S.groups = (await api(`/Churches/${c.id}/groups${q}`)) || [];
    const head = `<div class="kc-hint">🗂 ${tr(
      "قسّم مخدومين المرحلة لمجموعات (مثلاً 25 في المجموعة) وعيّن لكل مجموعة خادم افتقاد مسؤول عنها. خادم الافتقاد بيشوف مجموعاته بس.",
      "Split a stage's members into groups (e.g. 25 each) and assign a follow-up servant to each. A follow-up servant only sees his own groups."
    )}</div>
      <div class="kc-head">
        <div class="kc-filters">${selHTML('id="kc-gr-stage"', stageOptions(true), S.gr.stage)}</div>
        <div class="kc-filters">
          <button type="button" class="kc-btn gold" data-act="auto-split">⚡ ${tr("تقسيم تلقائي", "Auto split")}</button>
          <button type="button" class="kc-btn primary" data-act="add-group">＋ ${tr("مجموعة", "Group")}</button>
        </div>
      </div>`;
    if (!S.groups.length) return head + empty("🗂", tr("لا توجد مجموعات.", "No groups yet."));
    const rows = S.groups.map((g, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><b>${esc(g.name)}</b></td>
        <td>${esc(stageLabel(g.stage))}</td>
        <td>${g.followUpServantName ? `🧑‍🏫 ${esc(g.followUpServantName)}` : `<span class="kc-badge warn">${tr("بدون خادم", "No servant")}</span>`}</td>
        <td><span class="kc-badge info">👥 ${g.membersCount}</span></td>
        <td class="kc-acts">
          <button class="kc-mini" data-act="group-members" data-g="${g.id}">👥 ${tr("المخدومين", "Members")}</button>
          <button class="kc-mini" data-act="edit-group" data-g="${g.id}">✎ ${tr("تعديل", "Edit")}</button>
          <button class="kc-mini danger" data-act="del-group" data-g="${g.id}">🗑 ${tr("حذف", "Delete")}</button>
        </td>
      </tr>`).join("");
    return head + table(["#", tr("المجموعة", "Group"), tr("المرحلة", "Stage"), tr("خادم الافتقاد", "Follow-up servant"), tr("العدد", "Members"), tr("إجراءات", "Actions")], rows);
  };

  // 5) الإيفنتس
  const bookBtn = (ev) => {
    const list = Array.isArray(ev.contacts) ? ev.contacts : [];
    const btns = list.map((ct) => {
      const t = String(ct.type || "").toLowerCase();
      const v = ct.value || "";
      if (!v) return "";
      if (t === "whatsapp") {
        const msg = encodeURIComponent(tr(`أنا عاوز أحجز في: ${ev.title}`, `I'd like to book: ${ev.title}`));
        return `<a class="kc-btn wa" href="https://wa.me/${waDigits(v)}?text=${msg}" target="_blank" rel="noopener noreferrer">💬 ${tr("احجز على واتساب", "Book on WhatsApp")}</a>`;
      }
      if (t === "phone") return `<a class="kc-btn gold" dir="ltr" href="tel:${esc(v)}">📞 ${tr("اتصل للحجز", "Call to book")} · ${esc(v)}</a>`;
      if (t === "link" && /^https?:\/\//i.test(v)) return `<a class="kc-btn gold" href="${esc(v)}" target="_blank" rel="noopener noreferrer">🔗 ${tr("احجز / سجّل من هنا", "Book / register here")}</a>`;
      return "";
    }).join("");
    return btns ? `<div class="kc-card-actions">${btns}</div>` : "";
  };

  PANELS.events = async () => {
    const c = current();
    const manage = can("events", c);
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
        ${bookBtn(ev)}
        ${manage ? `<div class="kc-card-actions">
          <button type="button" class="kc-btn ghost" data-act="edit-event" data-e="${ev.id}">✎ ${tr("تعديل", "Edit")}</button>
          <button type="button" class="kc-btn danger" data-act="del-event" data-e="${ev.id}">🗑 ${tr("حذف", "Delete")}</button>
        </div>` : ""}
      </article>`).join("")}</div>`;
  };

  // 6) أمناء الخدمة
  PANELS.ameens = async () => {
    const c = current();
    S.ameens = (await api(`/Churches/${c.id}/ameens`)) || [];
    const admin = isAdmin();
    const head = `<div class="kc-head"><span class="kc-badge info">✝ ${S.ameens.length}</span>${admin ? `<button type="button" class="kc-btn primary" data-act="assign-ameen">＋ ${tr("تعيين أمين", "Assign Ameen")}</button>` : ""}</div>`;
    if (!S.ameens.length) return head + empty("✝", tr("لا يوجد أمناء لهذه الكنيسة.", "No Ameens for this church."));
    const rows = S.ameens.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><b>${esc(a.fullName)}</b></td>
        <td>${phoneHTML(a.phone)}</td>
        <td>${waHTML(a.whatsAppPhone)}</td>
        ${admin ? `<td class="kc-acts"><button class="kc-mini danger" data-act="remove-ameen" data-m="${a.memberId}">🗑 ${tr("إزالة", "Remove")}</button></td>` : ""}
      </tr>`).join("");
    return head + table(["#", tr("الاسم", "Name"), tr("الموبايل", "Phone"), tr("واتساب", "WhatsApp")].concat(admin ? [tr("إجراءات", "Actions")] : []), rows);
  };

  // 7) إعدادات الكنيسة
  PANELS.settings = async () => {
    await loadChurches();
    const c = current();
    if (!can("settings", c)) {
      return `
        <div class="kc-card kc-settings">
          <h3>⚙ ${esc(c.name)}</h3>
          <div class="kc-meta">📅 ${dayLabel(c.meetingDay)} ${esc(fmtTime(c.meetingTime))}</div>
          <div class="kc-meta">📞 ${tr("الافتقاد بعد", "Follow-up after")} ${esc(c.followUpAfterDays ?? "—")} ${tr("يوم غياب", "days absent")}</div>
          <div class="kc-note">${tr("تعديل إعدادات الاجتماع للأمين والأمين العام والأدمن فقط.", "Only the Ameen, General Ameen and admins can edit meeting settings.")}</div>
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
    const c = current();
    const gate = { members: "viewMembers", team: "viewMembers", attendance: "attendance", groups: "groups" };
    const tiles = TILES.filter((t) => {
      if (t.k === "followup") return can("followUp", c) || can("followServants", c);
      return !gate[t.k] || can(gate[t.k], c);
    });
    return `<div class="kc-tiles">${tiles.map((t) => `
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
      if (S.view !== "churches") await loadStageCfg(current().id);
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

  // ربط خانة الإيميل والاسم في مودال العضو: لو أدمن وكتب إيميل مسجل يجلب اسمه تلقائي
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

  /* ---------------- الأدوار والمجموعات (مساعدات) ---------------- */
  function roleStageField(c, m) {
    const keys = assignableRoles(c);
    const opts = [{ value: "", label: tr("اختر الدور", "Select role") }].concat(keys.map((k) => ({ value: roleVal(k), label: roleLabel(roleVal(k)) })));
    const cur = m ? roleKey(m.role) : "";
    return { name: "rolestage", type: "rolestage", options: opts, value: keys.includes(cur) ? roleVal(cur) : "", stages: m ? (m.serviceStages || []) : [], serviceGrade: m ? m.serviceGrade : null };
  }

  async function groupModal(g) {
    const c = current();
    const team = (await api(`/Churches/${c.id}/team`)) || [];
    const fus = team.filter((t) => roleKey(t.role) === FU);
    const cur = g ? findStage(g.stage) : findStage(S.gr.stage);
    openModal({
      title: g ? tr("تعديل مجموعة", "Edit group") : tr("مجموعة جديدة", "New group"), sub: c.name,
      fields: [
        { name: "stage", label: tr("المرحلة", "Stage"), type: "select", required: true, value: cur ? cur.v : "",
          options: [{ value: "", label: tr("اختر المرحلة", "Select stage") }].concat(MAIN.map((s) => ({ value: s.v, label: isAr() ? s.ar : s.en }))) },
        { name: "name", label: tr("اسم المجموعة", "Group name"), value: g ? g.name : "", required: true, maxlength: 80 },
        { name: "servant", label: tr("خادم الافتقاد المسؤول", "Follow-up servant"), type: "select", value: g && g.followUpServantMemberId != null ? g.followUpServantMemberId : "",
          options: [{ value: "", label: tr("— بدون —", "— none —") }].concat(fus.map((t) => ({ value: t.id, label: `${t.fullName}${stagesText(t.serviceStages) ? " — " + stagesText(t.serviceStages) : ""}` }))) }
      ],
      onSubmit: async (v) => {
        const body = JSON.stringify({ stage: Number(v.stage), name: v.name, followUpServantMemberId: v.servant ? Number(v.servant) : null });
        if (g) await api(`/Churches/${c.id}/groups/${g.id}`, { method: "PUT", body });
        else await api(`/Churches/${c.id}/groups`, { method: "POST", body });
        say(tr("تم الحفظ ✓", "Saved ✓"));
        reload();
      }
    });
  }

  async function groupMembersModal(g) {
    const c = current();
    const sv = (findStage(g.stage) || {}).v;
    const [mine, pool] = await Promise.all([
      api(`/Churches/${c.id}/groups/${g.id}/members`),
      api(`/Churches/${c.id}/members?status=1&role=0${sv ? "&stage=" + sv : ""}`)
    ]);
    const inGroup = new Set((mine || []).map((x) => x.id));
    const avail = (pool || []).filter((x) => !inGroup.has(x.id));
    const html = `
      <div class="kc-gm">
        <h4>${tr("أعضاء المجموعة", "Group members")} (${(mine || []).length})</h4>
        ${(mine || []).length ? `<ul class="kc-gm-list">${mine.map((m) => `<li><span><b>${esc(m.fullName)}</b> <small>${esc(m.phone || "")}</small></span><button type="button" class="kc-mini danger" data-gm-remove="${m.id}">✕ ${tr("شيل", "Remove")}</button></li>`).join("")}</ul>` : `<div class="kc-sub">${tr("المجموعة فاضية.", "The group is empty.")}</div>`}
        <h4>${tr("إضافة مخدومين", "Add members")} (${avail.length})</h4>
        ${avail.length ? `<ul class="kc-gm-list">${avail.map((m) => `<li><label class="kc-check"><input type="checkbox" value="${m.id}" data-gm-pick><span><b>${esc(m.fullName)}</b> <small>${esc(stageLabel(m.stage, m.grade))}</small></span></label>${m.followUpGroupId != null ? `<span class="kc-badge warn">${tr("في مجموعة أخرى", "In another group")}</span>` : ""}</li>`).join("")}</ul>
        <div class="kc-actions"><button type="button" class="kc-btn primary" data-gm-add>＋ ${tr("إضافة المحدّدين", "Add selected")}</button></div>` : `<div class="kc-sub">${tr("مفيش مخدومين متاحين في المرحلة دي.", "No available members in this stage.")}</div>`}
      </div>`;
    openInfo({ title: g.name, sub: stageLabel(g.stage), html });
    const modal = $("kc-modal");
    modal.addEventListener("click", async (e) => {
      const rm = e.target.closest("[data-gm-remove]");
      const add = e.target.closest("[data-gm-add]");
      if (!rm && !add) return;
      try {
        if (rm) {
          await api(`/Churches/${c.id}/groups/${g.id}/members/remove`, { method: "POST", body: JSON.stringify({ memberIds: [Number(rm.dataset.gmRemove)] }) });
        } else {
          const ids = Array.from(modal.querySelectorAll("[data-gm-pick]:checked")).map((i) => Number(i.value));
          if (!ids.length) { say(tr("اختر مخدومين الأول.", "Select members first.")); return; }
          await api(`/Churches/${c.id}/groups/${g.id}/members`, { method: "POST", body: JSON.stringify({ memberIds: ids }) });
        }
        S.groups = (await api(`/Churches/${c.id}/groups${S.gr.stage !== "" ? "?stage=" + encodeURIComponent(S.gr.stage) : ""}`)) || S.groups;
        const fresh = S.groups.find((x) => x.id === g.id) || g;
        await groupMembersModal(fresh);
        loadPanel();
      } catch (err) { showErr(err); }
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

    "manage-stages": async () => manageStagesModal(),

    "pick-stage": async (b) => { S.stageSel = b.dataset.stage; loadPanel(); },
    "back-stages": async () => { S.stageSel = null; loadPanel(); },
    "clear-grade": async () => { S.mfGrade = ""; loadPanel(); },

    "stage-members": async (b) => {
      S.mfGrade = b.dataset.grade || "";
      S.mf.stage = b.dataset.stage || "";
      S.view = "members";
      render();
    },

    open: async (b) => {
      S.churchId = b.dataset.id;
      localStorage.setItem("kcChurch", String(S.churchId));
      S.stageSel = null;
      S.view = "stages";
      render();
    },

    join: async (b) => {
      const c = churchById(b.dataset.id);
      if (!c) return;
      await loadStageCfg(c.id);
      openModal({
        title: tr("طلب انضمام", "Join request"), sub: c.name, submitLabel: tr("إرسال الطلب", "Send request"),
        fields: [
          phoneField(),
          waField(),
          { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", required: true, value: b.dataset.stage || "", grade: b.dataset.grade || "", locked: !!b.dataset.stage && (!gradesOf(b.dataset.stage) || !!b.dataset.grade) }
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/join`, { method: "POST", body: JSON.stringify({ stage: Number(v.stage), grade: gradeVal(v), phone: v.phone, whatsAppPhone: v.whatsapp || null }) });
          say(tr("تم إرسال طلب الانضمام ✓", "Join request sent ✓"));
          reload();
        }
      });
    },

    "my-profile": async (b) => {
      const c = churchById(b.dataset.id);
      if (!c) return;
      await loadStageCfg(c.id);
      openModal({
        title: tr("بياناتي في الكنيسة", "My church profile"), sub: c.name,
        fields: [
          { name: "fullName", label: tr("الاسم", "Full name"), maxlength: 100 },
          phoneField(),
          waField(),
          { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", allowEmpty: true, value: b.dataset.stage || "", grade: b.dataset.grade || "" }
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/my-profile`, {
            method: "PUT",
            body: JSON.stringify({ phone: v.phone, whatsAppPhone: v.whatsapp || null, stage: v.stage === "" ? null : Number(v.stage), grade: v.stage === "" ? null : gradeVal(v), fullName: v.fullName || null })
          });
          const wasApproved = c.myStatus != null && statusKey(c.myStatus) === "approved";
          say(wasApproved && v.stage !== ""
            ? tr("تم تحديث بياناتك. طلب النقل مستني موافقة الأمين ✓", "Profile updated. Your move request is waiting for approval ✓")
            : tr("تم تحديث بياناتك ✓", "Profile updated ✓"));
        }
      });
    },

    move: async (b) => {
      const c = current();
      await api(`/Churches/${c.id}/members/${b.dataset.m}/move/${b.dataset.do}`, { method: "POST" });
      say(b.dataset.do === "approve" ? tr("تم نقل العضو ✓", "Member moved ✓") : tr("تم رفض طلب النقل", "Move request rejected"));
      reload();
    },

    decide: async (b) => {
      const c = current();
      await api(`/Churches/${c.id}/members/${b.dataset.m}/${b.dataset.do}`, { method: "POST" });
      say(tr("تم ✓", "Done ✓"));
      reload();
    },

    "add-member": async (b) => {
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
          waField(),
          { name: "stage", label: tr("المرحلة", "Stage"), type: "stage", required: true, value: b.dataset.stage || "", grade: b.dataset.grade || "", locked: !!b.dataset.stage && (!gradesOf(b.dataset.stage) || !!b.dataset.grade) }
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
              whatsAppPhone: v.whatsapp || null,
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
          waField(m.phone, m.whatsAppPhone),
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
              whatsAppPhone: v.whatsapp || null,
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

    "report-followup": async (b) => {
      const c = current();
      const list = b.dataset.src === "servants" ? (S.fuServants || []).map((x) => x.info || {}) : S.followups;
      const m = list.find((x) => String(x.memberId) === String(b.dataset.m));
      if (!m) return;
      openModal({
        title: tr("تقرير افتقاد", "Follow-up report"), sub: m.fullName, submitLabel: tr("إرسال التقرير", "Submit report"),
        fields: [
          { name: "outcome", label: tr("نتيجة الافتقاد", "Outcome"), type: "select", required: true, value: 1,
            options: [1, 2, 3].map((i) => { const l = OUTCOME_LBL[norm(OUTCOMES[i])]; return { value: i, label: isAr() ? l[0] : l[1] }; }) },
          { name: "note", label: tr("ملاحظة التقرير (إجباري)", "Report note (mandatory)"), type: "textarea", required: true, maxlength: 1000,
            pattern: /^[\s\S]{3,}$/, patternMsg: tr("اكتب ملاحظة (3 حروف على الأقل).", "Write a note (at least 3 characters).") }
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/follow-up/reports`, { method: "POST", body: JSON.stringify({ memberId: Number(m.memberId), outcome: Number(v.outcome), note: v.note }) });
          say(tr("تم تسجيل تقرير الافتقاد ✓", "Follow-up report saved ✓"));
          reload();
        }
      });
    },

    "set-role": async (b) => {
      const c = current();
      const m = S.members.find((x) => String(x.id) === String(b.dataset.m)) || S.team.find((x) => String(x.id) === String(b.dataset.m));
      if (!m) return;
      openModal({
        title: tr("تغيير الدور", "Change role"), sub: m.fullName,
        fields: [roleStageField(c, m)],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/members/${m.id}/role`, { method: "PUT", body: JSON.stringify({ role: v.role, serviceStages: v.stages, serviceGrade: v.svcGrade }) });
          say(tr("تم تحديث الدور ✓", "Role updated ✓"));
          reload();
        }
      });
    },

    promote: async () => {
      const c = current();
      const list = (await api(`/Churches/${c.id}/members?status=1&role=0`)) || [];
      if (!list.length) throw new Error(tr("مفيش مخدومين معتمدين لتعيينهم.", "No approved members to assign."));
      openModal({
        title: tr("تعيين خادم", "Assign team member"), sub: c.name,
        fields: [
          { name: "memberId", label: tr("العضو", "Member"), type: "select", required: true,
            options: [{ value: "", label: tr("اختر العضو", "Select member") }].concat(list.map((m) => ({ value: m.id, label: `${m.fullName} — ${stageLabel(m.stage, m.grade)}` }))) },
          roleStageField(c, null)
        ],
        onSubmit: async (v) => {
          await api(`/Churches/${c.id}/members/${v.memberId}/role`, { method: "PUT", body: JSON.stringify({ role: v.role, serviceStages: v.stages, serviceGrade: v.svcGrade }) });
          say(tr("تم التعيين ✓", "Assigned ✓"));
          reload();
        }
      });
    },

    "add-group": async () => groupModal(null),
    "edit-group": async (b) => groupModal(S.groups.find((x) => String(x.id) === String(b.dataset.g))),

    "del-group": async (b) => {
      const c = current();
      const g = S.groups.find((x) => String(x.id) === String(b.dataset.g));
      if (!g || !confirm(tr(`حذف المجموعة «${g.name}»؟ (المخدومين هيفضلوا في الكنيسة)`, `Delete group "${g.name}"? (members stay in the church)`))) return;
      await api(`/Churches/${c.id}/groups/${g.id}`, { method: "DELETE" });
      say(tr("تم الحذف ✓", "Deleted ✓"));
      reload();
    },

    "group-members": async (b) => {
      const g = S.groups.find((x) => String(x.id) === String(b.dataset.g));
      if (g) await groupMembersModal(g);
    },

    "auto-split": async () => {
      const c = current();
      openModal({
        title: tr("تقسيم تلقائي لمجموعات", "Auto-split into groups"), sub: c.name, submitLabel: tr("قسّم", "Split"),
        fields: [
          { name: "stage", label: tr("المرحلة", "Stage"), type: "select", required: true, value: S.gr.stage,
            options: [{ value: "", label: tr("اختر المرحلة", "Select stage") }].concat(stageOptions(false)) },
          { name: "size", label: tr("عدد المخدومين في المجموعة (5 – 200)", "Members per group (5 – 200)"), type: "number", value: 25, required: true },
          { name: "only", label: tr("مين يتقسّم؟", "Who to split?"), type: "select", value: "1",
            options: [{ value: "1", label: tr("اللي مالهمش مجموعة بس", "Only members without a group") }, { value: "0", label: tr("كل المرحلة (إعادة توزيع)", "Whole stage (redistribute)") }] }
        ],
        onSubmit: async (v) => {
          const size = Number(v.size);
          if (!(size >= 5 && size <= 200)) throw new Error(tr("العدد لازم يكون بين 5 و 200.", "Size must be between 5 and 200."));
          const res = await api(`/Churches/${c.id}/groups/auto-split`, { method: "POST", body: JSON.stringify({ stage: Number(v.stage), groupSize: size, onlyUnassigned: v.only === "1" }) });
          say(tr(`تم إنشاء/تحديث ${Array.isArray(res) ? res.length : ""} مجموعة ✓`, `${Array.isArray(res) ? res.length : ""} group(s) created/updated ✓`));
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
        { name: "endsAt", label: tr("ينتهي (اختياري)", "Ends (optional)"), type: "datetime-local", value: ev ? toLocalInput(ev.endsAt) : "" },
        { name: "contacts", label: tr("وسائل الحجز (اختياري — ممكن أكتر من واحدة)", "Booking methods (optional — add several)"), type: "contacts", value: ev && Array.isArray(ev.contacts) ? ev.contacts : [] }
      ],
      onSubmit: async (v) => {
        const body = JSON.stringify({
          title: v.title,
          description: v.description || null,
          location: v.location || null,
          startsAt: withSeconds(v.startsAt),
          endsAt: withSeconds(v.endsAt),
          contacts: v.contacts || []
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

      const ft = e.target.closest("[data-futab]");
      if (ft) { S.fu.tab = ft.dataset.futab; loadPanel(); return; }

      const sc = e.target.closest("[data-scope]");
      if (sc) { S.scope = sc.dataset.scope; loadPanel(); return; }

      const b = e.target.closest("[data-act]");
      if (!b) return;
      const fn = ACTIONS[b.dataset.act];
      if (fn) fn(b).catch(showErr);
    });

    r0.addEventListener("change", (e) => {
      const t = e.target;
      if (t.id === "kc-church-select") { S.churchId = t.value; S.stageSel = null; localStorage.setItem("kcChurch", t.value); render(); return; }
      if (t.dataset && t.dataset.filter) { S.mf[t.dataset.filter] = t.value; if (t.dataset.filter === "stage") S.mfGrade = ""; loadPanel(); return; }
      if (t.id === "kc-att-date") { S.att.date = t.value || todayStr(); loadPanel(); return; }
      if (t.id === "kc-att-stage") { S.att.stage = t.value; loadPanel(); return; }
      if (t.id === "kc-fu-stage") { S.fu.stage = t.value; loadPanel(); return; }
      if (t.id === "kc-gr-stage") { S.gr.stage = t.value; loadPanel(); }
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


  /* ---------------- Custom dropdowns (replace the native select popup) ---------------- */
  function enhanceSelect(sel) {
    if (sel.dataset.kcx) return;
    sel.dataset.kcx = "1";
    sel.classList.add("kcx-native");
    const dd = document.createElement("div");
    dd.className = "kcx";
    dd.innerHTML = `<button type="button" class="kcx-btn" aria-haspopup="listbox" aria-expanded="false"><span class="kcx-val"></span><svg class="kcx-arrow" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="kcx-list" role="listbox"></div>`;
    sel.insertAdjacentElement("afterend", dd);
    const btn = dd.querySelector(".kcx-btn");
    const val = dd.querySelector(".kcx-val");
    const list = dd.querySelector(".kcx-list");
    if (sel.style.marginTop) dd.style.marginTop = sel.style.marginTop;

    const close = () => { dd.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); list.style.cssText = ""; };
    const open = () => {
      document.querySelectorAll(".kcx.open").forEach((x) => { if (x !== dd) x.classList.remove("open"); });
      dd.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      const r = btn.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < 180 && above > below;
      const maxH = Math.max(120, Math.min(280, up ? above : below));
      list.style.cssText = `position:fixed;left:${r.left}px;width:${r.width}px;max-height:${maxH}px;` + (up ? `bottom:${window.innerHeight - r.top + 6}px;` : `top:${r.bottom + 6}px;`);
      const cur = list.querySelector(".sel");
      if (cur) cur.scrollIntoView({ block: "nearest" });
    };

    const build = () => {
      dd.style.display = sel.style.display === "none" ? "none" : "";
      list.innerHTML = "";
      let selected = null;
      Array.from(sel.children).forEach((ch) => {
        const add = (o, parent) => {
          const it = document.createElement("div");
          it.className = "kcx-opt" + (o.value === "" ? " ph" : "") + (o.selected ? " sel" : "");
          it.setAttribute("role", "option");
          it.dataset.v = o.value;
          it.textContent = o.textContent;
          if (o.selected) selected = o;
          parent.appendChild(it);
        };
        if (ch.tagName === "OPTGROUP") {
          const g = document.createElement("div");
          g.className = "kcx-grp";
          g.textContent = ch.label;
          list.appendChild(g);
          Array.from(ch.children).forEach((o) => add(o, list));
        } else add(ch, list);
      });
      const o = selected || sel.options[sel.selectedIndex];
      val.textContent = o ? o.textContent : "";
      dd.classList.toggle("empty", !o || o.value === "");
      btn.disabled = sel.disabled;
    };
    build();

    btn.addEventListener("click", (e) => { e.preventDefault(); dd.classList.contains("open") ? close() : open(); });
    list.addEventListener("click", (e) => {
      const it = e.target.closest(".kcx-opt");
      if (!it) return;
      sel.value = it.dataset.v;
      close();
      build();
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      btn.focus();
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const i = sel.selectedIndex + (e.key === "ArrowDown" ? 1 : -1);
        if (i >= 0 && i < sel.options.length) { sel.selectedIndex = i; build(); sel.dispatchEvent(new Event("change", { bubbles: true })); }
      }
    });
    sel.addEventListener("change", build);
    new MutationObserver(build).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "disabled"] });
    dd._close = close;
  }

  function enhanceAll() {
    document.querySelectorAll("#kc-root select:not([data-kcx]), #kc-modal select:not([data-kcx])").forEach(enhanceSelect);
  }
  new MutationObserver(enhanceAll).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".kcx.open").forEach((d) => { if (!d.contains(e.target) && d._close) d._close(); });
  });
  window.addEventListener("resize", () => document.querySelectorAll(".kcx.open").forEach((d) => d._close && d._close()));
  document.addEventListener("scroll", (e) => {
    if (e.target && e.target.closest && e.target.closest(".kcx-list")) return;
    document.querySelectorAll(".kcx.open").forEach((d) => d._close && d._close());
  }, true);
  enhanceAll();

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { document.querySelectorAll(".kcx.open").forEach((d) => d._close && d._close()); closeModal(); } });

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