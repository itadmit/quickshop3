# 🚀 מדריך Deployment - Quickshop3

## סביבת הפרויקט

הפרויקט מוגדר לעבוד עם:
- **Next.js 15** (App Router)
- **Vercel** - פלטפורמת deployment
- **Neon PostgreSQL** - מסד נתונים בענן
- **Cloudinary** - אחסון תמונות

---

## 📋 דרישות לפני Deployment

### 1. מסד נתונים - Neon PostgreSQL

✅ **כבר מוגדר!** המסד נתונים שלך ב-Neon כבר פעיל.

```
DATABASE_URL=postgresql://neondb_owner:npg_...@ep-red-mountain-....neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. משתני סביבה נדרשים

לפני deployment, ודא שיש לך את כל המשתנים הבאים:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...

# JWT Secret (32+ characters random string)
JWT_SECRET=your-secret-key-here

# Cloudinary CDN
CLOUDINARY_CLOUD_NAME=dpbsspc1b
CLOUDINARY_API_KEY=471447719311179
CLOUDINARY_API_SECRET=H6KY-xcaqn0LR7IWdSfBqrtkk2A

# App URL (will change in production)
NEXT_PUBLIC_APP_URL=http://localhost:3099

# Environment
NODE_ENV=development

# SendGrid (optional - for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=no-reply@yourdomain.com
SENDGRID_FROM_NAME=Quick Shop
```

---

## 🌐 Deployment ל-Vercel

### שלב 1: חיבור GitHub ל-Vercel

1. **היכנס ל-Vercel:**
   - לך ל: https://vercel.com
   - התחבר עם חשבון GitHub

2. **הוסף פרויקט חדש:**
   - לחץ על "Add New Project"
   - בחר את ה-repository: `itadmit/quickshop3`
   - Vercel יזהה אוטומטי שזה Next.js

3. **הגדרות Build (ברירת מחדל - אל תשנה!):**
   - **Framework Preset:** Next.js (זיהוי אוטומטי)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
   - **Node.js Version:** 18.x (ברירת מחדל)

### שלב 2: הגדרת משתני סביבה ב-Vercel

**חשוב מאוד!** לפני ה-Deploy הראשון, הוסף את כל משתני הסביבה:

1. ב-Vercel Dashboard, בחר את הפרויקט
2. לך ל: **Settings → Environment Variables**
3. הוסף את המשתנים הבאים:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_...` | Production, Preview, Development |
| `JWT_SECRET` | `9cf00a40603ca882d99fb736f32e351324a5f1801d9f537e602108b08db041` | Production, Preview, Development |
| `CLOUDINARY_CLOUD_NAME` | `dpbsspc1b` | Production, Preview, Development |
| `CLOUDINARY_API_KEY` | `471447719311179` | Production, Preview, Development |
| `CLOUDINARY_API_SECRET` | `H6KY-xcaqn0LR7IWdSfBqrtkk2A` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3099` | Development |
| `NODE_ENV` | `production` | Production |
| `NODE_ENV` | `development` | Development |

**הערה:** `NEXT_PUBLIC_APP_URL` ישתנה אחרי ה-deploy הראשון ל-URL האמיתי שVercel נותן לך.

### שלב 3: Deploy

1. לחץ על **"Deploy"**
2. Vercel יבנה את הפרויקט (לוקח 2-3 דקות)
3. אחרי ה-build, תקבל URL: `https://your-app.vercel.app`

### שלב 4: עדכון URL (חשוב!)

1. חזור ל-Settings → Environment Variables
2. עדכן את `NEXT_PUBLIC_APP_URL` ל-URL האמיתי
3. Vercel יעשה **Redeploy אוטומטי**

---

## 🔄 Deployment אוטומטי

**מעכשיו, כל push ל-GitHub יגרום ל-deployment אוטומטי ב-Vercel!**

```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel יזהה ויעשה deploy אוטומטי
```

---

## ⚠️ כללי זהב ל-Deployment

### 1. Dependencies נכונות

**חשוב מאוד!** ספריות שנדרשות ל-build חייבות להיות ב-`dependencies`, לא ב-`devDependencies`:

✅ **ב-dependencies:**
- `tailwindcss`
- `postcss`
- `autoprefixer`
- כל ספרייה שנדרשת בזמן build

❌ **ב-devDependencies:**
- `@types/*` (TypeScript types)
- `ts-node`
- `glob`
- כלי פיתוח בלבד

### 2. תמיד בדוק build מקומית לפני push

```bash
# נקה את ה-build הקודם
rm -rf .next

# בנה מחדש
npm run build

# אם הבניה עברה בהצלחה, תראה:
# ✓ Compiled successfully
```

### 3. אל תעשה push של קבצים רגישים

וודא ש-`.gitignore` כולל:
```
.env
.env.local
.env*.local
node_modules
.next
```

### 4. השתמש ב-Environment Variables

**אל תקבע ערכים בקוד!** תמיד השתמש במשתני סביבה:

❌ **לא לעשות:**
```typescript
const apiKey = "my-secret-key-123";
```

✅ **לעשות:**
```typescript
const apiKey = process.env.CLOUDINARY_API_KEY;
```

---

## 🛠️ פתרון בעיות נפוצות

### בעיה: Build נכשל עם "Cannot find module 'tailwindcss'"

**פתרון:**
```bash
# ודא ש-tailwindcss ב-dependencies
npm install tailwindcss postcss autoprefixer --save
# לא --save-dev!
```

### בעיה: "Module not found: Can't resolve 'pg'"

**פתרון:**
ודא ש-`pg` ו-`@types/pg` ב-dependencies:
```bash
npm install pg @types/pg --save
```

### בעיה: משתני סביבה לא עובדים ב-production

**פתרון:**
1. בדוק שהוספת את המשתנים ב-Vercel Dashboard
2. משתנים שמתחילים ב-`NEXT_PUBLIC_` נגישים גם ב-client
3. משתנים רגילים נגישים רק ב-server (API routes, middleware)

### בעיה: Build עובר אבל האפליקציה לא פועלת

**פתרון:**
1. בדוק את הלוגים ב-Vercel Dashboard → Deployments → [בחר deploy] → Logs
2. ודא שמסד הנתונים זמין (Neon)
3. ודא שכל משתני הסביבה מוגדרים נכון

---

## 📊 ניטור ובדיקות

### בדיקת Deployment

לאחר deployment, בדוק:

1. **האתר עולה:**
   - לך ל-URL שVercel נתן
   - ודא שדף הבית נטען

2. **API Routes עובדים:**
   ```bash
   curl https://your-app.vercel.app/api/auth/me
   ```

3. **מסד נתונים מחובר:**
   - נסה להירשם / להתחבר
   - בדוק שהנתונים נשמרים

### לוגים ב-Vercel

- לך ל: Deployments → [בחר deploy] → **Functions**
- תראה לוגים של כל API route
- שימושי לדיבוג בעיות

---

## 🔐 אבטחה

### חובה לעשות:

1. **JWT_SECRET חזק:**
   ```bash
   # צור secret חדש:
   openssl rand -hex 32
   ```

2. **DATABASE_URL מאובטח:**
   - Neon אוטומטית משתמש ב-SSL
   - וודא ש-`sslmode=require` ב-connection string

3. **משתני סביבה בלבד:**
   - אף פעם אל תשים secrets בקוד
   - תמיד השתמש ב-`process.env.*`

4. **CORS מוגבל:**
   - ה-API מוגבל רק לדומיין שלך
   - Middleware בודק authentication

---

## 📚 משאבים נוספים

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Cloudinary Setup](https://cloudinary.com/documentation)

---

## ✅ Checklist לפני Production

- [ ] כל משתני הסביבה מוגדרים ב-Vercel
- [ ] `DATABASE_URL` מצביע ל-Neon
- [ ] `JWT_SECRET` מוגדר (32+ תווים)
- [ ] `NEXT_PUBLIC_APP_URL` מעודכן ל-URL של Vercel
- [ ] Build מקומית עוברת בהצלחה
- [ ] `.gitignore` מוגדר נכון
- [ ] אין secrets בקוד
- [ ] טסטים עוברים (אם יש)
- [ ] תיעוד מעודכן

---

## 🚨 תמיכה

אם נתקלת בבעיות:
1. בדוק את [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. ראה את הלוגים ב-Vercel Dashboard
3. בדוק את [GitHub Issues](https://github.com/itadmit/quickshop3/issues)

