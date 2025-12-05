# 🌐 מערכת תרגומים (i18n) - Quickshop3 Translation System

<div dir="rtl">

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [מבנה מערכת התרגומים](#מבנה-מערכת-התרגומים)
3. [JSON Translation Files](#json-translation-files)
4. [Database Translations](#database-translations)
5. [שימוש בקומפוננטות](#שימוש-בקומפוננטות)
6. [ניהול תרגומים מהדשבורד](#ניהול-תרגומים-מהדשבורד)
7. [Fallback Strategy](#fallback-strategy)
8. [יישום טכני](#יישום-טכני)

---

## 🎯 סקירה כללית

Quickshop3 כוללת **מערכת תרגומים דו-רבדית** בסגנון Shopify - תמיכה מלאה בשפות מרובות ללא תוכן hardcoded.

### שני סוגי תרגומים:

1. **System Translations** - תרגומי מערכת (JSON גלובלי)
   - כפתורים, שדות, הודעות שגיאה
   - "שם פרטי", "מעבר לתשלום", "הוסף לעגלה"
   - משותפים לכל החנויות

2. **Template/Content Translations** - תרגומי תבניות ותוכן (DB מותאם)
   - תוכן דינמי מ-Customizer
   - "ברוכים הבאים לחנות שלנו", "מעבר לכל המוצרים"
   - מותאם לכל חנות, ניתן לתרגום בנפרד

### עקרונות יסוד:

1. **אפס תוכן hardcoded** - כל טקסט מגיע ממערכת התרגומים
2. **JSON Files** - תרגומי מערכת בסיסיים (System Translations)
3. **Database Translations** - תרגומי תבניות ותוכן (Template Translations)
4. **Fallback Strategy** - חזרה לשפת ברירת מחדל אם חסר תרגום
5. **Admin Interface** - ממשק ניהול תרגומים מהדשבורד
6. **Auto-detection** - זיהוי שפה אוטומטי לפי locale של החנות

📖 **[מדריך מערכת דו-רבדית →](./I18N_TWO_LEVEL_SYSTEM.md)** - קריאה חובה!

### שפות נתמכות:

- **עברית (he-IL)** - שפת ברירת מחדל
- **אנגלית (en-US)**
- **ערבית (ar-SA)** - עם תמיכה ב-RTL
- **רוסית (ru-RU)**
- **שפות נוספות** - ניתן להוסיף בקלות

---

## 🏗️ מבנה מערכת התרגומים

### ארכיטקטורה היברידית:

```
┌─────────────────────────────────────────────┐
│     Translation System (מרכזי)              │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│   JSON   │  │   DB     │  │  Fallback│
│  Files   │  │Translations│ │  (he-IL) │
└──────────┘  └──────────┘  └──────────┘
```

### סדר עדיפויות:

1. **Database Translations** - תרגומים מותאמים אישית מהדשבורד (עדיפות גבוהה)
2. **JSON Files** - תרגומים סטטיים (עדיפות בינונית)
3. **Fallback** - שפת ברירת מחדל (עברית)

---

## 📄 JSON Translation Files

### מבנה תיקיות:

```
src/
└── locales/
    ├── he-IL/
    │   ├── common.json          # תרגומים כלליים
    │   ├── storefront.json      # תרגומי פרונט
    │   ├── products.json        # תרגומי מוצרים
    │   ├── cart.json            # תרגומי עגלה
    │   ├── checkout.json        # תרגומי צ'ק אאוט
    │   └── errors.json          # הודעות שגיאה
    ├── en-US/
    │   ├── common.json
    │   ├── storefront.json
    │   └── ...
    └── ar-SA/
        └── ...
```

### דוגמה לקובץ JSON:

#### `locales/he-IL/storefront.json`
```json
{
  "home": {
    "title": "ברוכים הבאים לחנות שלנו",
    "subtitle": "מגוון רחב של מוצרים איכותיים במחירים מעולים",
    "cta": "גלה את כל המוצרים",
    "featured_products": "מוצרים מובילים",
    "new_arrivals": "מוצרים חדשים",
    "collections": "קטגוריות",
    "view_all": "צפה בכל המוצרים"
  },
  "product": {
    "add_to_cart": "הוסף לעגלה",
    "buy_now": "קנה עכשיו",
    "out_of_stock": "אזל מהמלאי",
    "in_stock": "במלאי",
    "description": "תיאור המוצר",
    "reviews": "ביקורות",
    "related_products": "מוצרים קשורים"
  },
  "cart": {
    "title": "עגלת קניות",
    "empty": "העגלה שלך ריקה",
    "continue_shopping": "המשך לקנות",
    "subtotal": "סה\"כ פריטים",
    "total": "סה\"כ",
    "checkout": "המשך לצ'ק אאוט"
  },
  "checkout": {
    "title": "צ'ק אאוט",
    "shipping": "פרטי משלוח",
    "payment": "תשלום",
    "complete_order": "השלם הזמנה"
  }
}
```

#### `locales/en-US/storefront.json`
```json
{
  "home": {
    "title": "Welcome to Our Store",
    "subtitle": "Wide variety of quality products at great prices",
    "cta": "Discover All Products",
    "featured_products": "Featured Products",
    "new_arrivals": "New Arrivals",
    "collections": "Collections",
    "view_all": "View All Products"
  },
  "product": {
    "add_to_cart": "Add to Cart",
    "buy_now": "Buy Now",
    "out_of_stock": "Out of Stock",
    "in_stock": "In Stock",
    "description": "Product Description",
    "reviews": "Reviews",
    "related_products": "Related Products"
  },
  "cart": {
    "title": "Shopping Cart",
    "empty": "Your cart is empty",
    "continue_shopping": "Continue Shopping",
    "subtotal": "Subtotal",
    "total": "Total",
    "checkout": "Proceed to Checkout"
  },
  "checkout": {
    "title": "Checkout",
    "shipping": "Shipping Information",
    "payment": "Payment",
    "complete_order": "Complete Order"
  }
}
```

### מבנה JSON מומלץ:

```typescript
// מבנה מומלץ - nested objects
{
  "namespace": {
    "key": "value",
    "nested": {
      "key": "value"
    }
  }
}

// דוגמה:
{
  "common": {
    "buttons": {
      "save": "שמור",
      "cancel": "ביטול",
      "delete": "מחק"
    },
    "messages": {
      "success": "הפעולה בוצעה בהצלחה",
      "error": "אירעה שגיאה"
    }
  }
}
```

---

## 🗄️ Database Translations

### סכמת מסד נתונים:

```sql
-- Translation Keys (מפתחות תרגום)
CREATE TABLE translation_keys (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  namespace VARCHAR(100) NOT NULL, -- 'storefront', 'products', 'common'
  key_path VARCHAR(255) NOT NULL, -- 'home.title', 'product.add_to_cart'
  default_value TEXT, -- ערך ברירת מחדל (עברית)
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, namespace, key_path)
);

CREATE INDEX idx_translation_keys_store ON translation_keys(store_id);
CREATE INDEX idx_translation_keys_namespace ON translation_keys(namespace);

-- Translations (תרגומים)
CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  translation_key_id INT REFERENCES translation_keys(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL, -- 'he-IL', 'en-US', 'ar-SA'
  value TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(translation_key_id, locale)
);

CREATE INDEX idx_translations_key ON translations(translation_key_id);
CREATE INDEX idx_translations_locale ON translations(locale);
```

### למה Database Translations?

1. **עריכה מהדשבורד** - בעל החנות יכול לערוך תרגומים
2. **תרגומים מותאמים** - כל חנות יכולה להתאים תרגומים **מותאמים אישית**
3. **תרגומים דינמיים** - ניתן לעדכן בלי deploy
4. **Override JSON** - תרגומים מ-DB דורסים JSON (עדיפות גבוהה)
5. **בידוד בין חנויות** - כל חנות עם התרגומים שלה

📖 **[מדריך התאמת תרגומים לכל חנות →](./I18N_STORE_CUSTOMIZATION.md)**

---

## 💻 שימוש בקומפוננטות

### Hook לשימוש בתרגומים:

```typescript
// src/hooks/useTranslation.ts
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';

interface TranslationOptions {
  namespace?: string;
  locale?: string;
  fallback?: string;
}

export function useTranslation(namespace: string = 'common') {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  
  // קבלת locale מהחנות (מ-DB או מ-params)
  const locale = useMemo(() => {
    // TODO: קבלה מ-store data
    return 'he-IL'; // ברירת מחדל
  }, [storeSlug]);
  
  const t = useCallback((key: string, options?: TranslationOptions) => {
    // 1. נסה DB translations
    // 2. נסה JSON files
    // 3. Fallback לשפת ברירת מחדל
    // 4. Fallback ל-key עצמו
    return getTranslation(key, { namespace, locale, ...options });
  }, [namespace, locale]);
  
  return { t, locale };
}
```

### שימוש בקומפוננטות:

```typescript
// ✅ טוב - שימוש ב-useTranslation
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export function HomePageContent() {
  const { t } = useTranslation('storefront');
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
      <button>{t('home.cta')}</button>
    </div>
  );
}

// ❌ רע - hardcoded text
export function HomePageContent() {
  return (
    <div>
      <h1>ברוכים הבאים לחנות שלנו</h1> {/* ❌ hardcoded */}
      <p>מגוון רחב של מוצרים</p> {/* ❌ hardcoded */}
    </div>
  );
}
```

### Server Components:

```typescript
// ✅ טוב - Server Component עם תרגומים
import { getTranslations } from '@/lib/i18n/server';

export default async function HomePage({ params }) {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);
  const t = await getTranslations(store.locale, 'storefront');
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
    </div>
  );
}
```

---

## 🎛️ ניהול תרגומים מהדשבורד

### דף ניהול תרגומים:

**מיקום:** `/dashboard/settings/translations`

### מבנה הדף:

```
┌─────────────────────────────────────────────┐
│  ניהול תרגומים                              │
├─────────────────────────────────────────────┤
│                                             │
│  [בחר שפה: עברית ▼] [בחר Namespace: common]│
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Key                    │ Value         │ │
│  ├───────────────────────────────────────┤ │
│  │ common.buttons.save    │ [שמור]       │ │
│  │ common.buttons.cancel  │ [ביטול]      │ │
│  │ common.messages.success│ [הצלחה]      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [+ הוסף מפתח חדש] [ייבא מ-JSON] [ייצא]   │
│                                             │
└─────────────────────────────────────────────┘
```

### תכונות:

1. **עריכת תרגומים** - עריכה ישירה בטבלה
2. **הוספת מפתחות** - הוספת מפתחות תרגום חדשים
3. **ייבוא/ייצוא** - ייבוא מ-JSON, ייצוא ל-JSON
4. **חיפוש** - חיפוש מפתחות
5. **Preview** - תצוגה מקדימה בפרונט
6. **Fallback** - הצגת תרגומי fallback

---

## 🔄 Fallback Strategy

### סדר Fallback:

```
1. Database Translation (store_id + locale)
   ↓ (אם לא קיים)
2. JSON File Translation (locale)
   ↓ (אם לא קיים)
3. Database Translation (store_id + default locale)
   ↓ (אם לא קיים)
4. JSON File Translation (default locale - he-IL)
   ↓ (אם לא קיים)
5. Key עצמו (key path)
```

### דוגמה:

```typescript
// מפתח: 'home.title'
// שפה: 'en-US'
// חנות: store_id = 1

// 1. נסה: DB translation (store_id=1, locale='en-US', key='home.title')
// 2. נסה: JSON file (locales/en-US/storefront.json -> home.title)
// 3. נסה: DB translation (store_id=1, locale='he-IL', key='home.title')
// 4. נסה: JSON file (locales/he-IL/storefront.json -> home.title)
// 5. Fallback: 'home.title' (המפתח עצמו)
```

---

## 🛠️ יישום טכני

### 1. Translation Service

```typescript
// src/lib/i18n/translations.ts

interface TranslationCache {
  [locale: string]: {
    [namespace: string]: Record<string, string>;
  };
}

const translationCache: TranslationCache = {};

/**
 * טוען תרגומים מ-JSON files
 */
export async function loadJSONTranslations(
  locale: string,
  namespace: string
): Promise<Record<string, string>> {
  const cacheKey = `${locale}:${namespace}`;
  
  if (translationCache[locale]?.[namespace]) {
    return translationCache[locale][namespace];
  }
  
  try {
    const translations = await import(`@/locales/${locale}/${namespace}.json`);
    if (!translationCache[locale]) {
      translationCache[locale] = {};
    }
    translationCache[locale][namespace] = translations.default;
    return translations.default;
  } catch (error) {
    // Fallback לשפת ברירת מחדל
    if (locale !== 'he-IL') {
      return loadJSONTranslations('he-IL', namespace);
    }
    return {};
  }
}

/**
 * טוען תרגומים מ-DB
 */
export async function loadDBTranslations(
  storeId: number,
  locale: string,
  namespace: string
): Promise<Record<string, string>> {
  const translations = await query<{
    key_path: string;
    value: string;
  }>(
    `SELECT 
      tk.key_path,
      COALESCE(t.value, tk.default_value) as value
    FROM translation_keys tk
    LEFT JOIN translations t ON t.translation_key_id = tk.id AND t.locale = $1
    WHERE tk.store_id = $2 AND tk.namespace = $3`,
    [locale, storeId, namespace]
  );
  
  const result: Record<string, string> = {};
  translations.forEach(trans => {
    result[trans.key_path] = trans.value;
  });
  
  return result;
}

/**
 * מקבל תרגום - עם Fallback מלא
 */
export async function getTranslation(
  key: string,
  options: {
    storeId: number;
    locale: string;
    namespace: string;
    defaultLocale?: string;
  }
): Promise<string> {
  const { storeId, locale, namespace, defaultLocale = 'he-IL' } = options;
  
  // 1. נסה DB translation (locale הנוכחי)
  const dbTranslations = await loadDBTranslations(storeId, locale, namespace);
  if (dbTranslations[key]) {
    return dbTranslations[key];
  }
  
  // 2. נסה JSON file (locale הנוכחי)
  const jsonTranslations = await loadJSONTranslations(locale, namespace);
  if (jsonTranslations[key]) {
    return jsonTranslations[key];
  }
  
  // 3. נסה DB translation (שפת ברירת מחדל)
  if (locale !== defaultLocale) {
    const defaultDBTranslations = await loadDBTranslations(storeId, defaultLocale, namespace);
    if (defaultDBTranslations[key]) {
      return defaultDBTranslations[key];
    }
  }
  
  // 4. נסה JSON file (שפת ברירת מחדל)
  const defaultJSONTranslations = await loadJSONTranslations(defaultLocale, namespace);
  if (defaultJSONTranslations[key]) {
    return defaultJSONTranslations[key];
  }
  
  // 5. Fallback למפתח עצמו
  return key;
}
```

### 2. Server Helper

```typescript
// src/lib/i18n/server.ts

import { getTranslation } from './translations';
import { getStoreBySlug } from '@/lib/utils/store';

/**
 * מקבל translation function לשרת
 */
export async function getTranslations(
  locale: string,
  namespace: string,
  storeId?: number
) {
  const storeIdToUse = storeId || 1; // TODO: קבלה מ-context
  
  return (key: string) => {
    return getTranslation(key, {
      storeId: storeIdToUse,
      locale,
      namespace,
    });
  };
}
```

### 3. Client Hook

```typescript
// src/hooks/useTranslation.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

export function useTranslation(namespace: string = 'common') {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const [locale, setLocale] = useState<string>('he-IL');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // טעינת locale מהחנות
    const loadLocale = async () => {
      const response = await fetch(`/api/stores/${storeSlug}/locale`);
      const data = await response.json();
      setLocale(data.locale || 'he-IL');
    };
    
    loadLocale();
  }, [storeSlug]);
  
  useEffect(() => {
    // טעינת תרגומים
    const loadTranslations = async () => {
      const response = await fetch(
        `/api/translations?locale=${locale}&namespace=${namespace}&storeSlug=${storeSlug}`
      );
      const data = await response.json();
      setTranslations(data.translations || {});
    };
    
    loadTranslations();
  }, [locale, namespace, storeSlug]);
  
  const t = useCallback((key: string): string => {
    return translations[key] || key;
  }, [translations]);
  
  return { t, locale };
}
```

### 4. API Route לתרגומים

```typescript
// src/app/api/translations/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'he-IL';
  const namespace = searchParams.get('namespace') || 'common';
  const storeSlug = searchParams.get('storeSlug');
  
  if (!storeSlug) {
    return NextResponse.json({ error: 'Store slug required' }, { status: 400 });
  }
  
  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }
  
  // טעינת תרגומים (DB + JSON)
  const translations = await loadAllTranslations(store.id, locale, namespace);
  
  return NextResponse.json({
    translations,
    locale,
    namespace,
  });
}
```

---

## 📝 דוגמאות שימוש

### דף בית:

```typescript
// ✅ טוב - עם תרגומים
import { getTranslations } from '@/lib/i18n/server';

export default async function HomePage({ params }) {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);
  const t = await getTranslations(store.locale, 'storefront', store.id);
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
      <button>{t('home.cta')}</button>
    </div>
  );
}
```

### קומפוננטה Client:

```typescript
// ✅ טוב - עם useTranslation
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export function AddToCartButton() {
  const { t } = useTranslation('storefront');
  
  return (
    <button>
      {t('product.add_to_cart')}
    </button>
  );
}
```

---

## 🎨 Namespaces מומלצים

### רשימת Namespaces:

1. **`common`** - תרגומים כלליים (כפתורים, הודעות)
2. **`storefront`** - תרגומי פרונט החנות
3. **`products`** - תרגומי מוצרים
4. **`cart`** - תרגומי עגלה
5. **`checkout`** - תרגומי צ'ק אאוט
6. **`errors`** - הודעות שגיאה
7. **`emails`** - תרגומי מיילים
8. **`admin`** - תרגומי דשבורד (אופציונלי)

---

## ✅ Checklist יישום

### Database:
- [ ] יצירת טבלאות translation_keys ו-translations
- [ ] Indexes לביצועים
- [ ] Migrations

### JSON Files:
- [ ] יצירת תיקיית locales
- [ ] יצירת קבצי JSON לכל שפה
- [ ] מבנה JSON מוגדר

### Translation Service:
- [ ] Translation Service (loadJSONTranslations, loadDBTranslations)
- [ ] Fallback Strategy
- [ ] Caching

### Server Helpers:
- [ ] getTranslations function
- [ ] Server Component helpers

### Client Hooks:
- [ ] useTranslation hook
- [ ] Auto-loading translations

### API Routes:
- [ ] GET /api/translations
- [ ] POST /api/translations (עריכה)
- [ ] Cache headers

### Admin Interface:
- [ ] דף ניהול תרגומים
- [ ] עריכת תרגומים בטבלה
- [ ] ייבוא/ייצוא JSON
- [ ] Preview

### Integration:
- [ ] שימוש בכל הקומפוננטות
- [ ] עדכון כל העמודים
- [ ] בדיקת Fallback

---

## 🎯 סיכום

מערכת התרגומים כוללת:

✅ **JSON Files** - תרגומים סטטיים לכל שפה  
✅ **Database Translations** - תרגומים דינמיים מהדשבורד  
✅ **Fallback Strategy** - חזרה אוטומטית לשפת ברירת מחדל  
✅ **Admin Interface** - ניהול תרגומים מהדשבורד  
✅ **Auto-detection** - זיהוי שפה אוטומטי  
✅ **אפס hardcoded** - כל טקסט ממערכת התרגומים  

**כמו שופיפיי - אבל יותר טוב!** 🎉

</div>

