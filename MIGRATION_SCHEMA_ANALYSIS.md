# ניתוח מבנה מסד הנתונים הישן

## סיכום הממצאים

### 1. מבנה מוצרים (`products`)

**מוצרים רגילים (`product_type = 'regular'`):**
- מחירים: `regular_price`, `sale_price` ברמת המוצר
- SKU: `sku` ברמת המוצר
- מלאי: `inventory_quantity` ברמת המוצר
- תמונות: `product_image` (שם קובץ), `product_gallery` (JSON array)

**מוצרים עם וריאציות (`product_type = 'variable'`):**
- מחירים: `regular_price`, `sale_price` = NULL (נשמרים ב-`product_variants`)
- SKU: `sku` = NULL (נשמרים ב-`product_variants`)
- מלאי: `inventory_quantity` = 0 (נשמרים ב-`product_variants`)
- תמונות: `product_image` (תמונה ראשית), `product_gallery` (JSON array)

### 2. מבנה וריאציות (`product_variants`)

- `id`, `product_id`
- `regular_price`, `sale_price` - מחירים
- `sku` - SKU של הוריאציה
- `inventory_quantity` - מלאי
- `variant_options` - JSON עם אפשרויות (למשל: `{"צבע":"שחור","מידה":"XS"}`)
- `variant_image` - תמונה של הוריאציה (שם קובץ)
- `variant_gallery` - JSON array של שמות קבצים

**דוגמה:**
```json
{
  "variant_options": {"צבע":"שחור","מידה":"XS"},
  "variant_gallery": ["687ceb5470266.webp", "687ceb5505fff.webp"]
}
```

### 3. מבנה אפשרויות (`product_options`)

**חשוב:** אפשרויות נשמרות ברמת החנות (`store_id`), לא ברמת המוצר!

- `id`, `store_id`
- `option_name` - שם האפשרות (למשל: "מידה", "צבע")
- `option_type` - select, radio, checkbox, text
- `display_order` - סדר תצוגה

### 4. מבנה ערכי אפשרויות (`option_values`)

- `id`, `option_id`
- `value_name` - שם הערך (למשל: "XS", "S", "M", "שחור")
- `price` - מחיר נוסף (אם יש)

### 5. מבנה תמונות

**טבלת `media`:**
- `id`, `store_id`
- `file_name` - שם הקובץ (למשל: "69089d6bb0c85.webp")
- `file_type` - סוג הקובץ (images, videos, etc.)

**תמונות מוצרים:**
- `product_image` - תמונה ראשית (שם קובץ)
- `product_gallery` - JSON array של שמות קבצים
- `variant_image` - תמונה של הוריאציה
- `variant_gallery` - JSON array של שמות קבצים

**מיקום תמונות:**
- התמונות נמצאות ב-S3
- צריך לבדוק את המבנה של ה-URLs (כנראה: `https://s3.../store_id/filename`)

### 6. מבנה חנויות (`stores`)

- `id`, `name`, `slug`
- חנות argania: `id = 310`, `slug = 'argania'`
- יש 222 מוצרים בחנות argania

---

## מיפוי למערכת החדשה

### מוצרים רגילים → מוצר + variant אחד

```
products (ישן) → products (חדש) + product_variants (חדש)
- name → title
- description → body_html
- regular_price → product_variants.price
- sale_price → product_variants.compare_at_price
- sku → product_variants.sku
- inventory_quantity → product_variants.inventory_quantity
- product_image → product_images[0]
- product_gallery → product_images[1..n]
```

### מוצרים עם וריאציות → מוצר + מספר variants

```
products (ישן) → products (חדש)
product_variants (ישן) → product_variants (חדש)
- variant_options JSON → product_options + product_option_values
- כל variant_options → variant עם option1, option2, option3
```

### אפשרויות

```
product_options (ישן) → product_options (חדש)
- option_name → name
- option_type → type (צריך מיפוי)

option_values (ישן) → product_option_values (חדש)
- value_name → value
```

### תמונות

```
product_image / variant_image → הורדה מ-S3 → העלאה ל-Cloudinary → media_files + product_images
```

---

## אתגרים

1. **אפשרויות ברמת החנות:** במערכת הישנה אפשרויות נשמרות ברמת החנות, במערכת החדשה ברמת המוצר. צריך ליצור אפשרויות לכל מוצר.

2. **variant_options JSON:** צריך לפרסר את ה-JSON ולהמיר ל-`product_options` + `product_option_values`.

3. **תמונות מ-S3:** צריך להוריד מ-S3 ולהעלות ל-Cloudinary.

4. **מוצרים בלי וריאציות:** מוצרים רגילים צריכים variant אחד עם "Default Title".

5. **מוצרים עם וריאציות:** צריך ליצור variants לפי ה-`variant_options` JSON.

