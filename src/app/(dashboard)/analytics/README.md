# Analytics Module – Feature Checklist
# מודול אנליטיקס – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] Sales dashboard | דשבורד מכירות ✅
- [x] Top products | מוצרים מובילים ✅
- [x] Date range selection | בחירת טווח תאריכים ✅
- [ ] Revenue charts | גרפי הכנסות
- [ ] Order trends | מגמות הזמנות
- [ ] Customer analytics | אנליטיקס לקוחות
- [ ] Product performance | ביצועי מוצרים
- [ ] Traffic analytics | אנליטיקס תנועה
- [ ] Conversion rates | שיעורי המרה
- [ ] Export reports | ייצוא דוחות

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `analytics.viewed` | כשצופים בדוח | `{ report_type: string, date_range: {...} }` | dashboard | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | עדכון סטטיסטיקות מכירות | כשנוצרת הזמנה | ✅ |
| `order.paid` | עדכון הכנסות | כשהזמנה שולמה | ✅ |
| `product.viewed` | עדכון תצוגות מוצר | כשצופים במוצר | ⚠️ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/analytics/sales` | Get sales data | ✅ |
| GET | `/api/analytics/top-products` | Get top products | ✅ |
| GET | `/api/analytics/visits` | Get visit analytics | ✅ |
| GET | `/api/analytics/revenue` | Get revenue data | ⚠️ |
| GET | `/api/analytics/conversion` | Get conversion rates | ⚠️ |

## UI Components

- [x] SalesMetrics | מטריקות מכירות ✅
- [x] TopProductsList | רשימת מוצרים מובילים ✅
- [x] DateRangePicker | בחירת תאריכים ✅
- [ ] RevenueChart | גרף הכנסות
- [ ] OrderTrendsChart | גרף מגמות הזמנות
- [ ] TrafficChart | גרף תנועה

