# ארכיטקטורת מרקטפלייס - Marketplace Architecture

**תאריך:** 2025-01-XX  
**מטרה:** בניית מערכת מרקטפלייס (App Store) כמו Shopify עם תמיכה בפלאגינים בתשלום

---

## 🎯 חזון כללי

מערכת מרקטפלייס מקצועית שמאפשרת:
- **תוספים חינמיים** - זמינים מיד לכל החנויות
- **תוספים בתשלום** - מנוי חודשי עם הוראת קבע אוטומטית
- **ניהול מרכזי** - סופר אדמין מנהל את כל התוספים
- **אינטגרציה מלאה** - תוספים משתלבים במערכת בצורה חלקה

---

## 📊 מבנה מסד הנתונים

### טבלת `plugins` (תוספים)

```sql
CREATE TABLE plugins (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE, -- null = גלובלי
  company_id INT REFERENCES companies(id) ON DELETE CASCADE, -- null = גלובלי
  
  -- מידע בסיסי
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- URL לאייקון
  version VARCHAR(50) DEFAULT '1.0.0',
  author VARCHAR(200),
  
  -- סוג התוסף
  type VARCHAR(50) NOT NULL CHECK (type IN ('CORE', 'SCRIPT')),
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'ANALYTICS', 'MARKETING', 'PAYMENT', 'INVENTORY', 
    'COMMUNICATION', 'OPERATIONS', 'CUSTOMIZATION', 'LOYALTY'
  )),
  
  -- הגדרות הפעלה
  is_active BOOLEAN DEFAULT false,
  is_installed BOOLEAN DEFAULT false,
  is_built_in BOOLEAN DEFAULT false, -- תוספים מובנים (לא ניתן להסיר)
  
  -- הגדרות תוסף סקריפט
  script_url TEXT, -- URL לסקריפט (רק ל-SCRIPT plugins)
  script_content TEXT, -- תוכן סקריפט ישיר (רק ל-SCRIPT plugins)
  inject_location VARCHAR(50) CHECK (inject_location IN ('HEAD', 'BODY_START', 'BODY_END')),
  
  -- הגדרות תוסף ליבה
  config_schema JSONB, -- Schema להגדרות התוסף (Zod schema)
  config JSONB DEFAULT '{}'::jsonb, -- הגדרות התוסף הספציפיות
  
  -- תמחור
  is_free BOOLEAN DEFAULT true,
  price NUMERIC(10,2), -- מחיר חודשי (אם לא חינמי)
  currency VARCHAR(10) DEFAULT 'ILS',
  
  -- ניהול על ידי סופר אדמין
  is_editable BOOLEAN DEFAULT true,
  is_deletable BOOLEAN DEFAULT false, -- רק תוספים לא מובנים
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- מידע נוסף (תמונות, מסכים, וכו')
  requirements JSONB, -- דרישות (מינימום גרסה, תוספים אחרים, וכו')
  admin_notes TEXT, -- הערות לסופר אדמין
  display_order INT DEFAULT 0, -- סדר תצוגה במרקטפלייס
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  installed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_plugins_store_id ON plugins(store_id);
CREATE INDEX idx_plugins_company_id ON plugins(company_id);
CREATE INDEX idx_plugins_type ON plugins(type);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_is_active ON plugins(is_active);
CREATE INDEX idx_plugins_is_installed ON plugins(is_installed);
CREATE INDEX idx_plugins_slug ON plugins(slug);
CREATE INDEX idx_plugins_is_free ON plugins(is_free);
```

### טבלת `plugin_subscriptions` (מנויים לתוספים)

```sql
CREATE TABLE plugin_subscriptions (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  plugin_id INT REFERENCES plugins(id) ON DELETE CASCADE,
  
  -- סטטוס
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'FAILED'
  )),
  is_active BOOLEAN DEFAULT false,
  
  -- תאריכים
  start_date TIMESTAMP WITHOUT TIME ZONE,
  end_date TIMESTAMP WITHOUT TIME ZONE,
  next_billing_date TIMESTAMP WITHOUT TIME ZONE,
  
  -- תשלום
  payment_method VARCHAR(50), -- PayPlus, Stripe, וכו'
  payment_details JSONB, -- פרטי תשלום
  recurring_payment_uid VARCHAR(255), -- UID של הוראת הקבע ב-PayPlus
  card_token VARCHAR(255), -- Token לכרטיס אשראי
  
  -- מחיר
  monthly_price NUMERIC(10,2) NOT NULL,
  last_payment_date TIMESTAMP WITHOUT TIME ZONE,
  last_payment_amount NUMERIC(10,2),
  
  -- ביטול
  cancelled_at TIMESTAMP WITHOUT TIME ZONE,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  UNIQUE(store_id, plugin_id)
);

CREATE INDEX idx_plugin_subscriptions_store_id ON plugin_subscriptions(store_id);
CREATE INDEX idx_plugin_subscriptions_plugin_id ON plugin_subscriptions(plugin_id);
CREATE INDEX idx_plugin_subscriptions_status ON plugin_subscriptions(status);
CREATE INDEX idx_plugin_subscriptions_next_billing_date ON plugin_subscriptions(next_billing_date);
```

---

## 🏗️ ארכיטקטורת תוספים

### סוגי תוספים

#### 1. Core Plugins (תוספי ליבה)
תוספים שדורשים שילוב עמוק במערכת:
- **Premium Club** - מערכת רמות והטבות
- **Bundle Products** - מוצר באנדל
- **Cash on Delivery** - תשלום במזומן
- **Saturday Shutdown** - האתר מכובה בשבת
- **Reviews** - מערכת ביקורות מתקדמת

**מבנה:**
```
lib/plugins/core/
  premium-club/
    index.ts          # נקודת כניסה + hooks
    config.ts         # הגדרות ברירת מחדל
    types.ts          # TypeScript types
```

#### 2. Script Plugins (תוספי סקריפט)
תוספים קלילים שדורשים רק הזרקת סקריפט:
- **Google Analytics** - מעקב אנליטיקס
- **WhatsApp Floating Button** - אייקון וואטסאפ צף
- **Facebook Pixel** - פיקסל פייסבוק

**מבנה:**
- נשמר ב-`plugins.script_content` או `plugins.script_url`
- מוזרק אוטומטית ל-storefront

---

## 🔌 מערכת Hooks/Events

כל תוסף Core יכול להירשם לאירועים במערכת:

```typescript
export interface PluginHook {
  // אירועי עגלה
  onCartAdd?: (item: CartItem, storeId: number) => Promise<void>
  onCartUpdate?: (cart: Cart, storeId: number) => Promise<void>
  onCartRemove?: (itemId: string, storeId: number) => Promise<void>
  
  // אירועי הזמנה
  onOrderCreate?: (order: Order, storeId: number) => Promise<void>
  onOrderUpdate?: (order: Order, storeId: number) => Promise<void>
  onOrderComplete?: (order: Order, storeId: number) => Promise<void>
  
  // אירועי מוצר
  onProductView?: (product: Product, storeId: number) => Promise<void>
  onProductPurchase?: (product: Product, order: Order, storeId: number) => Promise<void>
  
  // אירועי תשלום
  onPaymentMethodAdd?: (methods: PaymentMethod[], storeId: number) => Promise<PaymentMethod[]>
  onPaymentProcess?: (order: Order, method: string, storeId: number) => Promise<PaymentResult>
  
  // אירועי storefront
  onStorefrontRender?: (shop: Store, storeId: number) => Promise<ReactNode | null>
  onCheckoutRender?: (checkout: Checkout, storeId: number) => Promise<ReactNode | null>
  
  // אירועי לוח זמנים
  onScheduleCheck?: (date: Date, storeId: number) => Promise<boolean>
}
```

---

## 💳 מערכת בילינג

### תהליך רכישת תוסף בתשלום

1. **משתמש בוחר תוסף** → `POST /api/plugins/[slug]/subscribe`
2. **בדיקת Token**:
   - אם יש token במנוי הבסיסי → יצירת הוראת קבע ישירה
   - אם אין token → יצירת payment page עם `createToken: true`
3. **תשלום ראשוני**:
   - PayPlus גובה את התשלום
   - Webhook מקבל עדכון
4. **יצירת הוראת קבע**:
   - אם יש token → יצירת הוראת קבע עם `instant_first_payment: true`
   - שמירת `recurringPaymentUid` ב-`plugin_subscriptions`
5. **חידוש אוטומטי**:
   - PayPlus גובה אוטומטית כל חודש
   - Webhook מעדכן את `last_payment_date`
   - אם תשלום נכשל → התוסף נכבה

### תהליך ביטול

1. **משתמש מבטל** → `POST /api/plugins/[slug]/cancel`
2. **כיבוי הוראת קבע** → `setRecurringPaymentValid(..., false)`
3. **עדכון DB** → status = CANCELLED, end_date = סוף החודש
4. **כיבוי התוסף** → is_active = false

---

## 🎨 UI Components

### דף מרקטפלייס: `/settings/plugins`

**תכונות:**
- רשימת כל התוספים הזמינים
- סינון לפי קטגוריה
- חיפוש
- תוספים חינמיים - כפתור "התקן"
- תוספים בתשלום - כפתור "התקן - ₪XX/חודש"
- תוספים מותקנים - כפתור "הגדרות" / "בטל מנוי"
- מצב התקנה/הפעלה

### דף ניהול תוספים לסופר אדמין: `/admin/plugins`

**תכונות:**
- רשימת כל התוספים
- עריכה: שם, תיאור, מחיר, קטגוריה
- הוספת תוסף חדש
- מחיקת תוסף (רק אם לא מובנה ולא בשימוש)
- הגדרת תמחור
- תצוגה מקדימה

### עדכון דף המנוי: `/settings?tab=subscription`

**הוספת סעיף "תוספים פעילים":**
- רשימת כל התוספים הפעילים
- מחיר כל תוסף
- סכום כולל (מנוי בסיס + תוספים)
- כפתור "בטל מנוי" לכל תוסף

---

## 📡 API Routes

### Plugins Management

- `GET /api/plugins` - רשימת כל התוספים הזמינים
- `POST /api/plugins` - התקנת תוסף חדש
- `GET /api/plugins/active` - רשימת תוספים פעילים לחנות
- `GET /api/plugins/[slug]` - פרטי תוסף
- `PUT /api/plugins/[slug]` - עדכון הגדרות תוסף
- `DELETE /api/plugins/[slug]` - הסרת תוסף
- `POST /api/plugins/[slug]/activate` - הפעלת תוסף
- `DELETE /api/plugins/[slug]/activate` - כיבוי תוסף

### Billing

- `POST /api/plugins/[slug]/subscribe` - רכישת תוסף בתשלום
- `POST /api/plugins/[slug]/cancel` - ביטול מנוי
- `POST /api/plugins/billing/webhook` - Webhook לחיובים חוזרים
- `GET /api/plugins/billing/callback` - Callback לאחר תשלום

### Admin

- `GET /api/admin/plugins` - רשימת כל התוספים (סופר אדמין)
- `POST /api/admin/plugins` - יצירת תוסף חדש
- `PUT /api/admin/plugins/[id]` - עדכון תוסף
- `DELETE /api/admin/plugins/[id]` - מחיקת תוסף

---

## 🔧 Premium Club כפלאגין

### הגדרת התוסף

```typescript
{
  slug: 'premium-club',
  name: 'חברי מועדון פרימיום',
  description: 'מערכת רמות מתקדמת עם הנחות, הטבות ופיצ\'רים נוספים',
  type: 'CORE',
  category: 'LOYALTY',
  version: '1.0.0',
  is_built_in: true,
  is_free: false, // בתשלום
  price: 49.90, // מחיר חודשי
  defaultConfig: {
    enabled: false,
    tiers: [...],
    benefits: {...},
    notifications: {...}
  }
}
```

### אינטגרציה עם מערכת הנקודות

- Premium Club משתמש ב-`customer_loyalty_tiers` ו-`customer_loyalty_points`
- `pointsMultiplier` מחובר למערכת הנקודות
- עדכון רמה אוטומטי אחרי הזמנה

---

## 📋 שלבי יישום

### שלב 1: תשתית בסיסית ⏳
1. עדכון סכמת מסד הנתונים
2. יצירת Types & Interfaces
3. Registry - רישום כל התוספים המובנים
4. Loader - טעינה והרצה של תוספים

### שלב 2: API Routes ⏳
1. Plugins Management API
2. Billing API
3. Admin API

### שלב 3: UI Components ⏳
1. דף `/settings/plugins`
2. עדכון דף המנוי
3. דף `/admin/plugins`

### שלב 4: אינטגרציה עם PayPlus ⏳
1. יצירת הוראת קבע
2. Webhook לחיובים
3. ביטול מנוי

### שלב 5: Premium Club כפלאגין ⏳
1. העברת Premium Club למערכת פלאגינים
2. אינטגרציה עם מערכת הנקודות
3. UI במרקטפלייס

---

## 🎯 סיכום

מערכת מרקטפלייס מקצועית שמאפשרת:
- ✅ תוספים חינמיים ותשלום
- ✅ ניהול מרכזי על ידי סופר אדמין
- ✅ אינטגרציה עם PayPlus לבילינג
- ✅ מערכת hooks/events גמישה
- ✅ תמיכה ב-Core ו-Script plugins
- ✅ Premium Club כפלאגין בתשלום

**זה בדיוק כמו Shopify App Store! 🚀**



