# Orders Module – Feature Checklist
# מודול הזמנות – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List orders | רשימת הזמנות ✅
- [x] Filter orders (status, date, amount) | פילטרים (סטטוס, תאריך, סכום) ✅
- [x] Order details | פרטי הזמנה ✅
- [x] Update order status | שינוי סטטוס הזמנה ✅
- [x] Refund/Cancel order | החזר/ביטול הזמנה ✅
- [ ] Send receipt/invoice | שליחת קבלה/חשבונית
- [x] Order line items | רשימת פריטי הזמנה ✅
- [ ] Mark as fraud/risk | סימון הונאה/סיכון
- [ ] Order timeline | טיימליין הערות
- [ ] Manual order creation | יצירת הזמנה ידנית

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source |
|------------|----------|---------|--------|
| `order.created` | כשנוצרת הזמנה חדשה | `{ order: {...} }` | api, dashboard, frontend |
| `order.updated` | כשהזמנה עודכנה | `{ order: {...}, changes: {...} }` | api, dashboard |
| `order.paid` | כשהזמנה שולמה | `{ order: {...}, transaction: {...} }` | api |
| `order.cancelled` | כשהזמנה בוטלה | `{ order: {...}, reason: string }` | api, dashboard |
| `order.fulfilled` | כשהזמנה בוצעה | `{ order: {...}, fulfillment: {...} }` | api, dashboard |
| `order.refunded` | כשמתבצע החזר | `{ order: {...}, refund: {...} }` | api, dashboard |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי |
|------------|---------|-----|
| `transaction.succeeded` | עדכון `financial_status` ל-`paid` | כשתשלום מצליח |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/orders` | Get orders list (with filters) | ✅ |
| GET | `/api/orders/:id` | Get order details | ✅ |
| POST | `/api/orders` | Create order | ✅ |
| PUT | `/api/orders/:id` | Update order | ✅ |
| POST | `/api/orders/:id/status` | Update order status | ✅ |
| POST | `/api/orders/:id/refund` | Refund order | ✅ |

## UI Components

- [x] OrdersTable | טבלת הזמנות ✅
- [x] OrderFilters | פילטרים ✅
- [x] OrderDetails | פרטי הזמנה ✅
- [x] OrderStatusBadge | תגית סטטוס ✅
- [ ] OrderTimeline | טיימליין

