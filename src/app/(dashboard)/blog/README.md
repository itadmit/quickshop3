# Blog Module – Feature Checklist
# מודול בלוג – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List blog posts | רשימת פוסטים ✅
- [x] Create blog post | יצירת פוסט ✅
- [x] Edit blog post | עריכת פוסט ✅
- [x] Delete blog post | מחיקת פוסט ✅
- [x] Search posts | חיפוש פוסטים ✅
- [ ] Post categories | קטגוריות פוסטים
- [ ] Post tags | תגיות פוסטים
- [ ] Post SEO | SEO לפוסטים
- [ ] Post scheduling | תזמון פוסטים
- [ ] Post comments | תגובות פוסטים
- [ ] Post featured image | תמונה ראשית

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `blog.post.created` | כשנוצר פוסט | `{ post: {...} }` | api, dashboard | ✅ |
| `blog.post.updated` | כשעודכן פוסט | `{ post: {...} }` | api, dashboard | ✅ |
| `blog.post.deleted` | כשנמחק פוסט | `{ post_id: number }` | api, dashboard | ✅ |
| `blog.post.published` | כשפורסם פוסט | `{ post: {...} }` | api, dashboard | ⚠️ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| - | - | - | - |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/blog/posts` | Get posts list | ✅ |
| POST | `/api/blog/posts` | Create post | ✅ |
| GET | `/api/blog/posts/:id` | Get post details | ✅ |
| PUT | `/api/blog/posts/:id` | Update post | ✅ |
| DELETE | `/api/blog/posts/:id` | Delete post | ✅ |

## UI Components

- [x] BlogPostsTable | טבלת פוסטים ✅
- [ ] BlogPostForm | טופס פוסט
- [ ] BlogPostEditor | עורך פוסט
- [ ] BlogPostPreview | תצוגה מקדימה

