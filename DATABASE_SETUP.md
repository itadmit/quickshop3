# 🗄️ הגדרת מסד נתונים - Quickshop3

## שלב 1: יצירת מסד נתונים

```bash
# התחבר ל-PostgreSQL
psql -U postgres

# צור מסד נתונים חדש
CREATE DATABASE quickshop3;

# צא
\q
```

## שלב 2: הרצת הסכמה

```bash
# הרץ את קובץ הסכמה
psql -U postgres -d quickshop3 -f sql/schema.sql
```

או אם אתה משתמש ב-psql ישירות:

```bash
psql -U postgres -d quickshop3 < sql/schema.sql
```

## שלב 3: הגדרת משתני סביבה

1. העתק את `.env.example` ל-`.env`:
```bash
cp .env.example .env
```

2. ערוך את `.env` והגדר את `DATABASE_URL`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/quickshop3"
```

**דוגמאות:**
- Local: `postgresql://postgres:password@localhost:5432/quickshop3`
- Docker: `postgresql://postgres:password@db:5432/quickshop3`
- Remote: `postgresql://user:pass@example.com:5432/quickshop3`

## שלב 4: בדיקת החיבור

האפליקציה תתחבר אוטומטית למסד הנתונים כשתפעיל אותה:

```bash
npm run dev
```

אם יש שגיאה, בדוק:
- ✅ מסד הנתונים קיים
- ✅ הסכמה הורצה בהצלחה
- ✅ `DATABASE_URL` נכון ב-`.env`
- ✅ יש הרשאות למשתמש

## 📋 טבלאות עיקריות

לאחר הרצת הסכמה, תהיינה לך הטבלאות הבאות:

- `store_owners` - בעלי חנויות
- `stores` - חנויות
- `products` - מוצרים
- `product_variants` - וריאציות מוצרים
- `product_images` - תמונות מוצרים
- `product_options` - אפשרויות מוצרים
- `product_collections` - קטגוריות
- `product_tags` - תגיות
- `orders` - הזמנות
- `customers` - לקוחות
- ועוד...

ראה `sql/schema.sql` לפרטים מלאים.

