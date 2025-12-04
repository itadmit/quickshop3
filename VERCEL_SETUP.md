# 🚀 הגדרת Vercel - Quickshop3

## שתי דרכים להעלות ל-Vercel:

### דרך 1: חיבור Vercel ל-GitHub (מומלץ) ✅

כשמחברים Vercel ל-GitHub, כל push ל-GitHub יגרום ל-deployment אוטומטי ב-Vercel.

**שלבים:**

1. **היכנס ל-Vercel:**
   - לך ל: https://vercel.com
   - התחבר עם חשבון GitHub שלך

2. **הוסף פרויקט חדש:**
   - לחץ על "Add New Project"
   - בחר את ה-repository: `itadmit/quickshop3`

3. **הגדר את הפרויקט:**
   - **Framework Preset:** Next.js (אוטומטי)
   - **Root Directory:** `./` (ברירת מחדל)
   - **Build Command:** `npm run build` (ברירת מחדל)
   - **Output Directory:** `.next` (ברירת מחדל)
   - **Install Command:** `npm install` (ברירת מחדל)

4. **הגדר משתני סביבה:**
   
   הוסף את כל המשתנים הבאים ב-Vercel Dashboard:
   
   ```env
   # Database
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
   
   # Application
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NODE_ENV=production
   
   # Authentication
   JWT_SECRET=your-secret-key-here
   SESSION_SECRET=your-session-secret-here
   
   # SendGrid Email
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=no-reply@yourdomain.com
   SENDGRID_FROM_NAME=Quick Shop
   
   # Cloudinary CDN
   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
   # או בנפרד:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # AWS S3 (אם משתמש)
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   AWS_S3_BUCKET=your_bucket_name
   ```

5. **Deploy:**
   - לחץ על "Deploy"
   - Vercel יבנה את הפרויקט ויעלה אותו אוטומטית
   - כל push חדש ל-GitHub יגרום ל-deployment אוטומטי

---

### דרך 2: דחיפה ישירה עם Vercel CLI

אם אתה רוצה לדחוף ישירות ל-Vercel ללא Git:

1. **התקן Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **התחבר ל-Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   או ל-production:
   ```bash
   vercel --prod
   ```

4. **הגדר משתני סביבה:**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   # וכו'...
   ```

---

## 📝 הערות חשובות:

1. **משתני סביבה:**
   - כל המשתנים ב-`.env.local` צריכים להיות מוגדרים ב-Vercel Dashboard
   - משתנים שמתחילים ב-`NEXT_PUBLIC_` נגישים גם ב-client-side

2. **מסד נתונים:**
   - ודא שיש לך מסד נתונים זמין (Neon, Supabase, או PostgreSQL אחר)
   - עדכן את `DATABASE_URL` ב-Vercel

3. **Build:**
   - Vercel יבנה את הפרויקט אוטומטית
   - אם יש שגיאות build, הן יופיעו ב-Vercel Dashboard

4. **Domains:**
   - Vercel ייתן לך domain אוטומטי: `your-app.vercel.app`
   - אפשר להוסיף domain מותאם אישית ב-Settings

---

## 🔗 קישורים שימושיים:

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

