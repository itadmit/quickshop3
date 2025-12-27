# הוראות לבדיקת מבנה מסד הנתונים הישן

## בעיית חיבור

ה-RDS לא נגיש מהמחשב המקומי בגלל Security Group. יש כמה אפשרויות:

## אפשרות 1: הרצה ישירה מהטרמינל שלך

אם יש לך mysql מותקן, הרץ:

```bash
mysql -h quickshop-mysql.choq2s2o8d8y.us-east-1.rds.amazonaws.com -u root -p'aA0542284283!!' quicdvuk_ecom -e "SHOW TABLES;"
```

ואז העבר את הפלט.

## אפשרות 2: SSH Tunnel

אם יש לך גישה ל-EC2 instance, צור SSH tunnel:

```bash
ssh -L 3306:quickshop-mysql.choq2s2o8d8y.us-east-1.rds.amazonaws.com:3306 user@ec2-instance
```

ואז הרץ את הסקריפט עם:
```bash
MYSQL_HOST=localhost python3 scripts/check-old-quickshop-db.py
```

## אפשרות 3: הרצה מהשרת (EC2)

אם יש לך גישה ל-EC2, התחבר לשרת והרץ שם:

```bash
# התקן pymysql אם צריך
pip3 install pymysql

# הרץ את הסקריפט
python3 scripts/check-old-quickshop-db.py
```

## אפשרות 4: פתיחת Security Group

פתח את ה-Security Group ב-RDS ל-IP שלך:
1. לך ל-AWS Console → RDS
2. בחר את ה-instance
3. Security → VPC security groups
4. Edit inbound rules
5. הוסף rule: MySQL/Aurora, Port 3306, Source = Your IP

## מה הסקריפט בודק

הסקריפט `scripts/check-old-quickshop-db.py` בודק:
1. כל הטבלאות במסד הנתונים
2. מבנה טבלאות מוצרים (products, variants, options)
3. מבנה טבלאות חנויות
4. מבנה טבלאות תמונות/מדיה
5. דוגמאות נתונים מכל טבלה

## מה צריך לבדוק

1. **טבלאות מוצרים:**
   - איך נשמרים מוצרים בלי וריאציות?
   - איך נשמרים מוצרים עם אפשרויות?
   - איך נשמרים מחירים ומלאי?

2. **טבלאות תמונות:**
   - איך נשמרות תמונות?
   - מה המבנה של URLs ב-S3?
   - איך מקושרות תמונות למוצרים?

3. **טבלאות חנויות:**
   - איך מזוהה חנות?
   - מה המבנה של store_id?

4. **מידע נוסף:**
   - איך נשמרים SKU?
   - איך נשמרים ברקודים?
   - איך נשמרים תיאורים?

## אחרי הבדיקה

אחרי שתקבל את הפלט, נצטרך:
1. לנתח את המבנה
2. לבנות מיפוי שדות (old → new)
3. לבנות את כלי ההעברה

