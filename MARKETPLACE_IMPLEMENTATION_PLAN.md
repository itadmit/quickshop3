# תוכנית יישום מרקטפלייס - Marketplace Implementation Plan

**תאריך:** 2025-01-XX  
**מטרה:** יישום מערכת מרקטפלייס מלאה כמו Shopify עם Premium Club כפלאגין בתשלום

---

## 📊 סיכום המצב הנוכחי

### מה יש כרגע:
1. ✅ **Premium Club** (`/settings/premium-club`) - מערכת רמות והטבות, עובדת טוב
2. ✅ **Loyalty** (`/loyalty`) - מערכת נקודות נאמנות, UI בסיסי
3. ✅ **מסד נתונים** - טבלאות קיימות ל-Premium Club ו-Loyalty

### מה חסר:
1. ⚠️ **מערכת מרקטפלייס** - אין כרגע
2. ⚠️ **מערכת בילינג** - אין תמיכה בתשלום חודשי
3. ⚠️ **ניהול פלאגינים** - אין מערכת מרכזית
4. ⚠️ **אינטגרציה** - Premium Club לא מחובר למערכת נקודות

---

## 🎯 המטרה

לבנות מערכת מרקטפלייס מקצועית שמאפשרת:
- **תוספים חינמיים** - זמינים מיד לכל החנויות
- **תוספים בתשלום** - מנוי חודשי עם הוראת קבע אוטומטית
- **ניהול מרכזי** - סופר אדמין מנהל את כל התוספים
- **Premium Club כפלאגין** - בתשלום חודשי

---

## 📋 שלבי יישום

### שלב 1: עדכון מסד הנתונים ✅

**מה עשינו:**
- ✅ הוספנו טבלת `plugins` למרקטפלייס
- ✅ הוספנו טבלת `plugin_subscriptions` למנויים
- ✅ שמרנו את `premium_club_config` לתאימות לאחור

**מה צריך לעשות:**
1. ⏳ להריץ את הסכמה המעודכנת (לאפס את מסד הנתונים)
2. ⏳ לוודא שהכל עובד

---

### שלב 2: תשתית Core ⏳

**מה צריך לעשות:**

#### 2.1 Types & Interfaces
```typescript
// src/types/plugin.ts
export interface Plugin {
  id: number
  store_id: number | null
  name: string
  slug: string
  description: string | null
  icon: string | null
  version: string
  author: string | null
  type: 'CORE' | 'SCRIPT'
  category: PluginCategory
  is_active: boolean
  is_installed: boolean
  is_built_in: boolean
  script_url: string | null
  script_content: string | null
  inject_location: 'HEAD' | 'BODY_START' | 'BODY_END' | null
  config_schema: any | null
  config: any
  is_free: boolean
  price: number | null
  currency: string
  metadata: any
  requirements: any | null
  admin_notes: string | null
  display_order: number
  created_at: Date
  updated_at: Date
  installed_at: Date | null
}

export interface PluginSubscription {
  id: number
  store_id: number
  plugin_id: number
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'FAILED'
  is_active: boolean
  start_date: Date | null
  end_date: Date | null
  next_billing_date: Date | null
  payment_method: string | null
  payment_details: any | null
  recurring_payment_uid: string | null
  card_token: string | null
  monthly_price: number
  last_payment_date: Date | null
  last_payment_amount: number | null
  cancelled_at: Date | null
  cancellation_reason: string | null
  created_at: Date
  updated_at: Date
}
```

#### 2.2 Registry - רישום תוספים
```typescript
// src/lib/plugins/registry.ts
export const builtInPlugins: PluginDefinition[] = [
  {
    slug: 'premium-club',
    name: 'חברי מועדון פרימיום',
    description: 'מערכת רמות מתקדמת עם הנחות, הטבות ופיצ\'רים נוספים',
    type: 'CORE',
    category: 'LOYALTY',
    version: '1.0.0',
    is_built_in: true,
    is_free: false,
    price: 49.90,
    defaultConfig: {...}
  },
  // ... תוספים נוספים
]
```

#### 2.3 Loader - טעינת תוספים
```typescript
// src/lib/plugins/loader.ts
export async function loadActivePlugins(storeId: number): Promise<Plugin[]>
export async function executePluginHook(hook: string, ...args: any[]): Promise<void>
```

---

### שלב 3: API Routes ⏳

**מה צריך לעשות:**

#### 3.1 Plugins Management
- `GET /api/plugins` - רשימת כל התוספים
- `POST /api/plugins` - התקנת תוסף
- `GET /api/plugins/active` - תוספים פעילים
- `GET /api/plugins/[slug]` - פרטי תוסף
- `PUT /api/plugins/[slug]` - עדכון הגדרות
- `DELETE /api/plugins/[slug]` - הסרת תוסף
- `POST /api/plugins/[slug]/activate` - הפעלת תוסף
- `DELETE /api/plugins/[slug]/activate` - כיבוי תוסף

#### 3.2 Billing
- `POST /api/plugins/[slug]/subscribe` - רכישת תוסף בתשלום
- `POST /api/plugins/[slug]/cancel` - ביטול מנוי
- `POST /api/plugins/billing/webhook` - Webhook לחיובים
- `GET /api/plugins/billing/callback` - Callback לאחר תשלום

#### 3.3 Admin
- `GET /api/admin/plugins` - רשימת כל התוספים
- `POST /api/admin/plugins` - יצירת תוסף חדש
- `PUT /api/admin/plugins/[id]` - עדכון תוסף
- `DELETE /api/admin/plugins/[id]` - מחיקת תוסף

---

### שלב 4: UI Components ⏳

**מה צריך לעשות:**

#### 4.1 דף מרקטפלייס: `/settings/plugins`
- רשימת כל התוספים הזמינים
- סינון לפי קטגוריה
- חיפוש
- תוספים חינמיים - כפתור "התקן"
- תוספים בתשלום - כפתור "התקן - ₪XX/חודש"
- תוספים מותקנים - כפתור "הגדרות" / "בטל מנוי"

#### 4.2 דף ניהול לסופר אדמין: `/admin/plugins`
- רשימת כל התוספים
- עריכה: שם, תיאור, מחיר, קטגוריה
- הוספת תוסף חדש
- מחיקת תוסף
- הגדרת תמחור

#### 4.3 עדכון דף המנוי: `/settings?tab=subscription`
- הוספת סעיף "תוספים פעילים"
- רשימת כל התוספים הפעילים
- מחיר כל תוסף
- סכום כולל
- כפתור "בטל מנוי" לכל תוסף

---

### שלב 5: אינטגרציה עם PayPlus ⏳

**מה צריך לעשות:**

#### 5.1 יצירת הוראת קבע
```typescript
// src/lib/plugins/billing.ts
export async function createPluginRecurringPayment(
  storeId: number,
  pluginId: number,
  cardToken: string
): Promise<void>
```

#### 5.2 Webhook לחיובים
```typescript
// src/app/api/plugins/billing/webhook/route.ts
export async function POST(request: NextRequest): Promise<NextResponse>
```

#### 5.3 ביטול מנוי
```typescript
export async function cancelPluginSubscription(
  storeId: number,
  pluginId: number
): Promise<void>
```

---

### שלב 6: Premium Club כפלאגין ⏳

**מה צריך לעשות:**

#### 6.1 העברת Premium Club למערכת פלאגינים
- יצירת פלאגין `premium-club` ב-registry
- העברת הלוגיקה ל-`lib/plugins/core/premium-club/`
- עדכון ה-API routes להשתמש בפלאגין

#### 6.2 אינטגרציה עם מערכת הנקודות
- חיבור `pointsMultiplier` למערכת הנקודות
- עדכון רמה אוטומטי אחרי הזמנה
- UI לניהול נקודות בדף Premium Club

#### 6.3 UI במרקטפלייס
- הוספת Premium Club למרקטפלייס
- הגדרת מחיר חודשי (₪49.90)
- תצוגה של התוסף במרקטפלייס

---

## 🔧 קבצים שצריך ליצור/לעדכן

### קבצים חדשים:
1. `src/types/plugin.ts` - Types לפלאגינים
2. `src/lib/plugins/registry.ts` - רישום תוספים
3. `src/lib/plugins/loader.ts` - טעינת תוספים
4. `src/lib/plugins/billing.ts` - לוגיקת בילינג
5. `src/lib/plugins/core/premium-club/index.ts` - Premium Club כפלאגין
6. `src/app/(dashboard)/settings/plugins/page.tsx` - דף מרקטפלייס
7. `src/app/(dashboard)/admin/plugins/page.tsx` - דף ניהול (סופר אדמין)
8. `src/app/api/plugins/route.ts` - API routes
9. `src/app/api/plugins/[slug]/route.ts` - API routes לתוסף ספציפי
10. `src/app/api/plugins/billing/webhook/route.ts` - Webhook

### קבצים לעדכון:
1. `sql/schema.sql` - ✅ כבר עודכן
2. `src/app/(dashboard)/settings/premium-club/page.tsx` - להעביר למערכת פלאגינים
3. `src/app/api/premium-club/config/route.ts` - להעביר למערכת פלאגינים
4. `src/lib/services/premiumClub.ts` - להעביר ל-`lib/plugins/core/premium-club/`

---

## 📝 הערות חשובות

### 1. מסד נתונים
- **לא לעשות מיגרציות** - להכניס הכל לסכמה ואז לאפס
- לשמור את `premium_club_config` לתאימות לאחור
- בעתיד להעביר את כל הלוגיקה למערכת פלאגינים

### 2. Premium Club
- זה צריך להיות **פלאגין בתשלום** במרקטפלייס
- מחיר חודשי: ₪49.90
- צריך להיות מחובר למערכת הנקודות

### 3. בילינג
- כל תוסף בתשלום = מנוי נפרד
- כל מנוי = הוראת קבע נפרדת ב-PayPlus
- המשתמש רואה את כל התוספים בהגדרות המנוי

### 4. חשיבה כמו Shopify
- כל תוסף = אפליקציה נפרדת
- ניהול מרכזי על ידי סופר אדמין
- תמיכה בתוספים חינמיים ותשלום
- אינטגרציה מלאה עם המערכת

---

## ✅ צ'קליסט יישום

### תשתית:
- [ ] עדכון מסד נתונים ✅
- [ ] Types & Interfaces
- [ ] Registry
- [ ] Loader

### API:
- [ ] Plugins Management API
- [ ] Billing API
- [ ] Admin API

### UI:
- [ ] דף מרקטפלייס (`/settings/plugins`)
- [ ] דף ניהול (`/admin/plugins`)
- [ ] עדכון דף המנוי

### אינטגרציה:
- [ ] PayPlus - יצירת הוראת קבע
- [ ] PayPlus - Webhook
- [ ] PayPlus - ביטול מנוי

### Premium Club:
- [ ] העברת Premium Club למערכת פלאגינים
- [ ] אינטגרציה עם מערכת הנקודות
- [ ] UI במרקטפלייס

---

## 🚀 השלבים הבאים

1. **לאפס את מסד הנתונים** עם הסכמה החדשה
2. **ליצור את Types & Interfaces**
3. **ליצור את Registry ו-Loader**
4. **ליצור את API Routes**
5. **ליצור את UI Components**
6. **לחבר את PayPlus**
7. **להעביר את Premium Club למערכת פלאגינים**

---

**זה בדיוק כמו Shopify App Store! 🚀**



