# מיפוי שדות CSV - מהישן לחדש

## ✅ כל השדות נתמכים!

### מיפוי מלא של כל השדות:

| עמודה ב-CSV הישן | שדה פנימי | איפה נשמר | הערות |
|------------------|-----------|-----------|-------|
| **ID** | `id` | לא נשמר | רק לזיהוי |
| **שם מוצר** | `name` | `products.title` | ✅ |
| **סלאג** | `slug` | `products.handle` | ✅ יוצר slug ייחודי |
| **תיאור** | `description` | `products.body_html` | ✅ |
| **מחיר רגיל** | `price` | `product_variants.price` | ✅ ב-variant |
| **מחיר מבצע** | `sale_price` | `product_variants.compare_at_price` | ✅ ב-variant |
| **מקט** | `sku` | `product_variants.sku` | ✅ ב-variant |
| **כמות במלאי** | `inventory_quantity` | `product_variants.inventory_quantity` | ✅ ב-variant |
| **התעלם ממלאי** | `ignore_inventory` | `product_variants.inventory_policy` | ✅ 'continue' או 'deny' |
| **מוסתר** | `hidden` | `products.status` | ✅ 'draft' או 'active' |
| **קטגוריות** | `categories` | `product_collections` + `product_collection_map` | ✅ יוצר collections |
| **תגים** | `tags` | `product_tags` + `product_tag_map` | ✅ יוצר tags |
| **סוג מוצר** | `product_type` | `products.product_type` | ✅ |
| **תמונה ראשית** | `image` | `media_files` + `product_images` | ✅ מוריד מ-S3, מעלה ל-Cloudinary |
| **תאריך יצירה** | `created_at` | לא נשמר | רק לזיהוי |

---

## 📋 מה הקוד עושה עם כל שדה:

### ✅ שדות בסיסיים:
- **שם מוצר** → `products.title`
- **סלאג** → `products.handle` (יוצר slug ייחודי אם צריך)
- **תיאור** → `products.body_html`
- **סוג מוצר** → `products.product_type`

### ✅ מחירים ומלאי (ב-variant):
- **מחיר רגיל** → `product_variants.price`
- **מחיר מבצע** → `product_variants.compare_at_price` (אם > 0)
- **מקט** → `product_variants.sku`
- **כמות במלאי** → `product_variants.inventory_quantity`
- **התעלם ממלאי** → `product_variants.inventory_policy` ('continue' או 'deny')

### ✅ סטטוס:
- **מוסתר** → `products.status`:
  - 'כן' / 'yes' / '1' → 'draft'
  - אחרת → 'active'

### ✅ קטגוריות:
- **קטגוריות** (מופרדות בפסיק) → `product_collections`:
  - מחפש collection קיים לפי שם
  - אם לא קיים → יוצר חדש
  - מקשר למוצר דרך `product_collection_map`

**דוגמה:**
```
קטגוריות: "מסכה, סדרת ארגן"
→ יוצר/מוצא 2 collections: "מסכה" ו-"סדרת ארגן"
→ מקשר את המוצר לשניהם
```

### ✅ תגים:
- **תגים** (מופרדים בפסיק) → `product_tags`:
  - מחפש tag קיים לפי שם
  - אם לא קיים → יוצר חדש
  - מקשר למוצר דרך `product_tag_map`

**דוגמה:**
```
תגים: "Best Sellers, שמפו"
→ יוצר/מוצא 2 tags: "Best Sellers" ו-"שמפו"
→ מקשר את המוצר לשניהם
```

### ✅ תמונות:
- **תמונה ראשית** → תהליך מלא:
  1. מוריד מ-S3 (מנסה מספר פורמטים)
  2. ממיר ל-WebP (אם צריך)
  3. מעלה ל-Cloudinary
  4. שומר ב-`media_files` (כאילו הועלה ידנית)
  5. שומר ב-`product_images` (קישור למוצר)

---

## ✅ סיכום - הכל עובד!

כל השדות מה-CSV של המערכת הישנה:
- ✅ מזוהים נכון (תמיכה בעברית)
- ✅ נשמרים במקום הנכון
- ✅ מטפלים בכל המקרים המיוחדים

**מוכן לשימוש!** 🎉

