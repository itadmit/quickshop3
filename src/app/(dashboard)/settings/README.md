# Settings Module – Feature Checklist
# מודול הגדרות – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] Store settings | הגדרות חנות ✅
- [x] Update store info | עדכון פרטי חנות ✅
- [ ] Store domain | דומיין חנות
- [ ] Store email | אימייל חנות
- [ ] Store address | כתובת חנות
- [ ] Store logo | לוגו חנות
- [ ] Store currency | מטבע חנות
- [ ] Store locale | שפה חנות
- [ ] Store timezone | אזור זמן
- [ ] Store plan | תוכנית חנות
- [ ] Admin users | משתמשי אדמין
- [ ] User permissions | הרשאות משתמשים
- [ ] API keys | מפתחות API
- [ ] Integrations | אינטגרציות

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `store.updated` | כשעודכנה חנות | `{ store: {...}, changes: {...} }` | api, dashboard | ✅ |
| `settings.changed` | כששונו הגדרות | `{ setting: string, value: any }` | api, dashboard | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| - | - | - | - |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/settings/store` | Get store settings | ✅ |
| PUT | `/api/settings/store` | Update store settings | ✅ |
| GET | `/api/settings/users` | Get admin users | ⚠️ |
| POST | `/api/settings/users` | Create admin user | ⚠️ |
| GET | `/api/settings/api-keys` | Get API keys | ⚠️ |
| POST | `/api/settings/api-keys` | Create API key | ⚠️ |

## UI Components

- [x] StoreSettingsForm | טופס הגדרות חנות ✅
- [ ] AdminUsersList | רשימת אדמינים
- [ ] APIKeysList | רשימת מפתחות API
- [ ] IntegrationsList | רשימת אינטגרציות

