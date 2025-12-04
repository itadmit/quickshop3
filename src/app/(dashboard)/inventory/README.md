# Inventory Module – Feature Checklist
# מודול מלאי – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List inventory items | רשימת פריטי מלאי ✅
- [ ] Inventory tracking | מעקב מלאי
- [ ] Low stock alerts | התראות מלאי נמוך
- [ ] Inventory adjustments | התאמות מלאי
- [ ] Inventory history | היסטוריית מלאי
- [ ] Bulk inventory update | עדכון מלאי בכמות
- [ ] Inventory transfers | העברות מלאי
- [ ] Stock locations | מיקומי מלאי
- [ ] Inventory reports | דוחות מלאי

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `inventory.updated` | כשמלאי עודכן | `{ variant_id: number, quantity: number }` | api, dashboard | ✅ |
| `inventory.low_stock` | כשמלאי נמוך | `{ variant_id: number, quantity: number }` | api | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | הורדת מלאי | כשנוצרת הזמנה | ✅ |
| `order.cancelled` | החזרת מלאי | כשהזמנה מבוטלת | ✅ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/inventory` | Get inventory items | ⚠️ |
| PUT | `/api/inventory/:id` | Update inventory | ⚠️ |

## UI Components

- [x] InventoryTable | טבלת מלאי ✅
- [ ] InventoryAdjustmentForm | טופס התאמת מלאי
- [ ] LowStockAlerts | התראות מלאי נמוך

