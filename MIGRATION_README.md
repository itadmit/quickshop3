# מדריך העברה מקוויק שופ הישן

## סקירה כללית

כלי זה מעביר מוצרים, וריאציות ותמונות ממסד הנתונים הישן של קוויק שופ (PHP/MySQL) למערכת החדשה (Next.js/PostgreSQL).

## דרישות מוקדמות

1. **התקנת חבילות:**
   ```bash
   npm install mysql2 @types/mysql2
   ```

2. **הגדרת משתני סביבה:**
   - `CLOUDINARY_URL` או:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
   - `OLD_S3_BASE_URL` - URL בסיס של S3 (למשל: `https://s3.amazonaws.com/bucket-name`)

3. **גישה למסד הנתונים הישן:**
   - צריך גישה ל-RDS MySQL
   - או להריץ מהשרת (EC2)

## מבנה המסד הישן

### מוצרים רגילים (`product_type = 'regular'`)
- מחירים: `regular_price`, `sale_price` ברמת המוצר
- SKU: `sku` ברמת המוצר
- מלאי: `inventory_quantity` ברמת המוצר
- תמונות: `product_image`, `product_gallery` (JSON)

### מוצרים עם וריאציות (`product_type = 'variable'`)
- מחירים: נשמרים ב-`product_variants`
- SKU: נשמרים ב-`product_variants`
- מלאי: נשמרים ב-`product_variants`
- אפשרויות: `variant_options` (JSON) - למשל: `{"צבע":"שחור","מידה":"XS"}`

## שימוש

### 1. בדיקה ראשונית (Dry Run)

```bash
npx ts-node scripts/migrate-from-old-quickshop.ts \
  --store-slug argania \
  --new-store-id 1 \
  --limit 5 \
  --dry-run
```

זה יציג את המוצרים שיועברו בלי לבצע שינויים.

### 2. העברה מלאה

```bash
npx ts-node scripts/migrate-from-old-quickshop.ts \
  --store-slug argania \
  --new-store-id 1
```

### 3. העברה מוגבלת (לבדיקה)

```bash
npx ts-node scripts/migrate-from-old-quickshop.ts \
  --store-slug argania \
  --new-store-id 1 \
  --limit 10
```

## פרמטרים

- `--store-slug` - slug של החנות במסד הישן (למשל: `argania`)
- `--new-store-id` - ID של החנות במערכת החדשה
- `--limit` - הגבלת מספר מוצרים (אופציונלי)
- `--dry-run` - מצב בדיקה ללא שינויים

## מה הכלי עושה

1. **קורא מוצרים מהמסד הישן**
2. **יוצר מוצרים במערכת החדשה:**
   - מוצרים רגילים → מוצר + variant אחד עם "Default Title"
   - מוצרים עם וריאציות → מוצר + מספר variants לפי `variant_options`
3. **מעביר תמונות:**
   - מוריד מ-S3
   - מעלה ל-Cloudinary
   - שומר ב-`media_files` (כאילו עלו ידנית)
   - מקשר למוצר ב-`product_images`
4. **מעביר וריאציות:**
   - מפרסר `variant_options` JSON
   - יוצר variants עם `option1`, `option2`, `option3`
   - מעביר מחירים, SKU, מלאי

## בעיות ידועות

1. **אפשרויות ברמת החנות:** במערכת הישנה אפשרויות נשמרות ברמת החנות (`store_id`), במערכת החדשה ברמת המוצר. הכלי לא יוצר `product_options` ו-`product_option_values` - צריך לעשות זאת ידנית או להוסיף לוגיקה.

2. **מבנה URLs של S3:** צריך לבדוק את המבנה המדויק של ה-URLs. כרגע הכלי מנסה לבנות URL לפי `OLD_S3_BASE_URL/store_id/filename`.

3. **תמונות שלא נמצאות:** אם תמונה לא נמצאה ב-S3, היא תתעלם והמוצר ייווצר בלי תמונה.

## בדיקות אחרי העברה

1. ✅ כל מוצר יש לו variant אחד לפחות
2. ✅ התמונות נטענות נכון
3. ✅ המחירים והמלאי נכונים
4. ✅ ה-SKUs נכונים
5. ✅ הוריאציות נכונות

## לוגים

הכלי מדפיס:
- התקדמות בזמן אמת
- שגיאות אם יש
- סיכום בסוף (כמה הצליחו, כמה נכשלו)

## תמיכה

אם יש בעיות:
1. בדוק את הלוגים
2. בדוק את משתני הסביבה
3. בדוק את הגישה למסד הנתונים הישן
4. בדוק את הגישה ל-S3 ו-Cloudinary

