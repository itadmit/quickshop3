# Storefront Module – חנות פומבית

## סקירה כללית

המודול Storefront הוא החנות הפומבית של הלקוחות - כל מה שהמנהל יצר בדשבורד מוצג כאן.

החנות בנויה בסגנון מודרני עם:
- ✅ **SSR לדפים סטטיים** - דף בית, מוצרים, קטגוריות
- ✅ **Server Actions לפעולות** - הוספה לסל, צ'ק אאוט
- ✅ **Client-Side לפעולות אינטראקטיביות** - עגלת קניות, עדכון כמות
- ✅ **מהירות** - כל פעולה מהירה ורספונסיבית

---

## מבנה הקבצים

```
src/app/(storefront)/
├── layout.tsx                    # Layout עם Header + Footer
├── page.tsx                      # דף בית (SSR)
├── products/
│   ├── page.tsx                 # רשימת כל המוצרים (SSR)
│   └── [handle]/page.tsx        # דף מוצר בודד (SSR)
├── collections/
│   ├── page.tsx                 # רשימת כל הקטגוריות (SSR)
│   └── [handle]/page.tsx        # דף קטגוריה (SSR)
├── cart/
│   └── page.tsx                 # עגלת קניות (Client-Side)
├── checkout/
│   ├── page.tsx                 # צ'ק אאוט (Client-Side)
│   └── success/page.tsx         # דף הצלחה
├── blog/
│   ├── page.tsx                 # רשימת פוסטים (SSR)
│   └── [handle]/page.tsx        # דף פוסט (SSR)
├── pages/
│   └── [handle]/page.tsx        # דפי תוכן (SSR)
└── actions/
    └── checkout.ts              # Server Action לצ'ק אאוט
```

---

## דפים

### 1. דף בית (`/`)
- **SSR** - טעינה מהשרת
- מוצרים מובילים
- קטגוריות
- Hero Section

### 2. רשימת מוצרים (`/products`)
- **SSR** - כל המוצרים הפעילים
- Grid layout
- תמונות ומחירים

### 3. דף מוצר (`/products/[handle]`)
- **SSR** - פרטי מוצר מלאים
- גלריית תמונות
- Variants
- הוספה לעגלה (Client-Side)

### 4. רשימת קטגוריות (`/collections`)
- **SSR** - כל הקטגוריות
- תמונות קטגוריות

### 5. דף קטגוריה (`/collections/[handle]`)
- **SSR** - מוצרים בקטגוריה
- Grid layout

### 6. עגלת קניות (`/cart`)
- **Client-Side** - ניהול עגלה
- עדכון כמות
- הסרת פריטים
- חישוב סה"כ

### 7. צ'ק אאוט (`/checkout`)
- **Client-Side** - טופס הזמנה
- **Server Action** - יצירת הזמנה
- פליטת אירוע `order.created`

### 8. דף הצלחה (`/checkout/success`)
- אישור הזמנה
- מספר הזמנה

### 9. בלוג (`/blog`)
- **SSR** - רשימת פוסטים
- דף פוסט (`/blog/[handle]`)

### 10. דפי תוכן (`/p/[handle]`)
- **SSR** - דפים סטטיים

---

## Components

### StorefrontHeader
- Header עם לוגו
- תפריט ניווט
- עגלת קניות (עם badge)
- תמיכה במובייל

### StorefrontFooter
- קישורים
- מידע על החנות

### ProductCard
- כרטיס מוצר
- תמונה, שם, מחיר
- Link לדף מוצר

### AddToCartButton
- כפתור הוספה לעגלה
- בחירת כמות
- Optimistic UI

---

## Hooks

### useCart
- ניהול עגלת קניות
- localStorage
- פונקציות: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- `getCartCount`, `getCartTotal`

---

## Server Actions

### createOrder
- יצירת הזמנה ב-DB
- יצירת לקוח (אם לא קיים)
- יצירת line items
- פליטת אירוע `order.created`

---

## אירועים

### Events Emitted

| Event Topic | מתי נשלח | Payload | Source |
|------------|----------|---------|--------|
| `order.created` | כשנוצרת הזמנה | `{ order: {...} }` | storefront |

---

## אופטימיזציות

### SSR לדפים סטטיים
- דף בית
- רשימת מוצרים
- דף מוצר
- קטגוריות
- בלוג ודפים

**למה SSR?**
- ✅ SEO טוב יותר
- ✅ טעינה מהירה יותר
- ✅ לא צריך API call נוסף

### Server Actions לפעולות
- הוספה לסל (Client-Side עם localStorage)
- צ'ק אאוט (Server Action)

**למה Server Action?**
- ✅ מהיר יותר מ-API Route
- ✅ פחות overhead
- ✅ תגובה מיידית

### Client-Side לפעולות אינטראקטיביות
- עגלת קניות
- עדכון כמות
- הסרת פריטים

**למה Client-Side?**
- ✅ תגובה מיידית
- ✅ אין round-trip לשרת
- ✅ UX טוב יותר

---

## TODO: שיפורים עתידיים

- [ ] זיהוי store לפי domain/subdomain
- [ ] Cache לדפים סטטיים
- [ ] חיפוש מוצרים
- [ ] פילטרים (מחיר, קטגוריה)
- [ ] מיון (מחיר, תאריך)
- [ ] Pagination
- [ ] תשלום (אינטגרציה עם payment providers)
- [ ] עגלות נטושות
- [ ] Wishlist
- [ ] ביקורות מוצרים
- [ ] מוצרים קשורים
- [ ] המלצות

---

## הערות חשובות

1. **storeId** - כרגע hardcoded ל-1, צריך לקבל מ-domain/subdomain
2. **Cart** - נשמר ב-localStorage, לא ב-DB (עד צ'ק אאוט)
3. **Events** - כל הזמנה פולטת אירוע `order.created`
4. **RTL** - כל הדפים תומכים ב-RTL (עברית)

---

## 🧮 מנוע חישוב הנחות וקופונים

המערכת כוללת **מנוע חישוב מרכזי וחכם** להנחות וקופונים.

### עקרונות:
- ✅ **Single Source of Truth** - מקום אחד שמחשב הכל
- ✅ **עקביות מוחלטת** - אותו חישוב בכל מקום
- ✅ **סדר פעולות נכון** - הנחות מחושבות בסדר הנכון

### שימוש:

```tsx
import { useCartCalculator } from '@/hooks/useCartCalculator';
import { CartSummary } from '@/components/storefront/CartSummary';

// Hook
const { getTotal, getDiscount, applyDiscountCode } = useCartCalculator({
  storeId: 1,
  autoCalculate: true,
});

// Component
<CartSummary storeId={1} onCheckout={handleCheckout} />
```

📖 **[תיעוד מלא של מנוע החישוב →](../../lib/services/CART_CALCULATOR.md)**

---

**החנות מוכנה לשימוש!** 🚀

