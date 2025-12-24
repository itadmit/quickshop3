# הוראות דחיפה ל-Vercel

## ✅ Vercel CLI מותקן!

### אפשרות 1: דחיפה ישירה (יפתח דפדפן להתחברות)
```bash
cd /Users/citizenm/Desktop/spam/quickshop3-main
vercel --prod
```

### אפשרות 2: שימוש ב-Token מ-Dashboard
1. לך ל-Vercel Dashboard: https://vercel.com/account/tokens
2. צור Token חדש או העתק token קיים
3. הרץ:
```bash
vercel login --token YOUR_TOKEN_HERE
vercel --prod
```

### אפשרות 3: קישור לפרויקט קיים
```bash
cd /Users/citizenm/Desktop/spam/quickshop3-main
vercel link
# בחר את הפרויקט הקיים
vercel --prod
```

### אפשרות 4: דחיפה דרך Dashboard (הכי קל)
1. לך ל: https://vercel.com/new
2. גרור את התיקייה או חבר ל-GitHub
3. Vercel יבנה ויעלה אוטומטית

## ✅ Build הצליח - מוכן לפריסה!
