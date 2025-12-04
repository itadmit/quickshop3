# 🗄️ הגדרת מסד נתונים - Quickshop3

## 🌐 מסד נתונים בענן - Neon PostgreSQL

הפרויקט מוגדר לעבוד עם **Neon PostgreSQL** - מסד נתונים serverless בענן.

### שלב 1: יצירת מסד נתונים ב-Neon

1. **היכנס ל-Neon:**
   - לך ל: https://neon.tech
   - צור חשבון או התחבר

2. **צור פרויקט חדש:**
   - לחץ על "Create Project"
   - בחר שם לפרויקט (למשל: `quickshop3`)
   - בחר אזור (מומלץ: `eu-central-1` או קרוב אליך)
   - לחץ על "Create Project"

3. **קבל את Connection String:**
   - לאחר יצירת הפרויקט, Neon יציג לך את ה-Connection String
   - העתק אותו - הוא נראה כך:
   ```
   postgresql://neondb_owner:npg_XXXXX@ep-XXXXX-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### שלב 2: הרצת הסכמה

**אפשרות 1: דרך Neon Dashboard (מומלץ)**
1. לך ל-Neon Dashboard → SQL Editor
2. העתק את תוכן `sql/schema.sql`
3. הדבק ב-SQL Editor
4. לחץ על "Run"

**אפשרות 2: דרך psql (אם יש לך psql מותקן)**
```bash
# השתמש ב-Connection String מ-Neon
psql "postgresql://neondb_owner:npg_XXXXX@ep-XXXXX-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require" -f sql/schema.sql
```

### שלב 3: הגדרת משתני סביבה

1. צור קובץ `.env.local` (או `.env`) בשורש הפרויקט:
```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_XXXXX@ep-XXXXX-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Secret (צור עם: openssl rand -hex 32)
JWT_SECRET=your-secret-key-here

# Cloudinary CDN
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3099

# Environment
NODE_ENV=development
```

**חשוב:**
- Neon דורש **SSL** - ה-Connection String כבר כולל `sslmode=require`
- הקוד ב-`src/lib/db.ts` מזהה אוטומטית Neon ומגדיר SSL

### שלב 4: בדיקת החיבור

האפליקציה תתחבר אוטומטית למסד הנתונים כשתפעיל אותה:

```bash
npm run dev
```

אם יש שגיאה, בדוק:
- ✅ מסד הנתונים קיים ב-Neon
- ✅ הסכמה הורצה בהצלחה (בודק ב-Neon Dashboard → Tables)
- ✅ `DATABASE_URL` נכון ב-`.env.local`
- ✅ ה-Connection String כולל `sslmode=require`
- ✅ אין שגיאות בקונסול

**בדיקה מהירה:**
```bash
# בדוק שהחיבור עובד
npm run dev
# אם אין שגיאות בקונסול = הכל תקין!
```

---

## 🔄 עבודה עם Neon

### יתרונות Neon:
- ✅ **Serverless** - אין צורך לנהל שרת
- ✅ **Auto-scaling** - מתאים אוטומטית לעומס
- ✅ **Free Tier** - חינם לפרויקטים קטנים
- ✅ **Branching** - אפשר ליצור branches למסד נתונים
- ✅ **Backups** - גיבויים אוטומטיים

### ניהול ב-Neon Dashboard:
- **SQL Editor** - הרצת שאילתות ישירות
- **Tables** - צפייה בטבלאות
- **Connection Strings** - ניהול חיבורים
- **Branches** - יצירת branches למסד נתונים

---

## 📝 הערות חשובות:

1. **SSL חובה** - Neon דורש SSL, הקוד מטפל בזה אוטומטית
2. **Connection Pooling** - השתמש ב-`-pooler` ב-Connection String לביצועים טובים יותר
3. **Environment Variables** - ב-Vercel, הוסף את `DATABASE_URL` ב-Settings → Environment Variables
4. **לא Prisma** - הפרויקט משתמש ב-`pg` ישירות, לא ב-Prisma

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

