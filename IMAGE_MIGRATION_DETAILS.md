# פרטי העברת תמונות מ-S3 ל-Cloudinary

## ✅ מה הקוד עושה

### תהליך העברת תמונה:

1. **הורדה מ-S3:**
   - מנסה מספר פורמטים של URLs (עם/בלי store_id)
   - מוריד את התמונה המקורית

2. **המרה ל-WebP:**
   - בודק אם התמונה כבר WebP → משאיר אותה
   - אם לא → ממיר ל-WebP עם `sharp` (quality: 85, effort: 4)
   - אם ההמרה נכשלת → משתמש בתמונה המקורית

3. **העלאה ל-Cloudinary:**
   - מעלה את התמונה (WebP או מקורית) ל-Cloudinary
   - Cloudinary עושה אופטימיזציה נוספת (quality: auto, fetch_format: auto)
   - Cloudinary יגיש WebP/AVIF אוטומטית לפי הדפדפן

4. **שמירה ב-`media_files`:**
   - שומר את כל הפרטים בטבלה `media_files`
   - כולל: filename, original_filename, file_url, file_size, width, height
   - `created_by` = המשתמש שרץ את הייבוא
   - `folder_path` = 'products'
   - **זה בדיוק כמו שהועלה ידנית דרך הדשבורד!**

5. **שמירה ב-`product_images`:**
   - שומר קישור למוצר ב-`product_images`
   - `src` = URL מ-Cloudinary
   - `position` = 1 (תמונה ראשית)

## 📋 שדות שנשמרים ב-`media_files`:

```sql
INSERT INTO media_files (
  store_id,           -- ID החנות
  filename,           -- שם קובץ ייחודי (timestamp-random_original.webp)
  original_filename,  -- שם הקובץ המקורי מ-S3
  file_path,          -- URL מ-Cloudinary
  file_url,           -- URL מ-Cloudinary (זהה ל-file_path)
  file_type,          -- 'image'
  mime_type,          -- 'image/webp' (אחרי המרה)
  file_size,          -- גודל הקובץ אחרי המרה ל-WebP
  width,              -- רוחב התמונה (אם זמין)
  height,             -- גובה התמונה (אם זמין)
  folder_path,        -- 'products'
  created_by,         -- ID המשתמש שרץ את הייבוא
  created_at,         -- תאריך יצירה
  updated_at          -- תאריך עדכון
)
```

## 🔧 הגדרות נדרשות

### משתני סביבה:

```env
# Cloudinary (חובה)
CLOUDINARY_URL=cloudinary://...
# או:
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# S3 (אופציונלי - לניסיון אוטומטי)
OLD_S3_BASE_URL=https://s3.amazonaws.com/bucket-name
# או:
OLD_S3_BUCKET=bucket-name
OLD_S3_REGION=us-east-1
```

## 📊 דוגמה לתהליך:

```
תמונה מקורית: 69030752a72e6.webp (מ-S3)
    ↓
הורדה מ-S3: https://bucket.s3.amazonaws.com/310/69030752a72e6.webp
    ↓
בדיקה: האם WebP? → כן → משאיר אותה
    ↓
העלאה ל-Cloudinary: quickshop3/310/products/1234567890-123_69030752a72e6.webp
    ↓
Cloudinary URL: https://res.cloudinary.com/.../quickshop3/310/products/1234567890-123_69030752a72e6.webp
    ↓
שמירה ב-media_files: id=123, filename=1234567890-123_69030752a72e6.webp, file_url=...
    ↓
שמירה ב-product_images: product_id=456, src=..., position=1
```

## ⚠️ הערות חשובות:

1. **אם תמונה לא נמצאה:** המוצר ייווצר בלי תמונה (לא ייכשל)
2. **אם ההמרה ל-WebP נכשלה:** משתמש בתמונה המקורית
3. **Cloudinary עושה אופטימיזציה נוספת:** גם אם העלינו WebP, Cloudinary יעשה אופטימיזציה
4. **שמירה ב-media_files:** התמונות יופיעו בספריית המדיה כאילו הועלו ידנית

## ✅ יתרונות:

- ✅ תמונות מומרות ל-WebP (קבצים קטנים יותר)
- ✅ Cloudinary עושה אופטימיזציה נוספת
- ✅ תמונות נשמרות ב-`media_files` (נראות בספריית המדיה)
- ✅ תמונות מקושרות למוצרים ב-`product_images`
- ✅ כל הפרטים נשמרים (גודל, מימדים, וכו')

