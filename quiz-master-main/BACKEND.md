# ربط المشروع بالباك اند (ASP.NET Core)

كل الاتصال بالبيانات والـ Realtime موجود في ملف واحد: **`api.js`**. باقي الصفحات بتكلّم `Api.*` بس.

## خطوات الربط
1. في `api.js` غيّر `CONFIG.USE_MOCK` إلى `false` وظبط `API_BASE` و `HUB_URL`.
2. أضف سكريبت SignalR قبل `api.js` في `lobby.html` و `host-game.html` و `player.html`:
   `<script src="https://cdn.jsdelivr.net/npm/@microsoft/signalr@8/dist/browser/signalr.min.js"></script>`
3. مفيش أي تعديل مطلوب في `admin.js` أو `host-game.js` أو `player.js` أو `lobby.js`.

> الوضع الحالي (`USE_MOCK = true`) بيخزّن في المتصفح، فاللاعب لازم يكون على نفس المتصفح/الجهاز.
> مع الباك اند + SignalR اللاعبين هيدخلوا من موبايلاتهم عادي.

## REST endpoints (JSON، والـ Authorization: Bearer <token>)
| Method | Path | Body / Response |
|---|---|---|
| POST | `/api/auth/register` | `{fullName,email,password,requestedRole}` ← خطأ `{code:"DUPLICATE_EMAIL"}` |
| POST | `/api/auth/login` | `{email,password}` ← `{token, user:{id,name,email,role}}` ، خطأ `{code:"INVALID_CREDENTIALS"}` |
| GET | `/api/categories` | `[{id,name}]` |
| GET | `/api/quizzes` | ملخصات: `[{id,title,category,status,createdAt,questionCount}]` |
| GET | `/api/quizzes/{id}` | الكويز كامل (فيه `questions`) |
| POST / PUT | `/api/quizzes` , `/api/quizzes/{id}` | الكويز كامل ← يرجّع الكويز بعد الحفظ (الـ `id` بيجي من السيرفر للجديد) |
| DELETE | `/api/quizzes/{id}` | 204 |
| GET | `/api/questions` | كل الأسئلة + `quizId` و `quizTitle` |
| DELETE | `/api/questions/{id}` | 204 ، خطأ `{code:"LAST_QUESTION"}` لو آخر سؤال في الكويز |
| POST | `/api/media` | `multipart: file` ← `{url}` (الصور بتتخزن كـ URL مش Base64) |
| GET / PUT | `/api/settings` | `{churchName,email,language}` |
| GET | `/api/results` | `[{name,score,total,percentage,time,date,quizTitle}]` |
| POST | `/api/results/games` | `{quizId,quizTitle,roomCode,totalQuestions,players:[{id,nickname,points,correct,timeSeconds}]}` |
| POST | `/api/games` | `{quizId}` ← `{roomCode,status,quizId,quizTitle,questions}` |
| POST | `/api/games/{pin}/start` | الجلسة |
| POST | `/api/games/{pin}/players` | `{nickname}` ← `{id,nickname}` ، أخطاء: `GAME_NOT_FOUND` , `NICKNAME_TAKEN` |
| GET | `/api/games/{pin}/players` | `[{id,nickname}]` |

## شكل السؤال (Question DTO)
```json
{ "id":"guid", "type":"mcq | tf", "text":"", "image":"url | null",
  "timeLimit":20, "points":"standard | double | none",
  "answers":["A","B","C","D"], "correct":0 }
```
`mcq` = 4 إجابات، `tf` = إجابتين. `timeLimit` بالثواني (من 5 لحد 10800).

## SignalR Hub (`/hubs/game?pin=123456&role=host|player`)
- Method واحدة على السيرفر: `Publish(string pin, string type, object data)` تبعت لكل اللي في نفس الـ pin group.
- الـ client بيستقبل الحدث `message(type, data)`.
- أنواع الرسائل:
  - Host ← Players: `STATE_GET_READY` , `STATE_SHOW_PAD {isTF,qIndex}` , `STATE_SHOW_RESULT {results:{[playerId]:{correct,gained,score}}}` , `STATE_GAME_OVER`
  - Player ← Host: `PLAYER_ANSWERED {playerId,answerIndex}`

## لازم تتعمل في السيرفر (مش في الفرونت)
- **الصلاحيات:** الفرونت بيمنع الدخول بس، فلازم `[Authorize]` على كل endpoints الأدمن، وموافقة الأدمن على طلب الـ Creator (حالياً أي حد بيسجل بيدخل كـ Creator في الـ Mock).
- **حساب النقاط:** حالياً الـ Host هو اللي بيحسبها (نفس الأسلوب الأصلي). للحماية من الغش الأفضل السيرفر يستقبل الإجابات ويحسب ويبعت `STATE_SHOW_RESULT`.
- تأكد إن اللاعب مايشوفش `correct` في أي response.
- تحقق من الـ nickname (طول/تكرار) والـ pin على السيرفر.
