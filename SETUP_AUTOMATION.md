# Vixcell — Social Automation Setup

دليل إعداد نظام الـ **Daily Auto-Posting + Market Analysis** على Vercel.

---

## 🧱 المعمارية

| الملف | الوظيفة | الجدول |
|------|---------|--------|
| `api/cron/daily-post-ar.js` | بوست عربي يومي على FB + IG | 10:00 ص بتوقيت القاهرة |
| `api/cron/daily-post-en.js` | بوست إنجليزي يومي على FB + IG | 8:00 م بتوقيت القاهرة |
| `api/cron/market-analysis.js` | تقرير سوق + منافسين | كل أحد 8:00 ص بتوقيت القاهرة |
| `api/lib/*` | منطق مشترك (Meta, Gemini, Imagen, Supabase) | — |

### تدفّق البوست اليومي
1. سحب آخر ١٤ بوست من Supabase → تجنّب التكرار
2. Gemini يولّد كابشن + هاشتاجات + image prompt (JSON)
3. Imagen 3 يولّد صورة 1024×1024
4. الصورة تترفع على Supabase Storage (bucket `social-media`)
5. النشر على FB Page → ثم IG Business
6. كل خطوة بتتسجّل في `social_posts`

### تدفّق تحليل السوق
1. سحب آخر ٢٥ بوست + page insights عبر Graph API
2. سحب signals داخلية (الـ submissions + automated post stats)
3. Gemini يحلّل ويطلع تقرير Markdown منظّم
4. التقرير يتحفظ في `market_reports`

---

## 🔑 Environment Variables المطلوبة

ضيفهم على **Vercel Dashboard → Project Settings → Environment Variables** (Production + Preview):

| Variable | الوصف | مثال |
|----------|-------|------|
| `CRON_SECRET` | سر عشوائي (32+ حرف) | `openssl rand -hex 32` |
| `META_PAGE_ACCESS_TOKEN` | Long-lived Page Access Token | `EAAG...` |
| `META_PAGE_ID` | Facebook Page numeric ID | `1054878624376550` |
| `META_IG_BUSINESS_ID` | Instagram Business Account ID | `1789...` |
| `META_GRAPH_VERSION` | (اختياري) | `v20.0` |
| `GEMINI_API_KEY` | من Google AI Studio | `AIzaS...` |
| `GEMINI_TEXT_MODEL` | (اختياري) | `gemini-2.0-flash` |
| `GEMINI_IMAGE_MODEL` | (اختياري) | `imagen-3.0-generate-002` |
| `SUPABASE_URL` | من Supabase project settings | `https://ilrxkhgdsirqppgqavjs.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-only) | `eyJhbG...` |
| `SUPABASE_BUCKET` | (اختياري) | `social-media` |
| `FALLBACK_IMAGE_URL` | (اختياري) صورة احتياطية | `https://...` |

> ⚠️ **لا تضع `SUPABASE_SERVICE_ROLE_KEY` في أي مكان عام.** هي للسيرفر بس.

---

## 🪪 الحصول على Meta Page Access Token (Long-lived)

Pipeboard فيه توكن لـ **Ads** فقط، مش كفاية للنشر العضوي. لازم تعمل واحد جديد:

### الخطوات

1. **افتح Meta for Developers** → [developers.facebook.com](https://developers.facebook.com/)
2. اعمل App جديد نوع **Business**
3. ضيف Products:
   - **Facebook Login**
   - **Instagram Graph API**
4. روح **App Settings → Basic** ونزّل **App ID + App Secret**
5. افتح **Graph API Explorer** → [https://developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
6. اختار App بتاعتك
7. اضغط **Get User Access Token** → اختار الـ permissions دي:
   - `pages_show_list`
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`
8. وافق على الـ login → هياخدلك **Short-lived User Token**
9. ابدل التوكن لـ Long-lived User Token:
   ```bash
   curl "https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```
10. هات الـ Page Access Token من User Token:
    ```bash
    curl "https://graph.facebook.com/v20.0/me/accounts?access_token=LONG_LIVED_USER_TOKEN"
    ```
    هتلاقي `access_token` لكل page — ده **Page Access Token غير منتهي الصلاحية** (ما دام الـ User Token طويل العمر شغّال).
11. هات **IG Business Account ID**:
    ```bash
    curl "https://graph.facebook.com/v20.0/{PAGE_ID}?fields=instagram_business_account&access_token=PAGE_TOKEN"
    ```

### تأكد إن IG Business مربوط بالـ Page
في فيس **Page Settings → Linked Accounts → Instagram** لازم يكون متربط بحساب **Business or Creator** (مش Personal).

---

## 🛠️ Setup خطوة بخطوة

### 1. ثبّت الـ dependencies الجديدة
```bash
cd F:\vixcell\api
npm install
cd ..
```

### 2. أضف env vars محليًا للتجريب
اعمل `F:\vixcell\.env.local`:
```env
CRON_SECRET=...
META_PAGE_ACCESS_TOKEN=...
META_PAGE_ID=...
META_IG_BUSINESS_ID=...
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. تأكد إن الـ Supabase Storage bucket موجود
البكت بتاع الصور (`social-media`) بيتعمل تلقائيًا أول مرة الـ cron يشتغل. لو حبيت تعمله يدوي: Supabase Dashboard → Storage → New bucket → اسم `social-media` → ✅ Public.

### 4. Deploy على Vercel
```bash
git add -A
git commit -m "feat: daily social automation + market analysis"
git push
```
Vercel هيكتشف الـ `crons` في `vercel.json` تلقائيًا.

### 5. اختبر يدوي قبل ما تستنى الـ cron
```bash
curl -X GET "https://YOUR-DOMAIN.vercel.app/api/cron/daily-post-ar" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

لازم يرجعلك JSON فيه `ok: true` ونتايج FB و IG.

---

## 📊 الـ Schedules النهائية

| Cron | UTC | Cairo (UTC+2) | الموضوع |
|------|-----|---------------|---------|
| `0 8 * * *` | 08:00 | **10:00 ص** يومياً | بوست عربي |
| `0 18 * * *` | 18:00 | **8:00 م** يومياً | بوست إنجليزي |
| `0 6 * * 0` | 06:00 الأحد | **8:00 ص الأحد** | تقرير سوق |

> غيّر الـ schedule في `vercel.json` لو تحب توقيت تاني. السطر `0 8 * * *` يعني الدقيقة 0 من الساعة 8 صباحاً UTC كل يوم.

---

## 🧪 شغّل cron يدوياً (للاختبار)

```bash
# بوست عربي
curl -X POST "https://YOUR-DOMAIN.vercel.app/api/cron/daily-post-ar" \
  -H "Authorization: Bearer $CRON_SECRET"

# تقرير السوق
curl -X POST "https://YOUR-DOMAIN.vercel.app/api/cron/market-analysis" \
  -H "Authorization: Bearer $CRON_SECRET"
```

من **Vercel Dashboard → Crons** كمان فيه زر "Run" لتشغيلهم يدوي.

---

## 🩺 Troubleshooting

| المشكلة | السبب الأرجح |
|---------|--------------|
| `IG container EXPIRED` | الصورة مش accessible من Meta — تأكد إن Supabase bucket عام |
| `(#100) Param image_url url cannot be parsed` | الـ URL فيه مسافات أو رموز خاصة |
| `(#10) Application does not have permission for this action` | الـ scopes ناقصة على الـ App — أعد generate التوكن بـ scopes كاملة |
| `Imagen error: ...quota` | بدّل model أو حط `FALLBACK_IMAGE_URL` |
| الـ cron مش بيشتغل | تأكد إن Vercel plan بتاعك بيدعم crons (Pro plan في Vercel بيدي عدد أكبر) |

---

## 🔍 التحقق من النتائج

```sql
-- آخر 10 بوستات
select created_at, platform, language, status, topic, external_post_id
from social_posts
order by created_at desc
limit 10;

-- آخر تقرير
select created_at, period_start, period_end, summary
from market_reports
order by created_at desc
limit 1;
```
