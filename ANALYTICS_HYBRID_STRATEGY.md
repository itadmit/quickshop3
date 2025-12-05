# אסטרטגיה היברידית לאנליטיקס - Redis + PostgreSQL

## 📊 סקירה כללית

המערכת משתמשת בגישה היברידית לניהול נתוני אנליטיקס:

### 🚀 Redis (זמן אמת)
- **תפקיד**: נתונים בזמן אמת (10 דקות אחרונות)
- **יתרונות**: מהיר מאוד, זול, לא מעמיס על DB
- **TTL**: 10 דקות (600 שניות)
- **שימוש**: דשבורד בזמן אמת, מעקב מבקרים פעילים

### 💾 PostgreSQL (היסטוריה)
- **תפקיד**: נתונים היסטוריים לסיכומים יומיים/חודשיים
- **יתרונות**: אחסון קבוע, שאילתות מורכבות, סיכומים
- **שימוש**: דוחות יומיים, חודשיים, ניתוחים ארוכי טווח

---

## 🔄 זרימת נתונים

```
┌─────────────────┐
│   Middleware    │
│  (מעקב מבקרים) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      כל 5 דקות      ┌─────────────────┐
│      Redis      │ ──────────────────► │   PostgreSQL     │
│  (זמן אמת)      │   Batch Sync       │   (היסטוריה)     │
│  TTL: 10 דקות   │                     │                  │
└─────────────────┘                     └─────────────────┘
         │                                       │
         │                                       │
         ▼                                       ▼
┌─────────────────┐                     ┌─────────────────┐
│  Realtime API   │                     │  Reports API   │
│  (דשבורד חי)    │                     │  (דוחות)       │
└─────────────────┘                     └─────────────────┘
```

---

## 📋 מבנה הטבלאות ב-PostgreSQL

### 1. `visitor_sessions`
היסטוריית מבקרים מלאה:
- מידע גיאוגרפי (מדינה, עיר, קואורדינטות)
- מידע מכשיר (device, browser, OS)
- UTM parameters
- התנהגות (עגלה, תשלום, רכישה)
- משך session וצפיות בעמודים

### 2. `visitor_page_views`
היסטוריית צפיות בעמודים:
- כל עמוד שנצפה
- זמן צפייה
- referrer

### 3. `analytics_daily`
סיכום יומי (מתעדכן אוטומטית):
- ביקורים יומיים
- מבקרים ייחודיים
- הזמנות והכנסות
- מוצרים מובילים

---

## ⚙️ Batch Sync Process

### תדירות: כל 5 דקות (מומלץ)
**למה 5 דקות?**
- Redis TTL = 10 דקות
- Sync כל 5 דקות = נתונים נשמרים לפני שהם נמחקים
- איזון בין עדכניות לעומס על DB

**⚠️ הערה**: אם אין CRON שעתי זמין, אפשר להריץ פעם ביום (פחות אידיאלי).

### תהליך:
1. **קריאת כל המבקרים מ-Redis**
2. **העברה ל-PostgreSQL** (visitor_sessions)
3. **עדכון analytics_daily** (פעם ביום בשעה 00:00)

### 📋 הטבלאות נוספו ל-`sql/schema.sql`
הטבלאות `visitor_sessions` ו-`visitor_page_views` כבר חלק מהסכמה הראשית.
**אין צורך במיגרציה נפרדת** - פשוט הרץ `npm run db:reset` כדי ליצור את הסכמה המלאה.

---

## 🔧 הגדרת CRON Job

### ⚠️ מגבלות Vercel
- **Vercel Free Plan**: CRON רק יומי (לא שעתי)
- **Vercel Pro Plan**: CRON שעתי זמין

### 🎯 פתרונות מומלצים

#### 1. **Upstash QStash** (מומלץ - חינמי!) ✅
Upstash מציעים **QStash** - שירות CRON חינמי עם:
- ✅ CRON שעתי בחינם
- ✅ עד 10,000 requests/day חינם
- ✅ אמין ומהיר
- ✅ אינטגרציה קלה עם Upstash Redis

**הגדרה מהירה:**
```bash
# 1. התקן את החבילה (כבר מותקן)
npm install @upstash/qstash

# 2. הוסף QSTASH_TOKEN ל-.env.local
# קבל מ-https://console.upstash.com/qstash
# הוסף גם: QSTASH_URL=https://qstash.upstash.io (אופציונלי)

# 3. הרץ את הסקריפט
npm run setup:qstash
```

**לפרטים נוספים**: ראה `QSTASH_SETUP.md`

**⚠️ חשוב**: זה הפתרון המומלץ והמוגדר כבר במערכת. אין צורך בהגדרות נוספות.

#### 2. **Vercel Cron Jobs** (לא מומלץ - יומי בלבד)
⚠️ **לא בשימוש** - המערכת מוגדרת עם QStash.

אם אתה רוצה להשתמש ב-Vercel CRON (רק יומי), הוסף ל-`vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-visitors",
    "schedule": "0 0 * * *"  // פעם ביום בשעה 00:00
  }]
}
```

**⚠️ הערה**: זה רק יומי, לא שעתי. נתונים עלולים להיאבד. **מומלץ להשתמש ב-QStash במקום.**

#### 3. **שירותים חיצוניים חינמיים**
- **cron-job.org** - חינמי, CRON שעתי
- **EasyCron** - חינמי עם מגבלות
- **GitHub Actions** - scheduled workflows (חינמי)

**URL**: `https://your-domain.com/api/cron/sync-visitors`
**Schedule**: `*/5 * * * *` (כל 5 דקות)

#### 4. **פתרון חלופי: On-Demand Sync**
במקום CRON, אפשר לסנכרן:
- כאשר יש פעילות גבוהה
- כאשר מבקרים בדשבורד אנליטיקס
- לפני סגירת session

**יתרון**: לא צריך CRON חיצוני
**חסרון**: נתונים עלולים להיאבד אם אין פעילות

---

## 📊 שימוש בנתונים

### זמן אמת (Redis)
```typescript
// דשבורד בזמן אמת
GET /api/analytics/visitors
GET /api/analytics/active-users
```

### היסטוריה (PostgreSQL)
```typescript
// דוחות יומיים
GET /api/analytics/reports/daily?start_date=2024-01-01&end_date=2024-01-31

// דוחות חודשיים
GET /api/analytics/reports/monthly?year=2024

// ניתוח מבקרים
GET /api/analytics/reports/visitors?start_date=2024-01-01
```

---

## 💡 יתרונות הגישה ההיברידית

### ✅ ביצועים
- **Redis**: קריאות מהירות מאוד (< 10ms)
- **PostgreSQL**: שאילתות מורכבות על היסטוריה

### ✅ עלויות
- **Redis**: Upstash חינמי (10K requests/day)
- **PostgreSQL**: אחסון זול יחסית

### ✅ מדרגיות
- **Redis**: מטפל בעשרות אלפי מבקרים בו-זמנית
- **PostgreSQL**: אחסון ללא הגבלה

### ✅ אמינות
- **Redis**: נתונים נשמרים לפני שהם נמחקים
- **PostgreSQL**: גיבויים אוטומטיים

---

## 🚨 נקודות חשובות

1. **Batch Sync חייב לרוץ כל 5 דקות** - אחרת נתונים יאבדו
2. **QStash CRON Job** - מוגדר כבר במערכת, ראה `QSTASH_SETUP.md` להגדרה
3. **Error Handling** - שגיאות לא אמורות לעצור את התהליך
4. **Deduplication** - בדיקה למניעת כפילויות

---

## 📈 דוגמאות שימוש

### דוח יומי
```sql
SELECT 
  DATE(session_started_at) as date,
  COUNT(*) as visits,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as purchases
FROM visitor_sessions
WHERE store_id = $1
  AND session_started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(session_started_at)
ORDER BY date DESC;
```

### ניתוח UTM
```sql
SELECT 
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) as visits,
  SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as purchases
FROM visitor_sessions
WHERE store_id = $1
  AND utm_source IS NOT NULL
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY visits DESC;
```

### ניתוח גיאוגרפי
```sql
SELECT 
  country,
  city,
  COUNT(*) as visits,
  COUNT(DISTINCT visitor_id) as unique_visitors
FROM visitor_sessions
WHERE store_id = $1
GROUP BY country, city
ORDER BY visits DESC
LIMIT 20;
```

---

## ✅ סיכום

**Redis** = מהיר, זול, זמן אמת (10 דקות)
**PostgreSQL** = קבוע, היסטוריה, סיכומים

**Batch Sync** = גשר בין השניים (כל 5 דקות)

**תוצאה** = מערכת אנליטיקס חזקה, מהירה וזולה! 🎉

