# הגדרת כלי העברה

## התקנה

1. **התקנת חבילות נדרשות:**
   ```bash
   npm install mysql2 @types/mysql2
   ```

## הגדרת משתני סביבה

הוסף ל-`.env`:

```env
# Cloudinary (אמור להיות כבר מוגדר)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
# או:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# S3 Configuration (צריך לבדוק את המבנה המדויק)
OLD_S3_BASE_URL=https://s3.amazonaws.com/bucket-name
# או:
OLD_S3_BUCKET=bucket-name
OLD_S3_REGION=us-east-1
```

## בדיקת מבנה URLs של תמונות

לפני הרצה, צריך לבדוק איך נראים ה-URLs של התמונות ב-S3:

1. פתח את האתר הישן: `https://quick-shop.co.il/store/argania`
2. פתח כלי מפתח (F12)
3. בדוק את ה-URL של תמונה אחת (למשל: `69089d6bb0c85.webp`)
4. עדכן את `OLD_S3_BASE_URL` או `OLD_S3_BUCKET` בהתאם

**דוגמאות למבנים אפשריים:**
- `https://bucket-name.s3.amazonaws.com/store_id/filename`
- `https://bucket-name.s3.region.amazonaws.com/store_id/filename`
- `https://s3.region.amazonaws.com/bucket-name/store_id/filename`
- `https://s3.amazonaws.com/bucket-name/store_id/filename`

הכלי ינסה את כל הפורמטים האלה אוטומטית אם לא מוגדר `OLD_S3_BASE_URL`.

## הרצה

### 1. Dry Run (בדיקה ללא שינויים)

```bash
npx ts-node scripts/migrate-from-old-quickshop.ts \
  --store-slug argania \
  --new-store-id 1 \
  --limit 5 \
  --dry-run
```

### 2. העברה מלאה

```bash
npx ts-node scripts/migrate-from-old-quickshop.ts \
  --store-slug argania \
  --new-store-id 1
```

## מה הכלי עושה

1. ✅ קורא מוצרים מהמסד הישן
2. ✅ יוצר מוצרים במערכת החדשה
3. ✅ יוצר variants (כולל variant ברירת מחדל למוצרים רגילים)
4. ✅ יוצר `product_options` ו-`product_option_values` למוצרים עם וריאציות
5. ✅ מעביר תמונות מ-S3 ל-Cloudinary
6. ✅ שומר תמונות ב-`media_files` (כאילו עלו ידנית)
7. ✅ מקשר תמונות למוצרים ב-`product_images`

## פתרון בעיות

### שגיאת חיבור למסד הנתונים הישן
- ודא שיש גישה ל-RDS MySQL
- או הרץ מהשרת (EC2)

### תמונות לא נמצאות
- בדוק את מבנה ה-URLs של S3
- עדכן את `OLD_S3_BASE_URL` או `OLD_S3_BUCKET`
- הכלי ידפיס אזהרות על תמונות שלא נמצאו

### שגיאת Cloudinary
- ודא ש-Cloudinary מוגדר נכון
- בדוק את ה-API credentials

### שגיאת PostgreSQL
- ודא שהמסד החדש פועל
- ודא שיש גישה למסד

## לוגים

הכלי מדפיס:
- התקדמות בזמן אמת
- אזהרות על תמונות שלא נמצאו
- שגיאות אם יש
- סיכום בסוף (כמה הצליחו, כמה נכשלו)

