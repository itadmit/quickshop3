# מערכת גבייה ומנויים - QuickShop

## סקירה כללית

מערכת הגבייה של QuickShop מנהלת את כל תהליך החיוב של בעלי חנויות, כולל:
- תקופת ניסיון (7 ימים)
- מנויים חודשיים (Lite / Pro)
- עמלות על עסקאות (Pro בלבד - 0.5%)
- קופונים והטבות

---

## 📋 תוכניות מנוי

### Quick Shop Lite - ₪299/חודש + מע"מ
- אתר תדמית / קטלוג מוצרים
- עיצוב Drag & Drop
- דומיין מותאם אישית
- טופס יצירת קשר
- **ללא אפשרות רכישה אונליין**

### Quick Shop Pro - ₪399/חודש + מע"מ + 0.5% עמלה
- כל מה שב-Lite
- מערכת סליקה מלאה
- ניהול משלוחים
- קופונים ומבצעים
- מועדון לקוחות
- אינטגרציות (Facebook Pixel, Google Analytics, TikTok)

---

## 🗄️ מבנה מסד הנתונים

### qs_subscription_plans - תוכניות מנוי
```sql
CREATE TABLE qs_subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,           -- 'lite' / 'pro'
  display_name VARCHAR(100) NOT NULL,         -- 'Quick Shop Lite'
  description TEXT,
  price NUMERIC(10,2) NOT NULL,               -- 299 / 399
  vat_percentage NUMERIC(5,2) DEFAULT 18,
  commission_percentage NUMERIC(5,4) DEFAULT 0, -- 0 / 0.005
  has_checkout BOOLEAN DEFAULT true,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false
);
```

### qs_store_subscriptions - מנויי חנויות
```sql
CREATE TABLE qs_store_subscriptions (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id),
  plan_id INT REFERENCES qs_subscription_plans(id),
  
  -- Status: trial, active, past_due, blocked, cancelled, expired
  status VARCHAR(20) DEFAULT 'trial',
  
  -- Trial
  trial_ends_at TIMESTAMP,
  
  -- Billing Cycle
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  next_payment_date TIMESTAMP,
  
  -- Payment History
  last_payment_date TIMESTAMP,
  last_payment_amount NUMERIC(10,2),
  last_payment_status VARCHAR(20),
  failed_payment_count INT DEFAULT 0,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  -- PayPlus
  payplus_customer_uid VARCHAR(100),
  
  UNIQUE(store_id)
);
```

### qs_payment_tokens - טוקני תשלום
```sql
CREATE TABLE qs_payment_tokens (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id),
  
  payplus_token_uid VARCHAR(100) NOT NULL,
  payplus_customer_uid VARCHAR(100),
  
  -- Card Info (display only)
  four_digits VARCHAR(4),
  expiry_month VARCHAR(2),
  expiry_year VARCHAR(4),
  brand VARCHAR(50),
  
  is_primary BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP
);
```

### qs_billing_transactions - עסקאות
```sql
CREATE TABLE qs_billing_transactions (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id),
  subscription_id INT,
  
  -- Type: subscription, commission, one_time, refund
  type VARCHAR(30) NOT NULL,
  
  amount NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  
  -- Status: pending, processing, success, failed, refunded
  status VARCHAR(20) DEFAULT 'pending',
  
  -- PayPlus
  payplus_transaction_uid VARCHAR(100),
  payplus_approval_num VARCHAR(50),
  
  description TEXT,
  failure_reason TEXT
);
```

### qs_commission_charges - עמלות
```sql
CREATE TABLE qs_commission_charges (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id),
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  charge_type VARCHAR(20) DEFAULT 'monthly',
  
  total_orders INT DEFAULT 0,
  total_sales NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL,
  commission_amount NUMERIC(10,2),
  vat_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  
  -- Status: calculated, charged, failed
  status VARCHAR(20) DEFAULT 'calculated',
  charged_at TIMESTAMP
);
```

### qs_coupons - קופונים
```sql
CREATE TABLE qs_coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  
  -- Type: extra_trial_days, free_months, first_payment_discount, recurring_discount
  type VARCHAR(30) NOT NULL,
  
  value NUMERIC(10,2) NOT NULL,
  value_type VARCHAR(20) DEFAULT 'fixed', -- fixed / percent
  max_discount NUMERIC(10,2),
  
  first_time_only BOOLEAN DEFAULT true,
  max_uses INT,
  current_uses INT DEFAULT 0,
  
  starts_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  
  is_active BOOLEAN DEFAULT true
);
```

---

## 🔄 תהליכי עבודה

### 1. הרשמה חדשה
```
1. משתמש נרשם → נוצרת חנות
2. נוצר מנוי בסטטוס 'trial' עם trial_ends_at = now() + 7 days
3. המשתמש יכול לעבוד עם המערכת 7 ימים
4. באנר בהדר מציג כמה ימים נותרו
```

### 2. בחירת מסלול ותשלום
```
1. משתמש בוחר תוכנית (Lite/Pro)
2. אופציונלי: מזין קוד קופון → בדיקה ב-/api/billing/coupon/validate
3. לחיצה על "התחל עכשיו" → קריאה ל-/api/billing/subscribe
4. מועבר לדף תשלום של PayPlus
5. PayPlus שולח IPN ל-/api/billing/ipn
6. המערכת:
   - מעדכנת סטטוס ל-'active'
   - שומרת token לחיובים עתידיים
   - רושמת עסקה ב-qs_billing_transactions
   - אם יש קופון - מיישמת אותו
```

### 3. חיוב חודשי אוטומטי
```
Cron: /api/cron/billing (רץ כל יום ב-00:00)

1. מחסום חשבונות שתקופת הניסיון שלהם נגמרה
2. מחפש מנויים שה-next_payment_date שלהם היום
3. לכל מנוי:
   - מושך token מ-qs_payment_tokens
   - מחייב דרך PayPlus
   - מעדכן next_payment_date לחודש הבא
   - רושם עסקה
4. אם נכשל 3 פעמים → חוסם את החנות
```

### 4. גביית עמלות
```
Cron: /api/cron/commissions (רץ ב-1 ו-15 לחודש)

ב-1 לחודש:
1. מחשב סה"כ מכירות לכל חנות Pro בחודש הקודם
2. יוצר רשומה ב-qs_commission_charges
3. מחייב את החנות

ב-15 לחודש:
- מחייב רק חנויות עם עמלות מעל ₪5,000
```

### 5. ביטול מנוי
```
1. משתמש לוחץ "בטל מנוי"
2. קריאה ל-/api/billing/cancel
3. מסומן cancel_at_period_end = true
4. המנוי פעיל עד סוף התקופה הנוכחית
5. ב-Cron - כשמגיע סוף התקופה, הסטטוס משתנה ל-'expired'
```

---

## 🔌 אינטגרציה עם PayPlus

### הגדרות סביבה (.env)
```env
# PayPlus API
PAYPLUS_API_KEY=e6151949-cb96-47c1-a798-bbdceed88346
PAYPLUS_SECRET_KEY=1176a689-53f1-469b-b852-dbd3f3b71817
PAYPLUS_TERMINAL_UID=ec44969d-79ed-49a3-8c28-9a41fc8c0132
PAYPLUS_CASHIER_UID=881b5ebd-54f6-4175-96a2-4925faa875ba
PAYPLUS_PAYMENT_PAGE_UID=a4117ca8-bba6-497c-ba26-05619528c94a
PAYPLUS_API_URL=https://restapidev.payplus.co.il/api/v1.0  # Staging

# Cron Jobs
CRON_SECRET=your-secure-cron-secret
```

### PayPlus Client (`/lib/payplus.ts`)
```typescript
const payplus = getPayPlusClient();

// יצירת לינק תשלום
await payplus.generatePaymentLink({
  amount: 470.82, // כולל מע"מ
  customer: { customer_name: 'חנות', email: 'owner@store.com' },
  items: [{ name: 'מנוי Pro', quantity: 1, price: 470.82 }],
  create_token: true,
  refURL_success: 'https://quickshop.co.il/billing/success',
  refURL_failure: 'https://quickshop.co.il/billing/failure',
  refURL_callback: 'https://quickshop.co.il/api/billing/ipn',
});

// חיוב מטוקן שמור
await payplus.chargeFromToken({
  amount: 470.82,
  token: 'saved-token-uid',
  products: [{ name: 'חידוש מנוי', quantity: 1, price: 470.82 }],
});
```

---

## 📡 API Endpoints

### תשלומים (Billing)
| Method | Endpoint | תיאור |
|--------|----------|--------|
| GET | `/api/billing/plans` | רשימת תוכניות |
| GET | `/api/billing/status` | סטטוס מנוי נוכחי |
| POST | `/api/billing/subscribe` | יצירת מנוי חדש |
| POST | `/api/billing/cancel` | ביטול מנוי |
| POST | `/api/billing/ipn` | IPN מ-PayPlus |
| POST | `/api/billing/coupon/validate` | בדיקת קופון |
| POST | `/api/billing/coupon/apply` | יישום קופון |

### Cron Jobs
| Method | Endpoint | תיאור | תזמון |
|--------|----------|--------|--------|
| POST | `/api/cron/billing` | חיוב חודשי | יומי 00:00 |
| POST | `/api/cron/commissions` | חיוב עמלות | 1 ו-15 לחודש |

### סופר אדמין
| Method | Endpoint | תיאור |
|--------|----------|--------|
| GET | `/api/admin/stats` | סטטיסטיקות כלליות |
| GET | `/api/admin/stores` | רשימת חנויות |
| GET | `/api/admin/subscriptions` | רשימת מנויים |
| GET | `/api/admin/transactions` | היסטוריית עסקאות |
| GET | `/api/admin/commissions` | דוח עמלות |
| GET/POST | `/api/admin/coupons` | ניהול קופונים |

---

## 🎟️ סוגי קופונים

| סוג | תיאור | דוגמה |
|-----|-------|-------|
| `extra_trial_days` | הוספת ימי ניסיון | TRIAL14 = +14 ימים |
| `free_months` | חודשים חינם | WELCOME3 = 3 חודשים חינם |
| `first_payment_discount` | הנחה מתשלום ראשון | SAVE50 = 50% הנחה |
| `recurring_discount` | הנחה קבועה | VIP20 = ₪20 הנחה כל חודש |

---

## 🔒 הגנות ואבטחה

### חסימת דומיין
```typescript
// /api/settings/store - PUT
if (body.domain && body.domain.trim() !== '') {
  const subscription = await queryOne(
    'SELECT status FROM qs_store_subscriptions WHERE store_id = $1',
    [user.store_id]
  );
  
  if (!subscription || subscription.status === 'trial' || subscription.status === 'blocked') {
    return NextResponse.json({ 
      error: 'חיבור דומיין אפשרי רק למנויים משלמים',
      code: 'SUBSCRIPTION_REQUIRED'
    }, { status: 403 });
  }
}
```

### זיהוי סופר אדמין
```typescript
// /lib/auth.ts
export function isSuperAdmin(email: string): boolean {
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
  return superAdminEmails.includes(email);
}
```

### אימות Cron
```typescript
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}
```

---

## 📊 דשבורד סופר אדמין

### `/admin` - לוח בקרה ראשי
- סה"כ חנויות
- חנויות פעילות / בניסיון / חסומות
- הכנסה חודשית
- עמלות בהמתנה

### `/admin/stores` - ניהול חנויות
- רשימת כל החנויות
- סינון לפי סטטוס
- חיפוש לפי שם / דומיין / אימייל

### `/admin/subscriptions` - מנויים
- סיכום מנויים
- היסטוריית תשלומים

### `/admin/commissions` - עמלות
- עמלות בהמתנה
- עמלות שנגבו
- סינון לפי תקופה

### `/admin/coupons` - קופונים
- יצירת קופונים חדשים
- עריכה / הפעלה / כיבוי
- מעקב שימוש

---

## 🔧 Upstash Cron הגדרות

ב-Vercel Dashboard או `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/billing",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/commissions",
      "schedule": "0 0 1,15 * *"
    }
  ]
}
```

---

## 📝 צ'קליסט לפני עלייה לפרודקשן

- [ ] להחליף PAYPLUS_API_URL לפרודקשן
- [ ] להגדיר CRON_SECRET חזק
- [ ] להגדיר SUPER_ADMIN_EMAILS
- [ ] לבדוק IPN webhook בפייפלוס
- [ ] להריץ סכמה במסד פרודקשן
- [ ] לאמת תהליך תשלום מקצה לקצה
- [ ] לבדוק מיילים מפייפלוס

---

## 🆘 פתרון בעיות נפוצות

### חיוב נכשל
1. לבדוק ב-`qs_billing_transactions` את `failure_reason`
2. לבדוק שה-token פעיל ב-`qs_payment_tokens`
3. לבדוק לוגים ב-`qs_payplus_ipn_log`

### חנות חסומה
1. לבדוק `qs_store_subscriptions.status`
2. לבדוק `failed_payment_count`
3. אפשרות: לאפס ידנית ולהפעיל מחדש

### קופון לא עובד
1. לבדוק תוקף (`starts_at`, `expires_at`)
2. לבדוק `is_active`
3. לבדוק `max_uses` vs `current_uses`
4. לבדוק ב-`qs_coupon_usage` אם כבר נעשה שימוש

