# Categories Module – Feature Checklist
# מודול קטגוריות – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List categories | רשימת קטגוריות ✅
- [x] Search categories | חיפוש קטגוריות ✅
- [ ] Create category | יצירת קטגוריה
- [ ] Edit category | עריכת קטגוריה
- [ ] Delete category | מחיקת קטגוריה
- [ ] Category image | תמונת קטגוריה
- [ ] Category products | מוצרי קטגוריה
- [ ] Category SEO | SEO לקטגוריה
- [ ] Category visibility | נראות קטגוריה
- [ ] Category sorting | מיון קטגוריות

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `category.created` | כשנוצרה קטגוריה | `{ category: {...} }` | api, dashboard | ⚠️ |
| `category.updated` | כשעודכנה קטגוריה | `{ category: {...} }` | api, dashboard | ⚠️ |
| `category.deleted` | כשנמחקה קטגוריה | `{ category_id: number }` | api, dashboard | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `product.created` | עדכון מוצרים בקטגוריה | כשנוצר מוצר | ⚠️ |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/categories` | Get categories list | ✅ |
| POST | `/api/categories` | Create category | ✅ |
| GET | `/api/categories/:id` | Get category details | ⚠️ |
| PUT | `/api/categories/:id` | Update category | ⚠️ |
| DELETE | `/api/categories/:id` | Delete category | ⚠️ |

## UI Components

- [x] CategoriesTable | טבלת קטגוריות ✅
- [ ] CategoryForm | טופס קטגוריה
- [ ] CategoryProducts | מוצרי קטגוריה

