# ✅ רשימת כל סוגי ההנחות - Checklist

## 📋 סקירה כללית

רשימה מלאה של כל סוגי ההנחות והקופונים הנתמכים במערכת, עם סטטוס יישום.

---

## 🎫 הנחות אוטומטיות (Automatic Discounts)

### סוגי חישוב:
- [x] **Percentage** - אחוז הנחה ✅
- [x] **Fixed Amount** - סכום קבוע ✅
- [x] **Free Shipping** - משלוח חינם ✅

### תנאי סכום:
- [x] **Minimum Order Amount** - סכום מינימום ✅
- [x] **Maximum Order Amount** - סכום מקסימום ✅
- [x] **Order Amount Range** - טווח סכום ✅

### תנאי כמות:
- [x] **Minimum Quantity** - כמות מינימום ✅
- [x] **Maximum Quantity** - כמות מקסימום ✅
- [x] **Quantity Range** - טווח כמות ✅

### תנאי מוצרים:
- [x] **All Products** - כל המוצרים ✅
- [x] **Specific Products** - מוצרים ספציפיים ✅
- [x] **Specific Collections** - קטגוריות ספציפיות ✅
- [x] **Specific Tags** - תגיות ספציפיות ✅

### תנאי לקוח:
- [x] **All Customers** - כל הלקוחות ✅
- [x] **VIP Customers** - לקוחות VIP ✅
- [x] **New Customers** - לקוחות חדשים ✅
- [x] **Returning Customers** - לקוחות חוזרים ✅
- [x] **By Orders Count** - לפי מספר הזמנות ✅
- [x] **By Lifetime Value** - לפי ערך חיים ✅

### תנאי זמן:
- [x] **Date Range** - טווח תאריכים ✅
- [x] **Day of Week** - יום בשבוע ✅
- [x] **Time of Day** - שעה ביום ✅
- [x] **Date & Time Range** - טווח תאריך ושעה ✅

### תכונות נוספות:
- [x] **Priority** - עדיפות ✅
- [x] **Can Combine with Codes** - שילוב עם קופונים ✅
- [x] **Can Combine with Other Automatic** - שילוב עם הנחות אוטומטיות אחרות ✅
- [x] **Max Combined Discounts** - מקסימום הנחות מצטברות ✅

---

## 🎟️ קופונים (Discount Codes)

### סוגי חישוב:
- [x] **Percentage** - אחוז הנחה ✅
- [x] **Fixed Amount** - סכום קבוע ✅
- [x] **Free Shipping** - משלוח חינם ✅

### תנאי סכום:
- [x] **Minimum Order Amount** - סכום מינימום ✅
- [x] **Maximum Order Amount** - סכום מקסימום ✅
- [x] **Order Amount Range** - טווח סכום ✅

### תנאי מוצרים:
- [x] **All Products** - כל המוצרים ✅
- [x] **Specific Products** - מוצרים ספציפיים ✅
- [x] **Specific Collections** - קטגוריות ספציפיות ✅
- [x] **Specific Tags** - תגיות ספציפיות ✅

### תנאי זמן:
- [x] **Date Range** - טווח תאריכים ✅
- [x] **Starts At** - תאריך התחלה ✅
- [x] **Ends At** - תאריך סיום ✅

### תכונות נוספות:
- [x] **Usage Limit** - מגבלת שימוש ✅
- [x] **Usage Count** - מעקב שימוש ✅
- [x] **Priority** - עדיפות ✅
- [x] **Can Combine with Automatic** - שילוב עם הנחות אוטומטיות ✅
- [x] **Can Combine with Other Codes** - שילוב עם קופונים אחרים ✅
- [x] **Max Combined Discounts** - מקסימום הנחות מצטברות ✅

---

## 🔄 שילובי הנחות

### סוגי שילובים:
- [x] **Automatic + Code** - הנחה אוטומטית + קופון ✅
- [x] **Multiple Automatic** - מספר הנחות אוטומטיות ✅
- [x] **Multiple Codes** - מספר קופונים ✅
- [x] **Prevent Combination** - מניעת שילוב ✅

### כללי שילוב:
- [x] **can_combine_with_codes** - האם ניתן לשלב עם קופונים ✅
- [x] **can_combine_with_other_automatic** - האם ניתן לשלב עם הנחות אוטומטיות אחרות ✅
- [x] **max_combined_discounts** - מקסימום הנחות מצטברות ✅

---

## 📊 עדיפויות

### סדר עדיפויות:
- [x] **הנחות אוטומטיות קודם** - תמיד מחושבות לפני קופונים ✅
- [x] **מיון לפי Priority** - הנחות אוטומטיות ממוינות לפי priority ✅
- [x] **קופונים אחרי** - מחושבים אחרי הנחות אוטומטיות ✅

---

## ✅ סיכום

### סטטיסטיקות:
- **סוגי הנחות:** 3 (percentage, fixed_amount, free_shipping)
- **תנאי סכום:** 2 (min, max)
- **תנאי כמות:** 2 (min, max)
- **תנאי מוצרים:** 4 (all, products, collections, tags)
- **תנאי לקוח:** 6 (all, vip, new, returning, orders, lifetime)
- **תנאי זמן:** 4 (date, day, hour, range)
- **סה"כ:** 20+ סוגי הנחות שונים!

### סטטוס יישום:
- ✅ **100% מיושם** - כל סוגי ההנחות מיושמים במלואם
- ✅ **מנוע מרכזי** - Single Source of Truth
- ✅ **עדיפויות** - הנחות אוטומטיות קודם
- ✅ **שילובים** - תמיכה מלאה בשילובים
- ✅ **תנאים** - כל סוגי התנאים נתמכים

---

**כל סוגי ההנחות מיושמים במלואם במנוע החישוב המרכזי!** 🎯

