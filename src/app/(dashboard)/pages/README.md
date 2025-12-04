# Pages Module – Feature Checklist
# מודול דפים – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List pages | רשימת דפים ✅
- [x] Create page | יצירת דף ✅
- [x] Edit page | עריכת דף ✅
- [x] Delete page | מחיקת דף ✅
- [x] Search pages | חיפוש דפים ✅
- [ ] Page templates | תבניות דפים
- [ ] Page SEO | SEO לדפים
- [ ] Page visibility | נראות דף
- [ ] Page scheduling | תזמון דף
- [ ] Page preview | תצוגה מקדימה

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `page.created` | כשנוצר דף | `{ page: {...} }` | api, dashboard | ✅ |
| `page.updated` | כשעודכן דף | `{ page: {...} }` | api, dashboard | ✅ |
| `page.deleted` | כשנמחק דף | `{ page_id: number }` | }` | api, dashboard | ✅ |
| `page.published` | כשפורסם דף | `{ page: {...} }` | api, dashboard | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| - | - | - | - |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/pages` | Get pages list | ✅ |
| POST | `/api/pages` | Create page | ✅ |
| GET | `/api/pages/:id` | Get page details | ✅ |
| PUT | `/api/pages/:id` | Update page | ✅ |
| DELETE | `/api/pages/:id` | Delete page | ✅ |

## UI Components

- [x] PagesTable | טבלת דפים ✅
- [ ] PageForm | טופס דף
- [ ] PageEditor | עורך דף
- [ ] PagePreview | תצוגה מקדימה

