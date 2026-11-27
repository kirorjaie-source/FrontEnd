"use strict";

/* ===========================================================================
   apin.js  —  الطبقة الموحدة للتعامل مع البيانات والـ Realtime (REST + SignalR)
   =========================================================================== */
(function () {
  const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const SERVER_ORIGIN = IS_LOCAL
    ? "https://localhost:7152"
    : "https://kokquiz-gaekbbdrcnhjdtd6.denmarkeast-01.azurewebsites.net";

  const CONFIG = {
    USE_MOCK: false,
    API_BASE: `${SERVER_ORIGIN}/api`,
    HUB_URL: `${SERVER_ORIGIN}/gamehub`,
    TOKEN_KEY: "token"
  };

  const KEYS = {
    users: "churchQuizUsers",
    session: "churchQuizSession",
    quizzes: "churchAdminQuizzes",
    legacyBank: "churchAdminQuestions",
    settings: "churchAdminSettings",
    results: "churchQuizResults",
    game: "churchQuizGameSession",
    players: "churchQuizPlayers",
    reconnect: "churchQuizReconnect"
  };

  class ApiError extends Error {
    constructor(code, message) {
      super(message || code);
      this.name = "ApiError";
      this.code = code;
    }
  }

  const uuid = () =>
    (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw new ApiError("STORAGE_FULL", "مساحة تخزين المتصفح ممتلئة.");
    }
  }

  const toArray = (r) => (Array.isArray(r) ? r : r?.items || r?.data || r?.$values || []);

  /* رقم المستخدم الحالي من الـ JWT */
  function currentUserId() {
    try {
      const t = localStorage.getItem(CONFIG.TOKEN_KEY) || localStorage.getItem("churchQuizToken");
      if (!t) return null;
      const p = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const id = p["http://schemas.xmlsoap.org/ws/2005/06/identity/claims/nameidentifier"] ?? p.nameid ?? p.sub;
      return id == null ? null : String(id);
    } catch { return null; }
  }

  function extractErrorMessage(err, status) {
    const describe = (e) => (typeof e === "string" ? e : e?.description || e?.message || JSON.stringify(e));
    if (typeof err === "string") return err.trim() || `خطأ من السيرفر (${status})`;
    if (Array.isArray(err)) return err.map(describe).join(" | ") || `خطأ من السيرفر (${status})`;

    let message = err?.message || err?.error || err?.detail || err?.details || err?.title || "";
    if (typeof message !== "string") message = JSON.stringify(message);

    if (err?.errors) {
      const list = Array.isArray(err.errors)
        ? err.errors.map(describe)
        : Object.entries(err.errors).map(([field, msgs]) => `${field}: ${[].concat(msgs).map(describe).join(", ")}`);
      if (list.length) message += (message ? " — " : "") + list.join(" | ");
    }
    return message || `خطأ من السيرفر (${status})`;
  }

  /* ---------------------------------------------------------------- REST HTTP */
  async function http(method, path, body, isForm = false) {
    const headers = {};
    const token = localStorage.getItem(CONFIG.TOKEN_KEY) || localStorage.getItem("churchQuizToken");
    if (token) headers.Authorization = "Bearer " + token;
    if (body && !isForm) headers["Content-Type"] = "application/json";

    const cleanPath = path.startsWith("/") ? path : "/" + path;
    const url = path.startsWith("http") ? path : CONFIG.API_BASE + cleanPath;

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        cache: "no-store",
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined
      });
    } catch (netErr) {
      console.error("Network Error:", netErr);
      throw new ApiError("NETWORK_ERROR", "تعذر الاتصال بالسيرفر. تأكد من تشغيل الباك إند.");
    }

    if (res.status === 401) {
      Api.auth.logout();
      location.href = "loginn.html";
      throw new ApiError("UNAUTHORIZED", "انتهت جلسة الدخول. يرجى إعادة التسجيل.");
    }

    if (!res.ok) {
      let raw = "";
      try { raw = await res.text(); } catch { /* no body */ }
      let err = {};
      try { err = raw ? JSON.parse(raw) : {}; } catch { err = raw; }
      let message = extractErrorMessage(err, res.status);
      if (res.status === 403) message = "ليس لديك صلاحية (يجب أن يكون الحساب Creator أو Admin).";
      console.error(`HTTP ${res.status} ${method} ${url}`, err);
      throw new ApiError((err && err.code) || `HTTP_${res.status}`, message);
    }

    if (res.status === 204) return null;
    const text = await res.text();
    try { return text ? JSON.parse(text) : {}; } catch { return text; }
  }

  /* --------------------------------------------------------------- Helpers */
  async function sha256(text) {
    if (!(window.crypto && crypto.subtle)) throw new ApiError("SECURE_CONTEXT_REQUIRED");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function normalizeQuestion(q) {
    const answers = Array.isArray(q.answers) ? q.answers.map(String) : [];
    return {
      id: q.id || uuid(),
      type: q.type || (answers.length === 2 ? "tf" : "mcq"),
      text: String(q.text || ""),
      image: q.image || null,
      timeLimit: Number(q.timeLimit) || 20,
      points: q.points === "zero" ? "none" : q.points || "standard",
      answers,
      correct: Number(q.correct) || 0
    };
  }

  function loadQuizzes() {
    const list = readJSON(KEYS.quizzes, []);
    const bank = readJSON(KEYS.legacyBank, []);
    let changed = false;

    list.forEach((quiz) => {
      if (!Array.isArray(quiz.questions)) {
        const ids = Array.isArray(quiz.questionIds) ? quiz.questionIds : [];
        quiz.questions = bank.filter((q) => ids.includes(q.id)).map(normalizeQuestion);
        changed = true;
      }
      if ("questionIds" in quiz) { delete quiz.questionIds; changed = true; }
      quiz.questionCount = quiz.questions.length;
    });

    if (changed) writeJSON(KEYS.quizzes, list);
    return list;
  }

  const summary = ({ questions, ...rest }) => ({ ...rest, questionCount: (questions || []).length });

  /* =========================================================================
     MOCK (LocalStorage + BroadcastChannel)
     ========================================================================= */
  const mock = {
    auth: {
      async register({ fullName, email, password, requestedRole }) {
        email = String(email).trim().toLowerCase();
        const users = readJSON(KEYS.users, []);
        if (users.some((u) => String(u.email || "").trim().toLowerCase() === email)) {
          throw new ApiError("DUPLICATE_EMAIL", "البريد الإلكتروني مستخدم بالفعل.");
        }
        const user = {
          id: uuid(),
          fullName: String(fullName).trim(),
          email,
          passwordHash: await sha256(password),
          role: "Player",
          requestedRole,
          creatorApproved: false,
          createdAt: new Date().toISOString()
        };
        users.push(user);
        writeJSON(KEYS.users, users);
        return { id: user.id, email, requestedRole };
      },

      async login(email, password) {
        email = String(email).trim().toLowerCase();
        const users = readJSON(KEYS.users, []);
        const user = Array.isArray(users)
          ? users.find((u) => typeof u.email === "string" && u.email.trim().toLowerCase() === email)
          : null;
        if (!user) throw new ApiError("INVALID_CREDENTIALS", "بيانات الدخول غير صحيحة.");
        const hash = await sha256(password);
        if (typeof user.passwordHash !== "string" || hash !== user.passwordHash) {
          throw new ApiError("INVALID_CREDENTIALS", "بيانات الدخول غير صحيحة.");
        }
        const session = { id: user.id, name: user.fullName || user.name || "", email: user.email, role: "Creator", loggedIn: true };
        writeJSON(KEYS.session, session);
        return session;
      },

      async confirmEmail() { return {}; },
      async resendCode() { return {}; }
    },

    categories: {
      async list() {
        return ["Bible Knowledge", "Old Testament", "New Testament", "Church History", "General"].map((name, i) => ({ id: i + 1, name }));
      }
    },

    quizzes: {
      async list() { return loadQuizzes().map(summary); },
      async get(id) { return loadQuizzes().find((q) => q.id === id) || null; },
      async save(quiz) {
        const list = loadQuizzes();
        const saved = {
          ...quiz,
          id: quiz.id || uuid(),
          createdAt: quiz.createdAt || new Date().toLocaleDateString(),
          questions: (quiz.questions || []).map(normalizeQuestion)
        };
        saved.questionCount = saved.questions.length;
        const idx = list.findIndex((q) => q.id === saved.id);
        if (idx > -1) list[idx] = saved; else list.push(saved);
        writeJSON(KEYS.quizzes, list);
        return saved;
      },
      async remove(id) {
        writeJSON(KEYS.quizzes, loadQuizzes().filter((q) => q.id !== id));
      }
    },

    questions: {
      async list() {
        return loadQuizzes().flatMap((quiz) =>
          quiz.questions.map((q) => ({ ...q, quizId: quiz.id, quizTitle: quiz.title, category: quiz.category }))
        );
      },
      async remove(questionId) {
        const list = loadQuizzes();
        const quiz = list.find((q) => q.questions.some((x) => x.id === questionId));
        if (!quiz) return;
        if (quiz.questions.length <= 1) throw new ApiError("LAST_QUESTION", "يجب أن تحتوي المسابقة على سؤال واحد على الأقل.");
        quiz.questions = quiz.questions.filter((x) => x.id !== questionId);
        quiz.questionCount = quiz.questions.length;
        writeJSON(KEYS.quizzes, list);
      }
    },

    media: {
      async upload(file) {
        if (!file || !String(file.type).startsWith("image/")) throw new ApiError("NOT_AN_IMAGE", "الملف المرفق ليس صورة.");
        if (file.size > 10 * 1024 * 1024) throw new ApiError("FILE_TOO_LARGE", "حجم الصورة كبير جداً.");
        const bmp = await createImageBitmap(file);
        const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bmp.width * scale);
        canvas.height = Math.round(bmp.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.82);
      }
    },

    results: {
      async list() { return readJSON(KEYS.results, []); },
      async saveGame({ quizId, quizTitle, roomCode, totalQuestions, players }) {
        const all = readJSON(KEYS.results, []);
        const date = new Date().toISOString();
        players.forEach((p) => {
          all.push({
            id: uuid(),
            name: p.nickname,
            score: p.correct,
            total: totalQuestions,
            percentage: totalQuestions ? Math.round((p.correct / totalQuestions) * 1000) / 10 : 0,
            points: p.points,
            time: p.timeSeconds || 0,
            date,
            quizId,
            quizTitle,
            roomCode
          });
        });
        writeJSON(KEYS.results, all);
      }
    },

    settings: {
      async get() { return readJSON(KEYS.settings, {}); },
      async save(settings) { writeJSON(KEYS.settings, settings); return settings; }
    },

    game: {
      async create(quizId) {
        const quiz = loadQuizzes().find((q) => q.id === quizId);
        if (!quiz) throw new ApiError("QUIZ_NOT_FOUND", "المسابقة غير موجودة.");
        if (!quiz.questions.length) throw new ApiError("QUIZ_EMPTY", "المسابقة لا تحتوي على أسئلة.");
        const session = {
          roomCode: String(Math.floor(100000 + Math.random() * 900000)),
          status: "waiting",
          quizId: quiz.id,
          quizTitle: quiz.title,
          questions: quiz.questions,
          createdAt: new Date().toISOString()
        };
        writeJSON(KEYS.players, []);
        writeJSON(KEYS.game, session);
        return session;
      },
      async start(pin) {
        const s = readJSON(KEYS.game, null);
        if (!s || s.roomCode !== String(pin)) throw new ApiError("GAME_NOT_FOUND", "الغرفة غير موجودة.");
        s.status = "playing";
        writeJSON(KEYS.game, s);
        return s;
      },
      async join(pin, nickname) {
        const s = readJSON(KEYS.game, null);
        if (!s || s.roomCode !== String(pin).trim()) throw new ApiError("GAME_NOT_FOUND", "الغرفة غير موجودة.");
        const players = readJSON(KEYS.players, []);
        const nick = String(nickname).trim();
        if (players.some((p) => p.nickname.toLowerCase() === nick.toLowerCase())) {
          throw new ApiError("NICKNAME_TAKEN", "الاسم مستخدم بالفعل داخل هذه الغرفة.");
        }
        const player = { id: uuid(), nickname: nick, joinedAt: new Date().toISOString() };
        players.push(player);
        writeJSON(KEYS.players, players);
        return player;
      },
      async players() { return readJSON(KEYS.players, []); }
    }
  };

  /* =========================================================================
     REMOTE  (ASP.NET Core REST API)
     ========================================================================= */
  const normKey = (s) => String(s).toLowerCase().replace(/[\s_\-]/g, "");

  let _catNames = null;
  async function getCategoryNames() {
    if (!_catNames) _catNames = toArray(await http("GET", "/Quizzes/categories")).map(String);
    return _catNames;
  }

  async function categoryToEnum(cat) {
    if (typeof cat === "number") return cat;
    const names = await getCategoryNames();
    const idx = names.findIndex((n) => normKey(n) === normKey(cat ?? ""));
    if (idx > -1) return idx;
    if (cat !== "" && cat != null && !isNaN(cat)) return Number(cat);
    return 0;
  }

  async function categoryToName(cat) {
    const names = await getCategoryNames();
    if (typeof cat === "number") return names[cat] ?? String(cat);
    return cat ?? "";
  }

  const QUESTION_TYPE = { mcq: 0, quiz: 0, tf: 1 };
  const POINTS = { none: 1, zero: 1, standard: 1000, double: 2000 };

  function toQuestionDto(q) {
    const n = normalizeQuestion(q);
    const pts = typeof q.points === "number" ? q.points : POINTS[n.points] ?? 1000;
    const options = n.answers
      .map((text, i) => ({ text: String(text).trim(), isCorrect: i === n.correct }))
      .filter((o) => o.text !== "")
      .slice(0, 4);
    return {
      text: n.text,
      imageUrl: n.image && !String(n.image).startsWith("data:") ? n.image : null,
      questionType: QUESTION_TYPE[n.type] ?? 0,
      timeLimit: Math.min(250, Math.max(5, n.timeLimit)),
      points: Math.min(5000, Math.max(1, pts)),
      options
    };
  }

  async function toQuizDto(quiz) {
    return {
      title: quiz.title,
      description: quiz.description || quiz.title || "",
      imageUrl: quiz.imageUrl || quiz.image || null,
      isPublic: quiz.isPublic ?? true,
      category: await categoryToEnum(quiz.category)
    };
  }

  async function fromSummary(s) {
    return {
      ...s,
      id: s.id,
      title: s.title ?? s.name ?? "",
      category: await categoryToName(s.category),
      createdAt: s.createdAt ?? s.createdOn ?? s.createdDate ?? s.dateCreated ?? s.created ?? null,
      questions: s.questions || [],
      questionCount: s.questionCount ?? s.questionsCount ?? (s.questions ? s.questions.length : 0)
    };
  }

  const pointsKey = (p) => (Number(p) <= 1 ? "none" : Number(p) >= 2000 ? "double" : "standard");
  function typeFromServer(v, optionCount) {
    if (typeof v === "number") return v === 1 ? "tf" : "mcq";
    const s = String(v ?? "").toLowerCase();
    if (/true|false|tf|bool/.test(s)) return "tf";
    return optionCount === 2 ? "tf" : "mcq";
  }
  function questionFromServer(q) {
    const options = toArray(q.options ?? q.answers ?? q.choices);
    const type = typeFromServer(q.questionType ?? q.type, options.length);
    let answers = options.map((o) => String(o.text ?? o.answerText ?? o.title ?? ""));
    const correct = Math.max(0, options.findIndex((o) => o.isCorrect ?? o.correct));
    if (type === "tf") answers = ["True", "False"];
    else while (answers.length < 4) answers.push("");

    const out = {
      id: q.id,
      type,
      text: q.text ?? "",
      image: q.imageUrl ?? q.image ?? null,
      timeLimit: Number(q.timeLimit ?? q.timeLimitInSeconds) || 20,
      points: pointsKey(q.points),
      answers,
      correct
    };
    out._fp = JSON.stringify(toQuestionDto(out));
    return out;
  }

  const ROLE_VALUES = { player: 0, creator: 1, teacher: 1, host: 1 };

  /* مسارات اتأكدنا إنها 404 في الباك، فمش هنكرر طلبها كل ثانية ونص */
  const _deadPaths = new Set();

  const remote = {
    auth: {
      async register(dto) {
        const roleKey = String(dto.requestedRole ?? dto.role ?? "player").trim().toLowerCase();
        const rolesDto = typeof dto.rolesDto === "number"
          ? dto.rolesDto
          : (ROLE_VALUES[roleKey] ?? ROLE_VALUES.player);

        const rawName = dto.userName ?? dto.fullName ?? dto.name ?? String(dto.email || "").split("@")[0];
        const userName = String(rawName).trim().replace(/\s+/g, "_");

        return http("POST", "/Auth/register", {
          userName,
          email: String(dto.email).trim(),
          password: dto.password,
          rolesDto
        });
      },

      async login(email, password) {
        const res = await http("POST", "/Auth/login", { email, password });
        const token = res.token || res.accessToken;
        if (token) {
          localStorage.setItem(CONFIG.TOKEN_KEY, token);
          localStorage.setItem("churchQuizToken", token);
        }
        const session = {
          ...(res.user || res),
          token,
          loggedIn: true
        };
        writeJSON(KEYS.session, session);
        return session;
      },

      confirmEmail(email, code) {
        return http("POST", "/Auth/confirm-email", {
          email: String(email).trim(),
          code: String(code).trim()
        });
      },

      resendCode(email) {
        return http("POST", "/Auth/resend-confirmation", {
          email: String(email).trim()
        });
      }
    },

    categories: {
      list: async () => (await getCategoryNames()).map((name, i) => ({ id: i, name }))
    },

    quizzes: {
      list: async () => Promise.all(toArray(await http("GET", "/Quizzes/mine")).map(fromSummary)),
      listPublic: async () => Promise.all(toArray(await http("GET", "/Quizzes/public")).map(fromSummary)),
      // للأدمن فقط: كل الكويزات (Private + Public) من كل المستخدمين
      listAll: async () => Promise.all(toArray(await http("GET", "/Quizzes/all")).map(fromSummary)),

      get: async (id) => {
        try {
          const d = await http("GET", `/Quizzes/${id}`);
          if (d && typeof d === "object" && (d.id != null || d.title != null)) {
            const base = await fromSummary(d);
            const qs = toArray(d.questions ?? d.Questions).map(questionFromServer);
            return { ...base, questions: qs, questionCount: qs.length || base.questionCount, _originalQuestionIds: qs.map((q) => q.id) };
          }
        } catch (e) {
          if (e.code !== "HTTP_404" && e.code !== "HTTP_405") throw e;
        }
        const list = toArray(await http("GET", "/Quizzes/mine"));
        const found = list.find((q) => String(q.id) === String(id));
        return found ? { ...(await fromSummary(found)), _partial: true } : null;
      },

      save: async (quiz) => {
        const dto = await toQuizDto(quiz);
        const isExisting = quiz.id != null && /^\d+$/.test(String(quiz.id));
        const isServerId = (q) => /^\d+$/.test(String(q.id ?? ""));
        const questions = quiz.questions || [];
        let quizId = quiz.id;

        const addQuestion = async (q) => {
          try {
            await http("POST", `/Quizzes/${quizId}/questions`, toQuestionDto(q));
          } catch (e) {
            e.message = `تم حفظ المسابقة (رقم ${quizId}) لكن فشل حفظ سؤال: ${e.message}`;
            throw e;
          }
        };

        if (!isExisting) {
          const res = await http("POST", "/Quizzes", dto);
          quizId = res.id ?? res.quizId;
          for (const q of questions) await addQuestion(q);
          return { ...quiz, id: quizId };
        }

        await http("PUT", `/Quizzes/${quizId}`, dto);

        for (const q of questions.filter((x) => !isServerId(x))) await addQuestion(q);

        if (quiz._partial) return { ...quiz, id: quizId };

        const keep = new Set(questions.filter(isServerId).map((q) => String(q.id)));
        for (const oldId of quiz._originalQuestionIds || []) {
          if (!keep.has(String(oldId))) await http("DELETE", `/Quizzes/questions/${oldId}`);
        }

        for (const q of questions.filter(isServerId)) {
          if (q._fp && JSON.stringify(toQuestionDto(q)) === q._fp) continue;
          try {
            await http("PUT", `/Quizzes/questions/${q.id}`, toQuestionDto(q));
          } catch (e) {
            e.message = `تعذّر تعديل سؤال موجود (محتاج PUT /Quizzes/questions/{id} في الباك إند): ${e.message}`;
            throw e;
          }
        }
        return { ...quiz, id: quizId };
      },

      remove: (id) => http("DELETE", `/Quizzes/${id}`),
      addQuestion: (quizId, question) => http("POST", `/Quizzes/${quizId}/questions`, toQuestionDto(question))
    },

    questions: {
      list: async () => [],
      remove: (id) => http("DELETE", `/Quizzes/questions/${id}`)
    },

    media: {
      async upload(file) {
        const UPLOAD = { path: "/Uploads/image", fields: ["file", "image"] };

        if (!file || !String(file.type).startsWith("image/")) throw new ApiError("NOT_AN_IMAGE", "الملف المرفق ليس صورة.");
        if (file.size > 10 * 1024 * 1024) throw new ApiError("FILE_TOO_LARGE", "حجم الصورة كبير جداً.");

        let res;
        for (let i = 0; i < UPLOAD.fields.length; i++) {
          const fd = new FormData();
          fd.append(UPLOAD.fields[i], file);
          try {
            res = await http("POST", UPLOAD.path, fd, true);
            break;
          } catch (err) {
            if (err.code !== "HTTP_400" || i === UPLOAD.fields.length - 1) throw err;
          }
        }

        const url = typeof res === "string"
          ? res
          : res?.url ?? res?.imageUrl ?? res?.path ?? res?.filePath ?? res?.fileUrl ?? "";
        if (!url) throw new ApiError("NO_URL", "السيرفر لم يرجع رابط الصورة.");

        if (/^(https?:|data:)/i.test(url)) return url;
        const origin = CONFIG.API_BASE.replace(/\/api\/?$/i, "");
        return origin + (url.startsWith("/") ? "" : "/") + url;
      }
    },

    results: {
      list: async () => {
        const cur = readJSON(KEYS.game, null);
        const sid = cur && (cur.sessionId || cur.id);
        if (!sid) return [];
        if (String(cur.ownerId ?? "") !== String(currentUserId() ?? "")) return [];
        const rows = toArray(await http("GET", `/Games/sessions/${sid}/leaderboard`));
        return rows.map((r) => ({
          ...r,
          name: r.name ?? "Participant",
          score: r.totalScore ?? 0,
          points: r.totalScore ?? 0,
          rank: r.rank,
          total: cur.totalQuestions ?? 0,
          quizTitle: cur.quizTitle ?? cur.title ?? "Church Quiz",
          date: cur.createdAt
        }));
      },
      saveGame: async () => null
    },

    settings: {
      get: async () => readJSON(KEYS.settings, {}),
      save: async (s) => { writeJSON(KEYS.settings, s); return s; }
    },

    game: {
      async create(quizId) {
        const s = await http("POST", `/Games/${quizId}/sessions`);
        const pin = s.pinCode ?? s.pin ?? s.roomCode ?? s.code;
        if (pin == null) {
          throw new ApiError("NO_PIN", "السيرفر لم يرجع PIN للغرفة.");
        }
        const session = {
          ...s,
          ownerId: currentUserId(),
          createdAt: s.createdAt ?? new Date().toISOString(),
          quizId,
          sessionId: s.sessionId ?? s.id,
          roomCode: String(pin),
          status: "waiting"
        };
        writeJSON(KEYS.players, []);
        writeJSON(KEYS.game, session);
        return session;
      },

      async start(pin) {
        const cur = readJSON(KEYS.game, {});
        const p = pin ?? cur.roomCode;
        await realtime.connect({ pin: p, role: "host" });
        await realtime.invoke("StartGame");
        const updated = { ...cur, status: "playing" };
        writeJSON(KEYS.game, updated);
        return updated;
      },

      async end() {
        await realtime.invoke("EndGame");
        writeJSON(KEYS.game, { ...readJSON(KEYS.game, {}), status: "finished" });
      },

      /* كل جلسات المدرّس المفتوحة (Waiting / Running) من السيرفر — بترجع array.
         لو الـ endpoint مش موجود أو السيرفر مش متاح بترمي خطأ، والصفحة بترجع للجلسة المحفوظة محلياً. */
      async openSessions() {
        const rows = toArray(await http("GET", "/Games/my-active"));
        return rows
          .map((r) => ({
            sessionId: r.sessionId ?? r.id,
            roomCode: String(r.pinCode ?? r.pin ?? ""),
            status: /^running$/i.test(String(r.status || "")) ? "playing" : "waiting",
            quizId: r.quizId,
            quizTitle: r.quizTitle ?? r.title ?? "",
            playersCount: Number(r.playersCount) || 0,
            totalQuestions: Number(r.totalQuestions) || 0,
            createdAt: r.date ?? null
          }))
          .filter((r) => r.roomCode)
          .sort((a, b) => Number(b.sessionId || 0) - Number(a.sessionId || 0));
      },

      /* بيخلّي الجلسة دي هي "الحالية" على الجهاز ده (اللوبي وصفحة اللعب بيقروا منها) */
      useSession(s) {
        const cur = readJSON(KEYS.game, null);
        if (!cur || String(cur.roomCode) !== String(s.roomCode)) writeJSON(KEYS.players, []);
        const session = { ...(cur && String(cur.roomCode) === String(s.roomCode) ? cur : {}), ...s, ownerId: currentUserId() };
        writeJSON(KEYS.game, session);
        return session;
      },

      async join(pin, nickname, avatar = "fox") {
        const p = String(pin).trim();
        const name = String(nickname).trim();
        await realtime.connect({ pin: p, role: "player" });
        const waitJoined = realtime.waitFor("Joined", 8000);
        try {
          await realtime.invoke("JoinGame", p, name, String(avatar));
        } catch (e) {
          waitJoined.catch(() => {});
          throw e;
        }
        const info = await waitJoined;
        writeJSON(KEYS.reconnect, { pin: p, playerId: info.playerId, reconnectToken: info.reconnectToken, nickname: name, avatar });

        // حفظ اللاعب في قايمة لاعبين الغرفة فوراً عشان يظهر لما ترجع اللوبي
        const cur = readJSON(KEYS.game, null);
        if (cur && String(cur.roomCode) === p) {
          const list = readJSON(KEYS.players, []);
          if (!list.some((x) => x.nickname.toLowerCase() === name.toLowerCase())) {
            list.push({ id: info.playerId || uuid(), nickname: name, avatar });
            writeJSON(KEYS.players, list);
          }
        }

        return { id: info.playerId, playerId: info.playerId, nickname: name, avatar, reconnectToken: info.reconnectToken };
      },

      async rejoin() {
        const saved = readJSON(KEYS.reconnect, null);
        if (!saved) throw new ApiError("NO_SAVED_PLAYER", "مفيش لاعب محفوظ للرجوع.");
        await realtime.connect({ pin: saved.pin, role: "player" });
        await realtime.invoke("RejoinGame", saved.pin, saved.reconnectToken);
        return saved;
      },

      submitAnswer: (answerId) => realtime.invoke("SubmitAnswer", Number(answerId)),

      async players(pin) {
        const cur = readJSON(KEYS.game, {});
        const sid = cur.sessionId ?? cur.id;
        const p = pin ?? cur.roomCode;
        // leaderboard هو الـ endpoint الوحيد الموجود فعلاً في الباك، فبنجربه الأول
        const paths = [
          sid ? `/Games/sessions/${sid}/leaderboard` : null,
          sid ? `/Games/sessions/${sid}/players` : null,
          sid ? `/Games/sessions/${sid}` : null,
          p ? `/Games/${p}/players` : null,
          p ? `/Games/sessions/by-pin/${p}` : null
        ].filter((path) => path && !_deadPaths.has(path));

        for (const path of paths) {
          try {
            const res = await http("GET", path);
            const rawList = Array.isArray(res)
              ? res
              : toArray(res?.players ?? res?.participants ?? res?.connectedPlayers ?? res?.session?.players ?? res);
            if (Array.isArray(rawList) && rawList.length) {
              const normalized = rawList.map(mapPlayer).filter(Boolean);
              if (normalized.length) {
                writeJSON(KEYS.players, normalized);
                return normalized;
              }
            }
          } catch (e) {
            if (e.code === "HTTP_404" || e.code === "HTTP_405") _deadPaths.add(path);
          }
        }
        return readJSON(KEYS.players, []);
      }
    }
  };

  /* =========================================================================
     REALTIME (SignalR Connection Wrapper)
     ========================================================================= */
  const cleanHubError = (err) =>
    String((err && err.message) || err).replace(/^.*HubException:\s*/s, "").trim();

  function extractPlayersFromPayload(payload) {
    if (!payload) return [];
    const raw = Array.isArray(payload)
      ? payload
      : toArray(
          payload.players ??
          payload.participants ??
          payload.connectedPlayers ??
          payload.session?.players ??
          payload.data?.players ??
          payload
        );
    return raw.map(mapPlayer).filter(Boolean);
  }

  function syncPlayersCacheFromPayload(payload) {
    const arr = extractPlayersFromPayload(payload);
    if (arr.length) {
      writeJSON(KEYS.players, arr);
    }
    return arr;
  }

  const realtime = {
    _handlers: {},
    _channel: null,
    _conn: null,
    _pin: null,
    _role: null,
    _bound: new Set(),

    _bind(evt) {
      if (!this._conn || this._bound.has(evt)) return;
      this._bound.add(evt);
      this._conn.on(evt, (...args) => this._dispatch(evt, args.length > 1 ? args : (args[0] ?? {})));
    },

    async connect({ pin, role = "player" } = {}) {
      if (CONFIG.USE_MOCK) {
        this._pin = pin;
        if (!this._channel) {
          this._channel = new BroadcastChannel("kahoot_game_bus");
          this._channel.onmessage = (e) => e.data && this._dispatch(e.data.type, e.data);
        }
        return;
      }

      if (!window.signalR) {
        throw new ApiError("SIGNALR_NOT_LOADED", "مكتبة SignalR غير محمّلة في الصفحة.");
      }

      const Connected = signalR.HubConnectionState.Connected;
      if (this._conn && this._conn.state === Connected && this._pin === pin && this._role === role) return;
      if (this._conn) { try { await this._conn.stop(); } catch { /* ignore */ } }

      this._pin = pin;
      this._role = role;
      this._bound = new Set();

      this._conn = new signalR.HubConnectionBuilder()
        .withUrl(CONFIG.HUB_URL, {
          accessTokenFactory: () => localStorage.getItem(CONFIG.TOKEN_KEY) || localStorage.getItem("churchQuizToken") || ""
        })
        .withAutomaticReconnect()
        .build();

      ["Joined", "PlayerJoined", "PlayerLeft", "UpdatePlayerList", "GameStarted", "ReceiveAnswer", "StateChanged",
        ...Object.keys(this._handlers)].forEach((evt) => this._bind(evt));

      this._conn.onreconnected(async () => {
        try {
          if (this._role === "host") {
            const res = await this._conn.invoke("HostJoin", this._pin);
            syncPlayersCacheFromPayload(res);
            this._dispatch("UpdatePlayerList", res);
          } else {
            const saved = readJSON(KEYS.reconnect, null);
            if (saved) await this._conn.invoke("RejoinGame", saved.pin, saved.reconnectToken);
          }
        } catch (err) { console.error("Re-join after reconnect failed:", err); }
      });

      try {
        await this._conn.start();
      } catch (err) {
        console.error("SignalR Connection Error:", err);
        throw new ApiError("HUB_CONNECTION_FAILED", "تعذر الاتصال بـ GameHub.");
      }

      if (role === "host") {
        const res = await this.invoke("HostJoin", pin);
        syncPlayersCacheFromPayload(res);
      }
    },

    async invoke(method, ...args) {
      if (!this._conn || this._conn.state !== signalR.HubConnectionState.Connected) {
        throw new ApiError("NOT_CONNECTED", "غير متصل بالسيرفر اللحظي.");
      }
      try {
        return await this._conn.invoke(method, ...args);
      } catch (err) {
        console.error(`Hub ${method} failed:`, err);
        throw new ApiError("HUB_ERROR", cleanHubError(err));
      }
    },

    on(type, handler) {
      (this._handlers[type] ||= []).push(handler);
      this._bind(type);
    },

    off(type, handler) {
      this._handlers[type] = (this._handlers[type] || []).filter((fn) => fn !== handler);
    },

    waitFor(type, ms = 8000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.off(type, handler);
          reject(new ApiError("TIMEOUT", "السيرفر لم يرد في الوقت المحدد."));
        }, ms);
        const handler = (data) => { clearTimeout(timer); this.off(type, handler); resolve(data); };
        this.on(type, handler);
      });
    },

    async disconnect() {
      if (this._conn) { try { await this._conn.stop(); } catch { /* ignore */ } }
      this._conn = null;
    },

    send(type, data = {}) {
      if (CONFIG.USE_MOCK) this._channel?.postMessage({ type, ...data });
      else console.warn(`realtime.send("${type}") غير مدعوم مع الـ GameHub`);
    },

    _dispatch(type, data) {
      (this._handlers[type] || []).forEach((fn) => fn(data));
    }
  };

  const mapPlayer = (p) => {
    if (!p) return null;
    if (typeof p === "string") return { id: uuid(), nickname: p, avatar: null };
    const obj = p.player ?? p.data ?? p;
    const nick = obj?.nickname ?? obj?.name ?? obj?.userName ?? obj?.playerName;
    if (!nick) return null;
    return { id: obj?.id ?? obj?.playerId ?? uuid(), nickname: nick, avatar: obj?.avatar ?? obj?.avatarKey ?? null };
  };

  realtime.on("PlayerJoined", (payload) => {
    const item = mapPlayer(payload);
    if (!item) return;
    const list = readJSON(KEYS.players, []);
    if (!list.some((p) => p.nickname.toLowerCase() === item.nickname.toLowerCase())) {
      list.push(item);
      writeJSON(KEYS.players, list);
    }
  });

  realtime.on("UpdatePlayerList", (payload) => {
    syncPlayersCacheFromPayload(payload);
  });

  realtime.on("StateChanged", (payload) => {
    syncPlayersCacheFromPayload(payload);
  });

  realtime.on("PlayerLeft", (payload) => {
    const nick = typeof payload === "string"
      ? payload
      : payload?.player?.nickname ?? payload?.name ?? payload?.nickname ?? payload?.playerName;
    if (!nick) return;
    const list = readJSON(KEYS.players, []).filter((p) => p.nickname.toLowerCase() !== String(nick).toLowerCase());
    writeJSON(KEYS.players, list);
  });

  const impl = CONFIG.USE_MOCK ? mock : remote;

  const Api = {
    config: CONFIG,
    ApiError,
    ...impl,
    realtime,
    auth: {
      ...impl.auth,
      getSession() {
        const token = localStorage.getItem(CONFIG.TOKEN_KEY) || localStorage.getItem("churchQuizToken");
        const s = readJSON(KEYS.session, null);
        if (token || (s && s.loggedIn)) {
          return s || { loggedIn: true };
        }
        return null;
      },
      logout() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem("churchQuizToken");
        localStorage.removeItem(KEYS.session);
        localStorage.removeItem(KEYS.game);
        localStorage.removeItem(KEYS.players);
        localStorage.removeItem(KEYS.reconnect);
      },
      requireLogin(redirect = "loginn.html") {
        if (Api.auth.getSession()) return true;
        location.replace(redirect);
        return false;
      }
    },
    game: {
      ...impl.game,
      current() { return readJSON(KEYS.game, null); },
      saveCurrent(session) { writeJSON(KEYS.game, session); }
    }
  };

  window.Api = Api;
})();