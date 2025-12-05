# 🛍️ אפיון פרונט החנות - Quickshop3 Storefront Specification

<div dir="rtl">

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [ארכיטקטורה וטכנולוגיה](#ארכיטקטורה-וטכנולוגיה)
3. [דף בית](#דף-בית)
4. [דף קטגוריה](#דף-קטגוריה)
5. [דף מוצר](#דף-מוצר)
6. [דף עגלה](#דף-עגלה)
7. [דף צ'ק אאוט](#דף-צק-אאוט)
8. [מערכת עריכה עם Customizer](#מערכת-עריכה-עם-customizer)
9. [תבניות עמודים](#תבניות-עמודים)
10. [עיצוב ו-UX](#עיצוב-ו-ux)
11. [מערכת פיקסלים ומעקב](#מערכת-פיקסלים-ומעקב)

📖 **[מסמך QA וביצועים מפורט →](./STOREFRONT_QA_SPEC.md)** - קריאה חובה לפני פיתוח!  
📖 **[מסמך מערכת תרגומים →](./I18N_SPEC.md)** - קריאה חובה לפני פיתוח!  
📖 **[ניתוח עיצוב Everlane →](./EVERLANE_DESIGN_ANALYSIS.md)** - עיצוב ברירת מחדל מבוסס על Everlane!

---

## 🎯 סקירה כללית

הפרונט של Quickshop3 הוא החנות הפומבית שהלקוחות רואים. זהו הממשק המקצועי והמתקדם ביותר בשוק - יותר טוב משופיפיי.

**עיצוב ברירת מחדל מבוסס על [Everlane.com](https://www.everlane.com/) - אחד האתרים הטובים ביותר בתחום האופנה.**

📖 **[ניתוח מפורט של Everlane →](./EVERLANE_DESIGN_ANALYSIS.md)** - קריאה חובה לפני פיתוח!

### עקרונות יסוד:

1. **עיצוב נקי ומינימליסטי** - Clean & Minimal Design בסגנון Everlane
2. **מהירות מקסימלית** - כל עמוד נטען מהר, עם SSR לדפים סטטיים
3. **עריכה מלאה** - כל עמוד ותבנית ניתן לעריכה מלאה עם Customizer
4. **גמישות מוחלטת** - כל אלמנט ניתן להתאמה אישית
5. **חוויית משתמש מעולה** - UX חלקה ואינטואיטיבית
6. **תמיכה מלאה ב-RTL** - עברית היא שפת ברירת המחדל
7. **Responsive מלא** - מובייל, טאבלט ודסקטופ
8. **תמיכה בשפות מרובות** - מערכת תרגומים מתקדמת כמו שופיפיי
9. **נגישות מלאה** - WCAG 2.1 AA compliance, Keyboard navigation, Screen reader support

📖 **[מסמך מערכת תרגומים מפורט →](./I18N_SPEC.md)** - קריאה חובה לפני פיתוח!

### כתובות URL:

- **ברירת מחדל:** `quickshop3.vercel.app/shops/{slug}`
- **דומיין מותאם:** `{custom-domain.com}` (לאחר חיבור A Record)

---

## 🏗️ ארכיטקטורה וטכנולוגיה

### Stack טכנולוגי:

- **Next.js 15** - App Router עם SSR
- **React 19** - Client Components לפעולות אינטראקטיביות
- **TypeScript** - Type safety מלא
- **Tailwind CSS** - עיצוב מהיר ועקבי
- **Server Actions** - פעולות מהירות מהשרת
- **PostgreSQL** - מסד נתונים

### עקרונות ארכיטקטורה:

#### 1. SSR לדפים סטטיים
```typescript
// ✅ טוב - SSR לדף בית
export default async function HomePage({ params }) {
  const products = await getFeaturedProducts(storeId);
  return <HomePageContent products={products} />;
}
```

**למה SSR?**
- ✅ SEO מעולה
- ✅ טעינה מהירה מהשרת
- ✅ אין API call נוסף

#### 2. Server Actions לפעולות
```typescript
// ✅ טוב - Server Action לצ'ק אאוט
'use server';
export async function createOrder(formData: FormData) {
  // יצירת הזמנה מהר מהשרת
  const order = await db.orders.create({...});
  return { orderId: order.id };
}
```

**למה Server Action?**
- ✅ מהיר יותר מ-API Route
- ✅ פחות overhead
- ✅ תגובה מיידית

#### 3. Client-Side לפעולות אינטראקטיביות
```typescript
// ✅ טוב - Client Component לעגלה
'use client';
export function Cart() {
  const [cart, setCart] = useState([]);
  // עדכון מיידי ב-UI
}
```

**למה Client-Side?**
- ✅ תגובה מיידית
- ✅ אין round-trip לשרת
- ✅ UX טוב יותר

---

## 🧭 Header (כותרת עליונה)

### מבנה Header (בסגנון Everlane):

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] [Women ▼] [Men ▼] [Home] [New] [Sale] [Search] [Bag] │
└─────────────────────────────────────────────────────────────┘
```

### תכונות Header:

#### 1. **Logo**
- מיקום: משמאל (LTR) או מימין (RTL)
- קישור לדף בית
- תמיכה ב-Logo מותאם או טקסט

#### 2. **Mega Menu** ⭐⭐⭐ (חדש!)
- **מה:** תפריט נפתח עם קטגוריות ותת-קטגוריות
- **איך:** Hover על קטגוריה → תפריט גדול נפתח
- **תכונות:**
  - Grid layout של תת-קטגוריות
  - תמונות/אייקונים (אופציונלי)
  - קישורים ישירים
  - Smooth animations

#### 3. **Search Bar** ⭐⭐⭐
- **מה:** Search input קבוע ב-Header
- **תכונות:**
  - Auto-complete (אופציונלי)
  - Search suggestions
  - Keyboard shortcut (Cmd/Ctrl + K)
  - Search results page

#### 4. **Cart Drawer** ⭐⭐⭐
- **מה:** עגלה שנפתחת מהצד
- **תכונות:**
  - Badge עם כמות פריטים
  - Quick view של פריטים
  - Order summary
  - Checkout button

#### 5. **Country/Region Selector** ⭐⭐ (חדש!)
- **מה:** בחירת מדינה ומטבע
- **תכונות:**
  - Dropdown עם רשימת מדינות
  - המרת מטבע אוטומטית
  - שמירת העדפה
  - Flag icons (אופציונלי)

#### 6. **Account Menu** ⭐⭐
- **מה:** כניסה/הרשמה/חשבון
- **תכונות:**
  - Sign in / Sign up
  - My Account
  - Order History
  - Wishlist

### דוגמת קוד:

```typescript
<header className="sticky top-0 z-50 bg-white border-b">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <Link href="/">
        <img src={logo} alt="Store" />
      </Link>
      
      {/* Navigation with Mega Menu */}
      <nav className="hidden md:flex items-center gap-6">
        <MegaMenu categories={categories} />
      </nav>
      
      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <SearchBar />
        <CountrySelector />
        <CartDrawer />
        <AccountMenu />
      </div>
    </div>
  </div>
</header>
```

---

## 🏠 דף בית

### מבנה כללי:

```
┌─────────────────────────────────────────────┐
│              HEADER (ניווט)                  │
├─────────────────────────────────────────────┤
│                                             │
│         HERO SECTION (מותאם אישית)         │
│   (תמונה/וידאו, כותרת, כפתור CTA)          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│      FEATURED COLLECTIONS (קטגוריות)        │
│   Grid של 3-6 קטגוריות עם תמונות           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│      FEATURED PRODUCTS (מוצרים מובילים)    │
│   Grid של 4-8 מוצרים                        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│      PROMOTIONAL BANNER (מותאם אישית)       │
│   באנר עם תמונה/טקסט/כפתור                 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│      NEW ARRIVALS (מוצרים חדשים)            │
│   Grid של 4-8 מוצרים                        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│      TESTIMONIALS / REVIEWS (ביקורות)       │
│   קארוסל של ביקורות לקוחות                │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│      NEWSLETTER SIGNUP (הרשמה לניוזלטר)     │
│   טופס הרשמה עם תמונה רקע                  │
│                                             │
├─────────────────────────────────────────────┤
│              FOOTER                         │
└─────────────────────────────────────────────┘
```

### רכיבים עיקריים:

#### 1. Hero Section
- **תמונה/וידאו רקע** - ניתן לעריכה ב-Customizer
- **כותרת ראשית** - טקסט מותאם אישית
- **תת-כותרת** - תיאור קצר
- **כפתור CTA** - "קנה עכשיו" / "גלה עוד" / מותאם אישית
- **אפקטים ויזואליים** - Overlay, Gradient, Animation

**אפשרויות עריכה ב-Customizer:**
- בחירת תמונה/וידאו
- עריכת טקסטים
- בחירת צבעים
- בחירת כפתור CTA
- גובה הסקשן
- אנימציות

#### 2. Featured Collections
- **Grid Layout** - 3-6 קטגוריות בשורה
- **כרטיס קטגוריה:**
  - תמונת קטגוריה
  - שם הקטגוריה
  - כפתור "קנה עכשיו"
  - Hover effect עם overlay

**אפשרויות עריכה:**
- בחירת קטגוריות להצגה
- סדר הקטגוריות (Drag & Drop)
- עיצוב כרטיסים
- מספר קטגוריות בשורה

#### 3. Featured Products
- **Grid Layout** - 4 מוצרים בשורה (דסקטופ)
- **Product Card:**
  - תמונת מוצר (עם Quick View)
  - שם מוצר
  - מחיר (עם מחיר מושווה אם יש)
  - כפתור "הוסף לעגלה" (Quick Add)
  - Badge "חדש" / "הנחה" / "נמכר מהר"

**אפשרויות עריכה:**
- בחירת מוצרים להצגה
- סדר המוצרים
- עיצוב כרטיסים
- מספר מוצרים בשורה

#### 4. Promotional Banner
- **באנר מותאם אישית:**
  - תמונת רקע
  - טקסט עליון
  - כפתור CTA
  - קישור לדף/מוצר/קטגוריה

**אפשרויות עריכה:**
- בחירת תמונה
- עריכת טקסטים
- בחירת צבעים
- בחירת קישור

#### 5. New Arrivals
- **Grid Layout** - מוצרים חדשים
- **Product Cards** - כמו Featured Products

#### 6. Testimonials / Reviews
- **קארוסל של ביקורות:**
  - תמונת לקוח
  - שם לקוח
  - דירוג (כוכבים)
  - ביקורת
  - תמונת מוצר (אופציונלי)

**אפשרויות עריכה:**
- בחירת ביקורות להצגה
- עיצוב קארוסל
- מספר ביקורות להצגה

#### 7. Newsletter Signup
- **טופס הרשמה:**
  - תמונת רקע
  - כותרת
  - תיאור
  - שדה אימייל
  - כפתור "הירשם"

**אפשרויות עריכה:**
- בחירת תמונה
- עריכת טקסטים
- עיצוב טופס

### SEO ו-Meta Tags:

```typescript
export const metadata = {
  title: `${store.name} - חנות אונליין`,
  description: store.description || 'חנות אונליין מקצועית',
  openGraph: {
    title: store.name,
    description: store.description,
    images: [store.logo],
  },
};
```

---

## 📂 דף קטגוריה

### מבנה כללי:

```
┌─────────────────────────────────────────────┐
│              HEADER                          │
├─────────────────────────────────────────────┤
│                                             │
│    BREADCRUMBS (ניווט)                      │
│    בית > קטגוריות > שם קטגוריה              │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    CATEGORY HEADER                          │
│    ┌─────────────────────────────────────┐ │
│    │  [תמונת קטגוריה]                    │ │
│    │  שם הקטגוריה                        │ │
│    │  תיאור הקטגוריה                    │ │
│    └─────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    FILTERS & SORT BAR                       │
│    [חיפוש] [מיון] [פילטרים] [תצוגה]        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    PRODUCTS GRID                            │
│    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│    │ P1  │ │ P2  │ │ P3  │ │ P4  │          │
│    └─────┘ └─────┘ └─────┘ └─────┘          │
│    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│    │ P5  │ │ P6  │ │ P7  │ │ P8  │          │
│    └─────┘ └─────┘ └─────┘ └─────┘          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    PAGINATION                               │
│    [< הקודם] [1] [2] [3] [הבא >]           │
│                                             │
├─────────────────────────────────────────────┤
│              FOOTER                         │
└─────────────────────────────────────────────┘
```

### רכיבים עיקריים:

#### 1. Category Header
- **תמונת קטגוריה** - תמונה גדולה/באנר
- **שם הקטגוריה** - כותרת H1
- **תיאור הקטגוריה** - HTML rich text
- **מספר מוצרים** - "X מוצרים בקטגוריה"

**אפשרויות עריכה:**
- בחירת תמונה
- עריכת טקסטים
- עיצוב Header

#### 2. Filters & Sort Bar
- **חיפוש** - חיפוש בתוך הקטגוריה
- **מיון:**
  - מחיר: נמוך לגבוה / גבוה לנמוך
  - תאריך: חדש לישן / ישן לחדש
  - פופולריות
  - שם: א-ב / ב-א
- **פילטרים:**
  - מחיר (Slider)
  - מותג (Checkboxes)
  - תכונות (Checkboxes)
  - זמינות (במלאי / לא במלאי)
- **תצוגה:**
  - Grid (4 מוצרים)
  - Grid (3 מוצרים)
  - List (רשימה)

**אפשרויות עריכה:**
- בחירת פילטרים להצגה
- עיצוב סרגל פילטרים

#### 3. Products Grid
- **Grid Layout** - 3-4 מוצרים בשורה
- **Product Cards** - כמו בדף בית
- **Loading States** - Skeleton loaders
- **Empty State** - "אין מוצרים בקטגוריה"

**אפשרויות עריכה:**
- מספר מוצרים בשורה
- עיצוב כרטיסים
- אנימציות

#### 4. Pagination
- **Cursor Pagination** - כמו Shopify
- **מספר עמודים** - 1, 2, 3...
- **כפתורי ניווט** - הקודם / הבא
- **מידע** - "מציג 1-20 מתוך 100 מוצרים"

---

## 🛍️ דף מוצר

### מבנה כללי:

```
┌─────────────────────────────────────────────┐
│              HEADER                         │
├─────────────────────────────────────────────┤
│                                             │
│    BREADCRUMBS                              │
│    בית > קטגוריות > קטגוריה > שם מוצר      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    PRODUCT DETAILS                          │
│    ┌──────────────┬──────────────────────┐ │
│    │              │  שם המוצר             │ │
│    │              │  מחיר                 │ │
│    │   GALLERY    │  וריאציות (מידה/צבע) │ │
│    │   (תמונות)   │  כמות                 │ │
│    │              │  [הוסף לעגלה]         │ │
│    │              │  [Buy Now]            │ │
│    │              │  תיאור                │ │
│    │              │  מפרט טכני            │ │
│    │              │  ביקורות              │ │
│    └──────────────┴──────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    RELATED PRODUCTS                         │
│    מוצרים קשורים / מאותה קטגוריה           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    RECENTLY VIEWED                          │
│    מוצרים שנצפו לאחרונה                    │
│                                             │
├─────────────────────────────────────────────┤
│              FOOTER                         │
└─────────────────────────────────────────────┘
```

### רכיבים עיקריים:

#### 1. Product Gallery
- **תמונות מוצר:**
  - תמונה ראשית גדולה
  - Thumbnails למטה/בצד
  - Zoom על hover
  - Lightbox על click
  - Video support (אם יש)
- **Badges:**
  - "חדש"
  - "הנחה X%"
  - "נמכר מהר"
  - "אחרון במלאי"

**אפשרויות עריכה:**
- סדר תמונות (Drag & Drop)
- בחירת תמונה ראשית
- עיצוב Gallery

#### 2. Product Info
- **שם מוצר** - H1
- **מחיר:**
  - מחיר נוכחי
  - מחיר מושווה (אם יש הנחה)
  - מחיר ליחידה (אם נמכר לפי משקל)
- **וריאציות:**
  - בחירת מידה (Radio/Select)
  - בחירת צבע (Swatches)
  - בחירת אפשרויות נוספות
  - מחיר משתנה לפי וריאציה
- **כמות:**
  - Input עם כפתורי +/-
  - מינימום/מקסימום
- **כפתורים:**
  - "הוסף לעגלה" (Primary)
  - "קנה עכשיו" (Secondary)
  - "הוסף לרשימת משאלות"
- **מידע נוסף:**
  - זמינות במלאי
  - זמן משלוח משוער
  - מדיניות החזרות

**אפשרויות עריכה:**
- עיצוב כפתורים
- מיקום אלמנטים
- עיצוב וריאציות

#### 3. Product Description
- **Rich Text Editor:**
  - HTML content
  - תמונות
  - וידאו
  - טבלאות
  - Lists
- **Tabs:**
  - תיאור
  - מפרט טכני
  - מדיניות החזרות
  - שאלות נפוצות

**אפשרויות עריכה:**
- עריכת תוכן (WYSIWYG)
- הוספת תמונות/וידאו
- עיצוב Tabs

#### 4. Product Reviews
- **ביקורות לקוחות:**
  - דירוג כללי (כוכבים)
  - רשימת ביקורות
  - טופס הוספת ביקורת
  - פילטרים (5 כוכבים, 4 כוכבים...)
- **ביקורת בודדת:**
  - תמונת לקוח
  - שם לקוח
  - דירוג
  - תאריך
  - ביקורת
  - תמונות מוצר (אם יש)
  - "מועיל" (Helpful votes)

**אפשרויות עריכה:**
- עיצוב ביקורות
- הגדרות אישור ביקורות

#### 5. Related Products
- **Grid של מוצרים קשורים:**
  - מאותה קטגוריה
  - מאותו מותג
  - מוצרים דומים
  - מוצרים שנקנו יחד

**אפשרויות עריכה:**
- בחירת אלגוריתם המלצות
- מספר מוצרים להצגה

#### 6. Recently Viewed
- **קארוסל של מוצרים שנצפו:**
  - נשמר ב-localStorage
  - עד 10 מוצרים

---

## 🛒 דף עגלה (בסגנון Everlane)

### מבנה כללי:

```
┌─────────────────────────────────────────────┐
│              HEADER                         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌────────────────┐ │
│  │                  │  │ ORDER SUMMARY  │ │
│  │  CART ITEMS      │  │                │ │
│  │                  │  │ Subtotal: $XX  │ │
│  │  [Product 1]    │  │ Shipping: $XX  │ │
│  │  [Product 2]    │  │ Tax: $XX       │ │
│  │                  │  │                │ │
│  │                  │  │ Total: $XX    │ │
│  │                  │  │                │ │
│  │                  │  │ [Checkout]    │ │
│  └──────────────────┘  └────────────────┘ │
│                                             │
│      FREE SHIPPING PROGRESS ⭐ (חדש!)      │
│      "You're $XX away from free shipping"  │
│                                             │
│      CONTINUE SHOPPING                      │
│                                             │
└─────────────────────────────────────────────┘
```

### תכונות מיוחדות (בסגנון Everlane):

#### 1. **Free Shipping Progress** ⭐⭐⭐ (חדש!)
- **מה:** התקדמות למשלוח חינם
- **איך:** Progress bar או הודעה
- **דוגמה:** "You're $125.00 away from free standard shipping"
- **למה:** הגדלת ערך העגלה, הגדלת המרות

#### 2. **Cart Items Layout**
- תמונה מוצר
- שם מוצר + Variant
- מחיר
- Quantity controls (+/-)
- Remove button
- Item total

#### 3. **Order Summary Sticky**
- Subtotal
- Shipping (או "Free shipping!")
- Tax
- Total
- Checkout button

#### 4. **Empty Cart State**
- הודעה: "Your bag is empty"
- CTA: "Shop New Arrivals" / "Shop Best Sellers"
- תמונות/אייקונים

### דוגמת קוד:

```typescript
<div className="cart-page">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Cart Items */}
    <div className="lg:col-span-2">
      {cartItems.length > 0 ? (
        <>
          {cartItems.map(item => (
            <CartItem key={item.id} item={item} />
          ))}
          
          {/* Free Shipping Progress */}
          <FreeShippingProgress
            cartTotal={cartTotal}
            threshold={125}
          />
        </>
      ) : (
        <EmptyCart />
      )}
    </div>
    
    {/* Order Summary */}
    <div className="lg:col-span-1">
      <OrderSummary sticky />
    </div>
  </div>
</div>
```

---

## 🛒 דף עגלה (מקורי - נשמר לרפרנס)

### מבנה כללי:

```
┌─────────────────────────────────────────────┐
│              HEADER                         │
├─────────────────────────────────────────────┤
│                                             │
│    CART CONTENT                             │
│    ┌──────────────────┬──────────────────┐ │
│    │                  │                  │ │
│    │   CART ITEMS     │   ORDER SUMMARY  │ │
│    │                  │                  │ │
│    │   [Item 1]       │   סה"כ פריטים    │ │
│    │   [Item 2]       │   הנחה           │ │
│    │   [Item 3]       │   משלוח          │ │
│    │                  │   ─────────────  │ │
│    │   [Continue      │   סה"כ           │ │
│    │    Shopping]     │                  │ │
│    │                  │   [צ'ק אאוט]     │ │
│    │                  │                  │ │
│    └──────────────────┴──────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    RECOMMENDED PRODUCTS                     │
│    מוצרים מומלצים                          │
│                                             │
├─────────────────────────────────────────────┤
│              FOOTER                         │
└─────────────────────────────────────────────┘
```

### רכיבים עיקריים:

#### 1. Cart Items
- **כרטיס פריט:**
  - תמונת מוצר (קישור לדף מוצר)
  - שם מוצר
  - וריאציה (מידה, צבע)
  - מחיר ליחידה
  - כמות (עם +/-)
  - מחיר סה"כ לפריט
  - כפתור הסרה (X)
  - עדכון מיידי (Optimistic UI)

**אפשרויות עריכה:**
- עיצוב כרטיסים
- אנימציות

#### 2. Order Summary
- **סיכום הזמנה:**
  - סה"כ פריטים (X פריטים)
  - סה"כ מחיר פריטים
  - הנחה (אם יש קופון)
  - משלוח (אם נבחר)
  - סה"כ סופי
- **קופון:**
  - שדה קוד קופון
  - כפתור "החל"
  - הודעת שגיאה/הצלחה
- **כפתור צ'ק אאוט:**
  - Primary button
  - "המשך לצ'ק אאוט"

**אפשרויות עריכה:**
- עיצוב סיכום
- מיקום קופון

#### 3. Continue Shopping
- **קישור חזרה לקניות:**
  - "המשך לקנות"
  - קישור לדף בית/קטגוריות

#### 4. Recommended Products
- **Grid של מוצרים מומלצים:**
  - מוצרים מאותה קטגוריה
  - מוצרים דומים
  - Quick Add לעגלה

---

## 💳 דף צ'ק אאוט (בסגנון Everlane)

### מבנה כללי (בסגנון Everlane):

```
┌─────────────────────────────────────────────┐
│              HEADER                         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌────────────────┐ │
│  │                  │  │ ORDER SUMMARY  │ │
│  │  SHIPPING INFO   │  │  (Sticky)      │ │
│  │                  │  │                │ │
│  │  First Name      │  │ Items: $XX     │ │
│  │  Last Name       │  │ Shipping: $XX  │ │
│  │  Email           │  │ Tax: $XX       │ │
│  │  Phone           │  │                │ │
│  │  Address         │  │ Total: $XX     │ │
│  │  City            │  │                │ │
│  │  Postal Code     │  │ [Place Order]  │ │
│  │                  │  │                │ │
│  │  PAYMENT INFO    │  │ Security Badges │ │
│  │                  │  │                │ │
│  │  Card Number     │  │ Trust Signals  │ │
│  │  Expiry          │  │                │ │
│  │  CVV             │  │                │ │
│  │                  │  └────────────────┘ │
│  │  [Place Order]   │                      │
│  └──────────────────┘                      │
│                                             │
│      TRUST SIGNALS ⭐ (חדש!)                │
│      "Easy returns within 30 days"        │
│      "Secure checkout"                     │
│                                             │
└─────────────────────────────────────────────┘
```

### תכונות מיוחדות (בסגנון Everlane):

#### 1. **Two-Column Layout** ⭐⭐⭐
- Shipping/Payment בצד שמאל
- Order Summary Sticky בצד ימין
- Responsive - ערימה במובייל

#### 2. **Order Summary Sticky** ⭐⭐⭐
- **מה:** Order Summary נשאר גלוי בזמן גלילה
- **איך:** `position: sticky` או fixed
- **למה:** תמיד רואים את הסכום הסופי

#### 3. **Form Validation** ⭐⭐
- **מה:** Validation בזמן אמת
- **תכונות:**
  - Error messages
  - Success indicators
  - Required fields highlight

#### 4. **Security Badges** ⭐⭐ (חדש!)
- **מה:** תגי אבטחה ואמון
- **איך:** SSL, Payment security icons
- **למה:** בונה אמון, מפחית חרדה

#### 5. **Progress Indicator** ⭐⭐ (חדש!)
- **מה:** אינדיקטור התקדמות בתהליך
- **איך:** Steps: Cart → Shipping → Payment → Review
- **למה:** ברור איפה המשתמש נמצא

#### 6. **Guest Checkout** ⭐⭐
- **מה:** אפשרות לצ'ק אאוט ללא הרשמה
- **איך:** "Continue as Guest" option
- **למה:** פחות חיכוך, יותר המרות

#### 7. **Trust Signals** ⭐⭐ (חדש!)
- **מה:** סימני אמון בתחתית
- **דוגמאות:**
  - "Easy returns within 30 days"
  - "Secure checkout"
  - "Free shipping on orders over $125"
- **למה:** מפחית חרדה, מגדיל המרות

---

## 💳 דף צ'ק אאוט (מקורי - נשמר לרפרנס)

### מבנה כללי:

```
┌─────────────────────────────────────────────┐
│              HEADER                         │
├─────────────────────────────────────────────┤
│                                             │
│    CHECKOUT STEPS                           │
│    [1. פרטי משלוח] [2. תשלום] [3. אישור]   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│    CHECKOUT FORM                            │
│    ┌──────────────────┬──────────────────┐ │
│    │                  │                  │ │
│    │   SHIPPING INFO  │   ORDER SUMMARY  │ │
│    │                  │                  │ │
│    │   [Email]        │   [Cart Items]    │ │
│    │   [First Name]   │   Subtotal        │ │
│    │   [Last Name]    │   Discount        │ │
│    │   [Phone]        │   Shipping        │ │
│    │   [Address]      │   ─────────────  │ │
│    │   [City]         │   Total           │ │
│    │   [Postal Code]  │                  │ │
│    │   [Country]      │   [Payment Form]  │ │
│    │                  │                  │ │
│    │   [Same as      │   [Complete Order]│ │
│    │    Shipping]    │                  │ │
│    │                  │                  │ │
│    └──────────────────┴──────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│              FOOTER                         │
└─────────────────────────────────────────────┘
```

### רכיבים עיקריים:

#### 1. Checkout Steps
- **3 שלבים:**
  1. פרטי משלוח (Active)
  2. תשלום
  3. אישור
- **Progress Bar** - ויזואלי
- **Validation** - מעבר לשלב הבא רק אחרי ולידציה

#### 2. Shipping Information
- **שדות חובה:**
  - אימייל
  - שם פרטי
  - שם משפחה
  - טלפון
  - כתובת
  - עיר
  - מיקוד
  - מדינה
- **שדות אופציונליים:**
  - שם חברה
  - הערות להזמנה
- **Validation:**
  - Real-time validation
  - הודעות שגיאה ברורות
  - Auto-complete לכתובות

#### 3. Billing Information
- **Same as Shipping** - Checkbox
- **אם לא:**
  - שדות בילינג נפרדים

#### 4. Order Summary
- **רשימת פריטים:**
  - תמונה קטנה
  - שם מוצר
  - וריאציה
  - כמות
  - מחיר
- **סיכום:**
  - Subtotal
  - הנחה
  - משלוח
  - סה"כ

#### 5. Payment Form
- **אפשרויות תשלום:**
  - כרטיס אשראי (Stripe/PayPal)
  - PayPal
  - העברה בנקאית
  - תשלום בקבלה
- **שדות כרטיס אשראי:**
  - מספר כרטיס
  - תאריך תפוגה
  - CVV
  - שם על הכרטיס
- **אבטחה:**
  - PCI Compliance
  - Encryption
  - 3D Secure

#### 6. Complete Order Button
- **כפתור ראשי:**
  - "השלם הזמנה"
  - Loading state
  - Disabled אם לא וליד
- **תנאים:**
  - הסכמה לתנאים
  - הסכמה למדיניות פרטיות

#### 7. Order Confirmation
- **לאחר תשלום:**
  - הודעת הצלחה
  - מספר הזמנה
  - אימייל אישור
  - קישור למעקב הזמנה
  - קישור לדף הבית

---

## 🎨 מערכת עריכה עם Customizer

### סקירה כללית:

המערכת כוללת **Customizer מלא** - עורך ויזואלי מתקדם שמאפשר עריכה של כל עמוד ותבנית ישירות מהפרונט.

### איך זה עובד:

1. **כניסה ל-Customizer:**
   - כפתור "ערוך עמוד" בדשבורד
   - או קישור ישיר: `/shops/{slug}/customize?page=home`

2. **מצב עריכה:**
   - Sidebar עריכה משמאל
   - Preview של העמוד במרכז
   - אפשרות לערוך כל אלמנט

3. **שמירה:**
   - שמירה אוטומטית
   - Preview לפני פרסום
   - אפשרות לחזור לגרסה קודמת

### מבנה Customizer:

```
┌─────────────────────────────────────────────┐
│  [X] Customizer - דף בית                    │
├──────────┬─────────────────────────────────┤
│          │                                  │
│ SIDEBAR  │        PREVIEW                   │
│          │        (עם אפשרות עריכה)        │
│ [Elements│                                  │
│  List]   │                                  │
│          │                                  │
│ [Settings│                                  │
│  Panel]  │                                  │
│          │                                  │
│ [Style   │                                  │
│  Options]│                                  │
│          │                                  │
└──────────┴─────────────────────────────────┘
```

### רכיבי Customizer:

#### 1. Elements Panel
- **רשימת אלמנטים בעמוד:**
  - Hero Section
  - Featured Collections
  - Featured Products
  - Promotional Banner
  - וכו'
- **פעולות:**
  - הוספת אלמנט חדש
  - מחיקת אלמנט
  - העתקת אלמנט
  - שינוי סדר (Drag & Drop)
  - הסתרה/הצגה

#### 2. Settings Panel
- **הגדרות אלמנט:**
  - בחירת תוכן (מוצרים, קטגוריות)
  - עריכת טקסטים
  - בחירת תמונות
  - הגדרות קישורים
  - הגדרות התנהגות

#### 3. Style Panel
- **עיצוב אלמנט:**
  - צבעים (רקע, טקסט)
  - טיפוגרפיה (גופן, גודל)
  - רווחים (Padding, Margin)
  - גבולות (Border, Radius)
  - צללים (Shadow)
  - אנימציות

#### 4. Device Preview
- **תצוגה לפי מכשיר:**
  - Desktop
  - Tablet
  - Mobile
- **Responsive Design** - עריכה נפרדת לכל מכשיר

### דוגמאות עריכה:

#### עריכת Hero Section:
1. לחיצה על Hero Section ב-Preview
2. Sidebar נפתח עם הגדרות:
   - **תוכן:**
     - בחירת תמונה/וידאו
     - עריכת כותרת
     - עריכת תת-כותרת
     - בחירת כפתור CTA
   - **עיצוב:**
     - צבע רקע
     - צבע טקסט
     - גודל כותרת
     - מיקום תוכן (מרכז/שמאל/ימין)
   - **התנהגות:**
     - גובה סקשן
     - אנימציה כניסה
3. שינויים נראים מיידית ב-Preview
4. שמירה אוטומטית

#### עריכת Featured Products:
1. לחיצה על Featured Products
2. Sidebar נפתח:
   - **תוכן:**
     - בחירת מוצרים (Search/Select)
     - סדר מוצרים (Drag & Drop)
     - מספר מוצרים להצגה
   - **עיצוב:**
     - מספר מוצרים בשורה
     - עיצוב כרטיסים
     - צבעים
   - **התנהגות:**
     - אנימציות
     - Hover effects
3. שמירה

### תכונות מתקדמות:

#### 1. Templates Library
- **ספריית תבניות:**
  - תבניות מוכנות לדף בית
  - תבניות לקטגוריות
  - תבניות למוצרים
- **ייבוא/ייצוא:**
  - שמירת תבנית מותאמת אישית
  - ייבוא תבנית
  - שיתוף תבניות

#### 2. Version History
- **היסטוריית גרסאות:**
  - שמירת כל שינוי
  - אפשרות לחזור לגרסה קודמת
  - השוואה בין גרסאות

#### 3. Live Preview
- **תצוגה חיה:**
  - Preview של העמוד לפני פרסום
  - אפשרות לשתף Preview עם אחרים
  - QR Code ל-Preview במובייל

#### 4. Undo/Redo
- **ביטול/חזרה:**
  - Ctrl+Z / Cmd+Z לביטול
  - Ctrl+Shift+Z / Cmd+Shift+Z לחזרה
  - היסטוריה של 50 פעולות אחרונות

---

## 📄 תבניות עמודים

### תבניות זמינות:

#### 1. Home Page Templates
- **Classic** - תבנית קלאסית עם Hero + Products
- **Minimal** - תבנית מינימליסטית
- **Bold** - תבנית בולטת עם תמונות גדולות
- **Modern** - תבנית מודרנית עם אנימציות
- **Fashion** - תבנית אופנה
- **Electronics** - תבנית אלקטרוניקה
- **Food** - תבנית מזון

#### 2. Category Page Templates
- **Grid** - תבנית Grid קלאסית
- **List** - תבנית רשימה
- **Masonry** - תבנית Masonry
- **Sidebar** - תבנית עם Sidebar פילטרים

#### 3. Product Page Templates
- **Standard** - תבנית סטנדרטית
- **Gallery** - תבנית עם Gallery גדול
- **Minimal** - תבנית מינימליסטית
- **Full Width** - תבנית רוחב מלא

#### 4. Cart Page Templates
- **Standard** - תבנית סטנדרטית
- **Minimal** - תבנית מינימליסטית

#### 5. Checkout Page Templates
- **Standard** - תבנית סטנדרטית
- **One Page** - תבנית עמוד אחד
- **Multi Step** - תבנית רב-שלבית

### יצירת תבנית מותאמת:

1. **בחירת תבנית בסיס**
2. **עריכה ב-Customizer**
3. **שמירה כתבנית חדשה**
4. **החלה על עמודים**

---

## 🎨 עיצוב ו-UX

### עקרונות עיצוב (בסגנון Everlane):

#### 1. Clean & Minimal Design (עיצוב נקי ומינימליסטי)
- **White Space** - הרבה רווח לבן, לא עומס ויזואלי
- **פשטות** - עיצוב נקי ומינימלי
- **תמיכה מלאה ב-RTL** - עברית היא שפת ברירת המחדל
- **Premium Feel** - תחושת איכות וגימור גבוה

#### 2. עקביות
- אותם רכיבים באותו עיצוב
- Color Palette אחיד (שחור/לבן/אפור)
- Typography אחידה
- Spacing System עקבי

#### 3. מהירות
- טעינה מהירה
- תגובה מיידית לפעולות
- Optimistic UI
- Skeleton screens במקום spinners

#### 4. נגישות מלאה (Accessibility)
- **WCAG 2.1 AA compliance** - תמיכה מלאה בנגישות
- **Keyboard navigation** - ניווט מלא במקלדת
- **Screen reader support** - תמיכה בקוראי מסך
- **ARIA labels** - תוויות נגישות מלאות
- **Color contrast** - ניגודיות צבעים מיטבית

#### 5. Intuitive Navigation (ניווט אינטואיטיבי)
- **Mega Menu** - תפריט נפתח עם קטגוריות ותת-קטגוריות
- **Breadcrumbs** - נתיב ניווט
- **Search Bar** - חיפוש מוצרים
- **Clear CTAs** - קריאות לפעולה ברורות

### Color Palette (בסגנון Everlane):

```css
/* Primary Colors - Clean & Minimal */
--primary-black: #000000;
--primary-white: #FFFFFF;
--primary-gray: #F5F5F5;

/* Text Colors */
--text-primary: #000000;
--text-secondary: #666666;
--text-muted: #999999;
--text-light: #CCCCCC;

/* Background Colors */
--bg-white: #FFFFFF;
--bg-gray-50: #FAFAFA;
--bg-gray-100: #F5F5F5;
--bg-gray-200: #EEEEEE;

/* Accent Colors (אופציונלי - ניתן להתאים) */
--accent-primary: #10B981; /* Green - ניתן לשנות */
--accent-hover: #333333;
--accent-active: #000000;

/* Status Colors */
--status-success: #10B981;
--status-warning: #F59E0B;
--status-error: #EF4444;
--status-info: #3B82F6;
```

### Typography (בסגנון Everlane):

```css
/* Font Family - Clean & Modern */
font-family: 'Helvetica Neue', 'Noto Sans Hebrew', Arial, sans-serif;

/* Font Sizes */
--text-5xl: 48px;  /* Hero Headings */
--text-4xl: 36px;  /* Large Headings */
--text-3xl: 30px;  /* Section Headings */
--text-2xl: 24px;  /* Product Titles */
--text-xl: 20px;   /* Subheadings */
--text-lg: 18px;   /* Body Large */
--text-base: 16px; /* Body */
--text-sm: 14px;   /* Small Text */
--text-xs: 12px;   /* Captions */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System (בסגנון Everlane):

```css
/* Base Spacing - 4px grid */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;

/* Component Spacing */
--section-padding: 64px; /* Padding בין sections */
--container-padding: 24px; /* Padding בתוך container */
--card-padding: 24px; /* Padding בתוך cards */
```

### Responsive Breakpoints:

```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

### Animations:

- **Fade In** - כניסה הדרגתית
- **Slide In** - החלקה
- **Scale** - הגדלה/הקטנה
- **Hover Effects** - אפקטים על hover

---

## 📱 Mobile Experience

### עקרונות:

1. **Mobile First** - עיצוב מתחיל ממובייל
2. **Touch Friendly** - כפתורים גדולים, קל ללחיצה
3. **Fast Loading** - טעינה מהירה גם על 3G
4. **Easy Navigation** - ניווט פשוט ואינטואיטיבי

### תכונות מובייל:

- **Hamburger Menu** - תפריט נפתח
- **Sticky Header** - Header קבוע למעלה
- **Bottom Navigation** - ניווט תחתון (אופציונלי)
- **Swipe Gestures** - החלקה לפעולות
- **Pull to Refresh** - משיכה לרענון

---

## 🔍 SEO & Performance

### SEO:

- **Meta Tags** - Title, Description, OG Tags
- **Structured Data** - Schema.org markup
- **Sitemap** - XML Sitemap אוטומטי
- **Robots.txt** - הגדרות robots
- **Canonical URLs** - מניעת תוכן כפול

### Performance:

- **Image Optimization** - WebP, Lazy Loading
- **Code Splitting** - חלוקת קוד
- **Caching** - Cache לדפים סטטיים
- **CDN** - Cloudinary CDN לתמונות
- **Minification** - CSS/JS minified

---

## ✅ Checklist יישום

### דף בית:
- [ ] Hero Section עם עריכה
- [ ] Featured Collections
- [ ] Featured Products
- [ ] Promotional Banner
- [ ] New Arrivals
- [ ] Testimonials
- [ ] Newsletter Signup
- [ ] SEO Meta Tags

### דף קטגוריה:
- [ ] Category Header
- [ ] Filters & Sort
- [ ] Products Grid
- [ ] Pagination
- [ ] Breadcrumbs

### דף מוצר:
- [ ] Product Gallery
- [ ] Product Info
- [ ] Variants Selection
- [ ] Add to Cart
- [ ] Product Description
- [ ] Product Reviews
- [ ] Related Products

### דף עגלה:
- [ ] Cart Items
- [ ] Order Summary
- [ ] Coupon Code
- [ ] Recommended Products

### דף צ'ק אאוט:
- [ ] Checkout Steps
- [ ] Shipping Form
- [ ] Billing Form
- [ ] Payment Form
- [ ] Order Summary
- [ ] Order Confirmation

### Customizer:
- [ ] Elements Panel
- [ ] Settings Panel
- [ ] Style Panel
- [ ] Device Preview
- [ ] Templates Library
- [ ] Version History
- [ ] Undo/Redo

---

## 📊 מערכת פיקסלים ומעקב

### סקירה כללית:

Quickshop3 כוללת **מערכת פיקסלים מתקדמת ומרכזית** שמשדרת אירועים לכל הפלטפורמות השיווקיות והאנליטיות בבת אחת.

### עקרונות יסוד:

1. **מערכת מרכזית אחת** - כל הפיקסלים מנוהלים ממקום אחד
2. **שידור אוטומטי** - כל אירוע מועבר אוטומטית לכל הפלטפורמות
3. **גמישות מלאה** - תמיכה בכל פלטפורמה ופיקסל מותאם אישית
4. **ניהול קל** - ממשק ניהול פשוט מהדשבורד
5. **ביצועים מעולים** - לא מאט את החנות, טעינה אסינכרונית

### פלטפורמות נתמכות:

#### 1. Facebook Pixel
- **תמיכה מלאה** - Facebook Pixel Standard Events
- **אירועים:** PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead, CompleteRegistration
- **Custom Events** - אירועים מותאמים אישית
- **Conversion API** - תמיכה ב-Server-Side Events (אופציונלי)

#### 2. TikTok Pixel
- **תמיכה מלאה** - TikTok Pixel Events
- **אירועים:** ViewContent, AddToCart, InitiateCheckout, CompletePayment, PlaceAnOrder
- **Custom Events** - אירועים מותאמים אישית

#### 3. Google Tag Manager (GTM)
- **תמיכה מלאה** - אינטגרציה עם GTM
- **Data Layer** - כל האירועים נשלחים ל-Data Layer
- **Custom Tags** - תמיכה בכל Tag מותאם אישית

#### 4. Google Analytics (GA4)
- **תמיכה מלאה** - Google Analytics 4
- **אירועים:** page_view, view_item, add_to_cart, begin_checkout, purchase, search
- **Enhanced Ecommerce** - תמיכה מלאה ב-Ecommerce Events

#### 5. פיקסלים מותאמים אישית
- **Custom HTML** - כל קוד HTML/JavaScript
- **Custom Scripts** - תמיכה בכל סקריפט חיצוני
- **Third-Party Tools** - תמיכה בכל כלי מעקב חיצוני

### מבנה המערכת:

```
┌─────────────────────────────────────────────┐
│         EVENT BUS (מרכזי)                   │
│  כל אירוע עובר דרך כאן                      │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Facebook │  │  TikTok  │  │   GTM    │
│  Pixel   │  │  Pixel   │  │          │
└──────────┘  └──────────┘  └──────────┘
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │  Custom Pixels       │
        │  (כל פיקסל אחר)      │
        └──────────────────────┘
```

### אירועים שמועברים:

#### 1. PageView
- **מתי:** בכל טעינת עמוד
- **נתונים:**
  - URL
  - Title
  - Referrer
  - User Agent
  - Timestamp

#### 2. ViewContent (ViewItem)
- **מתי:** צפייה במוצר
- **נתונים:**
  - Product ID
  - Product Name
  - Price
  - Currency
  - Category
  - Image URL

#### 3. AddToCart
- **מתי:** הוספה לעגלה
- **נתונים:**
  - Product ID
  - Product Name
  - Variant ID
  - Price
  - Quantity
  - Currency

#### 4. InitiateCheckout (BeginCheckout)
- **מתי:** התחלת תהליך צ'ק אאוט
- **נתונים:**
  - Cart Total
  - Number of Items
  - Currency
  - Products Array

#### 5. Purchase (CompletePayment)
- **מתי:** השלמת רכישה
- **נתונים:**
  - Order ID
  - Order Total
  - Tax
  - Shipping
  - Discount
  - Currency
  - Products Array
  - Customer Email (Hashed)

#### 6. Search
- **מתי:** חיפוש מוצרים
- **נתונים:**
  - Search Term
  - Number of Results

#### 7. Lead / CompleteRegistration
- **מתי:** הרשמה/יצירת חשבון
- **נתונים:**
  - Customer Email (Hashed)
  - Registration Method

### מיקום פיקסלים:

#### 1. Head Section
- **מתי:** פיקסלים שצריכים להיטען מוקדם
- **דוגמאות:** Facebook Pixel Base Code, Google Analytics, GTM Container

#### 2. Body Section
- **מתי:** פיקסלים שצריכים להיטען אחרי ה-Head
- **דוגמאות:** Custom Scripts, Third-Party Tools

#### 3. Footer Section
- **מתי:** פיקסלים שצריכים להיטען בסוף
- **דוגמאות:** Analytics Scripts, Performance Tracking

### ניהול מהדשבורד:

#### 1. הוספת פיקסל חדש
- **דף:** הגדרות > אינטגרציות > פיקסלים
- **טופס:**
  - שם הפיקסל
  - סוג פיקסל (Facebook, TikTok, GTM, Custom)
  - Pixel ID / Code
  - מיקום (Head/Body/Footer)
  - סטטוס (פעיל/לא פעיל)

#### 2. עריכת פיקסל
- **עריכה:** לחיצה על פיקסל קיים
- **שינויים:** עדכון Pixel ID, Code, מיקום
- **שמירה:** שמירה מיידית

#### 3. מחיקת פיקסל
- **מחיקה:** כפתור מחיקה
- **אישור:** אישור לפני מחיקה

#### 4. בדיקת פיקסלים
- **Preview Mode:** מצב תצוגה מקדימה
- **Debug Tools:** כלי דיבוג לכל פלטפורמה
- **Event Testing:** בדיקת אירועים בזמן אמת

### יישום טכני:

#### 1. Component מרכזי
```typescript
// src/components/storefront/TrackingPixels.tsx
'use client';

import { useEffect } from 'react';
import { useTrackingPixels } from '@/hooks/useTrackingPixels';

export function TrackingPixels() {
  const { pixels } = useTrackingPixels();
  
  return (
    <>
      {pixels.map((pixel) => (
        <PixelRenderer key={pixel.id} pixel={pixel} />
      ))}
    </>
  );
}
```

#### 2. Hook לניהול פיקסלים
```typescript
// src/hooks/useTrackingPixels.ts
export function useTrackingPixels() {
  const [pixels, setPixels] = useState([]);
  
  useEffect(() => {
    // טעינת פיקסלים מהשרת
    loadPixels();
  }, []);
  
  return { pixels };
}
```

#### 3. Event Emitter
```typescript
// src/lib/tracking/eventEmitter.ts
export function emitTrackingEvent(event: string, data: any) {
  // שליחה לכל הפיקסלים הפעילים
  window.fbq?.('track', event, data);
  window.ttq?.track(event, data);
  window.dataLayer?.push({ event, ...data });
  window.gtag?.('event', event, data);
}
```

#### 4. Server-Side Events (אופציונלי)
```typescript
// src/lib/tracking/serverEvents.ts
export async function sendServerEvent(
  pixelType: string,
  event: string,
  data: any
) {
  // שליחה מהשרת (לפייסבוק Conversion API, וכו')
  await fetch(`/api/tracking/${pixelType}`, {
    method: 'POST',
    body: JSON.stringify({ event, data }),
  });
}
```

### דוגמאות שימוש:

#### הוספת פיקסל פייסבוק:
1. היכנס להגדרות > אינטגרציות > פיקסלים
2. לחץ על "הוסף פיקסל חדש"
3. בחר "Facebook Pixel"
4. הזן את ה-Pixel ID שלך
5. בחר מיקום: "Head"
6. שמור

#### הוספת Google Tag Manager:
1. היכנס להגדרות > אינטגרציות > פיקסלים
2. לחץ על "הוסף פיקסל חדש"
3. בחר "Google Tag Manager"
4. הזן את ה-Container ID שלך
5. בחר מיקום: "Head"
6. שמור

#### הוספת פיקסל מותאם אישית:
1. היכנס להגדרות > אינטגרציות > פיקסלים
2. לחץ על "הוסף פיקסל חדש"
3. בחר "Custom HTML"
4. הדבק את הקוד שלך
5. בחר מיקום: "Head" / "Body" / "Footer"
6. שמור

### אירועים אוטומטיים:

המערכת שולחת אוטומטית את כל האירועים הבאים:

| אירוע | מתי נשלח | פלטפורמות |
|------|----------|-----------|
| `PageView` | כל טעינת עמוד | כל הפלטפורמות |
| `ViewContent` | צפייה במוצר | Facebook, TikTok, GA4 |
| `AddToCart` | הוספה לעגלה | Facebook, TikTok, GA4, GTM |
| `InitiateCheckout` | התחלת צ'ק אאוט | Facebook, TikTok, GA4 |
| `Purchase` | השלמת רכישה | כל הפלטפורמות |
| `Search` | חיפוש מוצרים | GA4, GTM |
| `Lead` | יצירת חשבון | Facebook, GA4 |

### הגדרות מתקדמות:

#### 1. Event Mapping
- **מיפוי אירועים** - מיפוי אירועים מותאמים לפלטפורמות שונות
- **Custom Events** - הגדרת אירועים מותאמים אישית

#### 2. Data Enrichment
- **העשרת נתונים** - הוספת נתונים נוספים לאירועים
- **User Properties** - מאפיינים קבועים של משתמש

#### 3. Privacy & Compliance
- **GDPR Compliance** - תמיכה ב-GDPR
- **Cookie Consent** - הסכמה לעוגיות
- **Data Retention** - שמירת נתונים מוגבלת

#### 4. Performance
- **Lazy Loading** - טעינה מאוחרת של פיקסלים
- **Async Loading** - טעינה אסינכרונית
- **Defer Scripts** - דחיית טעינת סקריפטים

### בדיקת פיקסלים:

#### 1. Facebook Pixel Helper
- **Chrome Extension** - בדיקת פיקסל פייסבוק
- **Event Testing** - בדיקת אירועים בזמן אמת

#### 2. TikTok Pixel Helper
- **Chrome Extension** - בדיקת פיקסל טיקטוק
- **Event Testing** - בדיקת אירועים

#### 3. Google Tag Assistant
- **Chrome Extension** - בדיקת GTM ו-GA4
- **Debug Mode** - מצב דיבוג

#### 4. Browser Console
- **Console Logs** - בדיקת אירועים בקונסול
- **Network Tab** - בדיקת בקשות רשת

### Checklist יישום:

- [ ] Component מרכזי לניהול פיקסלים
- [ ] Hook לטעינת פיקסלים
- [ ] Event Emitter מרכזי
- [ ] אינטגרציה עם Facebook Pixel
- [ ] אינטגרציה עם TikTok Pixel
- [ ] אינטגרציה עם Google Tag Manager
- [ ] אינטגרציה עם Google Analytics 4
- [ ] תמיכה בפיקסלים מותאמים אישית
- [ ] דף ניהול פיקסלים בדשבורד
- [ ] טעינה אסינכרונית של פיקסלים
- [ ] בדיקת פיקסלים (Debug Tools)
- [ ] תמיכה ב-GDPR ו-Cookie Consent
- [ ] Server-Side Events (אופציונלי)

---

## 🚀 סיכום

הפרונט של Quickshop3 הוא החנות המתקדמת ביותר בשוק:

✅ **מהירות מקסימלית** - SSR + Server Actions  
✅ **עריכה מלאה** - Customizer לכל עמוד  
✅ **גמישות מוחלטת** - כל אלמנט ניתן לעריכה  
✅ **חוויית משתמש מעולה** - UX חלקה ואינטואיטיבית  
✅ **תמיכה מלאה ב-RTL** - עברית היא שפת ברירת המחדל  
✅ **Responsive מלא** - מובייל, טאבלט ודסקטופ  
✅ **מערכת פיקסלים מתקדמת** - שידור אוטומטי לכל הפלטפורמות  
✅ **ביצועים מיטביים** - אפס בקשות כפולות, Cache מקסימלי, Queries מיטביים  

**יותר טוב משופיפיי!** 🎉

---

## ⚠️ קריאה חובה לפני פיתוח

**לפני שתפתח כל פיצ'ר בפרונט, קרא את המסמך הבא:**

📖 **[מסמך QA וביצועים מפורט →](./STOREFRONT_QA_SPEC.md)**

המסמך כולל:
- ✅ זיהוי כל הבעיות בקוד הקיים
- ✅ פתרונות מפורטים לכל בעיה
- ✅ אופטימיזציות נדרשות
- ✅ Checklist יישום מלא
- ✅ דוגמאות קוד מוכנות לשימוש

**חובה לקרוא לפני כל פיתוח כדי למנוע:**
- ❌ בקשות רשת כפולות
- ❌ N+1 queries
- ❌ עומס מיותר על השרת
- ❌ חוויית משתמש גרועה

</div>

