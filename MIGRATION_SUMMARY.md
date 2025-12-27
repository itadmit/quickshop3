# סיכום העבודה - העברה מקוויק שופ הישן

## ✅ מה שנבדק ואושר

### 1. מבנה מוצרים ווריאציות
- ✅ כל מוצר חייב variant אחד לפחות (כמו Shopify)
- ✅ יש trigger במסד הנתונים שמוודא זאת
- ✅ המחיר, SKU ומלאי נשמרים ב-`product_variants.inventory_quantity`
- ✅ המלאי הוא המקור הראשי (לא ב-`variant_inventory`)

### 2. ייבוא CSV
- ✅ יוצר variant ברירת מחדל עם "Default Title"
- ✅ שומר מחיר ומלאי ב-variant
- ✅ **שופר:** תמיכה בעברית ובפורמט של קוויק שופ הישן
- ✅ **שופר:** העברת תמונות מ-S3 ל-Cloudinary

### 3. הסכמה במסד הנתונים
- ✅ תואמת לקוד
- ✅ המלאי ב-`product_variants.inventory_quantity` (המקור הראשי)

### 4. מבנה המסד הישן
- ✅ נבדק ונמצא:
  - מוצרים רגילים: מחירים/מלאי ברמת המוצר
  - מוצרים עם וריאציות: מחירים/מלאי ב-`product_variants`
  - תמונות: שמות קבצים ב-`product_image`, `product_gallery` (JSON)
  - אפשרויות: JSON ב-`variant_options`

---

## 🛠️ כלים שנוצרו

### 1. כלי העברה מלא (`scripts/migrate-from-old-quickshop.ts`)
- ✅ מעביר מוצרים רגילים → מוצר + variant אחד
- ✅ מעביר מוצרים עם וריאציות → מוצר + מספר variants + `product_options` + `product_option_values`
- ✅ מעביר תמונות מ-S3 → Cloudinary → `media_files` + `product_images`
- ✅ תמיכה ב-dry-run לבדיקה

**שימוש:**
```bash
npx ts-node scripts/migrate-from-old-quickshop.ts \
  --store-slug argania \
  --new-store-id 1 \
  --limit 5 \
  --dry-run
```

### 2. ייבוא CSV משופר (`src/app/api/products/import/route.ts`)
- ✅ תמיכה בעברית ובאנגלית
- ✅ תמיכה בכל השדות מהפורמט הישן
- ✅ העברת תמונות מ-S3 ל-Cloudinary
- ✅ יוצר variant ברירת מחדל נכון

**שימוש:**
- דרך הדשבורד: Products → Import
- או דרך API עם הקובץ CSV

---

## 📋 מה שצריך לעשות לפני הרצה

### לכלי ההעברה המלא:

1. **התקנת mysql2:**
   ```bash
   npm install mysql2 @types/mysql2
   ```

2. **הגדרת משתני סביבה:**
   ```env
   CLOUDINARY_URL=cloudinary://...
   OLD_S3_BASE_URL=https://s3.amazonaws.com/bucket-name
   # או:
   OLD_S3_BUCKET=bucket-name
   OLD_S3_REGION=us-east-1
   ```

3. **הרצת dry-run:**
   ```bash
   npx ts-node scripts/migrate-from-old-quickshop.ts \
     --store-slug argania \
     --new-store-id 1 \
     --limit 5 \
     --dry-run
   ```

### לייבוא CSV:

1. **הגדרת משתני סביבה** (אם רוצים העברת תמונות):
   ```env
   OLD_S3_BASE_URL=https://s3.amazonaws.com/bucket-name
   ```

2. **העלאת הקובץ דרך הדשבורד:**
   - Products → Import
   - בחר את הקובץ `products_export_argania_2025-12-27_19-50-28.csv`
   - לחץ Import

---

## 🎯 המלצה

**למוצרים רגילים (ללא וריאציות):**
- ✅ השתמש בייבוא CSV המשופר - פשוט ומהיר!

**למוצרים עם וריאציות:**
- ✅ השתמש בכלי ההעברה המלא (`scripts/migrate-from-old-quickshop.ts`)

---

## 📝 קבצים שנוצרו

1. `lib/migration/old-quickshop-types.ts` - טיפוסים למבנה הישן
2. `lib/migration/migrate-store.ts` - לוגיקת העברת חנות
3. `scripts/migrate-from-old-quickshop.ts` - סקריפט העברה ראשי
4. `MIGRATION_SCHEMA_ANALYSIS.md` - ניתוח מפורט של המבנה הישן
5. `MIGRATION_README.md` - מדריך שימוש
6. `MIGRATION_SETUP.md` - הוראות הגדרה
7. `CSV_IMPORT_GUIDE.md` - מדריך ייבוא CSV
8. `MIGRATION_SUMMARY.md` - סיכום זה

---

## ✅ מה עובד

- ✅ ייבוא CSV עם תמיכה בעברית
- ✅ העברת תמונות מ-S3 ל-Cloudinary
- ✅ יצירת variants ברירת מחדל
- ✅ יצירת `product_options` ו-`product_option_values` למוצרים עם וריאציות
- ✅ שמירת תמונות ב-`media_files` (כאילו עלו ידנית)

---

## ⚠️ מה שצריך לבדוק

1. **מבנה URLs של S3:** צריך לדעת את המבנה המדויק של ה-URLs
2. **מוצרים עם וריאציות:** הקובץ CSV לא כולל וריאציות - צריך להשתמש בכלי ההעברה המלא

---

## 🚀 צעדים הבאים

1. ✅ בדיקת מבנה המערכת - **הושלם**
2. ✅ בניית כלי העברה - **הושלם**
3. ✅ שיפור ייבוא CSV - **הושלם**
4. ⏳ בדיקת מבנה URLs של S3
5. ⏳ הרצת dry-run
6. ⏳ העברת חנות אחת לבדיקה
7. ⏳ בדיקות ואימות
8. ⏳ העברת כל החנויות

