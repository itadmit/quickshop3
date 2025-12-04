# Payments Module – Feature Checklist
# מודול תשלומים – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List payment providers | רשימת ספקי תשלום ✅
- [x] Add payment provider | הוספת ספק תשלום ✅
- [x] Toggle provider status | הפעלה/כיבוי ספק ✅
- [ ] Edit provider settings | עריכת הגדרות ספק
- [ ] Delete provider | מחיקת ספק
- [ ] Provider configuration | הגדרת ספק
- [ ] Test payments | תשלומי בדיקה
- [ ] Payment methods | שיטות תשלום
- [ ] Refund management | ניהול החזרים
- [ ] Payment gateway logs | לוגים של שער תשלום

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `payment.provider.created` | כשנוצר ספק תשלום | `{ provider: {...} }` | api, dashboard | ⚠️ |
| `payment.provider.updated` | כשעודכן ספק | `{ provider: {...} }` | api, dashboard | ⚠️ |
| `payment.provider.toggled` | כששונה סטטוס ספק | `{ provider_id: number, is_active: boolean }` | api, dashboard | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | יצירת תשלום | כשנוצרת הזמנה | ⚠️ |
| `order.paid` | עדכון סטטוס תשלום | כשהזמנה שולמה | ⚠️ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/payments/providers` | Get payment providers | ✅ |
| POST | `/api/payments/providers` | Create payment provider | ✅ |
| GET | `/api/payments/providers/:id` | Get provider details | ✅ |
| PUT | `/api/payments/providers/:id` | Update provider | ✅ |
| DELETE | `/api/payments/providers/:id` | Delete provider | ✅ |

## UI Components

- [x] PaymentProvidersList | רשימת ספקי תשלום ✅
- [x] ProviderCard | כרטיס ספק ✅
- [ ] ProviderForm | טופס ספק
- [ ] ProviderSettings | הגדרות ספק

