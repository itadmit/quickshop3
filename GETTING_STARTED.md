# 🚀 התחלה מהירה - Quickshop3

## ✅ מה נוצר עד כה

### מבנה בסיסי:
- ✅ **Next.js 14** עם App Router
- ✅ **TypeScript** מוגדר
- ✅ **Tailwind CSS** עם תמיכה ב-RTL
- ✅ **Event Bus** - ארכיטקטורת אירועים
- ✅ **Layout** - Header + Sidebar
- ✅ **קומפוננטות UI** - Button, Card, Input, Skeleton, StatusBadge

### דפים שנוצרו:
- ✅ **Dashboard Home** - דף בית עם מטריקות והתראות
- ✅ **Products Page** - דף מוצרים בסיסי
- ✅ **Orders Page** - דף הזמנות בסיסי

### תיעוד:
- ✅ **README.md** - תיעוד מלא
- ✅ **DESIGN_SYSTEM.md** - אפיון ויזואלי
- ✅ **QA_SCHEMA_REVIEW.md** - סקירת סכמת DB
- ✅ **Module READMEs** - Orders & Products

---

## 📦 התקנה

### 1. התקנת תלויות

```bash
npm install
# או
pnpm install
```

### 2. הגדרת משתני סביבה

צור קובץ `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
NEXT_PUBLIC_APP_URL=http://localhost:3099
NODE_ENV=development
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=no-reply@my-quickshop.com
SENDGRID_FROM_NAME=Quick Shop

# Cloudinary CDN Configuration (for file uploads)
# Option 1: Use CLOUDINARY_URL (recommended - single variable)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
# Option 2: Use individual variables
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

**הערה חשובה על SendGrid:**
- המיילים יישלחו עם שם השולח = שם האתר (store name) אוטומטית
- כל אתר יכול לשנות את שם השולח על ידי שינוי שם האתר שלו
- ה-API key וה-from email נשמרים ב-.env או ב-DB (עדיפות ל-DB אם קיים)

**הערה על Cloudinary:**
- מומלץ להשתמש ב-`CLOUDINARY_URL` (משתנה אחד במקום שלושה)
- הפורמט: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
- דוגמה: `CLOUDINARY_URL=cloudinary://471447719311179:H6KY-xcaqn0LR7IWdSfBqrtkk2A@dpbsspc1b`

### 3. הגדרת מסד נתונים

הרץ את הסכמה:

```bash
psql -U your_user -d your_database -f sql/schema.sql
```

### 4. הרצת הפרויקט

```bash
npm run dev
```

האפליקציה תרוץ על `http://localhost:3000`

---

## 📁 מבנה הפרויקט

```
quickshop3/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # דשבורד מוגן
│   │   │   ├── page.tsx          # Dashboard Home
│   │   │   ├── layout.tsx        # Layout עם Header + Sidebar
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx      # דף הזמנות
│   │   │   │   └── README.md     # צ'קליסט תכונות
│   │   │   └── products/
│   │   │       ├── page.tsx      # דף מוצרים
│   │   │       └── README.md     # צ'קליסט תכונות
│   │   ├── layout.tsx            # Root Layout
│   │   └── globals.css           # Tailwind + RTL
│   ├── components/
│   │   ├── ui/                   # קומפוננטות UI בסיסיות
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── StatusBadge.tsx
│   │   └── layout/               # קומפוננטות Layout
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   └── lib/
│       └── events/               # Event-Driven Architecture
│           ├── eventBus.ts
│           └── types.ts
├── sql/
│   └── schema.sql                # סכמת PostgreSQL מלאה
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🎯 מה הלאה?

### לפי המתודולוגיה, השלבים הבאים:

1. **השלמת מודול Orders**
   - API Routes (`/api/orders`)
   - Service Layer
   - Event Emission
   - חיבור ל-DB

2. **השלמת מודול Products**
   - API Routes (`/api/products`)
   - Service Layer
   - Event Emission
   - חיבור ל-DB

3. **מודול Customers**
   - יצירת מבנה בסיסי
   - API Routes
   - UI

4. **מודולים נוספים**
   - Analytics
   - Marketing
   - Settings

---

## 📝 הערות חשובות

### Event-Driven Architecture
כל פעולה משמעותית חייבת לפלוט אירוע דרך `eventBus.emit()`.

### Client-Side Dashboard
כל הקומפוננטות בדשבורד הן `'use client'` - אין Server Components.

### RTL Support
הכל מיושר ימינה - עברית היא שפת ברירת המחדל.

### Tailwind CSS Only
אין ספריות קומפוננטות גדולות - הכל נבנה עם Tailwind.

---

## 🐛 פתרון בעיות

### שגיאת TypeScript
```bash
npm run type-check
```

### שגיאת Linting
```bash
npm run lint
```

### בדיקת תיעוד
```bash
npm run check:docs
```

---

## 📚 משאבים

- [README.md](./README.md) - תיעוד מלא
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - אפיון ויזואלי
- [sql/schema.sql](./sql/schema.sql) - סכמת DB

---

**מוכן להתחיל לפתח!** 🚀

