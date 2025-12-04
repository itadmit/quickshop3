# 🛠️ Troubleshooting Guide – Quickshop3

<div dir="rtl">

## 🎯 מטרה

המדריך הזה מרכז את התקלות הנפוצות ואת הצעדים המומלצים לפתרון מהיר. לפני פתיחת תקלה חדשה, עברו על הסעיפים הבאים.

---

## 1. Build נכשל ב-Vercel

### ❗ שגיאה: `Cannot find module 'tailwindcss'`
**סיבה:** Tailwind/PostCSS הוגדרו ב-`devDependencies` ולכן Vercel לא התקין אותם.

**פתרון:**
```bash
npm install tailwindcss postcss autoprefixer --save
# ואז להריץ
npm run build
```

### ❗ שגיאה: `ENOENT ... page_client-reference-manifest.js`
**סיבה:** Next.js 15 מדלג לפעמים על יצירת הקובץ הזה.

**פתרון:**
1. ודאו ש-`npm run build` מריץ את סקריפט ה-`postbuild`.
2. אל תמחקו את `scripts/postbuild-fix.js` – הוא יוצר את הקובץ החסר באופן אוטומטי.

### ❗ אזהרה: `Next.js inferred your workspace root`
**סיבה:** Next.js מזהה lockfile נוסף בספרייה אחרת.

**פתרון:** אין צורך לפעול – הקובץ `next.config.mjs` כבר מגדיר `outputFileTracingRoot`. האזהרה תיעלם לאחר build נוסף ב-Vercel.

---

## 2. Build נכשל לוקאלית

### ✅ לפני כל push / feature חדש
```bash
rm -rf .next
npm install
npm run build   # מריץ גם postbuild והבדיקות
```

### בדיקה ממוקדת
- `npm run type-check` – שגיאות TypeScript
- `npm run lint` – שגיאות ESLint
- `npm run check:docs` – עמידה בדרישות תיעוד

---

## 3. בעיות סביבת הרצה

### ❗ `DATABASE_URL` לא מוגדר
- ודאו שהמשתנה קיים ב-`.env.local` וב-Vercel Dashboard.
- פרויקט זה משתמש ב-Neon PostgreSQL בלבד (SSL חובה).

### ❗ פורט שגוי
- `npm run dev` מאזין ל-`http://localhost:3099`.
- אם כבר תפוס: `PORT=3099 npm run dev`.

---

## 4. תלותים (Dependencies)

- כל ספרייה שנחוצה בזמן build חייבת להיות ב-`dependencies`.
- `devDependencies` שמורים לכלי פיתוח בלבד (`@types/*`, `ts-node`, וכו').

בדיקה מהירה:
```bash
npm ls tailwindcss
npm ls pg
```

---

## 5. Vercel + Environment Variables

- כל משתני הסביבה ב-`.env.local` חייבים להופיע ב-Vercel.
- משתנים שמתחילים ב-`NEXT_PUBLIC_` זמינים גם בצד הלקוח.
- אחרי שינוי משתנה – Vercel מפעיל Redeploy אוטומטי.

---

## 6. מתי לפתוח תקלה חדשה?

- ✅ כבר הרצתם `npm run build`
- ✅ עדכנתם תלויות/ENV לפי ההנחיות
- ✅ בדקתם את הסעיפים לעיל
- ✅ יש לכם צילומי מסך ולוגים מלאים

---

## 7. עזרה נוספת

- [DEPLOYMENT.md](./DEPLOYMENT.md) – מדריך מלא ל-Vercel + Neon
- [README.md](./README.md) – סקירה מלאה של המערכת והסטאק
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) – כללי UI ו-UX

---

**בהצלחה!** אם יש שאלה שלא מופיעה כאן – עדכנו את המדריך אחרי שמצאתם פתרון.

</div>

