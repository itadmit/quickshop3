# Shipping Module – Feature Checklist
# מודול משלוחים – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List shipping zones | רשימת אזורי משלוח ✅
- [x] View zone rates | צפייה בתעריפי אזור ✅
- [ ] Create shipping zone | יצירת אזור משלוח
- [ ] Edit shipping zone | עריכת אזור משלוח
- [ ] Delete shipping zone | מחיקת אזור משלוח
- [ ] Add shipping rate | הוספת תעריף משלוח
- [ ] Edit shipping rate | עריכת תעריף משלוח
- [ ] Delete shipping rate | מחיקת תעריף משלוח
- [ ] Shipping rules | חוקי משלוח
- [ ] Free shipping threshold | סף משלוח חינם

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `shipping.zone.created` | כשנוצר אזור משלוח | `{ zone: {...} }` | api, dashboard | ⚠️ |
| `shipping.zone.updated` | כשעודכן אזור | `{ zone: {...} }` | api, dashboard | ⚠️ |
| `shipping.rate.created` | כשנוצר תעריף | `{ rate: {...} }` | api, dashboard | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | חישוב עלות משלוח | כשנוצרת הזמנה | ⚠️ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/shipping/zones` | Get shipping zones | ✅ |
| POST | `/api/shipping/zones` | Create shipping zone | ✅ |
| GET | `/api/shipping/zones/:id` | Get zone details | ⚠️ |
| PUT | `/api/shipping/zones/:id` | Update zone | ⚠️ |
| DELETE | `/api/shipping/zones/:id` | Delete zone | ⚠️ |
| GET | `/api/shipping/zones/:id/rates` | Get zone rates | ✅ |
| POST | `/api/shipping/zones/:id/rates` | Create rate | ✅ |

## UI Components

- [x] ShippingZonesList | רשימת אזורי משלוח ✅
- [x] ZoneCard | כרטיס אזור ✅
- [ ] ZoneForm | טופס אזור
- [ ] RateForm | טופס תעריף

