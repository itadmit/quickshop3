# Coupons Module – Feature Checklist
# מודול קופונים – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List coupons | רשימת קופונים ✅
- [x] Search coupons | חיפוש קופונים ✅
- [ ] Create coupon | יצירת קופון
- [ ] Edit coupon | עריכת קופון
- [ ] Delete coupon | מחיקת קופון
- [ ] Coupon usage tracking | מעקב שימוש בקופון
- [ ] Coupon expiration | תפוגת קופון
- [ ] Coupon limits | הגבלות קופון
- [ ] Bulk coupon generation | יצירת קופונים בכמות

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `coupon.created` | כשנוצר קופון | `{ coupon: {...} }` | api, dashboard | ⚠️ |
| `coupon.used` | כשקופון שימש | `{ coupon_id: number, order_id: number }` | api | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | עדכון שימוש בקופון | כשהזמנה משתמשת בקופון | ⚠️ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/discounts` | Get coupons (uses discounts API) | ✅ |
| POST | `/api/discounts` | Create coupon | ✅ |

## UI Components

- [x] CouponsTable | טבלת קופונים ✅
- [ ] CouponForm | טופס קופון

