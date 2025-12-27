# תוכנית העברה מקוויק שופ הישן למערכת החדשה

## 📋 סיכום ממצאים - מבנה המערכת הנוכחית

### ✅ מבנה מוצרים ווריאציות (כמו Shopify)

**עיקרון יסוד:** כל מוצר חייב להיות עם לפחות variant אחד, גם אם אין אפשרויות!

#### מבנה הטבלאות:
1. **`products`** - טבלת המוצרים הראשית
   - `id`, `store_id`, `title`, `handle`, `body_html`
   - `vendor`, `product_type`, `status`
   - `price`, `sku` - **לא נשמרים כאן!** (רק ב-variants)

2. **`product_variants`** - וריאציות מוצר
   - **חובה:** כל מוצר חייב variant אחד לפחות
   - `id`, `product_id`, `title` (ברירת מחדל: "Default Title")
   - `price`, `compare_at_price` - **המחיר כאן!**
   - `sku`, `barcode` - **הזיהוי כאן!**
   - `inventory_quantity` - **המלאי כאן!** (לא ב-`variant_inventory`)
   - `option1`, `option2`, `option3` - ערכי אפשרויות

3. **`product_options`** - אפשרויות מוצר (Size, Color, etc.)
   - `id`, `product_id`, `name`, `type`, `position`

4. **`product_option_values`** - ערכי אפשרויות
   - `id`, `option_id`, `value`, `metadata`, `position`

5. **`product_images`** - תמונות מוצר
   - `id`, `product_id`, `position`, `src`, `alt`

6. **`media_files`** - ספריית מדיה (תמונות שהועלו ידנית)
   - `id`, `store_id`, `filename`, `file_url` (Cloudinary)
   - `file_type`, `mime_type`, `file_size`

#### ✅ בדיקות שבוצעו:

1. **ייבוא CSV** (`src/app/api/products/import/route.ts`):
   - ✅ יוצר variant ברירת מחדל עם "Default Title"
   - ✅ שומר מחיר ומלאי ב-variant
   - ✅ עובד נכון!

2. **יצירת מוצר חדש** (`src/app/api/products/route.ts`):
   - ✅ אם אין variants, יוצר אוטומטית variant ברירת מחדל
   - ✅ שומר מחיר, SKU, מלאי ב-variant

3. **Trigger במסד הנתונים** (`sql/schema.sql`):
   - ✅ `ensure_product_has_variant()` - מוודא שמוצר לא נשאר בלי variants
   - ✅ Trigger אחרי מחיקת variant יוצר variant חדש אוטומטית

4. **מלאי**:
   - ✅ המלאי נשמר ב-`product_variants.inventory_quantity` (המקור הראשי)
   - ⚠️ יש גם טבלת `variant_inventory` אבל היא לא בשימוש פעיל (מיועדת למיקומים מרובים)

---

## 🔄 תוכנית העברה מקוויק שופ הישן

### שלב 1: הבנת מבנה מסד הנתונים הישן

**צריך לבדוק:**
- טבלאות מוצרים (כנראה `products`, `product_variants`, `product_options`)
- טבלאות תמונות (כנראה `product_images` או `images`)
- טבלאות חנויות (כנראה `stores` או `shops`)
- מיקום תמונות ב-S3 (URLs, paths)

**סקריפט מוכן:** `scripts/check-old-quickshop-db.py`
- צריך להריץ מהשרת או עם VPN/tunnel
- או להריץ מהמחשב שלך אם יש גישה ל-RDS

### שלב 2: בניית כלי העברה

#### 2.1 סקריפט העברת מוצרים

**קובץ:** `scripts/migrate-from-old-quickshop.ts`

**תהליך:**
1. התחברות למסד הנתונים הישן (MySQL)
2. קריאת כל המוצרים מחנות מסוימת
3. עבור כל מוצר:
   - יצירת מוצר חדש ב-`products`
   - יצירת variant אחד לפחות ב-`product_variants`
   - העברת אפשרויות ל-`product_options` ו-`product_option_values`
   - יצירת variants לפי שילובי אפשרויות
   - העברת תמונות מ-S3 ל-Cloudinary ושמירה ב-`media_files` ו-`product_images`

#### 2.2 העברת תמונות מ-S3 ל-Cloudinary

**תהליך:**
1. קריאת URL תמונה מ-S3
2. הורדת התמונה
3. העלאה ל-Cloudinary (דרך `/api/files/upload` או ישירות)
4. שמירה ב-`media_files` עם `store_id` נכון
5. קישור תמונה למוצר ב-`product_images`

### שלב 3: מיפוי שדות

**צריך לבדוק במסד הישן:**
- איך נשמרים מוצרים בלי וריאציות?
- איך נשמרים מוצרים עם אפשרויות?
- איך נשמרות תמונות?
- מה המבנה של URLs ב-S3?

---

## 🛠️ קבצים שנוצרו

1. ✅ **`lib/migration/old-quickshop-types.ts`** - טיפוסים למבנה הישן
2. ✅ **`lib/migration/migrate-store.ts`** - לוגיקת העברת חנות
3. ✅ **`scripts/migrate-from-old-quickshop.ts`** - סקריפט העברה ראשי
4. ✅ **`MIGRATION_SCHEMA_ANALYSIS.md`** - ניתוח מפורט של המבנה הישן

## 📋 מה שצריך לעשות לפני הרצה

1. **התקנת mysql2:**
   ```bash
   npm install mysql2 @types/mysql2
   ```

2. **הגדרת משתני סביבה:**
   - `CLOUDINARY_URL` או `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `OLD_S3_BASE_URL` - URL בסיס של S3 (למשל: `https://s3.amazonaws.com/bucket-name`)

3. **בדיקת מבנה URLs של תמונות:**
   - צריך לבדוק איך נראים ה-URLs של התמונות ב-S3
   - האם זה: `https://s3.amazonaws.com/bucket/store_id/filename`?
   - או: `https://bucket.s3.amazonaws.com/store_id/filename`?
   - או משהו אחר?

4. **הרצת dry-run:**
   ```bash
   npx ts-node scripts/migrate-from-old-quickshop.ts --store-slug argania --new-store-id 1 --limit 5 --dry-run
   ```

5. **הרצת העברה אמיתית:**
   ```bash
   npx ts-node scripts/migrate-from-old-quickshop.ts --store-slug argania --new-store-id 1
   ```

---

## 📝 הערות חשובות

1. **וריאציות:** גם אם במערכת הישנה אין וריאציות, צריך ליצור variant אחד עם "Default Title"

2. **תמונות:** כל תמונה צריכה להיות:
   - מועלת ל-Cloudinary
   - נשמרת ב-`media_files` (כאילו עלתה ידנית)
   - מקושרת למוצר ב-`product_images`

3. **חנויות:** כל חנות צריכה להיות מועברת בנפרד עם `store_id` נכון

4. **בדיקות:** אחרי העברה, לבדוק:
   - שכל מוצר יש לו variant אחד לפחות
   - שהתמונות נטענות נכון
   - שהמחירים והמלאי נכונים

---

## 🚀 צעדים הבאים

1. ✅ בדיקת מבנה המערכת הנוכחית - **הושלם**
2. ⏳ התחברות למסד הנתונים הישן - **צריך VPN/tunnel או גישה**
3. ⏳ בניית כלי העברה
4. ⏳ העברת חנות אחת לבדיקה
5. ⏳ בדיקות ואימות
6. ⏳ העברת כל החנויות

