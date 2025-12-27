#!/usr/bin/env python3
"""
Script to connect to old QuickShop MySQL database and explore its structure
"""
import sys

try:
    import pymysql
    USE_PYMYSQL = True
except ImportError:
    try:
        import mysql.connector
        USE_PYMYSQL = False
    except ImportError:
        print("Error: Need to install pymysql or mysql-connector-python")
        print("Run: pip install pymysql")
        sys.exit(1)

# Database connection details
# אם יש SSH tunnel, שנה host ל-'localhost'
DB_CONFIG = {
    'host': 'quickshop-mysql.choq2s2o8d8y.us-east-1.rds.amazonaws.com',  # או 'localhost' אם יש SSH tunnel
    'user': 'root',
    'password': 'aA0542284283!!',
    'database': 'quicdvuk_ecom',
    'charset': 'utf8mb4',
    'connect_timeout': 30,
    'read_timeout': 30,
    'write_timeout': 30
}

# אפשר לשנות דרך משתנה סביבה
import os
if os.getenv('MYSQL_HOST'):
    DB_CONFIG['host'] = os.getenv('MYSQL_HOST')

def get_connection():
    """Get database connection"""
    if USE_PYMYSQL:
        return pymysql.connect(**DB_CONFIG)
    else:
        return mysql.connector.connect(**DB_CONFIG)

def show_tables():
    """Show all tables in the database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    print("\n=== כל הטבלאות במסד הנתונים ===")
    for table in tables:
        print(f"  - {table[0]}")
    
    cursor.close()
    conn.close()
    return [t[0] for t in tables]

def describe_table(table_name):
    """Describe table structure"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(f"DESCRIBE `{table_name}`")
    columns = cursor.fetchall()
    
    print(f"\n=== מבנה טבלה: {table_name} ===")
    if USE_PYMYSQL:
        for col in columns:
            print(f"  {col[0]:30} {col[1]:20} {col[2]:5} {col[3]:5} {col[4]:10} {col[5]:10}")
    else:
        for col in columns:
            print(f"  {col[0]:30} {col[1]:20}")
    
    cursor.close()
    conn.close()

def get_table_data(table_name, limit=5):
    """Get sample data from table"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(f"SELECT * FROM `{table_name}` LIMIT {limit}")
    rows = cursor.fetchall()
    
    # Get column names
    cursor.execute(f"DESCRIBE `{table_name}`")
    columns = [col[0] for col in cursor.fetchall()]
    
    print(f"\n=== דוגמאות נתונים מטבלה: {table_name} (עד {limit} שורות) ===")
    print(f"עמודות: {', '.join(columns)}")
    for i, row in enumerate(rows, 1):
        print(f"\nשורה {i}:")
        for col_name, value in zip(columns, row):
            if value is not None and len(str(value)) > 100:
                print(f"  {col_name}: {str(value)[:100]}...")
            else:
                print(f"  {col_name}: {value}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("מתחבר למסד הנתונים של קוויק שופ הישן...")
    print(f"Host: {DB_CONFIG['host']}")
    print(f"Database: {DB_CONFIG['database']}")
    print(f"User: {DB_CONFIG['user']}")
    print("\nאם יש timeout, ייתכן שצריך:")
    print("1. להריץ מהשרת עצמו (EC2)")
    print("2. להגדיר SSH tunnel")
    print("3. לפתוח Security Group ב-RDS ל-IP שלך")
    print("4. להריץ את הפקודה mysql ישירות ולהעביר את הפלט\n")
    
    try:
        # Show all tables
        print("\nקורא את רשימת הטבלאות...")
        tables = show_tables()
        
        # Focus on product-related tables
        product_tables = [t for t in tables if 'product' in t.lower() or 'store' in t.lower() or 'image' in t.lower() or 'variant' in t.lower() or 'option' in t.lower()]
        
        print("\n\n=== טבלאות רלוונטיות למוצרים ===")
        for table in product_tables:
            print(f"\n{'='*60}")
            describe_table(table)
            get_table_data(table, limit=3)
        
        # Also check for stores
        store_tables = [t for t in tables if 'store' in t.lower() and t not in product_tables]
        if store_tables:
            print("\n\n=== טבלאות חנויות ===")
            for table in store_tables:
                print(f"\n{'='*60}")
                describe_table(table)
                get_table_data(table, limit=2)
        
        # Check for images/media tables
        image_tables = [t for t in tables if ('image' in t.lower() or 'media' in t.lower() or 'file' in t.lower()) and t not in product_tables]
        if image_tables:
            print("\n\n=== טבלאות תמונות/מדיה ===")
            for table in image_tables:
                print(f"\n{'='*60}")
                describe_table(table)
                get_table_data(table, limit=2)
        
    except Exception as e:
        print(f"\n❌ שגיאה: {e}")
        print("\n💡 אפשרויות:")
        print("1. להריץ מהטרמינל שלך: mysql -h quickshop-mysql.choq2s2o8d8y.us-east-1.rds.amazonaws.com -u root -p'aA0542284283!!' quicdvuk_ecom -e 'SHOW TABLES;'")
        print("2. להריץ מהשרת (EC2) אם יש לך גישה")
        print("3. להגדיר SSH tunnel: ssh -L 3306:quickshop-mysql.choq2s2o8d8y.us-east-1.rds.amazonaws.com:3306 user@ec2-instance")
        import traceback
        traceback.print_exc()

