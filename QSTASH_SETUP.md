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
APP_URL=https://your-domain.com
```

**הערות**:
- `QSTASH_TOKEN` - קבל מ-https://console.upstash.com/qstash → "Create Token" או העתק את ה-Token הקיים
- `QSTASH_URL` הוא אופציונלי (ברירת מחדל: `https://qstash.upstash.io`)
- `APP_URL` הוא חובה לפרודקשן - הוסף את ה-URL המלא של האתר שלך (לדוגמה: `https://your-app.vercel.app`)

**⚠️ חשוב**: ודא שה-Token נכון ולא מכיל רווחים או תווים מיוחדים. אם יש שגיאת אימות, נסה ליצור Token חדש מה-Console.

### שלב 3: הגדרת CRON Job

הרץ את הפקודה הבאה:

```bash
npm run setup:qstash
```

זה יגדיר את כל ה-CRON jobs:
- **Sync Visitors** - כל 5 דקות
- **Archive Products** - כל שעה
- **Update Discounts Status** - כל שעה
- **Cleanup OTP Codes** - כל יום בשעה 02:00

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

## 📊 מה ה-CRON Jobs עושים?

### 1. Sync Visitors (כל 5 דקות)
- קורא את כל המבקרים הפעילים מ-Redis
- מעביר אותם ל-PostgreSQL (לפני שהם נמחקים אחרי 10 דקות)
- מעדכן analytics_daily

### 2. Archive Products (כל שעה)
- מעביר מוצרים לארכיון אוטומטית לפי הגדרות

### 3. Update Discounts Status (כל שעה)
- מפעיל הנחות/קופונים שהגיע הזמן שלהם
- מפסיק הנחות/קופונים שפג תוקף

### 4. Cleanup OTP Codes (כל יום בשעה 02:00)
- מוחק קודי OTP שפג תוקף לפני יותר מ-24 שעות
- מוחק קודי OTP שכבר שימשו לפני יותר מ-7 ימים
- מוחק קודי OTP עם יותר מדי ניסיונות שגויים לפני יותר מ-24 שעות

## ⚙️ תדירות

- **Sync Visitors**: כל 5 דקות (`*/5 * * * *`) - מומלץ, מינימום כל 10 דקות
- **Archive Products**: כל שעה (`0 * * * *`)
- **Update Discounts Status**: כל שעה (`0 * * * *`)
- **Cleanup OTP Codes**: כל יום בשעה 02:00 (`0 2 * * *`)

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

