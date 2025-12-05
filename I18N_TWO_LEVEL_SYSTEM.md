# 🌐 מערכת תרגומים דו-רבדית - System vs Template Translations

<div dir="rtl">

## 🎯 סקירה כללית

Quickshop3 כוללת **מערכת תרגומים דו-רבדית** שמפרידה בין:

1. **System Translations** - תרגומי מערכת (JSON גלובלי)
2. **Template/Content Translations** - תרגומי תבניות ותוכן (DB מותאם)

---

## 📊 שני סוגי תרגומים

### 1. System Translations (שפת מערכת) 🔧

**מה זה:**
- תרגומים סטטיים של המערכת עצמה
- כפתורים, שדות, הודעות שגיאה
- משותפים לכל החנויות

**דוגמאות:**
- "שם פרטי", "שם משפחה"
- "מעבר לתשלום"
- "הוסף לעגלה"
- "שגיאה", "שמור", "ביטול"

**איפה נשמר:**
- ✅ **JSON Files** - `src/locales/{locale}/common.json`, `storefront.json`
- ✅ **גלובלי** - משותף לכל החנויות
- ✅ **לא ניתן לעריכה מהדשבורד** - רק בקוד

**דוגמה:**
```json
// locales/he-IL/storefront.json
{
  "checkout": {
    "first_name": "שם פרטי",
    "last_name": "שם משפחה",
    "proceed_to_payment": "מעבר לתשלום"
  },
  "product": {
    "add_to_cart": "הוסף לעגלה"
  }
}
```

### 2. Template/Content Translations (שפת תבנית) 🎨

**מה זה:**
- תוכן דינמי שנוצר ב-Customizer
- טקסטים מותאמים אישית לכל חנות
- ניתן לעריכה מהדשבורד

**דוגמאות:**
- "ברוכים הבאים לחנות שלנו" (Hero Section)
- "מעבר לכל המוצרים" (CTA מותאם)
- "מוצרים מובילים" (כותרת מותאמת)
- כל תוכן שנוצר בעורך התבניות

**איפה נשמר:**
- ✅ **Database** - טבלת `template_translations`
- ✅ **מותאם לכל חנות** - כל חנות עם התוכן שלה
- ✅ **ניתן לעריכה מהדשבורד** - ממשק ניהול תרגומים

**דוגמה:**
```sql
-- חנות 1
INSERT INTO template_translations (store_id, template_id, key, locale, value)
VALUES (1, 'home-hero', 'title', 'he-IL', 'ברוכים הבאים לחנות האופנה שלנו');

-- חנות 2
INSERT INTO template_translations (store_id, template_id, key, locale, value)
VALUES (2, 'home-hero', 'title', 'he-IL', 'ברוכים הבאים לחנות הטכנולוגיה שלנו');
```

---

## 🗄️ מבנה Database

### טבלאות:

```sql
-- Templates (תבניות)
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL, -- 'home-hero', 'home-featured-products'
  type VARCHAR(100) NOT NULL, -- 'hero', 'section', 'banner'
  page_type VARCHAR(100), -- 'home', 'product', 'collection'
  settings JSONB, -- הגדרות התבנית
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, name)
);

CREATE INDEX idx_templates_store ON templates(store_id);
CREATE INDEX idx_templates_page_type ON templates(page_type);

-- Template Translations (תרגומי תבניות)
CREATE TABLE template_translations (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES templates(id) ON DELETE CASCADE,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL, -- 'title', 'subtitle', 'cta_text'
  locale VARCHAR(10) NOT NULL, -- 'he-IL', 'en-US'
  value TEXT NOT NULL, -- התרגום
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(template_id, key, locale)
);

CREATE INDEX idx_template_translations_template ON template_translations(template_id);
CREATE INDEX idx_template_translations_store ON template_translations(store_id);
CREATE INDEX idx_template_translations_locale ON template_translations(locale);
```

---

## 🎨 איך זה עובד בפועל

### שלב 1: יצירת תבנית ב-Customizer

```typescript
// בעל חנות עורך תבנית Hero Section ב-Customizer
// מזין בעברית:
{
  title: "ברוכים הבאים לחנות שלנו",
  subtitle: "מגוון רחב של מוצרים איכותיים",
  cta_text: "מעבר לכל המוצרים"
}

// נשמר ב-DB:
INSERT INTO templates (store_id, name, type, page_type, settings)
VALUES (1, 'home-hero', 'hero', 'home', '{"position": 1}');

INSERT INTO template_translations (template_id, store_id, key, locale, value)
VALUES 
  (1, 1, 'title', 'he-IL', 'ברוכים הבאים לחנות שלנו'),
  (1, 1, 'subtitle', 'he-IL', 'מגוון רחב של מוצרים איכותיים'),
  (1, 1, 'cta_text', 'he-IL', 'מעבר לכל המוצרים');
```

### שלב 2: תרגום התבנית לשפות אחרות

```typescript
// בעל חנות הולך ל-/dashboard/settings/translations
// בוחר תבנית: "home-hero"
// בוחר שפה: "אנגלית"
// מתרגם:

INSERT INTO template_translations (template_id, store_id, key, locale, value)
VALUES 
  (1, 1, 'title', 'en-US', 'Welcome to Our Store'),
  (1, 1, 'subtitle', 'en-US', 'Wide variety of quality products'),
  (1, 1, 'cta_text', 'en-US', 'View All Products');
```

### שלב 3: שימוש בפרונט

```typescript
// בפרונט - טעינת תרגום לפי locale
const template = await getTemplate('home-hero', storeId);
const translations = await getTemplateTranslations(template.id, locale);

// שימוש:
<h1>{translations.title}</h1>
<p>{translations.subtitle}</p>
<button>{translations.cta_text}</button>

// אם locale = 'he-IL' → "ברוכים הבאים לחנות שלנו"
// אם locale = 'en-US' → "Welcome to Our Store"
```

---

## 💻 יישום טכני

### 1. Template Service

```typescript
// src/lib/templates/service.ts

/**
 * מקבל תבנית לפי שם
 */
export async function getTemplate(
  name: string,
  storeId: number
) {
  const { queryOne } = await import('@/lib/db');
  
  return queryOne<{
    id: number;
    name: string;
    type: string;
    page_type: string;
    settings: any;
  }>(
    'SELECT id, name, type, page_type, settings FROM templates WHERE store_id = $1 AND name = $2',
    [storeId, name]
  );
}

/**
 * מקבל תרגומי תבנית
 */
export async function getTemplateTranslations(
  templateId: number,
  locale: string
): Promise<Record<string, string>> {
  const { query } = await import('@/lib/db');
  
  const translations = await query<{
    key: string;
    value: string;
  }>(
    'SELECT key, value FROM template_translations WHERE template_id = $1 AND locale = $2',
    [templateId, locale]
  );
  
  // Fallback לשפת ברירת מחדל אם אין תרגום
  if (translations.length === 0 && locale !== 'he-IL') {
    const defaultTranslations = await query<{
      key: string;
      value: string;
    }>(
      'SELECT key, value FROM template_translations WHERE template_id = $1 AND locale = $2',
      [templateId, 'he-IL']
    );
    
    const result: Record<string, string> = {};
    defaultTranslations.forEach(t => {
      result[t.key] = t.value;
    });
    return result;
  }
  
  const result: Record<string, string> = {};
  translations.forEach(t => {
    result[t.key] = t.value;
  });
  return result;
}
```

### 2. שימוש בפרונט

```typescript
// src/app/(storefront)/shops/[storeSlug]/page.tsx

import { getTemplate, getTemplateTranslations } from '@/lib/templates/service';
import { getTranslations } from '@/lib/i18n/server';

export default async function HomePage({ params }) {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);
  
  // System Translations (JSON)
  const t = await getTranslations(store.locale, 'storefront', store.id);
  
  // Template Translations (DB)
  const heroTemplate = await getTemplate('home-hero', store.id);
  const heroTranslations = heroTemplate 
    ? await getTemplateTranslations(heroTemplate.id, store.locale)
    : {};
  
  return (
    <div>
      {/* System Translation */}
      <button>{t('product.add_to_cart')}</button>
      
      {/* Template Translation */}
      <h1>{heroTranslations.title || 'ברוכים הבאים'}</h1>
      <p>{heroTranslations.subtitle || ''}</p>
      <button>{heroTranslations.cta_text || t('home.cta')}</button>
    </div>
  );
}
```

---

## 🎛️ ממשק ניהול תרגומים

### דף ניהול תרגומים:

**מיקום:** `/dashboard/settings/translations`

### מבנה:

```
┌─────────────────────────────────────────────┐
│  ניהול תרגומים                             │
├─────────────────────────────────────────────┤
│                                             │
│  [System Translations] [Template Translations] │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Template Translations:                     │
│                                             │
│  [בחר תבנית: home-hero ▼]                  │
│  [בחר שפה: אנגלית ▼]                       │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Key        │ עברית      │ אנגלית      │ │
│  ├───────────────────────────────────────┤ │
│  │ title      │ [ברוכים]   │ [Welcome]   │ │
│  │ subtitle   │ [מגוון]    │ [Wide]      │ │
│  │ cta_text   │ [מעבר]     │ [View]      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [שמור תרגומים]                            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ✅ סיכום

### System Translations (JSON):
- ✅ תרגומי מערכת בסיסיים
- ✅ משותפים לכל החנויות
- ✅ לא ניתן לעריכה מהדשבורד
- ✅ נמצאים ב-JSON Files

### Template Translations (DB):
- ✅ תוכן דינמי מ-Customizer
- ✅ מותאם לכל חנות
- ✅ ניתן לעריכה מהדשבורד
- ✅ ניתן לתרגום לשפות אחרות
- ✅ נמצאים ב-Database

**הפרדה ברורה בין תרגומי מערכת לתרגומי תבניות!** 🎉

</div>

