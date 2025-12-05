# 🏪 התאמת תרגומים לכל חנות - Store-Specific Translations

<div dir="rtl">

## ✅ כן! כל חנות יכולה לערוך תרגומים מותאמים אישית

### איך זה עובד:

### 📊 שתי רמות תרגומים:

```
┌─────────────────────────────────────────────┐
│     סדר עדיפויות בתרגומים                   │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│   Database   │ │   JSON   │ │  Fallback │
│ Translations │ │  Files   │ │  (he-IL)  │
│  (חנות)     │ │ (גלובלי) │ │           │
│  עדיפות 1    │ │ עדיפות 2 │ │ עדיפות 3  │
└──────────────┘ └──────────┘ └──────────┘
```

### 🎯 איך זה עובד בפועל:

#### 1. **JSON Files (גלובלי)**
- תרגומים בסיסיים לכל השפות
- משותפים לכל החנויות
- נמצאים ב-`src/locales/{locale}/{namespace}.json`

#### 2. **Database Translations (מותאם לכל חנות)**
- כל חנות יכולה לערוך תרגומים מותאמים אישית
- נשמרים ב-DB עם `store_id`
- **דורסים את ה-JSON Files** - עדיפות גבוהה יותר

#### 3. **Fallback**
- אם אין תרגום ב-DB וגם לא ב-JSON → חוזר לעברית

---

## 🗄️ מבנה Database

### טבלאות:

```sql
-- מפתחות תרגום (לכל חנות)
CREATE TABLE translation_keys (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE, -- ⭐ כל חנות
  namespace VARCHAR(100) NOT NULL, -- 'storefront', 'products', 'common'
  key_path VARCHAR(255) NOT NULL, -- 'home.title', 'product.add_to_cart'
  default_value TEXT, -- ערך ברירת מחדל
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, namespace, key_path) -- ⭐ ייחודי לכל חנות
);

-- תרגומים (לכל שפה)
CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  translation_key_id INT REFERENCES translation_keys(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL, -- 'he-IL', 'en-US', 'ar-SA'
  value TEXT NOT NULL, -- ⭐ התרגום המותאם
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(translation_key_id, locale)
);
```

### דוגמה:

```sql
-- חנות 1 רוצה לשנות את "הוסף לעגלה" ל-"קנה עכשיו"
INSERT INTO translation_keys (store_id, namespace, key_path, default_value)
VALUES (1, 'storefront', 'product.add_to_cart', 'הוסף לעגלה');

INSERT INTO translations (translation_key_id, locale, value)
VALUES (1, 'he-IL', 'קנה עכשיו'); -- ⭐ תרגום מותאם

-- חנות 2 רוצה משהו אחר
INSERT INTO translation_keys (store_id, namespace, key_path, default_value)
VALUES (2, 'storefront', 'product.add_to_cart', 'הוסף לעגלה');

INSERT INTO translations (translation_key_id, locale, value)
VALUES (2, 'he-IL', 'הוסף לסל'); -- ⭐ תרגום שונה
```

---

## 🎛️ ממשק ניהול מהדשבורד

### דף ניהול תרגומים:

**מיקום:** `/dashboard/settings/translations`

### תכונות:

1. **עריכת תרגומים ישירה**
   - טבלה עם כל המפתחות
   - עריכה inline
   - שמירה מיידית

2. **הוספת מפתחות חדשים**
   - הוספת מפתח תרגום חדש
   - תרגום לכל השפות

3. **ייבוא מ-JSON**
   - ייבוא תרגומים מ-JSON Files
   - יצירת מפתחות אוטומטית

4. **ייצוא ל-JSON**
   - ייצוא תרגומים מותאמים
   - גיבוי

5. **Preview**
   - תצוגה מקדימה בפרונט
   - בדיקה לפני שמירה

### דוגמה לממשק:

```
┌─────────────────────────────────────────────┐
│  ניהול תרגומים - חנות שלי                  │
├─────────────────────────────────────────────┤
│                                             │
│  [בחר שפה: עברית ▼] [בחר Namespace: storefront]│
│                                             │
├─────────────────────────────────────────────┤
│  Key                    │ עברית │ אנגלית │ │
├─────────────────────────────────────────────┤
│  home.title             │ [ברוכים] │ [Welcome] │ │
│  home.subtitle          │ [מגוון] │ [Wide] │ │
│  product.add_to_cart    │ [קנה עכשיו] ⭐ │ [Buy Now] │ │
│                         │ (מותאם) │         │ │
└─────────────────────────────────────────────┘
```

---

## 💻 איך זה עובד בקוד

### סדר Fallback:

```typescript
async function getTranslation(key: string, storeId: number, locale: string) {
  // 1. נסה DB translation (חנות ספציפית)
  const dbTranslation = await getDBTranslation(storeId, locale, key);
  if (dbTranslation) return dbTranslation; // ✅ נמצא!
  
  // 2. נסה JSON file (גלובלי)
  const jsonTranslation = await getJSONTranslation(locale, key);
  if (jsonTranslation) return jsonTranslation;
  
  // 3. Fallback לשפת ברירת מחדל
  const defaultTranslation = await getJSONTranslation('he-IL', key);
  if (defaultTranslation) return defaultTranslation;
  
  // 4. Fallback ל-key עצמו
  return key;
}
```

### דוגמה:

```typescript
// חנות 1 - יש תרגום מותאם ב-DB
const t1 = await getTranslation('product.add_to_cart', 1, 'he-IL');
// ✅ מחזיר: "קנה עכשיו" (מ-DB)

// חנות 2 - אין תרגום מותאם, משתמש ב-JSON
const t2 = await getTranslation('product.add_to_cart', 2, 'he-IL');
// ✅ מחזיר: "הוסף לעגלה" (מ-JSON)
```

---

## 🎨 דוגמאות שימוש

### דוגמה 1: שינוי כותרת דף בית

```typescript
// חנות 1 רוצה: "ברוכים הבאים לחנות האופנה שלנו"
// במקום: "ברוכים הבאים לחנות שלנו"

// בדשבורד:
// 1. הולך ל-/dashboard/settings/translations
// 2. בוחר namespace: storefront
// 3. מוצא: home.title
// 4. משנה ל: "ברוכים הבאים לחנות האופנה שלנו"
// 5. שומר

// בפרונט:
// ✅ חנות 1 רואה: "ברוכים הבאים לחנות האופנה שלנו"
// ✅ חנות 2 רואה: "ברוכים הבאים לחנות שלנו" (מ-JSON)
```

### דוגמה 2: שינוי כפתור

```typescript
// חנות 1 רוצה: "קנה עכשיו" במקום "הוסף לעגלה"

// בדשבורד:
// Key: product.add_to_cart
// עברית: "קנה עכשיו"
// אנגלית: "Buy Now"

// בפרונט:
// ✅ חנות 1: "קנה עכשיו"
// ✅ חנות 2: "הוסף לעגלה" (מ-JSON)
```

### דוגמה 3: הוספת מפתח חדש

```typescript
// חנות 1 רוצה להוסיף: "מבצע מיוחד"

// בדשבורד:
// 1. לוחץ "+ הוסף מפתח חדש"
// 2. Namespace: storefront
// 3. Key: home.special_offer
// 4. עברית: "מבצע מיוחד"
// 5. אנגלית: "Special Offer"
// 6. שומר

// בקוד:
const { t } = useTranslation('storefront');
<h2>{t('home.special_offer')}</h2>
// ✅ חנות 1: "מבצע מיוחד"
// ✅ חנות 2: "home.special_offer" (Fallback ל-key)
```

---

## ✅ יתרונות

### 1. **גמישות מלאה**
- כל חנות יכולה להתאים תרגומים
- אין תלות בחנות אחרת

### 2. **עדכון דינמי**
- עדכון תרגומים בלי deploy
- שינויים מיידיים בפרונט

### 3. **Fallback חכם**
- אם אין תרגום מותאם → משתמש ב-JSON
- תמיד יש תרגום (אפילו אם זה Fallback)

### 4. **ניהול קל**
- ממשק ניהול נוח בדשבורד
- ייבוא/ייצוא JSON

---

## 🎯 סיכום

✅ **כל חנות יכולה לערוך תרגומים מותאמים אישית**  
✅ **תרגומים מ-DB דורסים את ה-JSON Files**  
✅ **Fallback חכם לשפת ברירת מחדל**  
✅ **ממשק ניהול נוח בדשבורד**  
✅ **עדכון דינמי בלי deploy**  

**כמו שופיפיי - אבל יותר גמיש!** 🎉

</div>

