# ⚡ QuickShop Remix Storefront

פרונט חדש לחנות עם **Remix.js** - מהיר כמו PHP, מודרני כמו React.

## 🚀 למה Remix?

```
Request → Loader → Render
```

בדיוק כמו PHP הישן והטוב, רק עם:
- ✅ TypeScript
- ✅ React components
- ✅ SSR מובנה
- ✅ אין hydration mismatch
- ✅ Form actions במקום API routes
- ✅ Progressive Enhancement

## 📦 התקנה

```bash
cd remix-storefront
npm install
```

## 🔧 הגדרות

צור קובץ `.env`:
```env
API_URL=http://localhost:3000/api
```

## 🏃 הרצה

```bash
# וודא שה-Next.js backend רץ בפורט 3000
npm run dev
```

הפרויקט ירוץ על **http://localhost:3001**

## 📁 מבנה

```
app/
├── lib/
│   └── api.server.ts    # שכבת API לתקשורת עם QuickShop
├── routes/
│   ├── _index.tsx       # דף בית
│   ├── products._index.tsx  # רשימת מוצרים
│   ├── products.$slug.tsx   # דף מוצר
│   └── cart.tsx         # עגלת קניות
├── root.tsx             # Layout ראשי
└── tailwind.css         # סגנונות
```

## 🆚 Remix vs Next.js

| תכונה | Remix | Next.js |
|--------|-------|---------|
| Data Loading | Loaders (server only) | getServerSideProps / RSC |
| Form Handling | Actions (native forms) | API Routes |
| Mental Model | Request/Response | Components + Magic |
| Bundle Size | קטן יותר | גדול יותר |
| Learning Curve | פשוט יותר | מורכב יותר |

## 🎯 מטרות

- [x] דף בית
- [x] רשימת מוצרים
- [x] דף מוצר עם הוספה לעגלה
- [x] עגלת קניות (בסיסי)
- [ ] חיבור מלא ל-API
- [ ] Session-based cart
- [ ] Checkout flow
- [ ] Customer auth

## 📝 דוגמאות

### Loader - טעינת נתונים
```tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const products = await fetchProducts();
  return json({ products });
}
```

### Action - טיפול בטפסים
```tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  await addToCart(formData.get("productId"));
  return json({ success: true });
}
```

---

⚡ Built with Remix.js | 🎨 Styled with Tailwind CSS

