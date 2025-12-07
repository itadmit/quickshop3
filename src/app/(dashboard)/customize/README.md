# Customizer Module – מודול קסטומייזר

## סקירה כללית

המודול Customizer מאפשר לבעלי חנויות לערוך את כל העמודים בחנות שלהם בצורה ויזואלית - בדיוק כמו שופיפיי, אבל בעברית!

## Core Features | תכונות ליבה

### ✅ Phase 1: Foundation (הושלם)
- [x] Database Schema - כל הטבלאות נוספו ל-schema.sql
- [x] Types TypeScript - כל ה-types והממשקים מוגדרים
- [x] Server Actions - שמירה, פרסום, עדכון, מחיקה
- [x] API Routes - קריאות נתונים (GET)
- [x] Event Integration - פליטת אירועים לכל פעולה

### ✅ Phase 2: UI Components (הושלם)
- [x] Visual Editor (WYSIWYG) - Layout + Sidebar + Preview
- [x] Section Management - הוספה, עריכה, מחיקה, שינוי סדר
- [x] Section Settings Panel - עריכת הגדרות סקשן מלאה
- [x] Add Section Dialog - דיאלוג הוספת סקשן עם חיפוש וקטגוריות
- [x] Drag & Drop - שינוי סדר סקשנים עם @dnd-kit
- [x] Preview Mode - דף תצוגה מקדימה (`/shops/[storeSlug]/preview`)
- [x] Save & Publish Buttons - כפתורי שמירה ופרסום
- [x] Auto-save - שמירה אוטומטית עם debounce (2 שניות)

### ✅ Phase 3: Section Components (הושלם)
- [x] Slideshow - סליידשו עם ניווט ואוטו-רוטציה
- [x] CollectionList - רשימת קטגוריות בגריד
- [x] RichText - טקסט עשיר עם HTML
- [x] AnnouncementBar - בר הודעות עליון
- [x] CustomHTML - HTML מותאם
- [x] FeaturedProduct - מוצר מוצג
- [x] ProductGrid - גריד מוצרים
- [x] ImageWithText - תמונה עם טקסט
- [x] DynamicSection - רינדור דינמי של סקשנים

### ✅ Phase 4: Advanced Features (הושלם חלקית)
- [x] Developer Mode (Code Editor) - עורך קוד למתכנתים (CSS, HTML, JS)
- [x] Theme Settings Panel - הגדרות תבנית גלובליות (צבעים, טיפוגרפיה, פריסה)
- [ ] Block Management - ניהול בלוקים בתוך סקשנים
- [ ] Edge Storage Integration - העלאה ל-Vercel Blob/R2
- [ ] Version History UI - תצוגת היסטוריית גרסאות
- [ ] Template Widgets - וידג'טים לעמודי לופ (product/collection)

## Events | אירועים

### Events Emitted | אירועים שנשלחים

| Event Topic | מתי נשלח | Payload | Source |
|------------|----------|---------|--------|
| `customizer.page.published` | כשעמוד מתפרסם | `{ store_id, page_type, page_handle, edge_json_url }` | dashboard |
| `customizer.page.draft_saved` | כששינויים נשמרים כ-draft | `{ store_id, page_type, page_handle }` | dashboard |
| `customizer.section.added` | כשסקשן נוסף | `{ store_id, page_type, section_type, section_id }` | dashboard |
| `customizer.section.updated` | כשסקשן עודכן | `{ store_id, section_id, changes }` | dashboard |
| `customizer.section.deleted` | כשסקשן נמחק | `{ store_id, section_id }` | dashboard |

### Events Listened | אירועים שמאזינים להם

| Event Topic | מה קורה | מתי |
|------------|---------|-----|
| `product.created` | עדכון רשימת מוצרים זמינים לוידג'טים | כשנוצר מוצר חדש |
| `product.updated` | עדכון תצוגה מקדימה | כשמוצר משתנה |
| `collection.created` | עדכון רשימת קטגוריות זמינות | כשנוצרת קטגוריה חדשה |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customizer/pages?pageType=home` | Get page config |
| GET | `/api/customizer/templates?type=product` | Get template config |

## Server Actions

| Function | Description |
|----------|-------------|
| `savePageDraft` | Save draft changes |
| `publishPage` | Publish page |
| `discardDraft` | Discard draft changes |
| `addSection` | Add new section |
| `updateSection` | Update section |
| `deleteSection` | Delete section |

## מבנה קבצים

```
src/app/(dashboard)/customize/
├── page.tsx                    # דף הקסטומייזר הראשי
├── actions.ts                 # Server Actions
├── hooks/
│   └── useAutoSave.ts         # Hook לשמירה אוטומטית
├── components/
│   ├── CustomizerLayout.tsx   # Layout עם Sidebar + Preview
│   ├── Sidebar.tsx            # Sidebar Editor עם Drag & Drop
│   ├── PreviewFrame.tsx       # Preview iframe
│   ├── SectionSettings.tsx    # פאנל עריכת הגדרות סקשן
│   ├── AddSectionDialog.tsx   # דיאלוג הוספת סקשן
│   ├── SortableSectionItem.tsx # פריט סקשן שניתן לגרירה
│   ├── DeveloperMode.tsx     # עורך קוד למתכנתים
│   └── ThemeSettings.tsx      # פאנל הגדרות תבנית
└── README.md                  # תיעוד המודול (קובץ זה)

src/components/storefront/
├── DynamicSection.tsx         # רינדור דינמי של סקשנים
└── sections/
    ├── Slideshow.tsx
    ├── CollectionList.tsx
    ├── RichText.tsx
    ├── AnnouncementBar.tsx
    ├── CustomHTML.tsx
    ├── FeaturedProduct.tsx
    ├── ProductGrid.tsx
    └── ImageWithText.tsx
```

## שימוש

### כניסה לקסטומייזר:

```
/dashboard/customize?page=home
/dashboard/customize?page=product
/dashboard/customize?page=collection
```

### שמירת שינויים:

```typescript
import { savePageDraft } from '@/app/(dashboard)/customize/actions';

await savePageDraft({
  page_type: 'home',
  sections: [...],
  section_order: [...],
});
```

### פרסום עמוד:

```typescript
import { publishPage } from '@/app/(dashboard)/customize/actions';

await publishPage({
  page_type: 'home',
});
```

## שימוש

### כניסה לקסטומייזר:

```
/dashboard/customize?page=home
/dashboard/customize?page=product
/dashboard/customize?page=collection
```

### תכונות עיקריות:

1. **הוספת סקשן**: לחץ על "הוסף סקשן" → בחר סקשן → הסקשן נוסף אוטומטית
2. **עריכת הגדרות**: לחץ על סקשן → לחץ על ⚙️ → ערוך הגדרות → שמור
3. **שינוי סדר**: גרור סקשן (⋮⋮) למעלה/למטה → נשמר אוטומטית
4. **שמירה**: שמירה אוטומטית כל 2 שניות, או לחץ על "שמור"
5. **פרסום**: לחץ על "פרסום" → העמוד מתפרסם
6. **מצב מפתח**: לחץ על "מפתח" → ערוך CSS, HTML, JavaScript
7. **הגדרות תבנית**: לחץ על "הגדרות תבנית" → ערוך צבעים, טיפוגרפיה, פריסה

### Auto-save:

הקסטומייזר שומר אוטומטית כל שינוי אחרי 2 שניות של חוסר פעילות. ניתן לראות את זמן השמירה האחרון בתחתית ה-Sidebar.

## תכונות מתקדמות

### Developer Mode 💻
- עורך CSS מותאם לכל העמוד
- עורך HTML להזרקה לפני סוף body
- עורך JavaScript להפעלה לאחר טעינת העמוד
- תמיכה ב-3 טאבים נפרדים
- שמירה ידנית

### Theme Settings ⚙️
- צבעים: Primary, Secondary, Accent, Background, Text, וכו'
- טיפוגרפיה: גופנים, גדלים, משקלים
- פריסה: רוחב מקסימלי, ריווחים
- כפתורים: פינות מעוגלות, סגנונות

## TODO

- [ ] Block Management UI - ניהול בלוקים בתוך סקשנים
- [ ] Edge Storage Integration - העלאה ל-Vercel Blob/R2
- [ ] Version History UI - תצוגת היסטוריית גרסאות
- [ ] Template Widgets - וידג'טים לעמודי לופ
- [ ] אינטגרציה עם מוצרים וקטגוריות אמיתיים
- [ ] שיפור עורך הקוד (Syntax highlighting, Auto-complete)

