"use strict";

/* ===========================================================================
   api.js  —  الطبقة الموحدة للتعامل مع البيانات والـ Realtime (REST + SignalR)
   تم تعديل قسم remote ليطابق الـ Swagger الفعلي.
   =========================================================================== */
(function () {
  // على اللابتوب بنستخدم localhost، ولما الصفحة تتفتح من التليفون (عنوان الشبكة 192.168.x.x)
  // بنستخدم نفس العنوان للباك إند، لأن localhost على التليفون معناه التليفون نفسه
  const API_HOST = (!location.hostname || location.hostname === "127.0.0.1") ? "localhost" : location.hostname;

  const CONFIG = {
    USE_MOCK: false,
    API_BASE: `https://${API_HOST}:7152/api`,
    HUB_URL: `https://${API_HOST}:7152/gamehub`,
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

  // يحوّل أي شكل رد (array أو {items} أو {data}) إلى array
  const toArray = (r) => (Array.isArray(r) ? r : r?.items || r?.data || r?.$values || []);

  // يستخرج سبب الخطأ من أي شكل رد: ProblemDetails، قايمة أخطاء Identity، نص عادي...
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
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined
      });
    } catch (netErr) {
      console.error("Network Error:", netErr);
      throw new ApiError("NETWORK_ERROR", "تعذر الاتصال بالسيرفر. تأكد من تشغيل الباك إند.");
    }

    if (res.status === 401) {
      Api.auth.logout();
      location.href = "login.html";
      throw new ApiError("UNAUTHORIZED", "انتهت جلسة الدخول. يرجى إعادة التسجيل.");
    }

    if (!res.ok) {
      let raw = "";
      try { raw = await res.text(); } catch { /* no body */ }
      let err = {};
      try { err = raw ? JSON.parse(raw) : {}; } catch { err = raw; } // رد نصي عادي
      let message = extractErrorMessage(err, res.status);
      if (res.status === 403) message = "ليس لديك صلاحية (يجب أن يكون الحساب Creator أو Admin).";
      console.error(`HTTP ${res.status} ${method} ${url}`, err);
      throw new ApiError((err && err.code) || `HTTP_${res.status}`, message);
    }

    if (res.status === 204) return null;
    const text = await res.text();
    try { return text ? JSON.parse(text) : {}; } catch { return {}; }
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
      }
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
     REMOTE  (ASP.NET Core REST API) — مطابق لـ QuizzesController
     ========================================================================= */
  const normKey = (s) => String(s).toLowerCase().replace(/[\s_\-]/g, "");

  let _catNames = null;
  async function getCategoryNames() {
    if (!_catNames) _catNames = toArray(await http("GET", "/Quizzes/categories")).map(String);
    return _catNames;
  }

  // يحوّل اسم/رقم الـ category لرقم الـ enum اللي السيرفر مستنيه
  async function categoryToEnum(cat) {
    if (typeof cat === "number") return cat;
    const names = await getCategoryNames();
    const idx = names.findIndex((n) => normKey(n) === normKey(cat ?? ""));
    if (idx > -1) return idx;
    if (cat !== "" && cat != null && !isNaN(cat)) return Number(cat);
    return 0;
  }

  // يحوّل رقم/اسم الـ category لاسم للعرض
  async function categoryToName(cat) {
    const names = await getCategoryNames();
    if (typeof cat === "number") return names[cat] ?? String(cat);
    return cat ?? "";
  }

  // ⚠️ قيم enum الـ QuestionType تخمين (0 = اختيار متعدد، 1 = صح/خطأ) — ابعتلي الـ enum للتأكد
  const QUESTION_TYPE = { mcq: 0, quiz: 0, tf: 1 };
  // القيم المسموحة للنقاط من السيرفر: 1..5000
  const POINTS = { none: 1, zero: 1, standard: 1000, double: 2000 };

  // QuestionCreateDto: Text, ImageUrl, QuestionType, TimeLimit(5-250), Points(1-5000), Options(2-4)
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
      options // ⚠️ أسماء حقول OptionDto تخمين (text, isCorrect)
    };
  }

  // QuizCreateDto: Title, Description, ImageUrl, IsPublic, Category (enum)
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
      questions: s.questions || [],
      questionCount: s.questionCount ?? s.questionsCount ?? (s.questions ? s.questions.length : 0)
    };
  }

  // ⚠️ قيم enum الـ UserRoles تخمين (Player=0, Creator=1, Admin=2) — ابعتلي الـ enum عشان أظبطها
  // الفورم مفروض ما يقدرش يسجّل Admin، فأي قيمة غير معروفة بتتحول لـ player
  const ROLE_VALUES = { player: 0, creator: 1, teacher: 1, host: 1 };

  const remote = {
    auth: {
      // RegisterDto: UserName, Email, Password, rolesDto (enum UserRoles)
      async register(dto) {
        const roleKey = String(dto.requestedRole ?? dto.role ?? "player").trim().toLowerCase();
        const rolesDto = typeof dto.rolesDto === "number"
          ? dto.rolesDto
          : (ROLE_VALUES[roleKey] ?? ROLE_VALUES.player);

        // الـ Identity غالبًا بيرفض المسافات في UserName، فبنبدلها بـ _
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
      }
    },

    // GET /api/Quizzes/categories  → ["BibleKnowledge", ...]
    categories: {
      list: async () => (await getCategoryNames()).map((name, i) => ({ id: i, name }))
    },

    quizzes: {
      // GET /api/Quizzes/mine
      list: async () => Promise.all(toArray(await http("GET", "/Quizzes/mine")).map(fromSummary)),

      // GET /api/Quizzes/public
      listPublic: async () => Promise.all(toArray(await http("GET", "/Quizzes/public")).map(fromSummary)),

      // ⚠️ مفيش GET /Quizzes/{id} في الباك إند، فبنرجّع الملخص من mine (غالبًا من غير أسئلة)
      get: async (id) => {
        const list = toArray(await http("GET", "/Quizzes/mine"));
        const found = list.find((q) => String(q.id) === String(id));
        return found ? fromSummary(found) : null;
      },

      // POST /api/Quizzes → { id } ثم POST /Quizzes/{id}/questions لكل سؤال
      // PUT /api/Quizzes/{id} → 204 (بيعدّل بيانات الكويز بس) + بيضيف الأسئلة الجديدة
      save: async (quiz) => {
        const dto = await toQuizDto(quiz);
        const isExisting = quiz.id != null && /^\d+$/.test(String(quiz.id));
        let quizId = quiz.id;
        let questions = quiz.questions || [];

        if (isExisting) {
          await http("PUT", `/Quizzes/${quizId}`, dto);
          // الأسئلة اللي ids بتاعتها من السيرفر (أرقام قصيرة) متضافة قبل كده
          questions = questions.filter((q) => !/^\d{1,9}$/.test(String(q.id ?? "")));
        } else {
          const res = await http("POST", "/Quizzes", dto);
          quizId = res.id ?? res.quizId;
        }

        for (const q of questions) {
          try {
            await http("POST", `/Quizzes/${quizId}/questions`, toQuestionDto(q));
          } catch (e) {
            e.message = `تم حفظ المسابقة (رقم ${quizId}) لكن فشل حفظ سؤال: ${e.message}`;
            throw e;
          }
        }
        return { ...quiz, id: quizId };
      },

      // DELETE /api/Quizzes/{id}
      remove: (id) => http("DELETE", `/Quizzes/${id}`),

      // POST /api/Quizzes/{quizId}/questions → { id }
      addQuestion: (quizId, question) => http("POST", `/Quizzes/${quizId}/questions`, toQuestionDto(question))
    },

    questions: {
      // ⚠️ مفيش endpoint لقايمة الأسئلة، و /mine مش بيرجّع الأسئلة — لازم endpoint جديد في الباك إند
      list: async () => [],
      // DELETE /api/Quizzes/questions/{questionId}
      remove: (id) => http("DELETE", `/Quizzes/questions/${id}`)
    },

    media: {
      // ⚠️ عدّل المسار حسب UploadsController
      async upload(file) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await http("POST", "/Uploads", fd, true);
        return res.url || res.path || "";
      }
    },

    results: {
      // GET /api/Games/sessions/{sessionId}/leaderboard → List<StandingDto>
      // StandingDto(PlayerId, Name, TotalScore, PointsEarned, Rank, RankChange, Streak)
      list: async () => {
        const cur = readJSON(KEYS.game, null);
        const sid = cur && (cur.sessionId || cur.id);
        if (!sid) return [];
        const rows = toArray(await http("GET", `/Games/sessions/${sid}/leaderboard`));
        return rows.map((r) => ({
          ...r,
          name: r.name ?? "Participant",
          score: r.totalScore ?? 0,
          points: r.totalScore ?? 0,
          rank: r.rank,
          total: cur.totalQuestions ?? 0, // ⚠️ السيرفر مش بيرجّع عدد الأسئلة/الإجابات الصحيحة
          quizTitle: cur.quizTitle ?? cur.title ?? "Church Quiz",
          date: cur.createdAt
        }));
      },
      saveGame: async () => null
    },

    // ⚠️ مفيش Settings في الباك إند — localStorage مؤقتًا
    settings: {
      get: async () => readJSON(KEYS.settings, {}),
      save: async (s) => { writeJSON(KEYS.settings, s); return s; }
    },

    game: {
      // POST /api/Games/{quizId}/sessions → SessionCreatedDto
      async create(quizId) {
        const s = await http("POST", `/Games/${quizId}/sessions`);
        console.log("SessionCreatedDto من السيرفر:", s);
        const pin = s.pinCode ?? s.pin ?? s.roomCode ?? s.code;
        if (pin == null) {
          throw new ApiError("NO_PIN", "السيرفر لم يرجع PIN للغرفة. افتح الـ Console وابعتلي شكل SessionCreatedDto.");
        }
        const session = {
          ...s,
          quizId,
          sessionId: s.sessionId ?? s.id,
          roomCode: String(pin),
          status: "waiting"
        };
        writeJSON(KEYS.players, []);
        writeJSON(KEYS.game, session);
        return session;
      },

      // المدرّس: HostJoin(pin) ثم StartGame()
      async start(pin) {
        const cur = readJSON(KEYS.game, {});
        const p = pin ?? cur.roomCode;
        await realtime.connect({ pin: p, role: "host" });
        await realtime.invoke("StartGame");
        const updated = { ...cur, status: "playing" };
        writeJSON(KEYS.game, updated);
        return updated;
      },

      // المدرّس: EndGame()
      async end() {
        await realtime.invoke("EndGame");
        writeJSON(KEYS.game, { ...readJSON(KEYS.game, {}), status: "finished" });
      },

      // اللاعب: JoinGame(pin, name) ← السيرفر يرد بحدث "Joined" { playerId, reconnectToken }
      async join(pin, nickname) {
        const p = String(pin).trim();
        const name = String(nickname).trim();
        await realtime.connect({ pin: p, role: "player" });
        const waitJoined = realtime.waitFor("Joined", 8000);
        try {
          await realtime.invoke("JoinGame", p, name);
        } catch (e) {
          waitJoined.catch(() => {});
          throw e;
        }
        const info = await waitJoined;
        writeJSON(KEYS.reconnect, { pin: p, playerId: info.playerId, reconnectToken: info.reconnectToken, nickname: name });
        return { id: info.playerId, playerId: info.playerId, nickname: name, reconnectToken: info.reconnectToken };
      },

      // اللاعب: رجوع بعد انقطاع النت — RejoinGame(pin, reconnectToken)
      async rejoin() {
        const saved = readJSON(KEYS.reconnect, null);
        if (!saved) throw new ApiError("NO_SAVED_PLAYER", "مفيش لاعب محفوظ للرجوع.");
        await realtime.connect({ pin: saved.pin, role: "player" });
        await realtime.invoke("RejoinGame", saved.pin, saved.reconnectToken);
        return saved;
      },

      // اللاعب: SubmitAnswer(answerId)
      submitAnswer: (answerId) => realtime.invoke("SubmitAnswer", Number(answerId)),

      // مفيش endpoint لقايمة اللاعبين — بتتحدّث من حدث PlayerJoined
      async players() { return readJSON(KEYS.players, []); }
    }
  };

  /* =========================================================================
     REALTIME (SignalR Connection Wrapper)
     ========================================================================= */
  const cleanHubError = (err) =>
    String((err && err.message) || err).replace(/^.*HubException:\s*/s, "").trim();

  const realtime = {
    _handlers: {},
    _channel: null,
    _conn: null,
    _pin: null,
    _role: null,
    _bound: new Set(),

    // يربط حدث SignalR باسمه (مرة واحدة لكل اتصال)
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
        throw new ApiError("SIGNALR_NOT_LOADED", "مكتبة SignalR غير محمّلة في الصفحة (ضيف script الـ signalr.min.js).");
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

      // بعد إعادة الاتصال السيرفر بينسى الـ Context، فلازم نعيد الدخول
      this._conn.onreconnected(async () => {
        try {
          if (this._role === "host") await this._conn.invoke("HostJoin", this._pin);
          else {
            const saved = readJSON(KEYS.reconnect, null);
            if (saved) await this._conn.invoke("RejoinGame", saved.pin, saved.reconnectToken);
          }
        } catch (err) { console.error("Re-join after reconnect failed:", err); }
      });

      try {
        await this._conn.start();
        console.log("SignalR connected successfully! 🚀");
      } catch (err) {
        console.error("SignalR Connection Error:", err);
        throw new ApiError("HUB_CONNECTION_FAILED", "تعذر الاتصال بـ GameHub. تأكد من الباك إند ومن إعدادات CORS/التوكن.");
      }

      if (role === "host") await this.invoke("HostJoin", pin);
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

    // ينتظر حدث واحد مع timeout
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

    // للـ mock فقط. مع السيرفر الحقيقي استخدم Api.game.* أو Api.realtime.invoke(method, ...args)
    send(type, data = {}) {
      if (CONFIG.USE_MOCK) this._channel?.postMessage({ type, ...data });
      else console.warn(`realtime.send("${type}") غير مدعوم مع الـ GameHub — استخدم Api.realtime.invoke("MethodName", ...)`);
    },

    _dispatch(type, data) {
      (this._handlers[type] || []).forEach((fn) => fn(data));
    }
  };

  // نحدّث قايمة اللاعبين المحفوظة كل ما حد يدخل (الحدث بيوصل المدرّس باسم اللاعب)
  realtime.on("PlayerJoined", (payload) => {
    const nick = typeof payload === "string" ? payload : payload?.name ?? payload?.nickname;
    if (!nick) return;
    const list = readJSON(KEYS.players, []);
    if (!list.some((p) => p.nickname === nick)) {
      list.push({ id: uuid(), nickname: nick });
      writeJSON(KEYS.players, list);
    }
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
        localStorage.removeItem(KEYS.session);
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem("churchQuizToken");
      },
      requireLogin(redirect = "login.html") {
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
