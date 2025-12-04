# Discounts Module – Feature Checklist
# מודול הנחות – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List discount codes | רשימת קודי הנחה ✅
- [x] Create discount code | יצירת קוד הנחה ✅
- [x] Edit discount code | עריכת קוד הנחה ✅
- [x] Delete discount code | מחיקת קוד הנחה ✅
- [x] Filter by status | פילטר לפי סטטוס ✅
- [ ] Discount usage tracking | מעקב שימוש בהנחה
- [ ] Discount rules | חוקי הנחה
- [ ] Automatic discounts | הנחות אוטומטיות
- [ ] Discount combinations | שילובי הנחות
- [ ] Export discount codes | ייצוא קודי הנחה

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `discount.created` | כשנוצר קוד הנחה | `{ discount: {...} }` | api, dashboard | ✅ |
| `discount.updated` | כשעודכן קוד | `{ discount: {...} }` | api, dashboard | ✅ |
| `discount.deleted` | כשנמחק קוד | `{ discount_id: number }` | api, dashboard | ✅ |
| `discount.used` | כשקוד שימש | `{ discount_id: number, order_id: number }` | api | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | עדכון שימוש בקוד | כשהזמנה משתמשת בקוד | ⚠️ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/discounts` | Get discounts list | ✅ |
| POST | `/api/discounts` | Create discount | ✅ |
| GET | `/api/discounts/:id` | Get discount details | ✅ |
| PUT | `/api/discounts/:id` | Update discount | ✅ |
| DELETE | `/api/discounts/:id` | Delete discount | ✅ |

## UI Components

- [x] DiscountsTable | טבלת הנחות ✅
- [x] DiscountFilters | פילטרים ✅
- [ ] DiscountForm | טופס הנחה
- [ ] DiscountUsageChart | גרף שימוש

