# Loyalty Module – Feature Checklist
# מודול מועדון לקוחות – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List loyalty tiers | רשימת רמות נאמנות ✅
- [x] List loyalty rules | רשימת חוקי נאמנות ✅
- [ ] Create loyalty tier | יצירת רמת נאמנות
- [ ] Edit loyalty tier | עריכת רמת נאמנות
- [ ] Delete loyalty tier | מחיקת רמת נאמנות
- [ ] Create loyalty rule | יצירת חוק נאמנות
- [ ] Edit loyalty rule | עריכת חוק נאמנות
- [ ] Delete loyalty rule | מחיקת חוק נאמנות
- [ ] Customer points management | ניהול נקודות לקוח
- [ ] Points history | היסטוריית נקודות
- [ ] Rewards redemption | מימוש פרסים

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `loyalty.tier.created` | כשנוצרה רמה | `{ tier: {...} }` | api, dashboard | ⚠️ |
| `loyalty.points.added` | כשנוספו נקודות | `{ customer_id: number, points: number }` | api | ⚠️ |
| `loyalty.points.redeemed` | כשנפדו נקודות | `{ customer_id: number, points: number }` | api | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | הוספת נקודות | כשנוצרת הזמנה | ⚠️ |
| `order.paid` | הוספת נקודות | כשהזמנה שולמה | ⚠️ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/loyalty/tiers` | Get loyalty tiers | ✅ |
| POST | `/api/loyalty/tiers` | Create tier | ✅ |
| GET | `/api/loyalty/rules` | Get loyalty rules | ✅ |
| POST | `/api/loyalty/rules` | Create rule | ✅ |
| GET | `/api/loyalty/customers/:id/points` | Get customer points | ✅ |
| PUT | `/api/loyalty/customers/:id/points` | Update customer points | ✅ |

## UI Components

- [x] LoyaltyTiersList | רשימת רמות ✅
- [x] LoyaltyRulesList | רשימת חוקים ✅
- [ ] TierForm | טופס רמה
- [ ] RuleForm | טופס חוק
- [ ] PointsManager | מנהל נקודות

