# Customers Module – Feature Checklist
# מודול לקוחות – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List customers | רשימת לקוחות ✅
- [x] Customer details | פרטי לקוח ✅
- [x] Order history | היסטוריית הזמנות ✅
- [x] Add notes | הוספת הערות ✅
- [ ] Customer tags | תגיות לקוח
- [ ] Customer segments | סגמנטים
- [ ] Customer search & filters | חיפוש ופילטרים
- [ ] Export customers | ייצוא לקוחות
- [ ] Customer groups | קבוצות לקוחות
- [ ] Customer lifetime value | ערך חיים של לקוח

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `customer.created` | כשנוצר לקוח חדש | `{ customer: {...} }` | api, dashboard | ✅ |
| `customer.updated` | כשעודכן לקוח | `{ customer: {...}, changes: {...} }` | api, dashboard | ✅ |
| `customer.note.added` | כשנוספה הערה | `{ customer_id: number, note: string }` | api, dashboard | ✅ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | עדכון סטטיסטיקות לקוח | כשנוצרת הזמנה | ✅ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/customers` | Get customers list (with filters) | ✅ |
| GET | `/api/customers/:id` | Get customer details | ✅ |
| POST | `/api/customers` | Create customer | ✅ |
| PUT | `/api/customers/:id` | Update customer | ✅ |
| POST | `/api/customers/:id/note` | Add note to customer | ✅ |

## UI Components

- [x] CustomersTable | טבלת לקוחות ✅
- [x] CustomerDetails | פרטי לקוח ✅
- [x] CustomerOrders | הזמנות לקוח ✅
- [x] CustomerNotes | הערות לקוח ✅
- [ ] CustomerTags | תגיות לקוח
- [ ] CustomerSegments | סגמנטים

