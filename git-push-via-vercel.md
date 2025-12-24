# דחיפה ל-Vercel דרך Git

## אפשרות 1: דרך Vercel Dashboard
1. פתח את https://vercel.com
2. הוסף פרויקט חדש
3. חבר ל-GitHub repository
4. Vercel יבנה ויעלה אוטומטית

## אפשרות 2: דרך Vercel CLI (אם מותקן)
```bash
npm i -g vercel
vercel login
vercel --prod
```

## אפשרות 3: דחיפה ידנית ל-GitHub
לאחר התקנת Xcode Command Line Tools:
```bash
cd /Users/citizenm/Desktop/spam/quickshop3-main
./install-and-push.sh
```

## הקבצים ששונו:
- src/components/orders/OrderQuickView.tsx
- src/app/api/orders/route.ts  
- src/app/api/storefront/[storeSlug]/premium-club/progress/route.ts

✅ Build הצליח - הפרויקט מוכן לפריסה!
