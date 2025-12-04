# Webhooks Module – Feature Checklist
# מודול Webhooks – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List webhook subscriptions | רשימת מנויי Webhook ✅
- [x] View webhook events | צפייה באירועי Webhook ✅
- [ ] Create webhook subscription | יצירת מנוי Webhook
- [ ] Edit webhook subscription | עריכת מנוי Webhook
- [ ] Delete webhook subscription | מחיקת מנוי Webhook
- [ ] Test webhook | בדיקת Webhook
- [ ] Webhook delivery logs | לוגי משלוח Webhook
- [ ] Retry failed deliveries | ניסיון חוזר למשלוחים שנכשלו
- [ ] Webhook security | אבטחת Webhook

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `webhook.subscription.created` | כשנוצר מנוי | `{ subscription: {...} }` | api, dashboard | ⚠️ |
| `webhook.delivered` | כשנשלח Webhook | `{ subscription_id: number, event: string }` | api | ⚠️ |
| `webhook.failed` | כשנכשל משלוח | `{ subscription_id: number, error: string }` | api | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `*` | יצירת אירוע Webhook | כל אירוע במערכת | ✅ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/webhooks/subscriptions` | Get subscriptions | ✅ |
| POST | `/api/webhooks/subscriptions` | Create subscription | ✅ |
| GET | `/api/webhooks/subscriptions/:id` | Get subscription | ✅ |
| PUT | `/api/webhooks/subscriptions/:id` | Update subscription | ✅ |
| DELETE | `/api/webhooks/subscriptions/:id` | Delete subscription | ✅ |
| GET | `/api/webhooks/events` | Get webhook events | ✅ |

## UI Components

- [x] WebhooksList | רשימת Webhooks ✅
- [x] WebhookEventsList | רשימת אירועים ✅
- [ ] WebhookForm | טופס Webhook
- [ ] WebhookDeliveryLogs | לוגי משלוח

