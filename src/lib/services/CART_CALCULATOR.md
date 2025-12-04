# 🧮 מנוע חישוב הנחות וקופונים - תיעוד מלא

## 📋 סקירה כללית

**מנוע החישוב המרכזי** הוא הלב של מערכת ההנחות והקופונים. זהו **Single Source of Truth** לכל החישובים במערכת.

### עקרונות יסוד:

1. ✅ **מקום אחד שמחשב הכל** - כל חישוב עובר דרך המנוע הזה
2. ✅ **עקביות מוחלטת** - אותו חישוב בכל מקום (עגלה, צ'ק אאוט, עגלת צד)
3. ✅ **סדר פעולות נכון** - הנחות מחושבות בסדר הנכון
4. ✅ **תמיכה בכל סוגי ההנחות** - קופונים, הנחות אוטומטיות, וכו'

---

## 📁 מבנה הקבצים

```
src/lib/services/
└── cartCalculator.ts          # המנוע המרכזי (CartCalculator class)

src/hooks/
└── useCartCalculator.ts       # Hook לשימוש בקומפוננטות

src/components/storefront/
├── CartSummary.tsx            # קומפוננטת סיכום עגלה
└── SideCart.tsx               # עגלת צד (Drawer)
```

---

## 🔧 שימוש בסיסי

### 1. שימוש ב-Hook (מומלץ)

```tsx
import { useCartCalculator } from '@/hooks/useCartCalculator';

function MyComponent() {
  const {
    calculation,
    discountCode,
    applyDiscountCode,
    removeDiscountCode,
    getTotal,
    getSubtotal,
    getDiscount,
  } = useCartCalculator({
    storeId: 1,
    shippingRate: { id: 1, name: 'משלוח רגיל', price: 30, free_shipping_threshold: 200 },
    autoCalculate: true, // חישוב אוטומטי כשהעגלה משתנה
  });

  return (
    <div>
      <p>סה"כ: ₪{getTotal().toFixed(2)}</p>
      <button onClick={() => applyDiscountCode('SUMMER20')}>
        החל קופון
      </button>
    </div>
  );
}
```

### 2. שימוש ישיר ב-Service

```tsx
import { calculateCart, validateDiscountCode } from '@/lib/services/cartCalculator';

// חישוב עגלה
const result = await calculateCart({
  items: [
    {
      variant_id: 1,
      product_id: 1,
      product_title: 'מוצר 1',
      variant_title: 'Default Title',
      price: 100,
      quantity: 2,
    },
  ],
  discountCode: 'SUMMER20',
  shippingRate: { id: 1, name: 'משלוח', price: 30, free_shipping_threshold: 200 },
  storeId: 1,
});

console.log(result.total); // סה"כ סופי
console.log(result.discounts); // רשימת הנחות שהוחלו
```

---

## 🎯 סוגי הנחות נתמכים

### 1. Percentage (אחוז הנחה)
```typescript
{
  discount_type: 'percentage',
  value: 20, // 20% הנחה
}
```

### 2. Fixed Amount (סכום קבוע)
```typescript
{
  discount_type: 'fixed_amount',
  value: 50, // ₪50 הנחה
}
```

### 3. Free Shipping (משלוח חינם)
```typescript
{
  discount_type: 'free_shipping',
  // value לא רלוונטי
}
```

## 🎫 הנחות אוטומטיות

הנחות אוטומטיות מוחלות **אוטומטית** ללא צורך בקוד קופון.

### תכונות:
- ✅ **עדיפות גבוהה** - מחושבות קודם לקופונים
- ✅ **תמיכה בכל התנאים** - סכום, כמות, לקוח, זמן
- ✅ **שילובים** - אפשרות למנוע או לאפשר שילוב עם קופונים

### דוגמה:
```typescript
{
  name: "10% הנחה על כל המוצרים",
  discount_type: 'percentage',
  value: 10,
  applies_to: 'all',
  priority: 10, // עדיפות גבוהה
  can_combine_with_codes: true, // ניתן לשלב עם קופונים
}
```

## 🔄 עדיפויות ושילובים

### סדר החישוב:
1. **הנחות אוטומטיות** (לפי priority)
2. **קופונים** (אם ניתן לשלב)

### כללי שילוב:
- `can_combine_with_codes` - האם הנחה אוטומטית ניתן לשלב עם קופונים
- `can_combine_with_other_automatic` - האם הנחה אוטומטית ניתן לשלב עם הנחות אוטומטיות אחרות
- `max_combined_discounts` - מקסימום הנחות מצטברות

---

## 📊 מבנה התוצאה (CartCalculationResult)

```typescript
interface CartCalculationResult {
  // פריטים עם חישובים
  items: Array<{
    item: CartItem;
    lineTotal: number;              // מחיר לפני הנחה
    lineDiscount: number;            // הנחה על הפריט
    lineTotalAfterDiscount: number; // מחיר אחרי הנחה
  }>;
  
  // סיכומים
  subtotal: number;                  // סה"כ פריטים לפני הנחה
  itemsDiscount: number;             // סה"כ הנחות על פריטים
  subtotalAfterDiscount: number;    // סה"כ פריטים אחרי הנחה
  
  // משלוח
  shipping: number;                  // מחיר משלוח לפני הנחה
  shippingDiscount: number;         // הנחה על משלוח
  shippingAfterDiscount: number;     // מחיר משלוח אחרי הנחה
  
  // הנחות שהוחלו
  discounts: Array<{
    id: number;
    name: string;
    code?: string;
    type: string;
    amount: number;
    description: string;
    source: 'automatic' | 'code';
    priority: number;
  }>;
  
  // סה"כ סופי
  total: number;
  
  // מטא-דאטה
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## 🔄 סדר פעולות החישוב

המנוע מחשב בסדר הבא:

1. **Subtotal בסיסי** - סכום כל הפריטים לפני הנחות
2. **הנחות אוטומטיות** (עדיפות גבוהה):
   - מיון לפי `priority` (גבוה יותר = קודם)
   - החלה לפי סדר עדיפות
   - כל הנחה מחושבת על המחיר אחרי הנחות קודמות
   - בדיקת שילוב (`can_combine_with_other_automatic`)
3. **קופונים** (אחרי הנחות אוטומטיות):
   - בדיקת שילוב עם הנחות אוטומטיות (`can_combine_with_codes`)
   - אם ניתן לשלב - החלה
   - אם לא ניתן לשלב - אזהרה
4. **Subtotal אחרי הנחות** - Subtotal - כל ההנחות
5. **משלוח** - מחיר משלוח (אם יש)
6. **הנחה על משלוח** - משלוח חינם (אם יש קופון/הנחה אוטומטית או סף)
7. **סה"כ סופי** - Subtotal אחרי הנחות + משלוח אחרי הנחה

---

## ✅ בדיקות תקינות

המנוע בודק:

1. ✅ **קופון קיים** - הקופון נמצא במסד הנתונים
2. ✅ **קופון פעיל** - `is_active = true`
3. ✅ **תוקף תאריכים** - `starts_at` ו-`ends_at`
4. ✅ **מגבלת שימוש** - `usage_count < usage_limit`
5. ✅ **סכום מינימום** - `subtotal >= minimum_order_amount`
6. ✅ **החלה על פריטים** - `applies_to` (all/specific_products/specific_collections)

---

## 🎨 קומפוננטות מוכנות

### CartSummary
קומפוננטה מוכנה להצגת סיכום עגלה עם:
- קופון הנחה
- סיכום מחירים
- הנחות שהוחלו
- סה"כ סופי
- כפתור צ'ק אאוט

```tsx
<CartSummary
  storeId={1}
  shippingRate={{ id: 1, name: 'משלוח', price: 30, free_shipping_threshold: 200 }}
  onCheckout={() => router.push('/checkout')}
/>
```

### SideCart
עגלת צד (Drawer) עם:
- רשימת פריטים
- CartSummary מובנה
- תמיכה במובייל

```tsx
<SideCart storeId={1} />
```

---

## 📝 דוגמאות שימוש

### דוגמה 1: עגלת קניות
```tsx
// src/app/(storefront)/cart/page.tsx
import { CartSummary } from '@/components/storefront/CartSummary';

export default function CartPage() {
  return (
    <div>
      {/* רשימת פריטים */}
      <div>...</div>
      
      {/* סיכום עם מנוע החישוב */}
      <CartSummary 
        storeId={1} 
        onCheckout={() => router.push('/checkout')}
        // הנחות אוטומטיות נטענות אוטומטית!
      />
    </div>
  );
}
```

### דוגמה 2: צ'ק אאוט עם פרטי לקוח
```tsx
// src/app/(storefront)/checkout/page.tsx
import { CartSummary } from '@/components/storefront/CartSummary';
import { useCartCalculator } from '@/hooks/useCartCalculator';

export default function CheckoutPage() {
  const { getTotal, calculation } = useCartCalculator({
    storeId: 1,
    autoCalculate: true,
    customerId: 123, // לקוח מחובר
    customerSegment: 'vip', // VIP customer
    customerOrdersCount: 10, // 10 הזמנות קודמות
    customerLifetimeValue: 5000, // ערך חיים ₪5000
  });

  const handleSubmit = async () => {
    const order = await createOrder({
      total: getTotal(), // משתמש במנוע החישוב (כולל הנחות אוטומטיות!)
      // ...
    });
  };

  return (
    <div>
      {/* טופס */}
      <form>...</form>
      
      {/* סיכום - מציג הנחות אוטומטיות + קופון */}
      <CartSummary storeId={1} />
    </div>
  );
}
```

### דוגמה 3: עגלת צד
```tsx
// src/components/storefront/StorefrontHeader.tsx
import { SideCart } from '@/components/storefront/SideCart';

export function StorefrontHeader() {
  return (
    <header>
      {/* ... */}
      <SideCart storeId={1} />
    </header>
  );
}
```

---

## ⚠️ כללי זהב

### ✅ תמיד לעשות:
1. **השתמש במנוע החישוב** - אף פעם אל תחשב ידנית
2. **השתמש ב-Hook** - `useCartCalculator` במקום שימוש ישיר
3. **השתמש ב-CartSummary** - קומפוננטה מוכנה במקום לבנות בעצמך
4. **בדוק errors ו-warnings** - תמיד הצג למשתמש

### ❌ לעולם לא לעשות:
1. **אל תחשב ידנית** - לא `subtotal - discount` בקומפוננטה
2. **אל תכפיל מחירים** - לא `price * quantity` ישירות
3. **אל תשכח לבדוק תקינות** - תמיד בדוק `isValid` לפני צ'ק אאוט
4. **אל תציג מחירים ללא מנוע** - תמיד דרך המנוע

---

## 🔍 Debugging

### בדיקת חישוב
```typescript
const result = await calculateCart({...});
console.log('Calculation result:', {
  subtotal: result.subtotal,
  discount: result.itemsDiscount,
  shipping: result.shippingAfterDiscount,
  total: result.total,
  discounts: result.discounts,
  errors: result.errors,
  warnings: result.warnings,
});
```

### בדיקת קופון
```typescript
const validation = await validateDiscountCode('SUMMER20', storeId, subtotal);
if (!validation.valid) {
  console.error('Discount error:', validation.error);
}
```

---

## ✅ תכונות מיושמות

- [x] **הנחות אוטומטיות** - ללא קופון, מוחלות אוטומטית ✅
- [x] **הנחות על מוצרים ספציפיים** - product_ids ✅
- [x] **הנחות על קטגוריות** - collection_ids ✅
- [x] **הנחות על תגיות** - tag_names ✅
- [x] **הנחות מצטברות** - מספר הנחות יחד ✅
- [x] **הנחות לפי כמות** - minimum_quantity, maximum_quantity ✅
- [x] **הנחות לפי לקוח** - VIP, חדש, חוזר ✅
- [x] **הנחות לפי מספר הזמנות** - minimum_orders_count ✅
- [x] **הנחות לפי ערך חיים** - minimum_lifetime_value ✅
- [x] **הנחות לפי תאריך/שעה** - starts_at, ends_at ✅
- [x] **הנחות לפי יום בשבוע** - day_of_week ✅
- [x] **הנחות לפי שעה ביום** - hour_start, hour_end ✅
- [x] **עדיפויות** - priority (גבוה יותר = קודם) ✅
- [x] **שילובים** - can_combine_with_codes, can_combine_with_other_automatic ✅
- [x] **מגבלת שילובים** - max_combined_discounts ✅

📖 **[רשימת כל סוגי ההנחות →](./DISCOUNT_TYPES.md)**

---

## 🔌 API Endpoints

### Automatic Discounts

#### GET `/api/automatic-discounts`
קבלת כל ההנחות האוטומטיות.

#### POST `/api/automatic-discounts`
יצירת הנחה אוטומטית חדשה.

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value?: number;
  minimum_order_amount?: number;
  maximum_order_amount?: number;
  minimum_quantity?: number;
  maximum_quantity?: number;
  applies_to?: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  priority?: number;
  can_combine_with_codes?: boolean;
  can_combine_with_other_automatic?: boolean;
  max_combined_discounts?: number;
  customer_segment?: 'all' | 'vip' | 'new_customer' | 'returning_customer';
  minimum_orders_count?: number;
  minimum_lifetime_value?: number;
  starts_at?: string;
  ends_at?: string;
  day_of_week?: number[];
  hour_start?: number;
  hour_end?: number;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}
```

#### GET `/api/automatic-discounts/:id`
קבלת פרטי הנחה אוטומטית.

#### PUT `/api/automatic-discounts/:id`
עדכון הנחה אוטומטית.

#### DELETE `/api/automatic-discounts/:id`
מחיקת הנחה אוטומטית.

---

## 📚 API Reference

### CartCalculator Class

```typescript
class CartCalculator {
  constructor(input: CartCalculationInput);
  async loadDiscountCode(code: string): Promise<boolean>;
  async calculate(): Promise<CartCalculationResult>;
}
```

### Helper Functions

```typescript
// חישוב עגלה
function calculateCart(input: CartCalculationInput): Promise<CartCalculationResult>;

// אימות קופון
function validateDiscountCode(
  code: string,
  storeId: number,
  subtotal: number
): Promise<{ valid: boolean; error?: string; discount?: DiscountCode }>;
```

### useCartCalculator Hook

```typescript
function useCartCalculator(options: UseCartCalculatorOptions): {
  calculation: CartCalculationResult | null;
  discountCode: string;
  loading: boolean;
  validatingCode: boolean;
  applyDiscountCode: (code: string) => Promise<{ valid: boolean; error?: string }>;
  removeDiscountCode: () => void;
  recalculate: () => Promise<void>;
  getSubtotal: () => number;
  getDiscount: () => number;
  getShipping: () => number;
  getTotal: () => number;
  getDiscounts: () => Array<{...}>;
  hasErrors: () => boolean;
  hasWarnings: () => boolean;
  getErrors: () => string[];
  getWarnings: () => string[];
}
```

---

## 🎯 סיכום תכונות

### ✅ מיושם במלואו:
- ✅ הנחות אוטומטיות עם כל התנאים
- ✅ קופונים עם כל התנאים
- ✅ עדיפויות (אוטומטיות קודם)
- ✅ שילובים (מניעה/אפשרות)
- ✅ הנחות מצטברות
- ✅ תמיכה בכל סוגי התנאים

### 📊 סטטיסטיקות:
- **סוגי הנחות:** 3 (percentage, fixed_amount, free_shipping)
- **תנאי סכום:** 2 (min, max)
- **תנאי כמות:** 2 (min, max)
- **תנאי מוצרים:** 4 (all, products, collections, tags)
- **תנאי לקוח:** 5 (all, vip, new, returning, orders, lifetime)
- **תנאי זמן:** 4 (date, day, hour, range)
- **סה"כ:** 20+ סוגי הנחות שונים!

---

**זכור: המנוע הזה הוא Single Source of Truth - כל חישוב עובר דרכו!** 🎯

📖 **[רשימת כל סוגי ההנחות →](./DISCOUNT_TYPES.md)**

