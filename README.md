# Quickshop3

<div dir="rtl">

## 🚀 פלטפורמת SaaS להקמת חנויות וירטואליות

**Quickshop3** היא פלטפורמת SaaS מודרנית להקמת וניהול חנויות וירטואליות, בנויה בהשראת Shopify עם ארכיטקטורה גמישה ומודולרית. המערכת מספקת פתרון מלא לניהול מוצרים, הזמנות, לקוחות, תשלומים, משלוחים ושיווק.

### 🌐 סביבת הפיתוח והפקה
- **Next.js 15** + **React 19** - עם App Router
- **Vercel** - פלטפורמת deployment אוטומטית
- **Neon PostgreSQL** - מסד נתונים serverless בענן
- **Cloudinary** - CDN ואחסון תמונות

📖 **[מדריך Deployment מפורט →](./DEPLOYMENT.md)**  
🛠️ **[מדריך Troubleshooting →](./TROUBLESHOOTING.md)**  
🗺️ **[תוכנית פיתוח מפורטת →](./DEVELOPMENT_ROADMAP.md)**

---

## ⚠️ הנחיות קריטיות כדי למנוע שבירת Build

כדי למנוע חזרה על תקלות deployment (במיוחד ב-Vercel + Next.js 15) הקפידו על הכללים הבאים:

1. **מפעילים `npm run build` לוקאלית לפני כל push**
   - הפקודה מריצה גם את `postbuild` שמוודא יצירת קבצי manifest ש-Vercel צריך.
2. **חבילות שנדרשות בזמן build תמיד ב-`dependencies`**
   - Tailwind CSS, PostCSS, Autoprefixer, Sharp, וכד' – לא לשים ב-`devDependencies`.
3. **עובדים רק מול Vercel + Neon**
   - `DATABASE_URL` צריך להיות ממקור Neon (SSL חובה).
   - `NEXT_PUBLIC_APP_URL` מתעדכן ל-URL של Vercel בכל deploy.
4. **לא דוחפים `.env*` / `.next` / `node_modules`**
   - הקונפיגורציה והסודות מוגדרים ב-Vercel Dashboard בלבד.
5. **שומרים על מבנה הסקריפטים**
   - אם מוסיפים סקריפטים חדשים (ב-`scripts/`), לרשום אותם ב-README/DEPLOYMENT כדי שכולם ידעו להריץ.

👆️ כללי זהב אלו הוכנסו למדריך הרשמי ב-`DEPLOYMENT.md` – חובה לעבור עליו לפני שינויים משמעותיים.

---

## ✨ תכונות עיקריות

### 🏪 ניהול חנויות מרובות
- תמיכה מלאה בחנויות מרובות (Multi-Store)
- ניהול בעלי חנויות והרשאות
- הגדרות חנות מותאמות אישית (דומיין, מטבע, אזור זמן)

### 🛍️ ניהול מוצרים מתקדם
- ניהול מוצרים מלא עם גלריית תמונות
- **כל מוצר חייב להיות עם לפחות variant אחד** (גם מוצרים בלי אפשרויות)
- וריאציות בלתי מוגבלות (מידות, צבעים, SKU)
- ניהול מלאי לפי מיקומי מחסן (ב-`variant_inventory`)
- Collections, Tags ו-Meta Fields מותאמים אישית
- מחירים דינמיים וחוקי תמחור (נשמרים ב-`product_variants`)

### 📦 ניהול הזמנות
- מעקב מלא אחר הזמנות
- פילטרים מתקדמים (סטטוס, תאריך, סכום)
- ניהול סטטוסים (תשלום, ביצוע)
- החזרים וביטולי תשלום
- היסטוריית פעולות והערות

### 👥 ניהול לקוחות
- כרטיסי לקוח מפורטים
- היסטוריית רכישות
- הערות ומשימות פנימיות
- כתובות מרובות
- הסכמות שיווק (אימייל, SMS, WhatsApp)

### 💳 תשלומים ומשלוחים
- תמיכה במספר ספקי תשלום
- ניהול טרנזקציות והחזרים
- אזורי משלוח מותאמים
- חוקי משלוח מתקדמים (משקל, סכום, מיקום)
- איסוף עצמי ומשלוח חינם

### 📊 אנליטיקס ודוחות
- דוחות מכירות מפורטים
- מעקב ביקורים ומרווחים
- מוצרים מובילים
- גרפים ודוחות ויזואליים
- אירועים מבוססי JSONB

### 🎯 שיווק וקופונים
- ניהול קופונים והנחות
- **מנוע חישוב הנחות מרכזי וחכם** - Single Source of Truth לכל החישובים
- מועדון לקוחות ורמות VIP
- אוטומציות שיווק
- Cashback ונאמנות

### 🔌 אינטגרציות
- Webhooks מלאים (כמו Shopify)
- API RESTful מלא
- Cursor Pagination
- System Logs ו-Request Logs

---

## 🛠️ טכנולוגיות

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS עם תמיכה ב-RTL
- **Icons**: react-icons (Heroicons) - אין אימוג'ים!
- **Font**: Open Sans Hebrew (חובה)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **DB Access**: `pg` (node-postgres) ללא ORM
- **Authentication**: JWT / Session (using `jose` library for Edge Runtime compatibility)

---

## ⚡ ביצועים ומהירות - עקרונות מרכזיים

### 🎯 המטרה: מהירות ותגובה מהירה

הדשבורד צריך להיות **מהיר ורספונסיבי** - כל פעולה צריכה להיות מיידית.

### 💻 Client-Side Dashboard (צד דפדפן)

**חוק זהב:** הדשבורד הוא **100% Client-Side** - כל הלוגיקה רצה בדפדפן.

#### מה זה אומר?

```
✅ טוב:
- כל הקומפוננטות הן "use client"
- כל הנתונים מגיעים מ-API calls
- אין Server Components בדשבורד
- אין Server-Side Rendering לדשבורד

❌ רע:
- Server Components בדשבורד
- Server-Side Rendering לדשבורד
- לוגיקה רצה בשרת
```

#### למה Client-Side?

1. **מהירות** - אין round-trip לשרת לכל פעולה
2. **UX טוב** - תגובה מיידית
3. **אינטראקטיביות** - אנימציות, transitions, וכו'
4. **מתאים לדשבורד** - דשבורד הוא אפליקציה אינטראקטיבית

### 📦 ספריות - מתי להתקין ומתי לבנות?

#### ✅ ספריות שכן מומלץ להתקין (חובה):

1. **Tailwind CSS** - עיצוב מהיר, bundle קטן
2. **React** - framework בסיסי
3. **Next.js** - routing ו-API
4. **TypeScript** - type safety
5. **react-icons** - אייקונים (Heroicons) - אין אימוג'ים!

#### ⚠️ ספריות שצריך להיזהר:

1. **UI Component Libraries** (shadcn/ui, Material-UI, וכו')
   - ❌ **אל תתקין** - בנה בעצמך!
   - ✅ למה? כי אתה צריך רק מה שאתה משתמש בו
   - ✅ Tailwind CSS מספיק לרוב הקומפוננטות

2. **Form Libraries** (React Hook Form, Formik)
   - ⚠️ **רק אם באמת צריך** - רוב הטפסים פשוטים
   - ✅ לטפסים פשוטים - בנה בעצמך עם useState

3. **Table Libraries** (TanStack Table, React Table)
   - ⚠️ **רק אם יש טבלאות מורכבות מאוד**
   - ✅ לרוב הטבלאות - בנה בעצמך עם Tailwind

4. **State Management** (Zustand, Redux)
   - ⚠️ **רק אם באמת צריך** - Next.js מספיק לרוב
   - ✅ לרוב המקרים - useState + API calls מספיק

#### 🏗️ מתי לבנות בעצמך?

**בנה בעצמך אם:**
- ✅ הקומפוננטה פשוטה (Button, Input, Card)
- ✅ אתה צריך רק חלק מהפיצ'רים של הספרייה
- ✅ אתה רוצה שליטה מלאה
- ✅ אתה רוצה bundle קטן יותר
- ✅ אתה רוצה תמיכה ב-RTL מותאמת

**השתמש בספרייה אם:**
- ✅ הקומפוננטה מאוד מורכבת (Rich Text Editor, Date Picker מורכב)
- ✅ אתה צריך את כל הפיצ'רים
- ✅ אין לך זמן לבנות
- ✅ הספרייה קטנה וממוקדת

### 🎨 קומפוננטות UI - גישה מומלצת

#### 1. **בנה קומפוננטות בסיסיות בעצמך**

```typescript
// ✅ טוב - בנה בעצמך
// src/components/ui/Button.tsx
export function Button({ children, onClick, variant = 'primary' }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg
        ${variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200'}
        hover:opacity-90 transition-opacity
      `}
    >
      {children}
    </button>
  );
}
```

**למה?**
- ✅ Bundle קטן יותר
- ✅ שליטה מלאה
- ✅ תמיכה ב-RTL מותאמת
- ✅ קל לתחזק

#### 2. **אל תתקין ספריות גדולות**

```typescript
// ❌ רע - ספרייה גדולה
import { Button } from '@mui/material'; // 500KB+ bundle

// ✅ טוב - קומפוננטה קטנה משלך
import { Button } from '@/components/ui/Button'; // 2KB bundle
```

#### 3. **השתמש ב-Tailwind CSS**

```typescript
// ✅ טוב - Tailwind CSS
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold">Orders</h2>
  <Button>Create Order</Button>
</div>

// ❌ רע - ספריית קומפוננטות
<Card>
  <CardHeader>
    <CardTitle>Orders</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Create Order</Button>
  </CardContent>
</Card>
```

### 🚀 אופטימיזציות לביצועים

#### 1. **Code Splitting**

```typescript
// ✅ טוב - Lazy loading
const OrdersPage = lazy(() => import('./orders/page'));
const ProductsPage = lazy(() => import('./products/page'));

// ❌ רע - הכל נטען בבת אחת
import OrdersPage from './orders/page';
import ProductsPage from './products/page';
```

#### 2. **API Calls - Optimistic Updates**

```typescript
// ✅ טוב - Optimistic Update
const updateOrder = async (id, status) => {
  // עדכן מיד ב-UI
  setOrders(prev => prev.map(o => 
    o.id === id ? { ...o, status } : o
  ));
  
  // אחר כך עדכן בשרת
  await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};
```

#### 3. **Caching**

```typescript
// ✅ טוב - Cache API responses
const { data, isLoading } = useSWR('/api/orders', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
});
```

#### 4. **Debouncing**

```typescript
// ✅ טוב - Debounce search
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchOrders({ search: debouncedSearch });
  }
}, [debouncedSearch]);
```

### 🎨 Skeleton Loaders - מתי ואיך?

#### ✅ מתי להשתמש ב-Skeleton?

**רק כשבאמת יש טעינה אמיתית!**

```typescript
// ✅ טוב - Skeleton רק כשיש טעינה אמיתית
const { data, isLoading } = useSWR('/api/orders', fetcher);

if (isLoading) {
  return <OrdersSkeleton />; // רק אם באמת טוען
}

return <OrdersList data={data} />;
```

```typescript
// ❌ רע - Skeleton גם כשאין טעינה
const { data, isLoading } = useSWR('/api/orders', fetcher, {
  fallbackData: [], // יש נתונים כבר
});

if (isLoading) {
  return <OrdersSkeleton />; // לא צריך! יש fallbackData
}
```

#### 🎯 כללי זהב ל-Skeleton:

1. **רק אם באמת טוען** - לא אם יש cache או fallbackData
2. **מהיר וקל** - Skeleton צריך להיות קל יותר מהתוכן האמיתי
3. **דומה לתוכן** - Skeleton צריך להיראות כמו התוכן הסופי
4. **לא לאגי** - אנימציה חלקה, לא כבדה

#### 💻 דוגמה ל-Skeleton Component:

```typescript
// src/components/ui/Skeleton.tsx
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`
        animate-pulse bg-gray-200 rounded
        ${className}
      `}
    />
  );
}

// שימוש:
export function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 border rounded">
          <Skeleton className="w-16 h-16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="w-24 h-8" />
        </div>
      ))}
    </div>
  );
}
```

#### ⚡ Optimistic UI - תגובה מיידית

**חשוב:** במקום Skeleton, עדיף Optimistic UI לפעולות משתמש:

```typescript
// ✅ טוב - Optimistic Update (מהיר יותר מ-Skeleton)
const addToCart = async (productId) => {
  // עדכן מיד ב-UI (אין Skeleton!)
  setCart(prev => [...prev, { id: productId, loading: true }]);
  
  // אחר כך עדכן בשרת
  const result = await fetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify({ productId })
  });
  
  // עדכן עם התוצאה האמיתית
  setCart(prev => prev.map(item => 
    item.id === productId 
      ? { ...result, loading: false }
      : item
  ));
};
```

### 🏪 Storefront vs Dashboard - ארכיטקטורה שונה

#### 📊 Dashboard (Admin) - Client-Side

```
✅ Client-Side Rendering
✅ "use client" בכל מקום
✅ API calls לכל נתון
✅ מהירות = תגובה מיידית
```

#### 🛍️ Storefront (חנות) - Hybrid (Server + Client)

```
✅ Server-Side Rendering לדפים סטטיים
✅ Client-Side לפעולות אינטראקטיביות
✅ מהירות = טעינה מהירה מהשרת
```

### 🚀 Storefront - אופטימיזציות למהירות

#### 1. **דף בית - Server-Side Rendering**

```typescript
// ✅ טוב - SSR לדף בית
// src/app/(storefront)/page.tsx
export default async function HomePage() {
  // טעינה מהשרת - מהיר!
  const products = await getFeaturedProducts();
  const collections = await getCollections();
  
  return (
    <div>
      <HeroSection />
      <CollectionsList collections={collections} />
      <ProductsGrid products={products} />
    </div>
  );
}
```

**למה SSR?**
- ✅ SEO טוב יותר
- ✅ טעינה מהירה יותר (הנתונים כבר שם)
- ✅ לא צריך API call נוסף

#### 2. **הוספה לסל - מהירה מהשרת**

```typescript
// ✅ טוב - Server Action (מהיר!)
// src/app/(storefront)/actions/cart.ts
'use server';

export async function addToCart(productId: number, variantId: number) {
  // עדכן מיד בשרת - מהיר!
  await db.cart_items.create({
    data: { product_id: productId, variant_id: variantId }
  });
  
  // החזר תוצאה מיידית
  return { success: true };
}

// שימוש:
import { addToCart } from '@/app/(storefront)/actions/cart';

<button onClick={() => addToCart(product.id, variant.id)}>
  Add to Cart
</button>
```

**למה Server Action?**
- ✅ מהיר יותר מ-API Route
- ✅ פחות overhead
- ✅ תגובה מיידית

#### 3. **צ'ק אאוט - מהיר מהשרת**

```typescript
// ✅ טוב - Server Action לצ'ק אאוט
// src/app/(storefront)/actions/checkout.ts
'use server';

export async function createCheckout(cartItems: CartItem[]) {
  // יצירת הזמנה מהר מהשרת
  const order = await db.orders.create({
    data: {
      line_items: cartItems,
      // ...
    }
  });
  
  // החזר מיידי
  return { orderId: order.id, redirectUrl: `/checkout/${order.id}` };
}
```

#### 4. **Caching - לא להעמיס על השרת**

```typescript
// ✅ טוב - Cache לדפים סטטיים
// src/app/(storefront)/products/[slug]/page.tsx
import { unstable_cache } from 'next/cache';

const getProduct = unstable_cache(
  async (slug: string) => {
    return await db.products.findFirst({ where: { slug } });
  },
  ['product'],
  { revalidate: 3600 } // Cache ל-שעה
);

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  return <ProductDetails product={product} />;
}
```

**למה Cache?**
- ✅ לא להעמיס על השרת
- ✅ תגובה מהירה יותר
- ✅ פחות load על ה-DB

### 📋 Checklist למהירות

#### Dashboard (Admin):
- [ ] **Client-Side** - כל הקומפוננטות "use client"
- [ ] **Optimistic Updates** - עדכון UI מיד
- [ ] **Skeleton רק אם צריך** - לא אם יש cache
- [ ] **API Calls** - כל הנתונים מ-API
- [ ] **Code Splitting** - lazy loading

#### Storefront (חנות):
- [ ] **SSR לדפים סטטיים** - דף בית, מוצרים, וכו'
- [ ] **Server Actions לפעולות** - הוספה לסל, צ'ק אאוט
- [ ] **Cache לדפים סטטיים** - לא להעמיס על השרת
- [ ] **Client-Side לפעולות אינטראקטיביות** - סינון, חיפוש
- [ ] **מהירות = עדיפות** - כל פעולה צריכה להיות מהירה

### ⚡ מהירות בפעולות קריטיות

#### פעולות שצריכות להיות מהירות מהשרת:

1. **הוספה לסל** - Server Action (לא API Route)
2. **צ'ק אאוט** - Server Action (לא API Route)
3. **טעינת דף בית** - SSR + Cache
4. **טעינת מוצר** - SSR + Cache
5. **חיפוש** - Client-Side (מהיר יותר)

#### דוגמה: הוספה לסל מהירה

```typescript
// ✅ טוב - Server Action (מהיר!)
'use server';

export async function addToCart(formData: FormData) {
  const productId = formData.get('productId');
  const variantId = formData.get('variantId');
  
  // עדכן מיד בשרת
  await db.cart_items.create({
    data: {
      product_id: Number(productId),
      variant_id: Number(variantId),
      quantity: 1
    }
  });
  
  // החזר מיידי
  revalidatePath('/cart');
  return { success: true };
}

// שימוש:
<form action={addToCart}>
  <input type="hidden" name="productId" value={product.id} />
  <input type="hidden" name="variantId" value={variant.id} />
  <button type="submit">Add to Cart</button>
</form>
```

**למה זה מהיר?**
- ✅ אין API Route overhead
- ✅ תגובה ישירה מהשרת
- ✅ פחות network latency

### 🎯 סיכום - מהירות ותגובה מהירה

#### Dashboard:
- ✅ **Client-Side** - תגובה מיידית
- ✅ **Optimistic UI** - עדכון מיד
- ✅ **Skeleton רק אם צריך** - לא סתם

#### Storefront:
- ✅ **SSR לדפים** - טעינה מהירה
- ✅ **Server Actions לפעולות** - מהיר מהשרת
- ✅ **Cache** - לא להעמיס על השרת
- ✅ **מהירות = עדיפות** - כל פעולה מהירה

**זכור:** מהירות = חוויית משתמש טובה = מכירות יותר! 🚀

### 📊 Bundle Size - כללים

#### ✅ Bundle קטן = מהירות

```
✅ טוב:
- Tailwind CSS: ~10KB (gzipped)
- React: ~45KB (gzipped)
- Next.js: ~50KB (gzipped)
סה"כ: ~105KB

❌ רע:
- Material-UI: ~200KB+
- Ant Design: ~150KB+
- Bootstrap: ~50KB+
סה"כ: 400KB+ (יותר מ-3x!)
```

#### איך לבדוק Bundle Size?

```bash
npm run build
# Next.js יציג את גודל ה-bundle
```

### 🎯 Checklist לביצועים

לפני כל פיצ'ר חדש, ודא:

- [ ] **קומפוננטות הן "use client"** - לא Server Components
- [ ] **אין ספריות מיותרות** - רק מה שצריך
- [ ] **Tailwind CSS** - לא ספריות קומפוננטות גדולות
- [ ] **Code Splitting** - lazy loading למודולים
- [ ] **Optimistic Updates** - עדכון UI מיד
- [ ] **Caching** - cache API responses
- [ ] **Bundle Size** - בדוק שהגודל סביר

### 📋 רשימת ספריות מותרת (מינימלית)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^20.0.0",
    "@types/pg": "^8.15.6"
  }
}
```

**הערה חשובה:** הפרויקט משתמש ב-`pg` (node-postgres) ישירות, **לא ב-Prisma**. כל הספריות שנדרשות ל-build (tailwindcss, postcss, autoprefixer) חייבות להיות ב-`dependencies`.

**זה הכל!** אין צורך בעוד ספריות.

### ✅ סיכום - כללי זהב

1. **Client-Side Dashboard** - כל הלוגיקה בדפדפן
2. **בנה קומפוננטות בעצמך** - אל תתקין ספריות גדולות
3. **Tailwind CSS** - מספיק לרוב הקומפוננטות
4. **Bundle קטן** - מהירות = bundle קטן
5. **Optimistic Updates** - תגובה מיידית
6. **Code Splitting** - טען רק מה שצריך

**זכור:** מהירות = חוויית משתמש טובה = לקוחות מרוצים! 🚀

---

## 📋 דרישות מערכת

- Node.js 18+ 
- PostgreSQL 14+
- npm / pnpm / yarn

---

## 🚀 התקנה והגדרה

### 1. שכפול הפרויקט

```bash
git clone https://github.com/your-org/quickshop3.git
cd quickshop3
```

### 2. התקנת תלויות

```bash
npm install
# או
pnpm install
```

### 3. הגדרת משתני סביבה

צור קובץ `.env` בשורש הפרויקט:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# Note: The system uses 'jose' library for JWT operations
# This ensures compatibility with both Edge Runtime (middleware) and Node.js Runtime (API routes)

# Redis (Upstash) - למעקב משתמשים מחוברים בזמן אמת
# הירשם חינם ב: https://upstash.com/
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# API
API_BASE_URL=http://localhost:3000/api
```

### 4. הגדרת מסד הנתונים

הפרויקט משתמש ב-**Neon PostgreSQL** עם `pg` (node-postgres) ישירות.

הרץ את קובץ ה-SQL ישירות:

```bash
psql -U your_user -d your_database -f sql/schema.sql
```

### 5. הרצת הפרויקט

```bash
npm run dev
```

האפליקציה תרוץ על `http://localhost:3099` (פורט קבוע)

---

## 📁 מבנה הפרויקט

```
quickshop3/
├── sql/
│   └── schema.sql             # סכמת PostgreSQL המלאה (Neon)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/       # דשבורד מוגן
│   │   │   ├── orders/        # מודול הזמנות
│   │   │   ├── products/      # מודול מוצרים
│   │   │   ├── customers/     # מודול לקוחות
│   │   │   ├── analytics/     # מודול אנליטיקס
│   │   │   ├── marketing/     # מודול שיווק
│   │   │   ├── settings/      # מודול הגדרות
│   │   │   └── ...
│   │   └── api/               # API Routes
│   │       ├── orders/
│   │       ├── products/
│   │       ├── customers/
│   │       └── ...
│   ├── components/            # קומפוננטות UI
│   │   ├── ui/                # קומפוננטות בסיסיות
│   │   └── modules/           # קומפוננטות מודולריות
│   ├── hooks/                 # React Hooks
│   ├── lib/                   # ספריות וכלי עזר
│   ├── utils/                 # פונקציות עזר
│   └── types/                 # TypeScript Types
├── .env.example
├── package.json
└── README.md
```

---

## 🗄️ סכמת מסד נתונים

הסכמה מבוססת על **Shopify Admin API** ומתוכננת להיות תואמת למבנה ה-JSON של Shopify, מה שמאפשר אינטגרציה קלה ומעבר חלק בין המערכות.

### 🎯 עקרונות התכנון

1. **תאימות ל-Shopify API** - כל טבלה תואמת למבנה ה-JSON של Shopify
2. **Multi-Store SaaS** - תמיכה מלאה בחנויות מרובות
3. **גמישות והרחבה** - Meta Fields, JSONB, ומבנה מודולרי
4. **ביצועים** - אינדקסים מותאמים לכל טבלה

### 📊 מבנה הטבלאות (בהתבסס על Shopify API)

#### 1. **Authentication & Multi-Store Base**

- **store_owners** - בעלי חנויות (משתמשים ראשיים)
- **stores** - חנויות (תואם ל-Shopify Shop object)
  - `myshopify_domain` - פורמט דומיין כמו Shopify
  - `currency`, `locale`, `timezone` - הגדרות אזוריות
  - `plan` - תוכנית מנוי

#### 2. **Products (תואם ל-Shopify Products API)**

> ⚠️ **חשוב מאוד - מבנה המוצרים:**
> 
> **כל מוצר חייב להיות עם לפחות variant אחד (Default Variant), גם אם אין לו אפשרויות!**
> 
> זהו עקרון יסוד במערכת, בדיוק כמו ב-Shopify:
> - מוצר **בלי אפשרויות** (כמו ספר או מוצר פשוט) = מוצר עם **variant אחד** בשם "Default Title"
> - מוצר **עם אפשרויות** (כמו מידות/צבעים) = מוצר עם **מספר variants** בהתאם לשילובי האפשרויות
> 
> **למה זה חשוב?**
> - המחיר, SKU, ומלאי נשמרים ב-`product_variants` ולא ב-`products`
> - המלאי (`inventory_quantity`) נשמר ב-`variant_inventory` ולא ב-`product_variants`
> - כל פעולה על מוצר (יצירה, עדכון, עגלה, הזמנה) עובדת דרך variants
> - זה מבטיח עקביות במערכת וקלות תחזוקה
> 
> **בקוד:**
> - בעת יצירת מוצר בלי variants, המערכת יוצרת אוטומטית variant ברירת מחדל
> - כל API endpoint שמטפל במוצרים צריך לקחת בחשבון את המבנה הזה
> - בעת בניית עגלת קניות, יש לעבוד עם `variant_id` ולא רק `product_id`

- **products** - מוצרים (תואם ל-Product object)
  - `handle` - URL-friendly identifier
  - `status` - draft, active, archived
  - `body_html` - תיאור HTML
  - `vendor`, `product_type` - מיון וסיווג
  
- **product_images** - תמונות מוצר (תואם ל-Product Image)
  - `position` - סדר תצוגה
  - `src`, `alt` - נתוני תמונה
  
- **product_collections** - אוספי מוצרים (תואם ל-Collection)
  - `handle` - URL-friendly
  - `published_scope` - web, global
  - `sort_order` - manual, best-selling, etc.
  
- **product_tags** - תגיות מוצרים
- **product_tag_map** - מיפוי מוצרים לתגיות (Many-to-Many)
- **product_collection_map** - מיפוי מוצרים לאוספים (Many-to-Many)

- **product_options** - אפשרויות מוצר (Size, Color, etc.)
- **product_option_values** - ערכי אפשרויות

- **product_variants** - וריאציות מוצר (תואם ל-Variant object)
  - **חובה:** כל מוצר חייב להיות עם לפחות variant אחד
  - `price`, `compare_at_price` - מחירים (נשמרים כאן, לא ב-products!)
  - `sku`, `barcode` - זיהוי
  - `option1`, `option2`, `option3` - ערכי אפשרויות
  - `inventory_policy` - deny, continue
  - `requires_shipping`, `taxable` - הגדרות
  - **לא כולל `inventory_quantity`** - המלאי נשמר ב-`variant_inventory`!
  
- **variant_inventory** - מלאי וריאציות (תואם ל-Inventory Level)
  - `variant_id` - קישור ל-variant (חובה!)
  - `available` - כמות זמינה (כאן נשמר המלאי!)
  - `committed` - שמורה להזמנות
  - `location_id` - תמיכה במיקומי מחסן מרובים
  - **אין UNIQUE constraint על `variant_id`** - צריך לבדוק קיום לפני INSERT/UPDATE
  
- **product_meta_fields** - שדות מטא מותאמים (תואם ל-Metafield)
  - `namespace`, `key`, `value` - מבנה גמיש
  - `value_type` - string, integer, json, etc.

#### 3. **Customers (תואם ל-Shopify Customers API)**

- **customers** - לקוחות (תואם ל-Customer object)
  - `accepts_marketing` - הסכמה שיווקית
  - `marketing_opt_in_level` - רמת הסכמה
  - `state` - enabled, disabled, invited
  - `verified_email` - אימייל מאומת
  - `tags` - תגיות לקוח
  
- **customer_addresses** - כתובות לקוחות (תואם ל-Customer Address)
  - `default_address` - כתובת ברירת מחדל
  - `province_code`, `country_code` - קודים סטנדרטיים
  
- **customer_notes** - הערות פנימיות
- **customer_tag_map** - מיפוי תגיות ללקוחות

#### 4. **Orders (תואם ל-Shopify Orders API)**

- **orders** - הזמנות (תואם ל-Order object)
  - `order_number`, `order_name` - מספר הזמנה (#1001)
  - `financial_status` - pending, paid, refunded, voided
  - `fulfillment_status` - fulfilled, partial, null
  - `total_price`, `subtotal_price`, `total_tax` - מחירים
  - `discount_codes` - קודי הנחה (JSONB)
  - `billing_address`, `shipping_address` - כתובות (JSONB)
  - `client_details` - פרטי לקוח (JSONB)
  - `note_attributes` - תכונות מותאמות (JSONB)
  
- **order_line_items** - פריטי הזמנה (תואם ל-Line Item)
  - `product_id`, `variant_id` - קישור למוצר/וריאציה (**חובה!** כל פריט חייב `variant_id`)
  - `title`, `variant_title` - שמות תצוגה
  - `quantity`, `price` - כמות ומחיר (המחיר נשמר כאן, לא ב-products)
  - `properties` - תכונות מותאמות (JSONB)
  - `tax_lines`, `discount_allocations` - מסים והנחות (JSONB)
  - **חשוב:** גם מוצר בלי אפשרויות חייב להיות עם `variant_id` (ה-default variant)
  
- **order_fulfillments** - ביצועי הזמנות (תואם ל-Fulfillment)
  - `status` - pending, success, cancelled
  - `tracking_number`, `tracking_url` - מעקב משלוח
  - `tracking_company` - חברת משלוחים
  - `line_items` - פריטים שבוצעו (JSONB)
  
- **order_refunds** - החזרים (תואם ל-Refund)
  - `refund_line_items` - פריטים שהוחזרו (JSONB)
  - `transactions` - טרנזקציות החזר (JSONB)

#### 5. **Transactions (תואם ל-Shopify Transactions API)**

- **transactions** - טרנזקציות תשלום
  - `kind` - sale, capture, authorization, void, refund
  - `status` - pending, success, failure
  - `gateway` - ספק תשלום
  - `authorization_code` - קוד הרשאה
  - `parent_id` - קישור לטרנזקציה מקורית (להחזרים)

#### 6. **Payment Providers**

- **payment_providers** - ספקי תשלום
  - `provider_name` - credit_card, paypal, etc.
  - `environment` - test, production
  - `settings` - הגדרות מותאמות (JSONB)

#### 7. **Shipping (תואם ל-Shopify Shipping Zones API)**

- **shipping_zones** - אזורי משלוח
  - `countries`, `provinces` - מערכים של קודים
  
- **shipping_rates** - תעריפי משלוח
  - `min_order_subtotal`, `max_order_subtotal` - הגבלות סכום
  - `min_weight`, `max_weight` - הגבלות משקל
  - `free_shipping_threshold` - משלוח חינם מעל סכום

#### 8. **Discounts (תואם ל-Shopify Discounts API)**

- **discount_codes** - קודי הנחה
  - `discount_type` - percentage, fixed_amount, free_shipping
  - `value` - ערך ההנחה
  - `minimum_order_amount` - סכום מינימום
  - `usage_limit`, `usage_count` - הגבלת שימוש
  - `applies_to` - all, specific_products, specific_collections
  - `starts_at`, `ends_at` - תקופת תוקף

#### 9. **Analytics**

- **analytics_events** - אירועי אנליטיקס
  - `event_type` - סוג אירוע
  - `metadata` - נתונים נוספים (JSONB)
  
- **analytics_daily** - סיכום יומי
  - `visits`, `unique_visitors` - ביקורים
  - `orders`, `revenue` - מכירות והכנסות
  - `top_products` - מוצרים מובילים (JSONB)

#### 10. **Webhooks (תואם ל-Shopify Webhooks API)**

- **webhook_subscriptions** - מנויי Webhooks
  - `topic` - orders/create, products/update, etc.
  - `address` - כתובת callback
  - `format` - json, xml
  - `fields` - שדות לכלול (מערך)
  - `api_version` - גרסת API
  
- **webhook_events** - תור אירועי Webhook
  - `payload` - נתוני האירוע (JSONB)
  - `status` - pending, sent, failed
  - `attempts` - מספר ניסיונות
  
- **webhook_delivery_attempts** - היסטוריית ניסיונות משלוח
  - `http_status` - קוד תגובה HTTP
  - `response_time_ms` - זמן תגובה
  - `error_message` - הודעת שגיאה

#### 11. **System Logs**

- **system_logs** - לוגים מערכתיים
  - `level` - info, warn, error, debug
  - `source` - api, webhook, billing, auth
  - `context` - הקשר נוסף (JSONB)
  
- **request_logs** - לוגי בקשות API (אופציונלי)
  - מעקב אחר כל קריאת API

#### 12. **Admin Users & Permissions**

- **admin_users** - משתמשי אדמין
  - `role` - owner, admin, staff, limited_staff
  - `permissions` - הרשאות מותאמות (JSONB)

#### 13. **Gift Cards (גיפט קארד)** ✨

- **gift_cards** - גיפט קארד
  - `code` - קוד גיפט קארד
  - `initial_value`, `current_value` - ערך התחלתי ונוכחי
  - `expires_at` - תאריך תפוגה
  
- **gift_card_transactions** - תנועות גיפט קארד
  - `transaction_type` - used, refunded, expired

#### 14. **Abandoned Carts (עגלות נטושות)** ✨

- **abandoned_carts** - עגלות נטושות
  - `cart_data` - נתוני העגלה (JSONB)
  - `abandoned_at`, `recovered_at` - תאריכי נטישה והחזרה
  - `token` - token ייחודי לעגלה

#### 15. **Wishlists (רשימת המתנה)** ✨

- **wishlists** - רשימות המתנה
  - `name` - שם הרשימה
  - `is_public` - האם ציבורית
  
- **wishlist_items** - פריטים ברשימת המתנה
  - `product_id`, `variant_id` - קישור למוצר/וריאציה
  - `quantity`, `note` - כמות והערה

#### 16. **Content Management (תוכן)** ✨

- **pages** - דפים
  - `handle` - URL-friendly identifier
  - `body_html` - תוכן HTML
  - `meta_title`, `meta_description` - SEO
  
- **navigation_menus** - תפריטי ניווט
  - `position` - header, footer, sidebar
  
- **navigation_menu_items** - פריטי תפריט
  - `type` - link, page, collection, product
  - `parent_id` - תמיכה בתפריטים היררכיים
  
- **blog_posts** - פוסטים בבלוג
  - `handle` - URL-friendly
  - `excerpt` - תקציר
  - `tags` - תגיות (מערך)
  
- **blog_categories** - קטגוריות בלוג
- **blog_post_categories** - מיפוי פוסטים לקטגוריות
  
- **popups** - פופאפים
  - `trigger_type` - time, scroll, exit_intent, page_load
  - `display_rules` - כללי תצוגה (JSONB)
  
- **media_files** - ספריית מדיה
  - `file_type` - image, video, document
  - `folder_path` - ארגון בתיקיות

#### 17. **Product Reviews (ביקורות)** ✨

- **product_reviews** - ביקורות מוצרים
  - `rating` - דירוג 1-5
  - `is_verified_purchase` - רכישה מאומתת
  - `is_approved`, `is_published` - אישור ופרסום
  - `helpful_count` - מספר "מועיל"
  
- **review_helpful_votes** - הצבעות "מועיל"

#### 18. **Store Credits (קרדיט בחנות)** ✨

- **store_credits** - קרדיט לקוחות
  - `balance` - יתרה
  - `expires_at` - תאריך תפוגה
  
- **store_credit_transactions** - תנועות קרדיט
  - `transaction_type` - earned, used, refunded, expired, manual_adjustment

#### 19. **Size Charts (טבלת מידות)** ✨

- **size_charts** - טבלאות מידות
  - `chart_type` - clothing, shoes, accessories
  - `chart_data` - נתוני הטבלה (JSONB)
  
- **product_size_chart_map** - מיפוי מוצרים לטבלאות

#### 20. **Product Addons (תוספות למוצרים)** ✨

- **product_addons** - תוספות למוצרים
  - `addon_type` - checkbox, radio, select, text_input, file_upload
  - `price_modifier` - תוספת/הנחה למחיר
  
- **product_addon_options** - אפשרויות תוספות
- **product_addon_map** - מיפוי מוצרים לתוספות
- **order_line_item_addons** - תוספות שנבחרו בהזמנה

#### 21. **Automations (אוטומציות)** ✨

- **automations** - אוטומציות
  - `trigger_type` - order.created, customer.created, cart.abandoned
  - `trigger_conditions` - תנאים נוספים (JSONB)
  - `actions` - פעולות לביצוע (JSONB)
  
- **automation_runs** - היסטוריית הרצות
  - `status` - pending, running, completed, failed

#### 22. **Tracking Pixels & Codes (פיקסלים וקודי מעקב)** ✨

- **tracking_pixels** - פיקסלי מעקב
  - `pixel_type` - facebook, google_analytics, tiktok, custom
  - `placement` - head, body, footer
  
- **tracking_codes** - קודי מעקב מותאמים
  - `code_type` - script, noscript, custom_html

#### 23. **Loyalty Program (מועדון לקוחות ונקודות)** ✨

- **customer_loyalty_tiers** - רמות מועדון
  - `tier_level` - 1, 2, 3, וכו'
  - `min_points` - נקודות מינימום לרמה
  - `discount_percentage` - הנחה לרמה זו
  - `benefits` - הטבות נוספות (JSONB)
  
- **customer_loyalty_points** - נקודות לקוח
  - `total_points` - סה"כ נקודות
  - `available_points` - נקודות זמינות לשימוש
  - `pending_points` - נקודות ממתינות
  - `tier_id` - רמה נוכחית
  
- **loyalty_point_transactions** - תנועות נקודות
  - `transaction_type` - earned, redeemed, expired, manual_adjustment, refunded
  - `points` - חיובי = צבירה, שלילי = שימוש
  
- **loyalty_program_rules** - חוקי צבירת נקודות
  - `rule_type` - purchase, signup, review, referral
  - `points_amount` - כמות נקודות
  - `conditions` - תנאים נוספים (JSONB)

#### 24. **Integrations (אינטגרציות)** ✨

- **integrations** - אינטגרציות
  - `integration_type` - email_marketing, crm, accounting, shipping
  - `provider_name` - mailchimp, hubspot, quickbooks
  - `credentials` - API keys, tokens (JSONB)
  - `settings` - הגדרות מותאמות (JSONB)
  - `last_sync_at`, `sync_status` - סטטוס סנכרון

#### 25. **Traffic Sources (מקורות תנועה)** ✨

- **traffic_sources** - מקורות תנועה
  - `source_type` - organic, paid, direct, referral, social, email
  - `source_name` - google, facebook, email_campaign
  - `medium` - cpc, organic, email
  - `campaign`, `term` - קמפיין ומילות מפתח
  - `referrer_url`, `landing_page` - מקור ונחיתה
  - `visit_count` - מספר ביקורים

#### 26. **Notifications (התראות)** ✨

- **notifications** - התראות למשתמשים
  - `notification_type` - order.new, inventory.low, customer.message
  - `title`, `message` - כותרת והודעה
  - `link_url` - קישור
  - `is_read` - האם נקרא
  - `metadata` - נתונים נוספים (JSONB)

#### 27. **Custom Order Statuses (סטטוסי הזמנות מותאמים)** ✨

- **custom_order_statuses** - סטטוסי הזמנות מותאמים
  - `status_type` - financial, fulfillment, custom
  - `color` - צבע לתצוגה
  - `is_default` - האם ברירת מחדל
  - `position` - סדר תצוגה

### 📋 רשימת טבלאות מלאה

| קטגוריה | טבלאות |
|---------|--------|
| **Base** | store_owners, stores, admin_users |
| **Products** | products, product_images, product_collections, product_tags, product_tag_map, product_collection_map, product_options, product_option_values, product_variants, variant_inventory, product_meta_fields, size_charts, product_size_chart_map, product_addons, product_addon_options, product_addon_map |
| **Customers** | customers, customer_addresses, customer_notes, customer_tag_map, customer_loyalty_tiers, customer_loyalty_points, loyalty_point_transactions, loyalty_program_rules |
| **Orders** | orders, order_line_items, order_fulfillments, order_refunds, order_line_item_addons, custom_order_statuses |
| **Payments** | transactions, payment_providers, gift_cards, gift_card_transactions, store_credits, store_credit_transactions |
| **Shipping** | shipping_zones, shipping_rates |
| **Discounts** | discount_codes |
| **Marketing** | abandoned_carts, wishlists, wishlist_items |
| **Content** | pages, navigation_menus, navigation_menu_items, blog_posts, blog_categories, blog_post_categories, popups, media_files |
| **Reviews** | product_reviews, review_helpful_votes |
| **Analytics** | analytics_events, analytics_daily, traffic_sources |
| **Automations** | automations, automation_runs |
| **Webhooks** | webhook_subscriptions, webhook_events, webhook_delivery_attempts |
| **Tracking** | tracking_pixels, tracking_codes |
| **Integrations** | integrations |
| **System** | system_logs, request_logs, notifications |

### 🔗 קשרים עיקריים

```
store_owners (1) ──→ (N) stores
stores (1) ──→ (N) products
products (1) ──→ (N) product_variants
products (N) ──→ (N) product_collections
products (N) ──→ (N) product_tags
stores (1) ──→ (N) customers
customers (1) ──→ (N) customer_addresses
customers (1) ──→ (N) orders
orders (1) ──→ (N) order_line_items
orders (1) ──→ (N) order_fulfillments
orders (1) ──→ (N) transactions
orders (1) ──→ (N) order_refunds
```

### 📄 קבצי SQL

הסכמה המלאה נמצאת ב-`sql/schema.sql` וניתן להריץ אותה ישירות על PostgreSQL:

```bash
psql -U your_user -d your_database -f sql/schema.sql
```

### ✅ תכונות מרכזיות

- ✅ **תאימות מלאה ל-Shopify API** - כל טבלה תואמת למבנה JSON של Shopify
- ✅ **Multi-Store** - תמיכה מלאה בחנויות מרובות
- ✅ **JSONB** - שדות גמישים לנתונים דינמיים
- ✅ **Indexes** - אינדקסים מותאמים לביצועים
- ✅ **Foreign Keys** - שלמות נתונים עם CASCADE
- ✅ **Timestamps** - created_at, updated_at בכל טבלה
- ✅ **RTL Support** - תמיכה בעברית ואזורי זמן

### 🔍 איך לחקות את Shopify API?

כדי להבטיח תאימות מלאה ל-Shopify, חשוב להבין את המבנה שלהם:

#### 1. מבנה התגובה (חשוב! הופך ל-Shopify vibe)

Shopify מחזיר JSON מובנה, לדוגמה:

```json
{
  "order": {
    "id": 123456,
    "created_at": "2025-01-10T12:34:56",
    "financial_status": "paid",
    "fulfillment_status": "unfulfilled",
    "total_price": "5663.00",
    "currency": "ILS",
    "line_items": [
      { "id": 1, "title": "Product name", "quantity": 2, "sku": "A100" }
    ],
    "customer": { "id": 78910, "first_name": "Yogev", "last_name": "Avitan" }
  }
}
```

**✔ אתה צריך להחזיר בדיוק עץ JSON כזה גם אם אתה ב-Backend עצמאי**

#### 2. פרמטרים ל-List (ככה מדמים פילטרים כמו Shopify)

Shopify endpoints תומכים לרוב ב:

```
?status=paid
?created_at_min=2025-01-01
?limit=50
?page=2
```

**→ גם אתה תוסיף אותם ב-API העצמאי שלך כדי שזה ירגיש אותו דבר**

#### 3. פיצ'רים מועילים להדמיה

- `financial_status` - pending, paid, refunded, voided
- `fulfillment_status` - unfulfilled, fulfilled, partial
- `currency` - מטבע ברירת מחדל
- `created_at` timestamps - תאריכים בפורמט ISO
- `line_items` tree - מבנה היררכי של פריטים
- `bulk actions` - פעולות גורפות
- `slug` auto-generation and validation errors

#### 4. Shopify Formatter Utility

כדי להבטיח תאימות, השתמש ב-utility function:

```typescript
// src/lib/utils/shopifyFormatter.ts

// עטיפה לרשימה (list)
export const shopifyList = <T>(key: string, items: T[]) => {
  return {
    [key]: items,
  };
};

// עטיפה לאובייקט בודד (single)
export const shopifyItem = <T>(key: string, item: T) => {
  return {
    [key]: item,
  };
};

// שימוש:
// GET /api/orders → { "orders": [...] }
// GET /api/orders/:id → { "order": {...} }
```

---

## 🔌 API Documentation

### Authentication

```http
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/me
```

#### 🔐 Authentication System

המערכת משתמשת ב-**JWT (JSON Web Tokens)** לאימות משתמשים, עם ספריית **`jose`** לניהול טוקנים.

**למה `jose`?**
- ✅ **תאימות מלאה ל-Edge Runtime** - עובד ב-Next.js Middleware (Edge Runtime)
- ✅ **תאימות מלאה ל-Node.js Runtime** - עובד ב-API Routes (Node.js Runtime)
- ✅ **קוד אחיד** - אותה ספרייה בכל המקומות, ללא צורך ב-`jsonwebtoken`
- ✅ **תמיכה ב-Web Crypto API** - סטנדרטי ומהיר

**מבנה המערכת:**
```
┌─────────────────────────────────────────┐
│  Middleware (Edge Runtime)               │
│  - משתמש ב-jose (jwtVerify)             │
│  - בודק טוקן ומגן על routes             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  API Routes (Node.js Runtime)          │
│  - משתמש ב-jose (SignJWT, jwtVerify)   │
│  - יוצר ומאמת טוקנים                   │
└─────────────────────────────────────────┘
```

**קבצים רלוונטיים:**
- `src/lib/auth.ts` - פונקציות עזר לאימות (generateToken, verifyToken, clearSessionCookie)
- `src/lib/session-tracker.ts` - מעקב משתמשים מחוברים בזמן אמת עם Upstash Redis
- `src/middleware.ts` - Next.js Middleware להגנה על routes + עדכון פעילות משתמשים
- `src/app/api/auth/login/route.ts` - API route להתחברות
- `src/app/api/auth/register/route.ts` - API route להרשמה
- `src/app/api/auth/logout/route.ts` - API route להתנתקות
- `src/app/api/auth/me/route.ts` - API route לקבלת פרטי משתמש נוכחי
- `src/app/api/analytics/active-users/route.ts` - API route לספירת משתמשים מחוברים

**מעקב משתמשים מחוברים:**
המערכת משתמשת ב-**Upstash Redis** למעקב משתמשים מחוברים בזמן אמת:
- כל פעולה של משתמש מחובר מעדכנת את ה-session ב-Redis עם TTL של 10 דקות
- ניתן לספור משתמשים מחוברים דרך `/api/analytics/active-users`
- פתרון יעיל שלא מעמיס על PostgreSQL
- **חינמי** - Upstash מציע 10,000 commands/יום חינם

**אירועים:**
- `user.created` - כשמשתמש נרשם
- `user.logged_in` - כשמשתמש מתחבר
- `user.logged_out` - כשמשתמש מתנתק
- `store.created` - כשחנות נוצרת (בהרשמה)

### Orders | הזמנות

```http
GET    /api/orders?status=paid&limit=20&cursor=123
GET    /api/orders/:id
POST   /api/orders/:id/status
POST   /api/orders/:id/refund
```

**Response Format (Shopify-style):**

```json
{
  "orders": [
    {
      "id": 123456,
      "created_at": "2025-01-10T12:34:56",
      "financial_status": "paid",
      "fulfillment_status": "fulfilled",
      "total_price": "5663.00",
      "currency": "ILS",
      "line_items": [
        {
          "id": 1,
          "title": "Product name",
          "quantity": 2,
          "price": "100.00",
          "sku": "A100"
        }
      ],
      "customer": {
        "id": 78910,
        "first_name": "יוגב",
        "last_name": "אביטן",
        "email": "customer@example.com"
      }
    }
  ],
  "page_info": {
    "has_next_page": true,
    "cursor": "12345"
  }
}
```

### Products | מוצרים

```http
GET    /api/products?collection_id=1&limit=20
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/:id/variants
POST   /api/products/bulk
```

### Customers | לקוחות

```http
GET    /api/customers?limit=20&cursor=123
GET    /api/customers/:id
POST   /api/customers/:id/note
POST   /api/customers/:id/tag
POST   /api/customers/:id/task
```

### Analytics | אנליטיקס

```http
GET    /api/analytics/sales?start_date=2025-01-01&end_date=2025-01-31
GET    /api/analytics/visits
GET    /api/analytics/top-products?limit=10
```

### Payments | תשלומים

```http
GET    /api/payments/providers
POST   /api/payments/providers
PUT    /api/payments/providers/:id
```

### Shipping | משלוחים

```http
GET    /api/shipping/zones
POST   /api/shipping/zones
GET    /api/shipping/methods?zone_id=1
POST   /api/shipping/methods
```

### Discounts | הנחות

```http
GET    /api/discounts
POST   /api/discounts
PUT    /api/discounts/:id
DELETE /api/discounts/:id
```

### Webhooks | Webhooks

```http
GET    /api/webhooks/subscriptions
POST   /api/webhooks/subscriptions
DELETE /api/webhooks/subscriptions/:id
GET    /api/webhooks/events?status=pending
```

---

## 📦 מודולים ותכונות

### 🧾 Orders Module | מודול הזמנות

**תכונות:**
- ✅ רשימת הזמנות עם פילטרים
- ✅ פרטי הזמנה מלאים
- ✅ שינוי סטטוס הזמנה
- ✅ החזרים וביטולי תשלום
- ✅ שליחת קבלה/חשבונית
- ✅ רשימת פריטי הזמנה
- ✅ סימון הונאה/סיכון
- ✅ טיימליין הערות

**צ'קליסט מלא:** `src/app/(dashboard)/orders/README.md`

### 🛍️ Products Module | מודול מוצרים

**תכונות:**
- ✅ רשימת מוצרים
- ✅ יצירה ועריכה של מוצרים
- ✅ העלאת גלריית תמונות
- ✅ יצירת Slug אוטומטית
- ✅ וריאציות (מידה/צבע/מלאי)
- ✅ ניהול מלאי לכל וריאציה
- ✅ פעולות גורפות
- ✅ Collections ו-Tags
- ✅ Meta Fields מותאמים

**צ'קליסט מלא:** `src/app/(dashboard)/products/README.md`

### 👥 Customers Module | מודול לקוחות

**תכונות:**
- ✅ רשימת לקוחות
- ✅ כרטיס לקוח מפורט
- ✅ היסטוריית רכישות
- ✅ הערות, משימות ותגים
- ✅ כתובות מרובות
- ✅ רמות VIP

**צ'קליסט מלא:** `src/app/(dashboard)/customers/README.md`

### 📊 Analytics Module | מודול אנליטיקס

**תכונות:**
- ✅ דוחות מכירות
- ✅ מעקב ביקורים
- ✅ מוצרים מובילים
- ✅ גרפים ודוחות ויזואליים
- ✅ אירועים מבוססי JSONB

### 💳 Payments & Shipping Module | מודול תשלומים ומשלוחים

**תכונות:**
- ✅ ניהול ספקי תשלום
- ✅ הגדרות משלוח (אזורים, ערים, איסוף עצמי)
- ✅ חוקי משלוח מתקדמים
- ✅ משלוח חינם מעל סכום

### ⚙️ Settings Module | מודול הגדרות

**תכונות:**
- ✅ הגדרות חנות בסיסיות
- ✅ חיבורים (API keys, CDN)
- ✅ משתמשי אדמין והרשאות
- ✅ חיבור דומיין + SSL

### 🎯 Marketing Module | מודול שיווק

**תכונות:**
- ✅ קופונים והנחות
- ✅ מועדון לקוחות
- ✅ אוטומציות שיווק
- ✅ Cashback ונאמנות

---

## 🎯 Event-Driven Architecture | ארכיטקטורת אירועים

### 💡 הרעיון המרכזי

**מערכת האירועים היא הלב של Quickshop3** - כל פעולה במערכת יוצרת אירוע אחיד, לא משנה מאיפה היא באה (פרונט, דשבורד, API, או אוטומציה).

#### למה זה חשוב?

1. **אחידות** - אותו אירוע (`order.created`) הוא תמיד אותו אירוע, לא משנה אם ההזמנה נוצרה מהפרונט, מהדשבורד, או מ-API
2. **מודולריות** - כל מודול יכול להאזין לאירועים שהוא צריך, בלי לדעת על מודולים אחרים
3. **גמישות** - קל להוסיף פיצ'רים חדשים (שליחת מייל, הורדת מלאי, analytics) בלי לשנות קוד קיים
4. **מתועד** - כל אירוע מתועד ב-`analytics_events` ו-`system_logs`

### 🏗️ איך זה עובד?

```
┌─────────────────────────────────────────────────┐
│           Event Bus (מרכזי)                      │
│  כל אירוע עובר דרך כאן                           │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Inventory│  │  Email   │  │ Analytics│
│  Module  │  │  Module  │  │  Module  │
└──────────┘  └──────────┘  └──────────┘
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
            ┌──────────────┐
            │   Webhooks   │
            │   (External) │
            └──────────────┘
```

### 📋 רשימת אירועים במערכת

כל אירוע במערכת מוגדר בפורמט: `resource.action`

#### 🧾 Orders Events | אירועי הזמנות

| Event Topic | תיאור | מתי נשלח |
|------------|-------|----------|
| `order.created` | הזמנה נוצרה | כשנוצרת הזמנה חדשה (פרונט/דשבורד/API) |
| `order.updated` | הזמנה עודכנה | כשמשתנה סטטוס או פרטים בהזמנה |
| `order.paid` | הזמנה שולמה | כשהתשלום מתקבל |
| `order.cancelled` | הזמנה בוטלה | כשהזמנה מבוטלת |
| `order.fulfilled` | הזמנה בוצעה | כשהזמנה נשלחת ללקוח |
| `order.refunded` | החזר בוצע | כשמתבצע החזר כספי |

#### 🛍️ Products Events | אירועי מוצרים

| Event Topic | תיאור | מתי נשלח |
|------------|-------|----------|
| `product.created` | מוצר נוצר | כשנוצר מוצר חדש |
| `product.updated` | מוצר עודכן | כשמשתנים פרטי מוצר |
| `product.deleted` | מוצר נמחק | כשמוצר נמחק |
| `product.published` | מוצר פורסם | כשמוצר עובר מ-draft ל-active |
| `variant.created` | וריאציה נוצרה | כשנוצרת וריאציה חדשה |
| `variant.updated` | וריאציה עודכנה | כשמשתנים פרטי וריאציה |
| `inventory.updated` | מלאי עודכן | כשמשתנה כמות במלאי |

#### 👥 Customers Events | אירועי לקוחות

| Event Topic | תיאור | מתי נשלח |
|------------|-------|----------|
| `customer.created` | לקוח נוצר | כשנרשם לקוח חדש |
| `customer.updated` | לקוח עודכן | כשמשתנים פרטי לקוח |
| `customer.deleted` | לקוח נמחק | כשמתבצעת מחיקת לקוח |

#### 💳 Transactions Events | אירועי תשלומים

| Event Topic | תיאור | מתי נשלח |
|------------|-------|----------|
| `transaction.created` | טרנזקציה נוצרה | כשנוצרת טרנזקציה חדשה |
| `transaction.succeeded` | טרנזקציה הצליחה | כשתשלום מתקבל בהצלחה |
| `transaction.failed` | טרנזקציה נכשלה | כשתשלום נכשל |

### 🔧 איך מודולים מאזינים לאירועים?

כל מודול יכול להרשם לאירועים שהוא צריך:

#### דוגמה: Inventory Module מאזין ל-`order.created`

```typescript
// src/lib/events/inventoryListener.ts
import { EventBus } from '@/lib/events/eventBus';

EventBus.on('order.created', async (event) => {
  const { order } = event.payload;
  
  // הורדת מלאי לכל פריט בהזמנה
  for (const lineItem of order.line_items) {
    await updateInventory({
      variantId: lineItem.variant_id,
      quantity: -lineItem.quantity, // הורדה
      reason: 'order_created',
      orderId: order.id
    });
  }
});
```

#### דוגמה: Email Module מאזין ל-`order.paid`

```typescript
// src/lib/events/emailListener.ts
import { EventBus } from '@/lib/events/eventBus';

EventBus.on('order.paid', async (event) => {
  const { order } = event.payload;
  
  // שליחת מייל אישור הזמנה
  await sendEmail({
    to: order.email,
    template: 'order_confirmation',
    data: { order }
  });
});
```

#### דוגמה: Analytics Module מאזין לכל האירועים

```typescript
// src/lib/events/analyticsListener.ts
import { EventBus } from '@/lib/events/eventBus';

// האזנה לכל האירועים
EventBus.on('*', async (event) => {
  // שמירה ב-analytics_events
  await db.analytics_events.create({
    store_id: event.store_id,
    event_type: event.topic,
    metadata: event.payload
  });
});
```

### 💻 יישום Event Bus

#### Event Bus Implementation

```typescript
// src/lib/events/eventBus.ts
import { EventEmitter } from 'events';
import { db } from '@/lib/db';

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100); // תמיכה בהרבה listeners
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async emit(topic: string, payload: any, options?: {
    store_id: number;
    source?: string;
    user_id?: number;
  }) {
    const event = {
      topic,
      store_id: options?.store_id || 0,
      payload,
      source: options?.source || 'system',
      user_id: options?.user_id,
      timestamp: new Date()
    };

    // שמירה ב-analytics_events (תמיד)
    await db.analytics_events.create({
      data: {
        store_id: event.store_id,
        event_type: topic,
        metadata: payload
      }
    });

    // שמירה ב-system_logs
    await db.system_logs.create({
      data: {
        store_id: event.store_id,
        level: 'info',
        source: options?.source || 'event',
        message: `Event emitted: ${topic}`,
        context: { topic, payload }
      }
    });

    // שליחה לכל ה-listeners
    super.emit(topic, event);
    super.emit('*', event); // Wildcard listener
  }
}

export const eventBus = EventBus.getInstance();
```

#### שימוש ב-API Route

```typescript
// src/app/api/orders/route.ts
import { eventBus } from '@/lib/events/eventBus';
import { createOrder } from '@/lib/services/orders';

export async function POST(req: Request) {
  const body = await req.json();
  const storeId = getStoreIdFromRequest(req); // מה-token/header

  // יצירת הזמנה ב-DB
  const order = await createOrder({
    ...body,
    store_id: storeId
  });

  // פליטת אירוע - כל ה-listeners יקבלו את זה
  await eventBus.emit('order.created', {
    order: {
      id: order.id,
      order_number: order.order_number,
      total_price: order.total_price,
      email: order.email,
      line_items: order.line_items,
      // ... כל הפרטים
    }
  }, {
    store_id: storeId,
    source: 'api',
    user_id: getUserIdFromRequest(req)
  });

  return Response.json({ order });
}
```

#### הרשמת Listeners (באפליקציה)

```typescript
// src/lib/events/index.ts
// קובץ שמאתחל את כל ה-listeners

import { eventBus } from './eventBus';
import './listeners/inventoryListener';
import './listeners/emailListener';
import './listeners/analyticsListener';
import './listeners/webhookListener';

// כל ה-listeners נרשמים אוטומטית כשהקובץ נטען
```

### 🎬 Flow לדוגמה: יצירת הזמנה

```
1. לקוח יוצר הזמנה (Frontend)
   ↓
2. API Route: POST /api/orders
   ↓
3. Order Service יוצר הזמנה ב-DB
   ↓
4. EventBus.emit('order.created', { order, store_id })
   ↓
5. Event Bus שומר ב-analytics_events ו-system_logs
   ↓
6. כל ה-Listeners מקבלים את האירוע:
   ├─ Inventory Module → מוריד מלאי
   ├─ Email Module → שולח מייל אישור
   ├─ Analytics Module → מעדכן סטטיסטיקות
   └─ Webhook Module → יוצר webhook_events
```

**הערה חשובה:** אותו אירוע נשלח גם אם ההזמנה נוצרה מהדשבורד, מ-API, או מכל מקום אחר!

### 📦 מבנה Event Object

כל אירוע במערכת הוא אובייקט אחיד:

```typescript
interface Event {
  topic: string;           // 'order.created'
  store_id: number;        // ID של החנות
  payload: any;           // נתוני האירוע (JSON)
  source: string;          // 'api', 'dashboard', 'frontend', 'system'
  user_id?: number;       // ID של המשתמש שיצר את האירוע
  timestamp: Date;         // זמן יצירת האירוע
}
```

### 🗂️ מבנה קבצים מומלץ

```
src/
├── lib/
│   └── events/
│       ├── eventBus.ts          # Event Bus מרכזי
│       ├── eventEmitter.ts      # Event Emitter
│       └── listeners/
│           ├── inventoryListener.ts
│           ├── emailListener.ts
│           ├── analyticsListener.ts
│           └── webhookListener.ts
├── app/
│   └── api/
│       └── orders/
│           └── route.ts         # פולט אירועים
```

### ✅ חוקי זהב למערכת אירועים

1. **אחידות** - אותו אירוע תמיד באותו פורמט, לא משנה מאיפה הוא בא
2. **מתועד** - כל אירוע חייב להיות מתועד ב-`analytics_events`
3. **מודולרי** - כל מודול מאזין רק לאירועים שהוא צריך
4. **ללא תלות** - מודולים לא תלויים זה בזה, רק באירועים
5. **Idempotent** - כל Listener צריך להיות idempotent (אפשר להריץ אותו כמה פעמים)

---

## 🛡️ אכיפה והבטחת איכות - איך לוודא שהאפיון תמיד נשמר?

### 🎯 המטרה

לוודא שכל פיצ'ר, עמוד, ו-API Route עוקבים אחרי:
- ✅ Event-Driven Architecture
- ✅ תיעוד מלא ב-README
- ✅ מודולריות
- ✅ אחידות

### 📋 Checklist לפני כל Pull Request

**כל PR חייב לכלול:**

#### 1. ✅ תיעוד
- [ ] README של המודול עודכן עם הפיצ'ר החדש
- [ ] אם יש אירועים חדשים → הם מתועדים ב-README
- [ ] אם יש API endpoints חדשים → הם מתועדים ב-README

#### 2. ✅ אירועים
- [ ] כל פעולה משמעותית פולטת אירוע (`order.created`, `product.updated`, וכו')
- [ ] האירוע מתועד ב-README של המודול
- [ ] האירוע נשמר ב-`analytics_events`
- [ ] אם יש Listener חדש → הוא מתועד ב-README

#### 3. ✅ מבנה קוד
- [ ] הקוד נמצא בתיקייה הנכונה של המודול
- [ ] אין תלויות ישירות בין מודולים (רק דרך אירועים)
- [ ] כל API Route פולט אירועים מתאימים

#### 4. ✅ בדיקות
- [ ] יש בדיקות לאירועים החדשים
- [ ] יש בדיקות ל-Listeners החדשים

### 🔍 Code Review Guidelines

#### מה לבדוק בכל Review:

1. **האם יש אירוע?**
   ```typescript
   // ✅ טוב - פולט אירוע
   const order = await createOrder(data);
   await eventBus.emit('order.created', { order }, { store_id, source: 'api' });
   
   // ❌ רע - לא פולט אירוע
   const order = await createOrder(data);
   // איפה האירוע?!
   ```

2. **האם האירוע מתועד?**
   - בדוק את ה-README של המודול
   - האם האירוע החדש מופיע ב-"Events Emitted"?

3. **האם יש תלות ישירה בין מודולים?**
   ```typescript
   // ❌ רע - תלות ישירה
   import { updateInventory } from '@/modules/inventory';
   await updateInventory(variantId, -quantity);
   
   // ✅ טוב - דרך אירועים
   await eventBus.emit('order.created', { order });
   // Inventory Module מאזין לאירוע
   ```

4. **האם הקוד מודולרי?**
   - האם הקוד נמצא בתיקייה הנכונה?
   - האם הוא לא תלוי במודולים אחרים?

### 📝 Template ל-Pull Request

```markdown
## תיאור
[תיאור קצר של הפיצ'ר]

## מודול
- [ ] Orders
- [ ] Products
- [ ] Customers
- [ ] אחר: _____

## שינויים
- [ ] פיצ'ר חדש
- [ ] תיקון באג
- [ ] שיפור

## תיעוד
- [ ] README עודכן
- [ ] אירועים חדשים מתועדים
- [ ] API endpoints מתועדים

## אירועים
### Events Emitted
- [ ] `event.topic` - [תיאור]

### Events Listened
- [ ] `event.topic` - [מה קורה]

## בדיקות
- [ ] בדיקות יחידה נוספו
- [ ] בדיקות אינטגרציה נוספו
- [ ] בדיקות ידניות בוצעו
```

### 🧪 Testing Requirements

#### בדיקות חובה לכל אירוע:

```typescript
// tests/events/orderCreated.test.ts
describe('order.created event', () => {
  it('should emit event when order is created', async () => {
    const order = await createOrder(testData);
    
    expect(eventBus.emit).toHaveBeenCalledWith(
      'order.created',
      expect.objectContaining({ order }),
      expect.objectContaining({ store_id: expect.any(Number) })
    );
  });

  it('should save event to analytics_events', async () => {
    await createOrder(testData);
    
    const event = await db.analytics_events.findFirst({
      where: { event_type: 'order.created' }
    });
    
    expect(event).toBeTruthy();
  });

  it('should trigger inventory listener', async () => {
    await createOrder(testData);
    
    // בדיקה שה-Mock של inventory listener נקרא
    expect(mockInventoryListener).toHaveBeenCalled();
  });
});
```

### 🔧 Linting & Type Checking

#### ESLint Rules (מומלץ להוסיף)

```json
// .eslintrc.json
{
  "rules": {
    "no-direct-module-imports": "error", // אסור לייבא ממודולים אחרים ישירות
    "require-event-emission": "warn" // אזהרה אם אין eventBus.emit
  }
}
```

#### TypeScript Types (חובה)

```typescript
// src/lib/events/types.ts
export type EventTopic = 
  | 'order.created'
  | 'order.updated'
  | 'order.paid'
  | 'product.created'
  | 'product.updated'
  // ... כל האירועים

export interface EventPayload {
  'order.created': { order: Order };
  'order.updated': { order: Order; changes: Partial<Order> };
  'product.created': { product: Product };
  // ... כל ה-payloads
}

// שימוש:
eventBus.emit('order.created', payload); // Type-safe!
```

### 📚 Documentation Requirements

#### כל מודול חייב לכלול ב-README:

```markdown
## Events | אירועים

### Events Emitted | אירועים שנשלחים

| Event Topic | מתי נשלח | Payload | Source |
|------------|----------|---------|--------|
| `order.created` | כשנוצרת הזמנה | `{ order: {...} }` | api, dashboard, frontend |

### Events Listened | אירועים שמאזינים להם

| Event Topic | מה קורה | מתי |
|------------|---------|-----|
| `transaction.succeeded` | עדכון סטטוס | כשתשלום מצליח |
```

### 🚨 Automated Checks (CI/CD)

#### GitHub Actions / GitLab CI Example:

```yaml
# .github/workflows/quality-check.yml
name: Quality Check

on: [pull_request]

jobs:
  check-documentation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check README exists
        run: |
          # בדיקה שיש README בכל מודול
          find src/app -type d -name "*" | while read dir; do
            if [ -f "$dir/page.tsx" ] && [ ! -f "$dir/README.md" ]; then
              echo "❌ Missing README.md in $dir"
              exit 1
            fi
          done
      
  check-events:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check event emission
        run: |
          # בדיקה שכל API route פולט אירועים
          # (דורש script מותאם)
          npm run check:events
```

### 📋 Pre-Commit Hooks

#### Husky + lint-staged:

```json
// package.json
{
  "scripts": {
    "check:events": "node scripts/check-events.js",
    "check:docs": "node scripts/check-docs.js"
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "npm run check:events"
    ],
    "**/README.md": [
      "npm run check:docs"
    ]
  }
}
```

### 🎓 Training & Onboarding

#### כל מפתח חדש חייב:

1. **לקרוא את ה-README** - במיוחד החלק על Event-Driven Architecture
2. **לעבור על דוגמאות** - לראות איך מודולים קיימים עובדים
3. **לעשות PR ראשון עם Review** - מפתח ותיק בודק שהכל נכון

### 📊 Metrics & Monitoring

#### מעקב אחרי איכות:

```typescript
// scripts/quality-metrics.ts
// סקריפט שבודק:
// 1. כמה API routes פולטים אירועים?
// 2. כמה מודולים יש README?
// 3. כמה אירועים מתועדים?

const metrics = {
  apiRoutesWithEvents: 95, // 95% פולטים אירועים
  modulesWithReadme: 100, // 100% יש README
  documentedEvents: 98, // 98% מהאירועים מתועדים
};
```

### 🛠️ כלים מעשיים - Scripts לבדיקה אוטומטית

#### 1. Script לבדיקת README בכל מודול

```typescript
// scripts/check-docs.ts
import fs from 'fs';
import path from 'path';

const modulesDir = 'src/app/(dashboard)';
const modules = fs.readdirSync(modulesDir);

const missingReadme: string[] = [];

modules.forEach(module => {
  const modulePath = path.join(modulesDir, module);
  const readmePath = path.join(modulePath, 'README.md');
  
  if (fs.statSync(modulePath).isDirectory() && !fs.existsSync(readmePath)) {
    missingReadme.push(module);
  }
});

if (missingReadme.length > 0) {
  console.error('❌ Missing README.md in modules:');
  missingReadme.forEach(m => console.error(`  - ${m}`));
  process.exit(1);
}

console.log('✅ All modules have README.md');
```

#### 2. Script לבדיקת אירועים ב-API Routes

```typescript
// scripts/check-events.ts
import fs from 'fs';
import path from 'path';

const apiDir = 'src/app/api';
const routes = getAllRoutes(apiDir);

const routesWithoutEvents: string[] = [];

routes.forEach(route => {
  const content = fs.readFileSync(route, 'utf-8');
  
  // בדיקה אם יש eventBus.emit
  if (!content.includes('eventBus.emit') && 
      (content.includes('POST') || content.includes('PUT') || content.includes('DELETE'))) {
    routesWithoutEvents.push(route);
  }
});

if (routesWithoutEvents.length > 0) {
  console.error('❌ Routes without event emission:');
  routesWithoutEvents.forEach(r => console.error(`  - ${r}`));
  process.exit(1);
}

console.log('✅ All routes emit events');
```

#### 3. Script לבדיקת תיעוד אירועים ב-README

```typescript
// scripts/check-event-docs.ts
import fs from 'fs';
import path from 'path';

const modulesDir = 'src/app/(dashboard)';
const modules = fs.readdirSync(modulesDir);

const missingEventDocs: string[] = [];

modules.forEach(module => {
  const readmePath = path.join(modulesDir, module, 'README.md');
  
  if (!fs.existsSync(readmePath)) return;
  
  const content = fs.readFileSync(readmePath, 'utf-8');
  
  // בדיקה אם יש Events Emitted section
  if (content.includes('eventBus.emit') && !content.includes('Events Emitted')) {
    missingEventDocs.push(module);
  }
});

if (missingEventDocs.length > 0) {
  console.error('❌ Modules with events but no documentation:');
  missingEventDocs.forEach(m => console.error(`  - ${m}`));
  process.exit(1);
}

console.log('✅ All events are documented');
```

#### 4. Template ל-README של מודול חדש

```markdown
# [Module Name] Module – Feature Checklist
# מודול [שם מודול] – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [ ] Feature 1 | תכונה 1
- [ ] Feature 2 | תכונה 2

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source |
|------------|----------|---------|--------|
| `event.topic` | מתי | `{ data }` | api, dashboard |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי |
|------------|---------|-----|
| `event.topic` | מה קורה | מתי |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resource` | Get resource |
| POST | `/api/resource` | Create resource |
```

#### 5. Template ל-API Route חדש

```typescript
// src/app/api/[resource]/route.ts
import { eventBus } from '@/lib/events/eventBus';
import { getStoreIdFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  const storeId = getStoreIdFromRequest(req);
  const body = await req.json();

  // יצירה/עדכון ב-DB
  const resource = await createResource({ ...body, store_id: storeId });

  // ✅ חובה: פליטת אירוע
  await eventBus.emit('resource.created', {
    resource: {
      id: resource.id,
      // ... כל הפרטים
    }
  }, {
    store_id: storeId,
    source: 'api',
    user_id: getUserIdFromRequest(req)
  });

  return Response.json({ resource });
}
```

#### 6. הוספה ל-package.json

```json
{
  "scripts": {
    "check:docs": "ts-node scripts/check-docs.ts",
    "check:events": "ts-node scripts/check-events.ts",
    "check:event-docs": "ts-node scripts/check-event-docs.ts",
    "check:all": "npm run check:docs && npm run check:events && npm run check:event-docs",
    "pre-commit": "npm run check:all"
  }
}
```

### 📋 Quick Reference Card

הדפס והדבק ליד המחשב:

```
✅ CHECKLIST לפני כל PR:

□ README עודכן?
□ אירועים פולטים? (eventBus.emit)
□ אירועים מתועדים ב-README?
□ ללא תלויות ישירות בין מודולים?
□ בדיקות נוספו?
□ Type-safe?

🚫 אם משהו חסר → PR לא מתקבל!
```

### ✅ סיכום - Checklist מהיר

לפני כל PR, ודא:

- [ ] **README עודכן** - הפיצ'ר החדש מתועד
- [ ] **אירועים פולטים** - כל פעולה משמעותית פולטת אירוע
- [ ] **אירועים מתועדים** - כל אירוע ב-README
- [ ] **ללא תלויות ישירות** - מודולים לא תלויים זה בזה
- [ ] **בדיקות נוספו** - יש בדיקות לאירועים החדשים
- [ ] **Type-safe** - כל האירועים עם types

**זכור:** אם משהו לא עובר את ה-Checklist → ה-PR לא מתקבל! 🚫

### 🎯 התוצאה

עם הכלים והכללים האלה:

✅ **כל פיצ'ר חדש** - אוטומטית עוקב אחרי האפיון  
✅ **כל עמוד חדש** - אוטומטית מתועד  
✅ **כל API Route** - אוטומטית פולט אירועים  
✅ **כל מודול** - אוטומטית מודולרי ועצמאי  

**המערכת תמיד תישאר נקייה, מתועדת, ומודולרית!** 🎉

### 🔗 קשר ל-Webhooks

**Webhooks הם רק Listener חיצוני** - הם מקבלים את אותם אירועים שהמודולים הפנימיים מקבלים:

```
Event Bus
    │
    ├─→ Inventory Module (פנימי)
    ├─→ Email Module (פנימי)
    ├─→ Analytics Module (פנימי)
    └─→ Webhook Module (פנימי)
            │
            └─→ External Webhooks (חיצוני)
```

---

## 🔔 Webhooks

המערכת תומכת ב-Webhooks מלאים בסגנון Shopify. **Webhooks הם רק Listener חיצוני** למערכת האירועים:

### Event Topics (זהה לרשימת האירועים למעלה)

- `order.created` - הזמנה נוצרה
- `order.paid` - הזמנה שולמה
- `order.fulfilled` - הזמנה בוצעה
- `product.created` - מוצר נוצר
- `product.updated` - מוצר עודכן
- `customer.created` - לקוח נוצר
- `customer.updated` - לקוח עודכן

### הגדרת Webhook

```http
POST /api/webhooks/subscriptions
Content-Type: application/json

{
  "event_topic": "order.created",
  "callback_url": "https://your-app.com/webhook",
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "id": 123,
  "event_topic": "order.created",
  "payload": {
    "order": {
      "id": 123456,
      "total_price": "5663.00",
      ...
    }
  },
  "created_at": "2025-01-10T12:34:56"
}
```

---

## 📄 Pagination

המערכת משתמשת ב-**Cursor Pagination** (בסגנון Shopify) במקום pagination מסורתי:

### דוגמה לשימוש

```http
GET /api/orders?limit=20&cursor=12345
```

### Response Format

```json
{
  "orders": [...],
  "page_info": {
    "has_next_page": true,
    "cursor": "12345"
  }
}
```

### שימוש ב-cursor

```http
GET /api/orders?limit=20&cursor=12345
```

ה-`cursor` הוא ה-ID של הרשומה האחרונה שראית, או מוצפן ב-Base64.

---

## 📝 Logging

המערכת כוללת מערכת לוגים מלאה:

### System Logs

כל אירוע במערכת נרשם ב-`system_logs`:

```sql
INSERT INTO system_logs (store_id, level, source, message, context)
VALUES (1, 'error', 'webhook', 'Failed to deliver webhook', '{"webhook_event_id": 123}');
```

### Request Logs (אופציונלי)

ניתן להפעיל לוגים לכל קריאת API ב-`request_logs`.

---

## 🧩 מתודולוגיית פיתוח - איך לעבוד נכון כדי לא לשכוח פיצ'רים

### 🎯 הבעיה

איך לתכנן דשבורד שלם בלי לשכוח פיצ'רים?

**הפתרון:** עבודה עם מתודולוגיית פיתוח מסודרת + צ'קליסט קבוע + מבנה מודולרי.

---

### 1. 🧩 עבודה במודולים ולא בדפים גדולים

במקום מסך אחד ענק, המערכת מחולקת למודולים עצמאיים:

```
Dashboard Home
├── Orders Module
├── Products Module
├── Customers Module
├── Payments & Shipping Module
├── Analytics Module
├── Settings Module
└── Marketing Module (קופונים, מועדון לקוחות, אוטומציות)
```

**למה זה חשוב?**
- כל מודול הוא "מיני מערכת" שלא תלויה באחרים
- ככה לא שוכחים דברים, כי לכל מודול יש רשימת תכונות משלו
- קל יותר לתחזק ולפתח

---

### 2. ✅ צ'קליסט פיצ'רים לכל מודול (בסגנון Shopify)

כל מודול חייב README עם צ'קליסט מפורט של כל התכונות שהוא צריך לכלול.

#### 🧾 דוגמה: Orders Module

```
- [ ] רשימת הזמנות
- [ ] פילטרים (סטטוס, תאריך, סכום)
- [ ] פרטי הזמנה
- [ ] שינוי סטטוס
- [ ] החזר/פעולות תשלום
- [ ] שליחת קבלה/חשבונית
- [ ] רשימת פריטי הזמנה
- [ ] סימון הונאה/סיכון
- [ ] טיימליין הערות
```

#### 🛍️ דוגמה: Products Module

```
- [ ] רשימת מוצרים
- [ ] יצירה ועריכה של מוצרים
- [ ] העלאת גלריית תמונות
- [ ] יצירת Slug אוטומטית
- [ ] וריאציות (מידה/צבע/מלאי)
- [ ] ניהול מלאי לכל וריאציה
- [ ] פעולות גורפות
- [ ] Collections ו-Tags
- [ ] Meta Fields מותאמים
```

**כל מודול צריך README משלו** עם צ'קליסט דו-לשוני (עברית + אנגלית).

---

### 3. 📦 Documentation Driven Development (DDD)

**הכי חשוב:** שמירת פיצ'רים דרך תיעוד.

#### חוק הזהב:

1. **לא פותחים Endpoint אם אין לו README**
2. **כל Sprint מתחיל בבדיקה מה נשאר ב-README**
3. **כל יכולת חדשה שנזכרים בה נכנסת ל-README — לא לקוד ישר**
4. **ה-UI לא ממציא נתונים — רק מציג מה שמגיע מה-Backend**

#### איך זה עובד:

```
1. פתח קובץ README לכל מודול
2. כתוב שם כל יכולת שאתה אמור לבנות
3. כל פעם שאתה נזכר בפיצ'ר → אתה מוסיף רק ל-README של המודול שלו
4. לפני כל Sprint → בודקים מה נשאר ב-README
5. לא עוברים מודול עד שהוא "✅ completed"
```

#### דוגמה למבנה README של מודול:

```markdown
# Products Module – Feature Checklist
# מודול מוצרים – צ'קליסט תכונות

## Core Features | תכונות ליבה
- [ ] List products | רשימת מוצרים
- [ ] Create product | יצירת מוצר
- [ ] Edit product | עריכת מוצר
- [ ] Upload images gallery | העלאת גלריית תמונות
- [ ] Auto-generate unique slug | יצירת סלאג אוטומטי
- [ ] Variants (size/color/stock) | וריאציות (מידה/צבע/מלאי)
- [ ] Inventory per variant | מלאי לכל וריאציה
- [ ] Bulk actions | פעולות גורפות

## Events | אירועים
### Events Emitted | אירועים שנשלחים
- [ ] `product.created` - כשנוצר מוצר חדש
- [ ] `product.updated` - כשמוצר עודכן
- [ ] `product.deleted` - כשמוצר נמחק
- [ ] `product.published` - כשמוצר פורסם
- [ ] `variant.created` - כשנוצרה וריאציה
- [ ] `variant.updated` - כשעודכנה וריאציה
- [ ] `inventory.updated` - כשמלאי עודכן

### Events Listened | אירועים שמאזינים להם
- [ ] `order.created` → הורדת מלאי
- [ ] `order.cancelled` → החזרת מלאי
```

**ככה אתה לא צריך לזכור, אתה פשוט בודק את הקובץ.**

#### 📋 תיעוד אירועים במודול

**חשוב מאוד:** כל מודול חייב לתעד:

1. **אירועים שהוא פולט** - מתי ואיך הוא שולח אירועים
2. **אירועים שהוא מאזין להם** - איזה אירועים הוא צריך לקבל

**דוגמה ל-README של Orders Module:**

```markdown
# Orders Module – Feature Checklist

## Core Features
- [ ] List orders
- [ ] Create order
- [ ] Update order status
...

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload |
|------------|----------|---------|
| `order.created` | כשנוצרת הזמנה חדשה | `{ order: {...} }` |
| `order.updated` | כשהזמנה עודכנה | `{ order: {...}, changes: {...} }` |
| `order.paid` | כשהזמנה שולמה | `{ order: {...}, transaction: {...} }` |
| `order.cancelled` | כשהזמנה בוטלה | `{ order: {...}, reason: string }` |
| `order.fulfilled` | כשהזמנה בוצעה | `{ order: {...}, fulfillment: {...} }` |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי |
|------------|---------|-----|
| `transaction.succeeded` | עדכון `financial_status` ל-`paid` | כשתשלום מצליח |

**חוק:** כל אירוע חייב להיות מתועד ב-README של המודול!
```

---

### 4. 🧬 ארכיטקטורה שמכריחה סדר

לכל מודול יש תיקייה משלו עם מבנה קבוע:

```
src/app/(dashboard)/
├── orders/
│   ├── page.tsx          # UI ראשי
│   ├── [id]/
│   │   └── page.tsx      # דף פרטי הזמנה
│   ├── components/       # קומפוננטות של המודול
│   ├── hooks/            # React hooks
│   └── README.md         # צ'קליסט פיצ'רים
├── products/
│   ├── page.tsx
│   ├── components/
│   ├── hooks/
│   └── README.md
└── ...
```

**בכל מודול יש:**
- `page.tsx` - מסך UI ראשי
- `components/` - קומפוננטות UI קטנות
- `hooks/` - React hooks לקריאות API
- `README.md` - צ'קליסט פיצ'רים (חובה!)

---

### 5. 🧱 שימוש ב-Component Library

המערכת משתמשת בספריית קומפוננטות משותפת:

- **Tailwind CSS** - לעיצוב מהיר ועקבי
- **Next.js** - למבנה הפרויקט
- **קומפוננטות UI משותפות** - ב-`src/components/ui/`

**למה זה חשוב?**
- חוסך בנייה מאפס
- עקביות בעיצוב
- תמיכה ב-RTL/LTR

---

### 6. 🚀 עבודה בסבבים (Feature Sprints)

**אל תפתח הכל יחד, תפתח מודול–מודול:**

1. **Orders Sprint** - רק הזמנות, עד שזה מושלם
2. **Products Sprint** - רק מוצרים, עד שזה מושלם
3. **Customers Sprint** - רק לקוחות, עד שזה מושלם
4. **Payments & Shipping Sprint**
5. **Analytics Sprint**
6. **Settings Sprint**
7. **Marketing Sprint**

#### בכל Sprint:

1. ✅ בודקים מה נשאר ב-README של המודול
2. ✅ לא עוברים מודול עד שהוא "✅ completed"
3. ✅ כל פיצ'ר חדש שנזכרים בו → נוסף ל-README
4. ✅ רק אחרי שכל ה-README מסומן → עוברים למודול הבא

---

### 7. 📋 צ'קליסט גלובלי (תמיד לבדוק)

לפני סיום כל Sprint, ודא שהכל קיים:

```
✅ Multi-store support
✅ Consistent RTL/LTR layout handling
✅ API parity with Shopify-like endpoints
✅ Auth system + permissions
✅ Error boundaries & logging
✅ Modular UI system
✅ External README per module
✅ Unified design system
```

---

### 🎯 סיכום המתודולוגיה

| שיטה | למה זה טוב |
|------|------------|
| **Modular architecture** | לא שוכחים פיצ'רים |
| **README checklist** | זיכרון חיצוני |
| **Client Side + API** | מתאים לדשבורד גדול |
| **Component Library** | חוסך בנייה מאפס |
| **Sprints** | מכריח סדר והשלמה |
| **Documentation Driven** | לא שוכחים כלום |

---

### 💡 טיפים חשובים

1. **תמיד התחל ב-README** - לפני שאתה כותב קוד, עדכן את הצ'קליסט
2. **אל תדלג על מודולים** - עבוד לפי הסדר, מודול אחר מודול
3. **בדוק את הצ'קליסט לפני כל commit** - ודא שסיימת את כל הפיצ'רים
4. **שמור על עקביות** - כל מודול צריך את אותו מבנה
5. **תיעוד הוא חלק מהקוד** - README הוא לא אופציונלי, הוא חובה

---

## 🎨 Design System

המערכת משתמשת ב-**Tailwind CSS** עם תמיכה מלאה ב-**RTL** (עברית).

### קומפוננטות UI

כל קומפוננטה נמצאת ב-`src/components/ui/` ומבוססת על:
- Tailwind CSS
- תמיכה ב-RTL/LTR
- עיצוב מותאם לסגנון Shopify

---

## 🔒 אבטחה

- **Authentication**: JWT / Session-based (using `jose` library for Edge Runtime compatibility)
- **Authorization**: Role-based permissions
- **API Security**: Rate limiting, CORS
- **Data Protection**: SQL injection prevention, XSS protection
- **Webhooks**: HMAC signatures

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

---

## 📚 משאבים נוספים

- [Shopify API Documentation](https://shopify.dev/docs/api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)

---

## 🤝 תרומה

תרומות מתקבלות בברכה! אנא פתח Issue או Pull Request.

---

## 📄 רישיון

MIT License

---

## 👥 צוות

פותח עם ❤️ על ידי צוות Quickshop3

---

## 📞 תמיכה

לשאלות ותמיכה:
- 📧 Email: support@quickshop3.com
- 💬 Discord: [קישור לשרת Discord]
- 📖 Documentation: [קישור לתיעוד]

---

## 🎯 שימוש ב-Cursor לפיתוח המערכת

### 💡 מודל מומלץ: **Composer**

לפיתוח מערכת SaaS מורכבת כמו Quickshop3, מומלץ להשתמש ב-**Composer Mode** של Cursor.

#### למה Composer?

1. **עבודה עם קבצים מרובים** - Composer יכול לעבוד עם מספר קבצים בו-זמנית
2. **שינויים גדולים ומסודרים** - מושלם לבניית מודולים שלמים
3. **תכנון מראש** - יכול לתכנן ולבצע שינויים מורכבים
4. **קונטקסט רחב** - מבין את הקשרים בין קבצים שונים

### 🚀 מתי להשתמש בכל מודל?

#### Composer Mode - מומלץ ל:

- ✅ בניית מודול חדש מהתחלה (Orders, Products, וכו')
- ✅ יצירת מבנה תיקיות חדש
- ✅ שינויים שדורשים עדכון של מספר קבצים
- ✅ יצירת API Routes + Services + Types יחד
- ✅ בניית Event Listeners + Handlers
- ✅ יצירת קומפוננטות UI מורכבות

**דוגמה לשימוש:**
```
"בנה לי את מודול Orders המלא:
- API Routes (GET, POST, PUT)
- Service layer עם פילטרים
- Event emission (order.created, order.updated)
- Types TypeScript
- README עם צ'קליסט"
```

#### Chat Mode - מומלץ ל:

- ✅ שאלות ותמיכה
- ✅ שינויים קטנים בקובץ אחד
- ✅ תיקון באגים
- ✅ הסברים על קוד קיים
- ✅ שיפורים נקודתיים

**דוגמה לשימוש:**
```
"תקן את הבאג ב-orderService.ts בשורה 45"
```

### 📋 Workflow מומלץ לפיתוח מודול חדש

#### שלב 1: תכנון (Chat Mode)

```
"אני רוצה לבנות מודול Products. תסביר לי מה צריך לכלול לפי ה-README"
```

#### שלב 2: יצירת מבנה (Composer Mode)

```
"צור לי את המבנה הבסיסי של מודול Products:
- src/app/api/products/route.ts
- src/lib/services/productsService.ts
- src/lib/types/products.ts
- src/app/(dashboard)/products/page.tsx
- src/app/(dashboard)/products/README.md"
```

#### שלב 3: בניית Backend (Composer Mode)

```
"בנה לי את ה-API Routes של Products:
- GET /api/products (עם פילטרים)
- GET /api/products/:id
- POST /api/products (עם event emission)
- PUT /api/products/:id
- DELETE /api/products/:id

כל route צריך:
- Validation
- Error handling
- Shopify-style response
- Event emission מתאים"
```

#### שלב 4: בניית Frontend (Composer Mode)

```
"בנה לי את דף Products בדשבורד:
- רשימת מוצרים עם טבלה
- פילטרים (status, collection, search)
- כפתור יצירת מוצר חדש
- עריכה ומחיקה
- תמיכה ב-RTL"
```

#### שלב 5: בדיקות ותיקונים (Chat Mode)

```
"תקן את הבאג בטבלת המוצרים - הפילטרים לא עובדים"
```

### 🎨 טיפים לשימוש יעיל ב-Cursor

#### 1. **השתמש ב-@ Mentions**

```
@README.md - "תסביר לי את המתודולוגיה"
@sql/schema.sql - "תראה לי את מבנה הטבלאות"
@src/lib/events/eventBus.ts - "איך אני משתמש ב-Event Bus?"
```

#### 2. **תן קונטקסט מלא**

במקום:
```
"בנה לי API route"
```

תגיד:
```
"בנה לי API route ל-Orders לפי המתודולוגיה ב-README:
- צריך לפלוט event 'order.created'
- צריך להחזיר Shopify-style JSON
- צריך validation ו-error handling
- צריך לתמוך ב-cursor pagination"
```

#### 3. **עבוד מודול אחר מודול**

אל תבקש הכל בבת אחת:
```
❌ "בנה לי את כל המערכת"
✅ "בנה לי את מודול Orders קודם, אחר כך Products"
```

#### 4. **השתמש ב-Composer לקבצים קשורים**

```
"בנה לי את מודול Orders:
- API Route
- Service
- Types
- Event Listeners
- UI Components

כל הקבצים צריכים להיות קשורים ולתמוך זה בזה"
```

#### 5. **בדוק את התוצאה**

לאחר כל שינוי גדול:
```
"בדוק שהקוד עוקב אחרי:
- Event-Driven Architecture
- תיעוד ב-README
- Type safety
- Error handling"
```

### 🔧 הגדרות מומלצות ב-Cursor

1. **Enable Composer** - ודא ש-Composer מופעל
2. **Context Window** - הגדר context window גדול (אם אפשר)
3. **Auto-save** - הפעל auto-save
4. **Git Integration** - השתמש ב-Git integration לבדיקת שינויים

### 📝 דוגמאות פקודות מומלצות

#### בניית מודול מלא:

```
"בנה לי את מודול Customers המלא לפי המתודולוגיה:
1. API Routes (CRUD)
2. Service layer עם פילטרים
3. Event emission (customer.created, customer.updated)
4. Types TypeScript
5. UI Dashboard (רשימה + פרטים)
6. README עם צ'קליסט

ודא שכל הקבצים:
- עוקבים אחרי Event-Driven Architecture
- מתועדים ב-README
- Type-safe
- תומכים ב-RTL"
```

#### יצירת Event Listener:

```
"צור לי Event Listener ל-Inventory Module:
- מאזין ל-'order.created'
- מוריד מלאי לכל פריט
- שומר ב-variant_inventory
- מטפל בשגיאות
- מתועד ב-README"
```

#### יצירת קומפוננטה UI:

```
"צור לי קומפוננטת OrderTable:
- טבלה עם רשימת הזמנות
- פילטרים (status, date range)
- Cursor pagination
- תמיכה ב-RTL
- Tailwind CSS
- Loading states
- Error handling"
```

### ✅ Checklist לפני כל Composer Session

- [ ] קראתי את ה-README של המודול
- [ ] הבנתי מה צריך לבנות
- [ ] יש לי קונטקסט על הקבצים הקיימים
- [ ] אני יודע איזה אירועים צריך לפלוט
- [ ] אני יודע איך זה צריך להתחבר למודולים אחרים

### 🎯 סיכום

**לפיתוח Quickshop3, השתמש ב-Composer Mode** כי:

1. ✅ המערכת מורכבת ומודולרית
2. ✅ כל מודול דורש מספר קבצים
3. ✅ צריך תאימות בין קבצים שונים
4. ✅ צריך לעקוב אחרי מתודולוגיה מסוימת

**Composer Mode** הוא הכלי הנכון לבניית מערכת כזאת בצורה מסודרת ויעילה! 🚀

---

## 🎨 Design System & Visual Guidelines

למסמך האפיון הוויזואלי המלא של הדשבורד, ראה: **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**

המסמך כולל:
- ✅ מבנה כללי של הדשבורד
- ✅ ערכת צבעים מלאה
- ✅ טיפוגרפיה
- ✅ Sidebar Navigation
- ✅ Top Header
- ✅ Tables, Cards, Buttons
- ✅ RTL Support
- ✅ Responsive Design
- ✅ Component Examples

### 📊 DataTable Component - קומפוננטת טבלה אחידה

**Quickshop3** כולל קומפוננטת `DataTable` מקצועית ואחידה לכל הטבלאות במערכת.

**מסמך מלא:** [DATATABLE_GUIDE.md](./DATATABLE_GUIDE.md)

#### תכונות עיקריות:

```tsx
import { DataTable } from '@/components/ui/DataTable';

<DataTable
  // Header
  title="הזמנות"
  description="נהל ועקוב אחר כל ההזמנות שלך"
  
  // Actions (משולבים בתוך ה-Card!)
  primaryAction={{ label: '+ הזמנה חדשה', onClick: handleCreate }}
  secondaryActions={[{ label: 'ייצוא', onClick: handleExport }]}
  
  // Search & Filters (משולבים בתוך ה-Card!)
  searchPlaceholder="חיפוש הזמנות..."
  onSearch={handleSearch}
  filters={[
    { type: 'select', options: [...], onChange: handleFilter }
  ]}
  
  // Table
  columns={columns}
  data={orders}
  keyExtractor={(o) => o.id}
  
  // Selection
  selectable
  selectedItems={selectedOrders}
  onSelectionChange={setSelectedOrders}
  
  // Row Actions
  rowActions={(order) => <ActionButtons order={order} />}
/>
```

#### 🎯 עיצוב מאוחד

הקומפוננטה מספקת מבנה אחיד עם:
- ✅ **חיפוש, כפתורים ופילטרים משולבים בתוך Card** (מעל הטבלה)
- ✅ מפריד ויזואלי ברור בין בר הפילטרים לטבלה
- ✅ עיצוב עקבי ומקצועי בכל העמודים
- ✅ תמיכה מלאה ב-RTL
- ✅ Responsive design
- ✅ בחירה מרובה (checkboxes)
- ✅ Loading states
- ✅ Empty states מותאמים אישית

#### 📝 חובה להשתמש!

**כל טבלה חדשה במערכת חייבת להשתמש ב-DataTable** כדי לשמור על עקביות ומקצועיות.

**לדוגמאות מלאות ו-API Reference:** [DATATABLE_GUIDE.md](./DATATABLE_GUIDE.md)

---

## 🧮 מנוע חישוב הנחות וקופונים - המנוע המרכזי

**מנוע החישוב המרכזי** הוא הלב של מערכת ההנחות והקופונים. זהו **Single Source of Truth** לכל החישובים במערכת.

### ✨ תכונות עיקריות

- ✅ **מקום אחד שמחשב הכל** - כל חישוב עובר דרך המנוע הזה
- ✅ **עקביות מוחלטת** - אותו חישוב בכל מקום (עגלה, צ'ק אאוט, עגלת צד)
- ✅ **סדר פעולות נכון** - הנחות מחושבות בסדר הנכון
- ✅ **תמיכה בכל סוגי ההנחות** - קופונים (percentage, fixed_amount, free_shipping)
- ✅ **בדיקות תקינות מלאות** - תוקף, שימוש, סכום מינימום

### 📊 סדר פעולות החישוב

1. **Subtotal בסיסי** - סכום כל הפריטים לפני הנחות
2. **הנחות על פריטים** - קופונים שפועלים על פריטים
3. **Subtotal אחרי הנחות** - Subtotal - הנחות
4. **משלוח** - מחיר משלוח (אם יש)
5. **הנחה על משלוח** - משלוח חינם (אם יש קופון או סף)
6. **סה"כ סופי** - Subtotal אחרי הנחות + משלוח אחרי הנחה

### 🎯 שימוש

```tsx
import { useCartCalculator } from '@/hooks/useCartCalculator';
import { CartSummary } from '@/components/storefront/CartSummary';

// Hook
const { getTotal, getDiscount, applyDiscountCode } = useCartCalculator({
  storeId: 1,
  shippingRate: { id: 1, name: 'משלוח', price: 30, free_shipping_threshold: 200 },
  autoCalculate: true,
});

// Component מוכן
<CartSummary storeId={1} onCheckout={handleCheckout} />
```

### 📚 תיעוד מלא

📖 **[תיעוד מפורט של מנוע החישוב →](./src/lib/services/CART_CALCULATOR.md)**  
📋 **[רשימת כל סוגי ההנחות →](./src/lib/services/DISCOUNT_TYPES.md)**  
✅ **[Checklist סוגי הנחות →](./src/lib/services/DISCOUNT_CHECKLIST.md)**

### ⚠️ כללי זהב

- ✅ **תמיד השתמש במנוע החישוב** - אף פעם אל תחשב ידנית
- ✅ **השתמש ב-Hook** - `useCartCalculator` במקום שימוש ישיר
- ✅ **השתמש ב-CartSummary** - קומפוננטה מוכנה במקום לבנות בעצמך
- ❌ **אל תחשב ידנית** - לא `subtotal - discount` בקומפוננטה
- ❌ **אל תכפיל מחירים** - לא `price * quantity` ישירות

---

## 📤 מערכת העלאת קבצים - AWS S3 Integration

**Quickshop3** כולל מערכת העלאת קבצים מתקדמת עם תמיכה מלאה ב-**AWS S3**.

### 🎯 תכונות עיקריות

- ✅ **העלאה ל-AWS S3** - כל הקבצים נשמרים ב-S3
- ✅ **אופטימיזציה אוטומטית** - תמונות מומרות ל-WebP
- ✅ **מבנה נתיבים מסודר** - `shops/{shopSlug}/{entityType}/{identifier}/{fileName}`
- ✅ **תמיכה בקבצים מרובים** - העלאה מרובת קבצים
- ✅ **MediaPicker Component** - קומפוננטה מוכנה לשימוש
- ✅ **גודל מקסימלי** - עד 25MB לקובץ

### 📁 מבנה נתיבים ב-S3

```
shops/
  └── {shopSlug}/
      ├── products/
      │   └── {productId}/
      │       └── {timestamp}-{fileName}.webp
      ├── collections/
      │   └── {collectionId}/
      │       └── {timestamp}-{fileName}.webp
      ├── logo/
      │   └── {timestamp}-{fileName}.webp
      ├── favicon/
      │   └── {timestamp}-{fileName}.webp
      └── media/
          └── {shopId}/
              └── {timestamp}-{fileName}.webp
```

### 🔧 API Endpoint

#### POST `/api/files/upload`

העלאת קובץ ל-AWS S3.

**Request:**
```typescript
FormData {
  file: File;              // הקובץ להעלאה
  entityType: string;      // 'products', 'collections', 'media', 'stores'
  entityId: string;        // ID של ה-entity או 'new'
  shopId: string;          // מזהה החנות (חובה עבור entities חדשים)
  storeId?: string;        // שם חלופי ל-shopId
  fileType?: string;       // 'logo', 'favicon', 'builders' (עבור stores)
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-1234567890",
    "name": "image.webp",
    "path": "https://bucket.s3.region.amazonaws.com/shops/shop-slug/products/123/1234567890-image.webp",
    "size": 123456,
    "mimeType": "image/webp",
    "createdAt": "2025-01-10T12:34:56.789Z"
  }
}
```

### 🎨 שימוש ב-Components

#### MediaPicker Component

קומפוננטה מוכנה לבחירת תמונות מהספרייה או העלאת תמונות חדשות:

```tsx
import { MediaPicker } from '@/components/MediaPicker';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        בחר תמונות
      </Button>
      
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        onSelect={(files) => {
          setSelectedFiles(files);
          console.log('Selected files:', files);
        }}
        selectedFiles={selectedFiles}
        shopId="1"
        entityType="products"
        entityId="123"
        multiple={true}
        title="בחר תמונות למוצר"
      />
    </>
  );
}
```

#### ImageGallery Component

קומפוננטה להצגת גלריית תמונות עם drag & drop:

```tsx
import { ImageGallery } from '@/components/products/ImageGallery';

function ProductForm({ productId, shopId }) {
  const [images, setImages] = useState<ProductImage[]>([]);

  return (
    <ImageGallery
      images={images}
      onImagesChange={setImages}
      productId={productId}
      shopId={shopId}
    />
  );
}
```

### ⚙️ הגדרת AWS S3

#### משתני סביבה נדרשים

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

#### הגדרת Bucket

1. צור S3 Bucket ב-AWS Console
2. הגדר CORS (אם צריך גישה מהדפדפן):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

3. הגדר Bucket Policy (אם צריך גישה ציבורית):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### 🔄 תהליך העלאה

```
1. משתמש בוחר קובץ
   ↓
2. Frontend שולח FormData ל-/api/files/upload
   ↓
3. Server ממיר תמונה ל-WebP (אם רלוונטי)
   ↓
4. Server יוצר S3 Key לפי מבנה הנתיבים
   ↓
5. Server מעלה ל-AWS S3
   ↓
6. Server מחזיר URL של הקובץ
   ↓
7. Frontend מעדכן את ה-UI עם ה-URL החדש
```

### 📝 אופטימיזציה

- **תמונות** - מומרות אוטומטית ל-WebP עם איכות 85%
- **וידאו** - נשמר בפורמט המקורי
- **קבצים אחרים** - נשמרים בפורמט המקורי

### 🛡️ אבטחה

- ✅ בדיקת גודל קובץ (מקסימום 25MB)
- ✅ בדיקת סוג קובץ
- ✅ בדיקת הרשאות (shopId חובה)
- ✅ Sanitization של שמות קבצים

### 📚 קבצים רלוונטיים

- `src/app/api/files/upload/route.ts` - API endpoint להעלאה
- `src/lib/s3.ts` - פונקציות עזר ל-S3
- `src/components/MediaPicker.tsx` - קומפוננטת בחירת מדיה
- `src/components/products/ImageGallery.tsx` - קומפוננטת גלריית תמונות

### ✅ דוגמאות שימוש

#### העלאת תמונת מוצר

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('entityType', 'products');
formData.append('entityId', '123');
formData.append('shopId', '1');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Uploaded file URL:', data.file.path);
```

#### העלאת לוגו חנות

```typescript
const formData = new FormData();
formData.append('file', logoFile);
formData.append('entityType', 'stores');
formData.append('entityId', '1');
formData.append('fileType', 'logo');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
});
```

---

<div dir="ltr">

**Made with ❤️ for the e-commerce community**

</div>
