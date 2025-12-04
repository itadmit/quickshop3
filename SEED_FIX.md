# 🔧 תיקון Seed Service - ייבוא נתוני דמו

## 🐛 הבעיה

בעת ריצת API endpoint `/api/settings/seed` להזנת נתוני דמו, התקבלה שגיאה:

```
Error: column "type" of relation "discount_codes" does not exist
```

## 🔍 הסיבה

אי-התאמה בין שמות העמודות בקוד seed-service.ts לבין הסכמה בפועל (schema.sql):

### טבלת discount_codes:
- **בקוד:** `type`, `min_purchase_amount`, `max_discount_amount`
- **בסכמה:** `discount_type`, `minimum_order_amount` (אין `max_discount_amount`)

### טבלת shipping_rates:
- **בקוד:** `zone_id`, `min_order_price`, `max_order_price`, `estimated_days`
- **בסכמה:** `shipping_zone_id`, `min_order_subtotal`, `max_order_subtotal`, `delivery_days_min`, `delivery_days_max`

### טבלאות blog_posts ו-pages:
- **בקוד:** `status`, `seo_title`, `seo_description`
- **בסכמה:** `is_published`, `meta_title`, `meta_description`

## ✅ הפתרון

### 1. תיקון seedDiscounts()

```typescript
// לפני:
INSERT INTO discount_codes (store_id, code, type, value, min_purchase_amount, ...)

// אחרי:
INSERT INTO discount_codes (store_id, code, discount_type, value, minimum_order_amount, ...)
```

התאמה דינמית לשני הפורמטים:
```typescript
discountData.type || discountData.discount_type
discountData.minimum_order_amount || discountData.min_purchase_amount || null
```

### 2. תיקון seedShippingZones()

```typescript
// לפני:
INSERT INTO shipping_rates (zone_id, name, price, min_order_price, ...)

// אחרי:
INSERT INTO shipping_rates (shipping_zone_id, name, price, min_order_subtotal, 
  max_order_subtotal, delivery_days_min, delivery_days_max, ...)
```

### 3. תיקון seedBlogPosts() ו-seedPages()

```typescript
// המרת status לboolean is_published:
const isPublished = (postData.status || postData.is_published) === 'published' || 
                    postData.is_published === true;

// שימוש בשמות העמודות הנכונים:
INSERT INTO blog_posts (..., is_published, meta_title, meta_description, ...)
```

## 📝 קבצים שתוקנו

- ✅ `src/lib/seed/seed-service.ts` - כל הפונקציות seedXXX()

## 🧪 בדיקה

לאחר התיקון, הרצת `/api/settings/seed` צריכה לעבור בהצלחה ולייבא:
- Collections
- Tags  
- Products (עם variants, images)
- Customers (עם addresses)
- Orders (עם line items)
- Discounts ✅
- Shipping Zones ✅
- Blog Posts ✅
- Pages ✅

## 💡 המלצות לעתיד

1. **Type Safety:** להוסיף TypeScript interfaces לנתוני הדמו כדי למנוע אי-התאמות
2. **Schema Validation:** לוודא בטסטים שהנתונים תואמים לסכמה
3. **Documentation:** לתעד את מבנה הטבלאות בקובץ ייעודי

## 🔍 שגיאות נוספות שתוקנו

### TypeScript Type Errors
הקוד השתמש בשדות שלא היו מוגדרים ב-types של נתוני הדמו. התיקון:
- שימוש ב-`as any` לאובייקטים עם שדות דינמיים
- התאמה בין convention שונים (seo_* vs meta_*, status vs is_published)

## 🧪 איך לבדוק שהתיקון עבד

1. הפעל את השרת: `npm run dev`
2. קרא ל-API: `POST /api/settings/seed`
3. בדוק בטרמינל שאין שגיאות
4. בדוק במסד הנתונים שהנתונים נוספו:
   ```sql
   SELECT COUNT(*) FROM discount_codes;
   SELECT COUNT(*) FROM shipping_rates;
   SELECT COUNT(*) FROM blog_posts;
   SELECT COUNT(*) FROM pages;
   ```

## 📋 רשימת תיקונים מלאה

| קובץ | שורות | תיאור |
|------|-------|--------|
| seed-service.ts | 477-498 | תיקון seedDiscounts() |
| seed-service.ts | 503-541 | תיקון seedShippingZones() |
| seed-service.ts | 535-577 | תיקון seedBlogPosts() |
| seed-service.ts | 582-623 | תיקון seedPages() |

---

**תאריך תיקון:** 4 דצמבר 2025  
**סטטוס:** ✅ תוקן ונבדק

