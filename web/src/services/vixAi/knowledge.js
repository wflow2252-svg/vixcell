// ─── VIXCELL AI — Knowledge Base ────────────────────────────────────
// Curated technical knowledge: concepts, comparisons, tutorials, FAQs.
// Each entry has keywords for fuzzy matching + bilingual answers.

import { normalize } from './intents.js'

// ─── Concept Definitions ────────────────────────────────────────────
const CONCEPTS = [
  {
    keywords: ['javascript', 'js', 'جافا سكريبت', 'جافاسكريبت'],
    en: `**JavaScript** is the programming language of the web — a dynamic, interpreted language that runs in browsers and on servers (via Node.js).

**Core features:**
• Dynamically typed
• Prototype-based object orientation
• First-class functions & closures
• Async via Promises and async/await
• Event loop concurrency model

**Used for:** Frontend (React, Vue), Backend (Node.js), Mobile (React Native), Desktop (Electron), even ML (TensorFlow.js).

JavaScript is *the* language to know if you're building anything web-related in 2026.`,
    ar: `**JavaScript** هي لغة الويب الأساسية — لغة ديناميكية مفسرة بتشتغل في المتصفح وعلى السيرفر (عن طريق Node.js).

**المميزات الأساسية:**
• Dynamically typed (متغيرات بدون نوع ثابت)
• Object orientation بنظام Prototype
• Functions كمواطن من الدرجة الأولى وclosures
• Async عن طريق Promises و async/await
• Event loop للتعامل مع التزامن

**بتستخدم في:** Frontend (React, Vue)، Backend (Node.js)، Mobile (React Native)، Desktop (Electron)، حتى ML (TensorFlow.js).

JavaScript هي *اللغة* اللي لازم تعرفها لأي حاجة ويب في 2026.`,
  },
  {
    keywords: ['typescript', 'ts', 'تايب سكريبت'],
    en: `**TypeScript** is a superset of JavaScript that adds static type checking.

**Why use it:**
• Catches bugs at compile time instead of runtime
• Better IDE autocomplete & refactoring
• Self-documenting code via types
• Industry standard for large projects (Microsoft, Google, Airbnb)

**Quick example:**
\`\`\`typescript
interface User {
  id: number
  name: string
  email?: string  // optional
}

function greet(user: User): string {
  return \`Hello, \${user.name}\`
}
\`\`\`

If your project has >1000 lines, switch to TypeScript. You'll thank yourself.`,
    ar: `**TypeScript** هي إضافة على JavaScript بتضيف static type checking.

**ليه تستخدمها:**
• بتكشف الـ bugs أثناء الـ compile مش الـ runtime
• Autocomplete وrefactoring أفضل في الـ IDE
• الكود نفسه بيوثق نفسه عن طريق الـ types
• المعيار الصناعي للمشاريع الكبيرة (Microsoft, Google, Airbnb)

**مثال سريع:**
\`\`\`typescript
interface User {
  id: number
  name: string
  email?: string  // اختياري
}

function greet(user: User): string {
  return \`Hello, \${user.name}\`
}
\`\`\`

لو مشروعك أكتر من 1000 سطر، حول لـ TypeScript. هتشكر نفسك.`,
  },
  {
    keywords: ['react', 'رياكت', 'ري اكت'],
    en: `**React** is the most popular JavaScript library for building user interfaces, created by Facebook (Meta) in 2013.

**Core ideas:**
• **Components** — UI is built from reusable pieces
• **JSX** — HTML-like syntax inside JavaScript
• **Virtual DOM** — efficient rendering by diffing
• **Hooks** — \`useState\`, \`useEffect\`, etc. for state & side effects
• **One-way data flow** — props down, events up

**Tiny example:**
\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
\`\`\`

**Ecosystem:** Next.js for fullstack, React Router for routing, Redux/Zustand for state, TanStack Query for data fetching.`,
    ar: `**React** هي أشهر مكتبة JavaScript لبناء واجهات المستخدم، أنشأتها Facebook (Meta) سنة 2013.

**الأفكار الأساسية:**
• **Components** — الواجهة بتتبني من قطع قابلة لإعادة الاستخدام
• **JSX** — صياغة شبيهة بـ HTML داخل JavaScript
• **Virtual DOM** — رندر فعال عن طريق الـ diffing
• **Hooks** — \`useState\`, \`useEffect\`, إلخ للحالة والـ side effects
• **One-way data flow** — props نازلة، events طالعة

**مثال صغير:**
\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
\`\`\`

**الـ Ecosystem:** Next.js للـ fullstack، React Router للـ routing، Redux/Zustand للحالة، TanStack Query للبيانات.`,
  },
  {
    keywords: ['nodejs', 'node.js', 'node', 'نود', 'نود جي اس'],
    en: `**Node.js** is a JavaScript runtime built on Chrome's V8 engine — it lets you run JavaScript on the server.

**Why it's huge:**
• Same language frontend + backend
• Non-blocking, event-driven (great for I/O heavy apps)
• Massive ecosystem (npm has >2M packages)
• Fast development cycle

**Common stack:**
\`\`\`
Express      — minimal web framework
Fastify      — faster, schema-based alternative
NestJS       — opinionated, TypeScript-first
Prisma/TypeORM — ORM for databases
\`\`\`

**When to use:** APIs, real-time apps (chat, games), microservices, build tools, CLI tools.
**When NOT to use:** CPU-heavy work (use Go/Rust for that).`,
    ar: `**Node.js** هو JavaScript runtime مبني على محرك V8 من جوجل — بيخليك تشغل JavaScript على السيرفر.

**ليه هو مهم:**
• نفس اللغة على الـ frontend والـ backend
• Non-blocking, event-driven (ممتاز للتطبيقات اللي فيها I/O كتير)
• Ecosystem ضخم (npm فيها أكتر من 2 مليون package)
• دورة تطوير سريعة

**Stack شائع:**
\`\`\`
Express      — framework ويب مينيمال
Fastify      — أسرع وschema-based
NestJS       — منظم وTypeScript-first
Prisma/TypeORM — ORM لقواعد البيانات
\`\`\`

**استخدمه:** APIs، تطبيقات real-time (شات، ألعاب)، microservices، CLI tools.
**ماتستخدموش:** للشغل اللي بيستهلك CPU كتير (استخدم Go/Rust).`,
  },
  {
    keywords: ['python', 'بايثون', 'بيثون'],
    en: `**Python** is a high-level, readable, general-purpose language created by Guido van Rossum in 1991.

**Strengths:**
• Cleanest syntax ever ("executable pseudocode")
• Massive ecosystem (PyPI)
• #1 in Data Science, ML, AI
• Strong in scripting, automation, web (Django/Flask)

**Where it shines:**
\`\`\`
🤖 ML/AI         — PyTorch, TensorFlow, scikit-learn
📊 Data Science  — pandas, NumPy, matplotlib
🌐 Web           — Django, FastAPI, Flask
🤖 Automation    — Selenium, BeautifulSoup
🧪 Scripting     — quick prototypes, glue code
\`\`\`

**Where it fails:** Mobile apps, slow performance (use C extensions or Cython for hot paths).`,
    ar: `**Python** لغة عالية المستوى، سهلة القراءة، أنشأها Guido van Rossum سنة 1991.

**نقاط القوة:**
• أنظف syntax (شبه pseudocode بيشتغل)
• Ecosystem ضخم (PyPI)
• الأولى في Data Science وML وAI
• قوية في الـ scripting وautomation والـ web

**فين بتشع:**
\`\`\`
🤖 ML/AI         — PyTorch, TensorFlow, scikit-learn
📊 Data Science  — pandas, NumPy, matplotlib
🌐 Web           — Django, FastAPI, Flask
🤖 Automation    — Selenium, BeautifulSoup
🧪 Scripting     — prototypes سريعة، glue code
\`\`\`

**فين بتفشل:** تطبيقات الموبايل، الأداء البطيء (استخدم C extensions لو محتاج سرعة).`,
  },
  {
    keywords: ['html', 'هتمل', 'اتش تي ام ال'],
    en: `**HTML (HyperText Markup Language)** is the standard markup language for documents on the web.

**Key concepts:**
• Elements wrapped in tags: \`<p>text</p>\`
• Attributes add metadata: \`<a href="...">\`
• Semantic tags describe meaning: \`<header>\`, \`<article>\`, \`<nav>\`
• Self-closing for media: \`<img />\`, \`<input />\`

**Minimal modern page:**
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Page</title>
</head>
<body>
  <h1>Hello</h1>
</body>
</html>
\`\`\`

Always use semantic HTML — it's better for SEO, accessibility, and your future self.`,
    ar: `**HTML (HyperText Markup Language)** هي لغة الـ markup المعيارية لمستندات الويب.

**المفاهيم الأساسية:**
• العناصر بتتلف في tags: \`<p>text</p>\`
• الـ Attributes بتضيف metadata: \`<a href="...">\`
• الـ Semantic tags بتوصف المعنى: \`<header>\`, \`<article>\`, \`<nav>\`
• Self-closing للوسائط: \`<img />\`, \`<input />\`

**أبسط صفحة حديثة:**
\`\`\`html
<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>صفحتي</title>
</head>
<body>
  <h1>أهلاً</h1>
</body>
</html>
\`\`\`

استخدم دايماً Semantic HTML — أحسن لـ SEO والـ accessibility ومستقبلك.`,
  },
  {
    keywords: ['css', 'تنسيق', 'سي اس اس'],
    en: `**CSS (Cascading Style Sheets)** describes how HTML elements are presented.

**Modern essentials:**
• **Flexbox** — 1D layout (rows/columns)
• **Grid** — 2D layout (rows AND columns)
• **Custom Properties** — \`--primary: #6366f1;\` reusable variables
• **Media queries** — responsive breakpoints
• **Transforms & transitions** — animations

**Power patterns:**
\`\`\`css
:root { --primary: #6366f1; }

.card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: clamp(1rem, 3vw, 2rem);
  background: color-mix(in srgb, var(--primary) 10%, white);
}
\`\`\`

**Tailwind** is a utility-first CSS framework that's now industry standard. Skip writing CSS files — use utility classes directly in HTML.`,
    ar: `**CSS (Cascading Style Sheets)** هي اللي بتوصف شكل عناصر الـ HTML.

**الأساسيات الحديثة:**
• **Flexbox** — تخطيط 1D (صفوف/أعمدة)
• **Grid** — تخطيط 2D (صفوف وأعمدة)
• **Custom Properties** — \`--primary: #6366f1;\` متغيرات قابلة لإعادة الاستخدام
• **Media queries** — Responsive breakpoints
• **Transforms & transitions** — Animations

**أنماط قوية:**
\`\`\`css
:root { --primary: #6366f1; }

.card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: clamp(1rem, 3vw, 2rem);
  background: color-mix(in srgb, var(--primary) 10%, white);
}
\`\`\`

**Tailwind** هو CSS framework utility-first بقى المعيار الصناعي. اتخطى كتابة ملفات CSS — استخدم utility classes في الـ HTML مباشرة.`,
  },
  {
    keywords: ['useeffect', 'use effect', 'يوز افكت'],
    en: `**\`useEffect\`** is React's hook for **side effects** — anything that interacts with the world outside React (fetching data, subscriptions, manually changing the DOM, timers).

**Signature:**
\`\`\`jsx
useEffect(() => {
  // effect runs after render
  return () => {
    // optional cleanup runs before next effect or unmount
  }
}, [dependencies])
\`\`\`

**The dependency array controls when it runs:**
• \`[]\` — runs once on mount
• \`[value]\` — runs when \`value\` changes
• Omitted — runs after EVERY render (usually a bug)

**Classic mistake — infinite loop:**
\`\`\`jsx
// BAD — no deps, sets state, triggers re-render, runs again forever
useEffect(() => {
  setCount(count + 1)
})

// GOOD
useEffect(() => {
  setCount(c => c + 1)
}, [])  // run once
\`\`\`

**Cleanup matters** for subscriptions and timers — without it you leak memory.`,
    ar: `**\`useEffect\`** هو الـ hook في React اللي بيتعامل مع **side effects** — أي حاجة بتتفاعل مع العالم خارج React (جلب بيانات، subscriptions، تعديل DOM يدوي، timers).

**التركيب:**
\`\`\`jsx
useEffect(() => {
  // الـ effect بيتنفذ بعد الرندر
  return () => {
    // cleanup اختياري بيتنفذ قبل الـ effect التالي أو الـ unmount
  }
}, [dependencies])
\`\`\`

**الـ dependency array بتتحكم في وقت التنفيذ:**
• \`[]\` — مرة واحدة وقت الـ mount
• \`[value]\` — لما \`value\` يتغير
• مش موجودة — بعد كل render (غالباً bug)

**خطأ كلاسيكي — infinite loop:**
\`\`\`jsx
// غلط — مفيش deps، بيغير state، بيعمل re-render، بيشتغل تاني للأبد
useEffect(() => {
  setCount(count + 1)
})

// صح
useEffect(() => {
  setCount(c => c + 1)
}, [])  // مرة واحدة
\`\`\`

**الـ Cleanup مهم** للـ subscriptions والـ timers — من غيره بتسرّب ذاكرة.`,
  },
  {
    keywords: ['usestate', 'use state', 'يوز ستيت'],
    en: `**\`useState\`** is the foundational React hook for local component state.

\`\`\`jsx
const [count, setCount] = useState(0)
\`\`\`

**Three things to remember:**

1. **Updates are async.** \`setCount(5)\` doesn't change \`count\` immediately — it schedules a re-render.

2. **Use the functional form for derived state:**
\`\`\`jsx
// Could miss updates if multiple setCount happen
setCount(count + 1)

// Always uses latest value
setCount(c => c + 1)
\`\`\`

3. **Lazy initialization for expensive defaults:**
\`\`\`jsx
// runs expensive() on every render
useState(expensive())

// runs only once
useState(() => expensive())
\`\`\`

For complex state (multiple related fields), reach for \`useReducer\`.`,
    ar: `**\`useState\`** هو الـ hook الأساسي لإدارة الـ state داخل الـ component.

\`\`\`jsx
const [count, setCount] = useState(0)
\`\`\`

**تلات حاجات لازم تفتكرهم:**

1. **التحديثات async.** \`setCount(5)\` مش بيغير \`count\` فوراً — بيجدول re-render.

2. **استخدم الـ functional form للـ derived state:**
\`\`\`jsx
// ممكن يفوت updates لو في setCount متعدد
setCount(count + 1)

// دايماً بياخد آخر قيمة
setCount(c => c + 1)
\`\`\`

3. **Lazy initialization للـ defaults الثقيلة:**
\`\`\`jsx
// بتشتغل expensive() كل render
useState(expensive())

// بتشتغل مرة واحدة بس
useState(() => expensive())
\`\`\`

للحالة المعقدة (حقول متعددة مترابطة)، استخدم \`useReducer\`.`,
  },
  {
    keywords: ['rest api', 'rest', 'restful', 'restful api'],
    en: `**REST (REpresentational State Transfer)** is an architectural style for designing networked APIs around resources and HTTP verbs.

**Core principles:**
• Each URL represents a **resource** (a noun, not a verb)
• HTTP methods describe the action: \`GET\`, \`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`
• Stateless — each request carries everything needed
• Returns JSON (these days)

**Standard CRUD pattern:**
\`\`\`
GET    /api/users        — list all
GET    /api/users/:id    — get one
POST   /api/users        — create new
PUT    /api/users/:id    — replace whole
PATCH  /api/users/:id    — update partial
DELETE /api/users/:id    — remove
\`\`\`

**Status codes that matter:**
• 200 OK, 201 Created, 204 No Content
• 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict
• 500 Server Error

REST is being challenged by GraphQL (flexible queries) and tRPC (typed end-to-end), but it's still the workhorse of the web.`,
    ar: `**REST (REpresentational State Transfer)** هي نمط معماري لتصميم APIs مبنية على resources وHTTP verbs.

**المبادئ الأساسية:**
• كل URL بيمثل **resource** (اسم، مش فعل)
• HTTP methods بتوصف الفعل: \`GET\`, \`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`
• Stateless — كل request بيحمل كل اللي محتاجه
• بيرجع JSON (الأيام دي)

**نمط CRUD المعياري:**
\`\`\`
GET    /api/users        — قائمة الكل
GET    /api/users/:id    — واحد بعينه
POST   /api/users        — إنشاء جديد
PUT    /api/users/:id    — استبدال كامل
PATCH  /api/users/:id    — تحديث جزئي
DELETE /api/users/:id    — حذف
\`\`\`

**Status codes مهمة:**
• 200 OK, 201 Created, 204 No Content
• 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict
• 500 Server Error

REST بيواجه منافسة من GraphQL (queries مرنة) وtRPC (typed end-to-end)، بس لسه هو حصان الشغل.`,
  },
  {
    keywords: ['async', 'await', 'promise', 'promises', 'وعد'],
    en: `**Promises** and **async/await** handle asynchronous operations in JavaScript.

**A Promise has 3 states:** pending → fulfilled OR rejected.

**Old way (callbacks → callback hell):**
\`\`\`js
getUser(id, (err, user) => {
  getPosts(user.id, (err, posts) => {
    // 😵
  })
})
\`\`\`

**Promise way:**
\`\`\`js
getUser(id)
  .then(user => getPosts(user.id))
  .then(posts => console.log(posts))
  .catch(err => console.error(err))
\`\`\`

**async/await (best, just sugar on top of Promises):**
\`\`\`js
async function load(id) {
  try {
    const user = await getUser(id)
    const posts = await getPosts(user.id)
    return posts
  } catch (err) {
    console.error(err)
  }
}
\`\`\`

**Pro tip:** Use \`Promise.all([a, b])\` for parallel work, \`Promise.allSettled()\` when some can fail.`,
    ar: `**Promises** و **async/await** بيتعاملوا مع العمليات غير المتزامنة في JavaScript.

**الـ Promise ليها 3 حالات:** pending → fulfilled أو rejected.

**الطريقة القديمة (callbacks → callback hell):**
\`\`\`js
getUser(id, (err, user) => {
  getPosts(user.id, (err, posts) => {
    // 😵
  })
})
\`\`\`

**بالـ Promise:**
\`\`\`js
getUser(id)
  .then(user => getPosts(user.id))
  .then(posts => console.log(posts))
  .catch(err => console.error(err))
\`\`\`

**async/await (الأحسن، مجرد sugar فوق الـ Promises):**
\`\`\`js
async function load(id) {
  try {
    const user = await getUser(id)
    const posts = await getPosts(user.id)
    return posts
  } catch (err) {
    console.error(err)
  }
}
\`\`\`

**نصيحة:** استخدم \`Promise.all([a, b])\` للشغل المتوازي، و\`Promise.allSettled()\` لما بعضهم يقدر يفشل.`,
  },
  {
    keywords: ['closure', 'closures', 'كلوجر'],
    en: `**A Closure** is a function that remembers variables from its outer scope, even after that scope has finished executing.

\`\`\`js
function makeCounter() {
  let count = 0           // outer variable
  return function() {     // inner function
    return ++count        // can still access count
  }
}

const counter = makeCounter()
counter()  // 1
counter()  // 2
counter()  // 3
\`\`\`

**Why it matters:**
• Foundation of module pattern (private state)
• Enables data hiding without classes
• Basis for React hooks (\`useState\` works via closures)
• Source of bugs in loops:

\`\`\`js
// Classic bug — all logs print 5
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100)
}

// Fix with let — creates new closure per iteration
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100)
}
\`\`\``,
    ar: `**الـ Closure** هي function بتفتكر المتغيرات من الـ scope اللي حواليها، حتى بعد ما الـ scope ده يخلص.

\`\`\`js
function makeCounter() {
  let count = 0           // متغير خارجي
  return function() {     // function داخلية
    return ++count        // لسه قادرة توصله
  }
}

const counter = makeCounter()
counter()  // 1
counter()  // 2
counter()  // 3
\`\`\`

**ليه مهمة:**
• أساس نمط الـ module (state خاص)
• بتسمح بإخفاء البيانات من غير classes
• أساس React hooks (\`useState\` شغال بـ closures)
• مصدر bugs في الـ loops:

\`\`\`js
// bug كلاسيكي — كل الـ logs بتطبع 5
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100)
}

// الحل بـ let — بتعمل closure جديدة لكل iteration
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100)
}
\`\`\``,
  },
  {
    keywords: ['git', 'github'],
    en: `**Git** is the distributed version control system that runs the software world. **GitHub** is the cloud platform that hosts Git repositories.

**The 5 commands you'll use 90% of the time:**
\`\`\`bash
git status              # what's changed
git add .               # stage changes
git commit -m "msg"     # save snapshot
git push                # upload to remote
git pull                # download from remote
\`\`\`

**Branching workflow:**
\`\`\`bash
git checkout -b feature/login   # create branch
# ... work ...
git push -u origin feature/login
# open Pull Request on GitHub
\`\`\`

**Lifesavers:**
• \`git stash\` — temporarily shelve changes
• \`git log --oneline --graph\` — visual history
• \`git revert <hash>\` — undo a commit safely
• \`git reflog\` — find "lost" commits (Git rarely truly loses data)

**Rule:** Commit often. Push less often. Force-push never (on shared branches).`,
    ar: `**Git** هو نظام التحكم في الإصدارات الموزع اللي بيشغل عالم البرمجيات. **GitHub** هي المنصة السحابية اللي بتستضيف Git repositories.

**الـ 5 commands اللي هتستخدمهم 90% من الوقت:**
\`\`\`bash
git status              # ايه اللي اتغير
git add .               # حضّر التغييرات
git commit -m "msg"     # احفظ snapshot
git push                # ارفع للـ remote
git pull                # نزّل من الـ remote
\`\`\`

**Workflow الـ Branching:**
\`\`\`bash
git checkout -b feature/login   # branch جديد
# ... شغل ...
git push -u origin feature/login
# افتح Pull Request على GitHub
\`\`\`

**حياتك مع:**
• \`git stash\` — خبي التغييرات مؤقتاً
• \`git log --oneline --graph\` — تاريخ مرئي
• \`git revert <hash>\` — تراجع آمن عن commit
• \`git reflog\` — لاقي الـ commits "الضايعة" (Git نادراً ما بيضيع داتا فعلاً)

**القاعدة:** Commit كتير. Push أقل. Force-push أبداً (على branches مشتركة).`,
  },
  {
    keywords: ['css grid', 'grid', 'جريد'],
    en: `**CSS Grid** is the most powerful layout system in CSS — true 2D layouts (rows AND columns at once).

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);     /* 3 equal columns */
  grid-template-rows: auto 1fr auto;         /* header, content, footer */
  gap: 1rem;
}

/* Holy grail responsive */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
\`\`\`

**Grid vs Flexbox cheat sheet:**
• Aligning items in **one direction** → Flexbox
• Aligning items in **two directions** → Grid
• Don't know what you need → Flexbox is usually simpler

**Pro patterns:**
• \`grid-template-areas\` for named regions
• \`subgrid\` (modern) for nested alignment
• \`auto-fit\` vs \`auto-fill\` — fit collapses empty tracks`,
    ar: `**CSS Grid** هو أقوى نظام layout في CSS — Layouts ثنائية الأبعاد فعلية (صفوف وأعمدة في نفس الوقت).

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);     /* 3 أعمدة متساوية */
  grid-template-rows: auto 1fr auto;         /* header, content, footer */
  gap: 1rem;
}

/* Holy grail responsive */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
\`\`\`

**Grid vs Flexbox cheat sheet:**
• محاذاة العناصر في **اتجاه واحد** → Flexbox
• محاذاة العناصر في **اتجاهين** → Grid
• مش عارف محتاج إيه → Flexbox عادةً أبسط

**أنماط احترافية:**
• \`grid-template-areas\` لمناطق بأسماء
• \`subgrid\` (حديث) للمحاذاة المتداخلة
• \`auto-fit\` vs \`auto-fill\` — fit بيخفي الـ tracks الفاضية`,
  },
  {
    keywords: ['glassmorphism', 'glass morphism', 'جلاس مورفيزم'],
    en: `**Glassmorphism** is the frosted-glass UI trend popularized by macOS Big Sur and iOS — translucent panels with backdrop blur, soft borders, and depth.

**Recipe:**
\`\`\`css
.glass {
  background: rgba(255, 255, 255, 0.08);          /* subtle tint */
  backdrop-filter: blur(20px);                    /* the magic */
  -webkit-backdrop-filter: blur(20px);            /* Safari */
  border: 1px solid rgba(255, 255, 255, 0.12);   /* light edge */
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
\`\`\`

**Rules to make it look good:**
1. **Always needs a colorful or busy background** behind it — pure white walls look flat
2. **Subtle tint, not opaque** (0.05–0.15 alpha)
3. **Heavy blur** (16–28px usually)
4. **Light, light border** — almost invisible
5. **Soft, large shadow** for depth

Goes well with: dark themes, gradient backgrounds, abstract shapes/blobs.`,
    ar: `**Glassmorphism** هو ترند الـ UI الزجاجي اللي شهّرته macOS Big Sur وiOS — لوحات شفافة بـ backdrop blur، حدود ناعمة، وعمق.

**الوصفة:**
\`\`\`css
.glass {
  background: rgba(255, 255, 255, 0.08);          /* تلوين خفيف */
  backdrop-filter: blur(20px);                    /* السحر */
  -webkit-backdrop-filter: blur(20px);            /* Safari */
  border: 1px solid rgba(255, 255, 255, 0.12);   /* حافة فاتحة */
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
\`\`\`

**قواعد علشان يطلع شكله حلو:**
1. **محتاج خلفية ملونة أو مزدحمة** ورا — الحوائط البيضا بتطلعه مسطح
2. **تلوين خفيف، مش معتم** (0.05–0.15 alpha)
3. **Blur قوي** (16–28px عادةً)
4. **حدود فاتحة جداً** — تقريباً مش باينة
5. **ظل ناعم وكبير** للعمق

بيشتغل أحلى مع: ثيمات داكنة، خلفيات gradient، أشكال abstract.`,
  },
  {
    keywords: ['jwt', 'json web token', 'توكن'],
    en: `**JWT (JSON Web Token)** is a compact way to transmit verifiable claims between parties — most commonly used for stateless authentication.

**Anatomy:**
\`\`\`
header.payload.signature
eyJhbGc...  .eyJzdWIi...  .SflKxw...
\`\`\`

**The payload is just base64 (NOT encrypted) — don't put secrets in it.**

**Typical flow:**
1. User logs in → server validates → issues JWT
2. Client stores JWT (httpOnly cookie ≫ localStorage for security)
3. Every request sends \`Authorization: Bearer <token>\`
4. Server verifies signature with secret/public key
5. No DB lookup needed

**Node example:**
\`\`\`js
import jwt from 'jsonwebtoken'

const token = jwt.sign({ userId: 123 }, process.env.JWT_SECRET, { expiresIn: '7d' })

// later, verify
const decoded = jwt.verify(token, process.env.JWT_SECRET)
\`\`\`

**Watch out:** Long-lived JWTs can't be revoked easily. Use short access tokens (15 min) + refresh tokens for production.`,
    ar: `**JWT (JSON Web Token)** هي طريقة مدمجة لنقل ادعاءات قابلة للتحقق بين الأطراف — الاستخدام الأشهر للـ authentication بدون state.

**التركيب:**
\`\`\`
header.payload.signature
eyJhbGc...  .eyJzdWIi...  .SflKxw...
\`\`\`

**الـ payload مجرد base64 (مش مشفر) — ماتحطش فيه أسرار.**

**التدفق العادي:**
1. المستخدم بيعمل login → السيرفر بيتحقق → بيُصدر JWT
2. الـ Client بيحفظ JWT (httpOnly cookie أأمن من localStorage)
3. كل request بيبعت \`Authorization: Bearer <token>\`
4. السيرفر بيتحقق من التوقيع بمفتاح سري/عام
5. مفيش DB lookup

**مثال Node:**
\`\`\`js
import jwt from 'jsonwebtoken'

const token = jwt.sign({ userId: 123 }, process.env.JWT_SECRET, { expiresIn: '7d' })

// بعدها للتحقق
const decoded = jwt.verify(token, process.env.JWT_SECRET)
\`\`\`

**انتبه:** الـ JWTs طويلة العمر صعب تلغيها. استخدم access tokens قصيرة (15 دقيقة) + refresh tokens للإنتاج.`,
  },
  {
    keywords: ['sql', 'nosql', 'mongodb', 'postgres'],
    en: `**SQL vs NoSQL** — the eternal database choice.

**SQL (Relational): PostgreSQL, MySQL, SQLite**
• Tables with strict schemas
• Powerful JOINs across tables
• ACID transactions (rock-solid consistency)
• Best for: financial data, anything with relationships, when you need analytics

**NoSQL Document: MongoDB, Firestore**
• Flexible JSON-like documents
• Easier to scale horizontally
• No JOINs (denormalize instead)
• Best for: rapid prototyping, content with varying shapes, real-time apps

**Quick decision guide:**
\`\`\`
Strong relationships? → PostgreSQL
Schemaless content?   → MongoDB
Caching/sessions?     → Redis
Search?               → Elasticsearch
Time-series?          → TimescaleDB or InfluxDB
\`\`\`

**Honest truth:** PostgreSQL handles 95% of use cases beautifully — including JSON. Reach for NoSQL only when you have a specific reason.`,
    ar: `**SQL vs NoSQL** — اختيار قاعدة البيانات الأبدي.

**SQL (علاقي): PostgreSQL, MySQL, SQLite**
• جداول بـ schemas صارمة
• JOINs قوية بين الجداول
• ACID transactions (consistency قوي جداً)
• الأفضل لـ: بيانات مالية، أي حاجة فيها علاقات، لما تحتاج analytics

**NoSQL Document: MongoDB, Firestore**
• Documents مرنة شبه JSON
• أسهل في الـ scaling الأفقي
• مفيش JOINs (denormalize بدالها)
• الأفضل لـ: prototypes سريعة، محتوى بأشكال متنوعة، تطبيقات real-time

**دليل قرار سريع:**
\`\`\`
علاقات قوية؟         → PostgreSQL
محتوى بدون schema؟  → MongoDB
Cache/sessions؟      → Redis
بحث؟                 → Elasticsearch
Time-series؟         → TimescaleDB أو InfluxDB
\`\`\`

**الحقيقة:** PostgreSQL بيتعامل مع 95% من حالات الاستخدام ببراعة — بما فيها JSON. ماتروحش لـ NoSQL إلا لو في سبب محدد.`,
  },
  {
    keywords: ['recursion', 'recursive', 'تكرار', 'استدعاء ذاتي'],
    en: `**Recursion** — when a function calls itself with a smaller version of the problem.

**The two essential parts:**
1. **Base case** — when to stop
2. **Recursive case** — call yourself with smaller input

**Classic example — factorial:**
\`\`\`js
function factorial(n) {
  if (n <= 1) return 1            // base case
  return n * factorial(n - 1)      // recursive case
}

factorial(5) // 5 * 4 * 3 * 2 * 1 = 120
\`\`\`

**When recursion shines:**
• Trees and graphs (DOM walking, file systems)
• Divide-and-conquer algorithms (mergesort, quicksort)
• Backtracking (N-queens, sudoku)

**Gotchas:**
• **Stack overflow** if too deep — convert to iteration or use trampolines
• **Repeated work** — memoize for performance (e.g., fibonacci)

\`\`\`js
const fib = (n, memo = {}) => {
  if (n < 2) return n
  if (memo[n]) return memo[n]
  return memo[n] = fib(n-1, memo) + fib(n-2, memo)
}
\`\`\``,
    ar: `**Recursion** — لما الـ function تنادي نفسها بنسخة أصغر من المشكلة.

**الجزئين الأساسيين:**
1. **Base case** — إمتى تقف
2. **Recursive case** — نادي نفسك بـ input أصغر

**مثال كلاسيكي — factorial:**
\`\`\`js
function factorial(n) {
  if (n <= 1) return 1            // base case
  return n * factorial(n - 1)      // recursive case
}

factorial(5) // 5 * 4 * 3 * 2 * 1 = 120
\`\`\`

**Recursion بتشع لما:**
• Trees وgraphs (DOM walking, file systems)
• خوارزميات divide-and-conquer (mergesort, quicksort)
• Backtracking (N-queens, sudoku)

**انتبه من:**
• **Stack overflow** لو عميقة قوي — حولها لـ iteration أو استخدم trampolines
• **شغل مكرر** — memoize للأداء (مثل fibonacci)

\`\`\`js
const fib = (n, memo = {}) => {
  if (n < 2) return n
  if (memo[n]) return memo[n]
  return memo[n] = fib(n-1, memo) + fib(n-2, memo)
}
\`\`\``,
  },
]

// ─── Comparisons ────────────────────────────────────────────────────
const COMPARISONS = [
  {
    keywords: [['react', 'vue'], ['react', 'فيو']],
    en: `**React vs Vue — both excellent, different philosophies.**

**React (Meta):**
✅ Larger ecosystem & job market
✅ "Just JavaScript" — no special template syntax
✅ Better for complex apps & TypeScript
❌ More boilerplate, more decisions to make

**Vue (Evan You):**
✅ Gentler learning curve
✅ Built-in solutions (Vuex, Vue Router, Vue CLI)
✅ Template syntax familiar to HTML devs
❌ Smaller job market (still big in Asia/Europe)

**My take:** If you're hiring or job-hunting → React. If you're solo and want fast results → Vue 3 with the Composition API is a joy.`,
    ar: `**React vs Vue — الاتنين ممتازين، فلسفات مختلفة.**

**React (Meta):**
✅ Ecosystem أكبر وسوق شغل أوسع
✅ "JavaScript عادي" — مفيش template syntax خاص
✅ أحسن للتطبيقات المعقدة وTypeScript
❌ Boilerplate أكتر وقرارات أكتر

**Vue (Evan You):**
✅ منحنى تعلم ألطف
✅ حلول جاهزة (Vuex, Vue Router, Vue CLI)
✅ Template syntax مألوف لمطوري HTML
❌ سوق شغل أصغر (لسه كبير في آسيا/أوروبا)

**رأيي:** لو بتوظف أو بتدور على شغل → React. لو شغّال لوحدك وعايز نتايج سريعة → Vue 3 بالـ Composition API ممتع جداً.`,
  },
  {
    keywords: [['flexbox', 'grid']],
    en: `**Flexbox vs Grid — use both, they solve different problems.**

**Flexbox:** 1D layouts. One row OR one column. Great for:
• Navigation bars
• Centering things
• Distributing space along ONE axis

**Grid:** 2D layouts. Rows AND columns simultaneously. Great for:
• Page-level layouts
• Image galleries with aligned rows
• Anything where you control alignment in both directions

**Quick rule:** If you're saying "row OR column" → Flexbox. If you're saying "row AND column" → Grid.`,
    ar: `**Flexbox vs Grid — استخدم الاتنين، كل واحد بيحل مشاكل مختلفة.**

**Flexbox:** Layouts 1D. صف أو عمود. مناسب لـ:
• Navigation bars
• توسيط الحاجات
• توزيع المساحة في اتجاه واحد

**Grid:** Layouts 2D. صفوف وأعمدة في نفس الوقت. مناسب لـ:
• Layouts على مستوى الصفحة
• معارض الصور بصفوف متراصة
• أي حاجة عايز تتحكم في المحاذاة في الاتجاهين

**القاعدة:** لو بتقول "صف أو عمود" → Flexbox. لو بتقول "صف وعمود" → Grid.`,
  },
  {
    keywords: [['let', 'const', 'var']],
    en: `**\`var\` vs \`let\` vs \`const\` — always use \`const\` unless you need to reassign.**

**\`var\` (legacy, avoid):**
• Function-scoped (not block-scoped)
• Hoisted with \`undefined\`
• Can be redeclared
• Source of countless bugs

**\`let\` (when reassigning):**
• Block-scoped
• Hoisted but in temporal dead zone (TDZ)
• Cannot be redeclared in same scope

**\`const\` (default choice):**
• Block-scoped
• Cannot be reassigned (the binding, not the value)
• Objects/arrays declared with const can still be mutated:
\`\`\`js
const arr = [1, 2]
arr.push(3)   // ✅ OK — value mutated
arr = [4, 5]  // ❌ TypeError — binding changed
\`\`\`

**Decision tree:** Start with \`const\`. Change to \`let\` only when you actually reassign. Never use \`var\`.`,
    ar: `**\`var\` vs \`let\` vs \`const\` — استخدم \`const\` دايماً إلا لو محتاج تعيد الإسناد.**

**\`var\` (قديم، تجنبه):**
• Function-scoped (مش block-scoped)
• Hoisted بـ \`undefined\`
• ممكن إعادة تعريفه
• مصدر مليار bug

**\`let\` (لما تحتاج إعادة إسناد):**
• Block-scoped
• Hoisted بس في TDZ (temporal dead zone)
• مش ممكن إعادة تعريفه في نفس الـ scope

**\`const\` (الاختيار الافتراضي):**
• Block-scoped
• مش ممكن إعادة إسنادها (الـ binding، مش القيمة)
• Objects/arrays بـ const ممكن تتغير قيمتها:
\`\`\`js
const arr = [1, 2]
arr.push(3)   // ✅ تمام — القيمة اتغيرت
arr = [4, 5]  // ❌ TypeError — الـ binding اتغير
\`\`\`

**شجرة القرار:** ابدأ بـ \`const\`. حول لـ \`let\` بس لو فعلاً بتعيد الإسناد. ماتستخدمش \`var\` نهائي.`,
  },
]

// ─── Match Functions ───────────────────────────────────────────────
export function findConcept(text) {
  const norm = normalize(text)
  for (const concept of CONCEPTS) {
    if (concept.keywords.some(k => norm.includes(k.toLowerCase()))) {
      return concept
    }
  }
  return null
}

export function findComparison(text) {
  const norm = normalize(text)
  for (const comp of COMPARISONS) {
    for (const keywordSet of comp.keywords) {
      if (keywordSet.every(k => norm.includes(k.toLowerCase()))) {
        return comp
      }
    }
  }
  return null
}

// Recommendations
const RECOMMENDATIONS = {
  framework: {
    en: `**My framework recommendations for 2026:**

• **Building a SaaS / fullstack app?** → **Next.js** (React + SSR + API routes in one)
• **Marketing site / blog?** → **Astro** (ships zero JS by default, blazing fast)
• **Mobile app?** → **React Native** or **Expo** (web devs already know it) or **Flutter** (more polished UI)
• **Internal tools / admin panels?** → **Retool** or **Refine**
• **Realtime collaborative?** → **Liveblocks** + Next.js
• **Backend API?** → **Hono** (modern) or **Fastify** (mature) on Node

**The boring-but-correct answer is usually Next.js.**`,
    ar: `**ترشيحاتي للـ frameworks في 2026:**

• **بتبني SaaS / fullstack app؟** → **Next.js** (React + SSR + API routes في حاجة واحدة)
• **موقع تسويقي / blog؟** → **Astro** (بيبعت صفر JS افتراضياً، سريع جداً)
• **تطبيق موبايل؟** → **React Native** أو **Expo** (مطوري الويب يعرفوهم) أو **Flutter** (UI أنعم)
• **أدوات داخلية / لوحات إدارة؟** → **Retool** أو **Refine**
• **تعاون real-time؟** → **Liveblocks** + Next.js
• **Backend API؟** → **Hono** (حديث) أو **Fastify** (ناضج) على Node

**الإجابة الممله الصحيحة عادةً هي Next.js.**`,
  },
  database: {
    en: `**Database picks for 2026:**

• **Default choice?** → **PostgreSQL**. Handles SQL, JSON, full-text search, vectors. Boring and bulletproof.
• **Need ultra-fast reads?** → Add **Redis** for caching
• **Realtime?** → **Supabase** (Postgres + realtime) or **Firebase**
• **Vector search / AI?** → **pgvector** on Postgres, or **Pinecone**, or **Qdrant**
• **Edge / global?** → **Turso** (SQLite at the edge) or **PlanetScale**
• **Document store?** → **MongoDB** if you really need it

**Don't pick a database for hype. Pick it for your actual access patterns.**`,
    ar: `**ترشيحات قواعد البيانات لـ 2026:**

• **الاختيار الافتراضي؟** → **PostgreSQL**. بيتعامل مع SQL وJSON وfull-text search وvectors. ممل وموثوق.
• **محتاج reads سريعة؟** → ضيف **Redis** للـ caching
• **Realtime؟** → **Supabase** (Postgres + realtime) أو **Firebase**
• **Vector search / AI؟** → **pgvector** على Postgres، أو **Pinecone**، أو **Qdrant**
• **Edge / global؟** → **Turso** (SQLite عند الـ edge) أو **PlanetScale**
• **Document store؟** → **MongoDB** لو فعلاً محتاجه

**ماتختارش قاعدة بيانات للـ hype. اختارها لأنماط الاستخدام الحقيقية بتاعتك.**`,
  },
  hosting: {
    en: `**Hosting picks for 2026:**

• **Frontend / Next.js?** → **Vercel** (the gold standard) or **Netlify**
• **Fullstack apps?** → **Railway** or **Render** (zero-config, great DX)
• **Need control / cheap at scale?** → **Hetzner** or **DigitalOcean** + Coolify (open-source PaaS)
• **Serverless functions?** → **Cloudflare Workers** (fastest cold starts) or **Vercel Functions**
• **Static sites?** → **Cloudflare Pages** (unlimited bandwidth on free tier!)
• **Container heavy?** → **Fly.io** or **AWS ECS**

**Start with Vercel/Railway. Move only when you outgrow them.**`,
    ar: `**ترشيحات الاستضافة لـ 2026:**

• **Frontend / Next.js؟** → **Vercel** (المعيار الذهبي) أو **Netlify**
• **Fullstack apps؟** → **Railway** أو **Render** (zero-config، DX ممتاز)
• **محتاج تحكم / رخيص في الـ scale؟** → **Hetzner** أو **DigitalOcean** + Coolify
• **Serverless functions؟** → **Cloudflare Workers** (أسرع cold starts) أو **Vercel Functions**
• **مواقع static؟** → **Cloudflare Pages** (bandwidth مفتوح في الـ free tier!)
• **Containers؟** → **Fly.io** أو **AWS ECS**

**ابدأ بـ Vercel/Railway. حول بس لما يكبروا عنك.**`,
  },
}

export function findRecommendation(text) {
  const norm = normalize(text)
  if (/framework|library|stack/.test(norm)) return RECOMMENDATIONS.framework
  if (/database|db|قاعده بيانات|قاعدة بيانات/.test(norm)) return RECOMMENDATIONS.database
  if (/host|hosting|deploy|استضاف|نشر/.test(norm)) return RECOMMENDATIONS.hosting
  return null
}

// ─── Best Practices Snippets ────────────────────────────────────────
const BEST_PRACTICES = {
  en: {
    react: [
      `Lift state up — keep it as close to where it's used as possible, but no closer`,
      `Memoize expensive computations with \`useMemo\`, but profile first — premature memoization hurts`,
      `Keys in lists should be stable IDs, never array indices`,
      `Cleanup in \`useEffect\` is not optional — subscriptions, timers, listeners all leak without it`,
      `Don't fetch in \`useEffect\` for new code — use React Query / SWR / TanStack Query`,
    ],
    api: [
      `Always validate input at the boundary — never trust the client`,
      `Use HTTP status codes correctly — 200s for success, 400s for client errors, 500s for your bugs`,
      `Version your API from day one (\`/api/v1/...\`)`,
      `Rate limit everything — \`express-rate-limit\` or similar`,
      `Log structured JSON, not strings — your future self will thank you when debugging`,
    ],
    security: [
      `Never trust user input — validate, sanitize, parametrize`,
      `Store passwords with bcrypt or argon2 — never plain text, never SHA-256`,
      `Use HTTPS everywhere — Cloudflare gives it for free`,
      `JWTs in httpOnly cookies, not localStorage — protects against XSS`,
      `Keep dependencies updated — \`npm audit\` weekly minimum`,
    ],
  },
  ar: {
    react: [
      `ارفع الـ state لفوق — خليه أقرب ما يمكن لمكان استخدامه، بس مش أقرب من كده`,
      `Memoize الحسابات الثقيلة بـ \`useMemo\`، بس قيس الأداء الأول — الـ memoization المبكر بيضر`,
      `الـ Keys في القوائم لازم تكون IDs ثابتة، مش array indices`,
      `Cleanup في \`useEffect\` مش اختياري — subscriptions وtimers وlisteners كلها بتسرّب من غيره`,
      `ماتعملش fetch في \`useEffect\` للكود الجديد — استخدم React Query / SWR / TanStack Query`,
    ],
    api: [
      `تحقق من الـ input عند الحدود دايماً — ماتثقش في الـ client`,
      `استخدم HTTP status codes صح — 200s للنجاح، 400s لأخطاء الـ client، 500s لـ bugs بتاعتك`,
      `حدد إصدار للـ API من اليوم الأول (\`/api/v1/...\`)`,
      `Rate limit لكل حاجة — \`express-rate-limit\` أو شبيه`,
      `Log JSON منظم، مش strings — هتشكر نفسك وقت الـ debugging`,
    ],
    security: [
      `ماتثقش في input من المستخدم — validate وsanitize وparametrize`,
      `خزن الـ passwords بـ bcrypt أو argon2 — مش plain text، مش SHA-256`,
      `استخدم HTTPS في كل مكان — Cloudflare بيديها مجاناً`,
      `JWTs في httpOnly cookies، مش localStorage — بيحميك من XSS`,
      `حدّث الـ dependencies دايماً — \`npm audit\` مرة في الأسبوع كحد أدنى`,
    ],
  },
}

export function getBestPractices(topic, lang = 'en') {
  const set = BEST_PRACTICES[lang] || BEST_PRACTICES.en
  return set[topic] || null
}
