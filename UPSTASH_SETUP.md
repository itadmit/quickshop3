# 🔴 הגדרת Upstash Redis למעקב משתמשים מחוברים

## מה זה Upstash Redis?

Upstash הוא שירות Redis מנוהל עם תוכנית **חינמית** שמתאימה למעקב משתמשים מחוברים בזמן אמת.

## למה Upstash?

✅ **חינמי לנצח** - 10,000 commands/יום, 256 MB storage  
✅ **מהיר מאוד** - Redis בזיכרון  
✅ **תומך ב-Edge Runtime** - עובד עם Next.js Middleware  
✅ **אוטומטי** - TTL אוטומטי, לא צריך לנקות ידנית  

## שלב 1: הרשמה ל-Upstash

1. היכנס ל-[https://upstash.com/](https://upstash.com/)
2. הירשם עם GitHub/Google
3. לחץ על **"Create Database"**
4. בחר **"Regional"** (לא Global - זה חינמי)
5. בחר אזור קרוב (למשל: `eu-west-1`)
6. לחץ **"Create"**

## שלב 2: קבלת Credentials

לאחר יצירת ה-Database:

1. לחץ על ה-Database שיצרת
2. תחת **"REST API"** תראה:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. העתק את שני הערכים

## שלב 3: הוספה ל-.env

הוסף את המשתנים הבאים לקובץ `.env`:

```env
# Redis (Upstash) - למעקב משתמשים מחוברים בזמן אמת
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## שלב 4: בדיקה

המערכת תעבוד גם בלי Redis (תזהיר בקונסול), אבל למעקב משתמשים מחוברים צריך Redis.

### בדיקה ידנית:

```bash
# הרץ את השרת
npm run dev

# התחבר למערכת
# כל פעולה של משתמש מחובר תעדכן את Redis

# בדוק את ה-API:
curl http://localhost:3099/api/analytics/active-users
```

## איך זה עובד?

1. **התחברות** - כשמשתמש מתחבר, נוצר session ב-Redis עם TTL של 10 דקות
2. **פעילות** - כל פעולה של משתמש מחובר מעדכנת את ה-`last_activity` ב-Redis
3. **ספירה** - `/api/analytics/active-users` סופר את כל ה-sessions הפעילים
4. **ניקוי אוטומטי** - אחרי 10 דקות של חוסר פעילות, ה-session נמחק אוטומטית

## מגבלות התוכנית החינמית

- ✅ **10,000 commands/יום** - מספיק ל-100 משתמשים עם ~100 פעולות/יום כל אחד
- ✅ **256 MB storage** - מספיק למיליוני sessions
- ⚠️ **Regional only** - לא Global (אבל זה בסדר לרוב המקרים)

## עלויות

- **חינמי** - התוכנית הבסיסית חינמית לנצח
- **שידרוג** - רק אם תעבור את המגבלות ($0.20 לכל 100K commands)

## פתרון בעיות

### Redis לא עובד?

המערכת תמשיך לעבוד גם בלי Redis, אבל מעקב משתמשים לא יעבוד. בדוק:
1. שהמשתנים ב-`.env` נכונים
2. שה-URL וה-Token תקינים
3. שה-Database פעיל ב-Upstash Dashboard

### שגיאות בקונסול?

אם אתה רואה שגיאות Redis, זה לא קריטי - המערכת תמשיך לעבוד. אבל לבדיקה:
1. בדוק את ה-credentials ב-Upstash Dashboard
2. ודא שה-Database לא נמחק
3. בדוק את ה-logs ב-Upstash Dashboard

## קישורים שימושיים

- [Upstash Dashboard](https://console.upstash.com/)
- [Upstash Documentation](https://docs.upstash.com/redis)
- [@upstash/redis npm](https://www.npmjs.com/package/@upstash/redis)

