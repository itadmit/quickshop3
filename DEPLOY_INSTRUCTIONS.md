# הוראות דחיפה ל-Vercel

## ✅ Build הצליח - הפרויקט מוכן!

### הקבצים ששונו:
1. `src/components/orders/OrderQuickView.tsx` - הוספת תצוגת הנחות על פריטים
2. `src/app/api/orders/route.ts` - תיקון פרסור discount_codes
3. `src/app/api/storefront/[storeSlug]/premium-club/progress/route.ts` - תיקון import

### דחיפה דרך Vercel Dashboard (הכי קל):

1. **פתח את Vercel Dashboard:**
   - לך ל: https://vercel.com
   - התחבר לחשבון שלך

2. **הוסף פרויקט חדש:**
   - לחץ על "Add New Project"
   - בחר "Import Git Repository"
   - אם אין repository, צור אחד חדש ב-GitHub

3. **או העלה ישירות:**
   - לחץ על "Deploy" 
   - גרור את התיקייה `/Users/citizenm/Desktop/spam/quickshop3-main`
   - Vercel יבנה ויעלה אוטומטית

### דחיפה דרך GitHub Desktop:

1. פתח את GitHub Desktop
2. File → Add Local Repository
3. בחר את התיקייה: `/Users/citizenm/Desktop/spam/quickshop3-main`
4. Commit את השינויים
5. Push ל-GitHub
6. Vercel יזהה את השינויים ויעלה אוטומטית

### דחיפה דרך Cursor/VS Code:

1. פתח את התיקייה ב-Cursor
2. לחץ על Source Control (Ctrl+Shift+G)
3. Commit את השינויים
4. Push ל-GitHub
5. Vercel יעלה אוטומטית

### או דרך Vercel CLI:

```bash
npm i -g vercel
cd /Users/citizenm/Desktop/spam/quickshop3-main
vercel login
vercel --prod
```

## ✅ הכל מוכן - רק צריך לדחוף!
