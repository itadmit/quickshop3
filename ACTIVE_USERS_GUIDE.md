# 👥 מדריך מעקב משתמשים מחוברים

## ✅ הכל מוכן!

המערכת מוגדרת למעקב אחר משתמשים מחוברים בזמן אמת באמצעות **Upstash Redis**.

## איך זה עובד?

1. **התחברות** - כשמשתמש מתחבר, נוצר session ב-Redis עם TTL של 10 דקות
2. **פעילות** - כל פעולה של משתמש מחובר מעדכנת את ה-`last_activity` ב-Redis
3. **ספירה** - API endpoint מחזיר את מספר המשתמשים הפעילים
4. **ניקוי אוטומטי** - אחרי 10 דקות של חוסר פעילות, ה-session נמחק אוטומטית

## בדיקת החיבור

```bash
npm run test:redis
```

אם הכל תקין, תראה:
```
✅ כל הבדיקות עברו בהצלחה!
🎉 Upstash Redis מוכן לשימוש!
```

## שימוש ב-API

### ספירת משתמשים מחוברים

```bash
GET /api/analytics/active-users
```

**Response:**
```json
{
  "count": 5,
  "store_id": 1,
  "period": "10 minutes"
}
```

### רשימת משתמשים מחוברים (עם פרטים)

```bash
GET /api/analytics/active-users?details=true
```

**Response:**
```json
{
  "count": 5,
  "store_id": 1,
  "period": "10 minutes",
  "users": [
    {
      "user_id": 1,
      "store_id": 1,
      "email": "user@example.com",
      "name": "יוגב",
      "last_activity": "2025-01-15T10:30:00Z",
      "last_activity_ago": 120
    }
  ]
}
```

## שימוש בקוד

```typescript
import { 
  getActiveUsersCount, 
  getActiveUsers,
  updateUserActivity,
  removeUserSession 
} from '@/lib/session-tracker';

// ספירת משתמשים מחוברים
const count = await getActiveUsersCount(storeId);

// רשימת משתמשים מחוברים
const users = await getActiveUsers(storeId);

// עדכון פעילות (נעשה אוטומטית ב-middleware)
await updateUserActivity(userId, storeId, { email, name });

// מחיקת session (נעשה אוטומטית ב-logout)
await removeUserSession(userId);
```

## איפה זה מתעדכן?

- ✅ **Middleware** - כל פעולה של משתמש מחובר מעדכנת את הפעילות
- ✅ **Login** - יצירת session חדש
- ✅ **Logout** - מחיקת session

## הגדרות

הכל מוגדר אוטומטית, אבל אפשר לשנות:

```typescript
// src/lib/session-tracker.ts
const ACTIVE_USER_TTL = 600; // 10 דקות (בשניות)
```

## פתרון בעיות

### Redis לא עובד?

המערכת תמשיך לעבוד גם בלי Redis, אבל מעקב משתמשים לא יעבוד. בדוק:
1. שהמשתנים ב-`.env` נכונים
2. הרץ `npm run test:redis` לבדיקה
3. בדוק את ה-logs ב-Upstash Dashboard

### אין משתמשים מחוברים?

1. ודא שמשתמשים באמת מחוברים
2. בדוק שהמשתמשים מבצעים פעולות (לא רק פתיחת הדף)
3. בדוק את ה-logs בקונסול

## מגבלות התוכנית החינמית

- ✅ **10,000 commands/יום** - מספיק ל-100 משתמשים עם ~100 פעולות/יום כל אחד
- ✅ **256 MB storage** - מספיק למיליוני sessions
- ⚠️ **Regional only** - לא Global (אבל זה בסדר לרוב המקרים)

## קישורים שימושיים

- [Upstash Dashboard](https://console.upstash.com/)
- [Upstash Documentation](https://docs.upstash.com/redis)
- [מדריך הגדרה מלא](./UPSTASH_SETUP.md)

