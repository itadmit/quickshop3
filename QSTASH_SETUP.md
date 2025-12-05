# הגדרת Upstash QStash CRON Job

## 📋 סקירה

Upstash QStash מאפשר להריץ CRON jobs שעתיים בחינם (עד 10,000 requests/day).

## 🚀 הוראות התקנה

### שלב 1: קבלת QStash Token

1. היכנס ל-[Upstash Console](https://console.upstash.com/)
2. בחר ב-**QStash** מהתפריט
3. לחץ על **"Create Token"**
4. העתק את ה-Token

### שלב 2: הוספת Token ל-.env.local

הוסף את השורות הבאות ל-`.env.local`:

```bash
QSTASH_TOKEN=your_token_here
QSTASH_URL=https://qstash.upstash.io
```

**הערה**: `QSTASH_URL` הוא אופציונלי (ברירת מחדל: `https://qstash.upstash.io`)

### שלב 3: הגדרת CRON Job

הרץ את הפקודה הבאה:

```bash
npm run setup:qstash
```

זה יגדיר CRON job שיקרא ל-`/api/cron/sync-visitors` כל 5 דקות.

## ✅ בדיקה

לאחר ההגדרה, תוכל לבדוק:

1. **ב-Upstash Console**: https://console.upstash.com/qstash → Schedules
2. **בלוגים**: בדוק את הלוגים של ה-API route `/api/cron/sync-visitors`

## 🔧 הגדרה ידנית

אם אתה רוצה להגדיר ידנית, השתמש ב-QStash API:

```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://your-domain.com/api/cron/sync-visitors",
    "cron": "*/5 * * * *"
  }'
```

## 📊 מה ה-CRON עושה?

1. **קורא את כל המבקרים הפעילים מ-Redis**
2. **מעביר אותם ל-PostgreSQL** (לפני שהם נמחקים אחרי 10 דקות)
3. **מעדכן analytics_daily** (פעם ביום בשעה 00:00)

## ⚙️ תדירות

- **מומלץ**: כל 5 דקות (`*/5 * * * *`)
- **מינימום**: כל 10 דקות (לפני שהנתונים נמחקים מ-Redis)

## 🛠️ פתרון בעיות

### CRON לא רץ?
1. בדוק שה-QSTASH_TOKEN נכון ב-.env.local
2. בדוק שהאתר זמין (לא localhost)
3. בדוק את הלוגים ב-Upstash Console

### שגיאת Signature?
- ודא שה-QSTASH_TOKEN נכון
- ודא שה-URL ב-QStash תואם ל-URL האמיתי של האתר

### CRON רץ אבל לא מסנכרן?
- בדוק את הלוגים ב-`/api/cron/sync-visitors`
- ודא שיש מבקרים פעילים ב-Redis
- בדוק את החיבור ל-PostgreSQL

## 📚 משאבים

- [Upstash QStash Documentation](https://docs.upstash.com/qstash)
- [QStash Console](https://console.upstash.com/qstash)

