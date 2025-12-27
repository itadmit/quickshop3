#!/bin/bash
# סקריפט פשוט לבדיקת מבנה מסד הנתונים הישן
# אם mysql מותקן, אפשר להריץ ישירות

HOST="quickshop-mysql.choq2s2o8d8y.us-east-1.rds.amazonaws.com"
USER="root"
PASS="aA0542284283!!"
DB="quicdvuk_ecom"

echo "=== רשימת כל הטבלאות ==="
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "SHOW TABLES;" 2>&1

echo -e "\n=== טבלאות מוצרים ==="
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "SHOW TABLES LIKE '%product%';" 2>&1

echo -e "\n=== טבלאות חנויות ==="
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "SHOW TABLES LIKE '%store%';" 2>&1

echo -e "\n=== טבלאות תמונות ==="
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "SHOW TABLES LIKE '%image%';" 2>&1
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "SHOW TABLES LIKE '%media%';" 2>&1

echo -e "\n=== מבנה טבלת products (אם קיימת) ==="
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "DESCRIBE products;" 2>&1

echo -e "\n=== דוגמאות ממוצרים (אם קיימת) ==="
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "SELECT * FROM products LIMIT 2\G" 2>&1

