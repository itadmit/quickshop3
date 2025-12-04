# 🎨 Design System - Quickshop3 Dashboard

<div dir="rtl">

## 📐 מבנה כללי של הדשבורד

הדשבורד בנוי מ-4 אזורים עיקריים:

```
┌─────────────────────────────────────────────────────────┐
│                    TOP HEADER                            │
│  [Logo] [Actions] [Search] [Notifications] [Profile]     │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ SIDEBAR  │           MAIN CONTENT AREA                  │
│          │                                              │
│          │                                              │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│                    FOOTER                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 ערכת צבעים (Color Palette)

### צבעים ראשיים:

```css
/* Primary Green - צבע ראשי */
--primary-green: #10B981;        /* כפתורים, לינקים פעילים */
--primary-green-hover: #059669;  /* Hover state */
--primary-green-light: #D1FAE5;  /* רקעים קלים */

/* Background Colors */
--bg-white: #FFFFFF;
--bg-gray-50: #F9FAFB;
--bg-gray-100: #F3F4F6;
--bg-gray-200: #E5E7EB;

/* Text Colors */
--text-primary: #111827;         /* טקסט ראשי */
--text-secondary: #6B7280;       /* טקסט משני */
--text-muted: #9CA3AF;           /* טקסט מוחלש */

/* Status Colors */
--status-success: #10B981;       /* שולם, נמסר */
--status-warning: #F59E0B;      /* ממתין */
--status-error: #EF4444;          /* בוטל, שגיאה */
--status-info: #3B82F6;          /* מידע */

/* Border Colors */
--border-light: #E5E7EB;
--border-medium: #D1D5DB;
```

---

## 📏 טיפוגרפיה (Typography)

### Font Family:
```css
font-family: 'Open Sans Hebrew', sans-serif;
```

**חשוב:** הפונט Open Sans Hebrew הוא חובה וברירת המחדל היחידה.

### Font Sizes:

```css
/* Headings */
--text-3xl: 30px;    /* כותרות ראשיות */
--text-2xl: 24px;    /* כותרות משניות */
--text-xl: 20px;     /* כותרות קטנות */
--text-lg: 18px;     /* טקסט גדול */
--text-base: 16px;    /* טקסט רגיל */
--text-sm: 14px;     /* טקסט קטן */
--text-xs: 12px;     /* טקסט קטן מאוד */
```

### Font Weights:
```css
--font-bold: 700;      /* כותרות */
--font-semibold: 600;  /* דגשים */
--font-medium: 500;     /* טקסט בינוני */
--font-normal: 400;    /* טקסט רגיל */
```

---

## 🧩 Top Header (כותרת עליונה)

### מבנה:

```
┌─────────────────────────────────────────────────────────┐
│ [Logo] [Actions] [Search Bar] [Icons] [Profile]         │
└─────────────────────────────────────────────────────────┘
```

### רכיבים:

1. **Logo (שמאל עליון)**
   - טקסט: "Quick Shop"
   - גודל: 24px, Bold
   - צבע: --text-primary

2. **Actions (שמאל)**
   - "+ עוד" (More) - כפתור אפור
   - "מוצר חדש" (New Product) - כפתור ירוק
   - "פעולות בשימוש תדיר" (Frequent Actions) - טקסט

3. **Search Bar (מרכז)**
   - רקע: --bg-gray-100
   - גבול: 1px solid --border-light
   - רדיוס: 8px
   - Placeholder: "חיפוש מוצרים, הזמנות, לקוחות, תוספים..."
   - אייקון חיפוש משמאל

4. **Icons (ימין)**
   - מרקטפלייס (Marketplace) - אייקון עגלה
   - צפייה בחנות (View Store) - אייקון עין
   - התראות (Notifications) - אייקון פעמון + badge אדום

5. **Profile (ימין עליון)**
   - תמונה/אותיות: עיגול ירוק עם אותיות
   - שם: "יוגב אביטן"
   - תפקיד: "סופר אדמין"
   - Dropdown arrow

### גובה Header:
```css
height: 64px;
padding: 0 24px;
border-bottom: 1px solid --border-light;
background: --bg-white;
```

---

## 📋 Sidebar Navigation (תפריט צד)

### מבנה:

```
┌─────────────┐
│ Quick Shop  │
├─────────────┤
│ [Icon] בית  │ ← Active (ירוק)
│ [Icon] התראות 3│
├─────────────┤
│ [Icon] מכירות│
│   [Icon] מוצרים│
│   [Icon] קטגוריות│
│   [Icon] הזמנות│
│   [Icon] אנשי קשר│
│   [Icon] מלאי│
│   [Icon] עריכה קבוצתית│
├─────────────┤
│ [Icon] שיווק והנחות│
│   [Icon] הנחות│
│   [Icon] קופונים│
│   [Icon] כרטיסי מתנה│
│   [Icon] עגלות נטושות│
│   [Icon] רשימת המתנה│
├─────────────┤
│ [Icon] תוכן│
│   [Icon] דפים│
│   [Icon] תפריט ניווט│
│   [Icon] בלוג│
│   [Icon] פופאפים│
│   [Icon] מדיה│
├─────────────┤
│ [Icon] שירות לקוחות│
│   [Icon] ביקורות│
│   [Icon] החזרות והחלפות│
│   [Icon] קרדיט בחנות│
└─────────────┘
```

### אייקונים:

**חשוב:** אין שימוש באימוג'ים! כל האייקונים הם מ-`react-icons` (Heroicons).

```typescript
import { 
  HiHome, 
  HiBell, 
  HiChartBar, 
  HiCube, 
  HiFolder, 
  HiShoppingCart,
  // ... וכו'
} from 'react-icons/hi';
```

### עיצוב:

```css
/* Sidebar Container */
width: 260px;
background: --bg-white;
border-right: 1px solid --border-light;
height: 100vh;
position: fixed;
right: 0; /* RTL */
top: 64px; /* מתחת ל-header */

/* Menu Item */
padding: 12px 20px;
font-size: --text-base;
color: --text-primary;
border-radius: 8px;
transition: all 0.2s;

/* Active State */
background: --primary-green-light;
color: --primary-green;
font-weight: --font-semibold;

/* Hover State */
background: --bg-gray-50;

/* Submenu */
padding-right: 40px; /* RTL - indent */
font-size: --text-sm;
```

### Badges (תגיות):

```css
/* Notification Badge */
background: --status-error;
color: white;
font-size: 12px;
padding: 2px 6px;
color: white;
font-weight: --font-semibold;
```

### Icons (אייקונים):

**חוק זהב:** אין אימוג'ים! רק אייקונים מ-`react-icons`.

```typescript
// ✅ טוב - react-icons
import { HiHome, HiBell, HiShoppingCart } from 'react-icons/hi';

<HiHome className="w-5 h-5" />

// ❌ רע - אימוג'ים
<span>🏠</span>
```

---

## 📊 Main Content Area (אזור תוכן ראשי)

### מבנה כללי:

```css
margin-right: 260px; /* RTL - רווח ל-sidebar */
margin-top: 64px;    /* רווח ל-header */
padding: 24px;
background: --bg-gray-50;
min-height: calc(100vh - 64px);
```

### Page Header (כותרת דף):

```css
/* Title */
font-size: --text-3xl;
font-weight: --font-bold;
color: --text-primary;
margin-bottom: 8px;

/* Subtitle */
font-size: --text-base;
color: --text-secondary;
margin-bottom: 24px;
```

---

## 🎴 Cards (כרטיסים)

### Metric Cards (כרטיסי מטריקות):

```css
/* Card Container */
background: --bg-white;
border-radius: 12px;
padding: 24px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
border: 1px solid --border-light;

/* Metric Value */
font-size: --text-3xl;
font-weight: --font-bold;
color: --text-primary;

/* Metric Label */
font-size: --text-sm;
color: --text-secondary;
margin-top: 8px;

/* Total/Subtext */
font-size: --text-xs;
color: --text-muted;
```

### דוגמה - כרטיס מטריקה:

```
┌─────────────────┐
│ חנויות פעילות  │
│                 │
│       1         │ ← גדול, Bold
│                 │
│     סה"כ 1      │ ← קטן, Muted
└─────────────────┘
```

---

## 📋 Tables (טבלאות)

### מבנה טבלה:

```css
/* Table Container */
background: --bg-white;
border-radius: 12px;
overflow: hidden;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* Table Header */
background: --bg-gray-50;
padding: 16px;
font-weight: --font-semibold;
font-size: --text-sm;
color: --text-secondary;
border-bottom: 2px solid --border-light;

/* Table Row */
padding: 16px;
border-bottom: 1px solid --border-light;
transition: background 0.2s;

/* Row Hover */
background: --bg-gray-50;

/* Row Selected */
background: --primary-green-light;
```

### עמודות טבלה:

1. **Checkbox Column**
   - רוחב: 48px
   - Checkbox במרכז

2. **Image Column** (אם רלוונטי)
   - רוחב: 64px
   - תמונה: 48x48px, rounded

3. **Text Columns**
   - רוחב: אוטומטי / flex
   - יישור: ימין (RTL)

4. **Actions Column**
   - רוחב: 48px
   - אייקון 3 נקודות (vertical ellipsis)

---

## 🔘 Buttons (כפתורים)

### Primary Button (כפתור ראשי):

```css
/* Green Primary */
background: --primary-green;
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: --font-semibold;
font-size: --text-base;
border: none;
transition: all 0.2s;

/* Hover */
background: --primary-green-hover;
transform: translateY(-1px);
box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);

/* Active */
transform: translateY(0);
```

### Secondary Button:

```css
background: --bg-white;
color: --text-primary;
border: 1px solid --border-medium;
padding: 12px 24px;
border-radius: 8px;
```

### Icon Button:

```css
width: 40px;
height: 40px;
border-radius: 8px;
background: --bg-gray-100;
border: none;
display: flex;
align-items: center;
justify-content: center;
```

---

## 🔍 Search Bar (שורת חיפוש)

### עיצוב:

```css
/* Search Container */
width: 100%;
max-width: 600px;
position: relative;

/* Input */
background: --bg-white;
border: 1px solid --border-light;
border-radius: 8px;
padding: 12px 16px 12px 48px; /* RTL - אייקון משמאל */
font-size: --text-base;
color: --text-primary;

/* Focus */
border-color: --primary-green;
box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);

/* Icon */
position: absolute;
right: 16px; /* RTL */
top: 50%;
transform: translateY(-50%);
color: --text-muted;
```

---

## 🏷️ Status Badges (תגיות סטטוס)

### עיצוב:

```css
/* Badge Base */
display: inline-block;
padding: 4px 12px;
border-radius: 12px;
font-size: --text-xs;
font-weight: --font-medium;

/* Status: Paid/Success */
background: rgba(16, 185, 129, 0.1);
color: --status-success;

/* Status: Pending/Warning */
background: rgba(245, 158, 11, 0.1);
color: --status-warning;

/* Status: Sent/Info */
background: rgba(59, 130, 246, 0.1);
color: --status-info;

/* Status: Delivered */
background: rgba(16, 185, 129, 0.1);
color: --status-success;
```

---

## 📱 Dropdown Menus (תפריטים נפתחים)

### עיצוב:

```css
/* Dropdown Container */
background: --bg-white;
border: 1px solid --border-light;
border-radius: 8px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
padding: 8px;
min-width: 200px;

/* Dropdown Item */
padding: 12px 16px;
border-radius: 6px;
font-size: --text-sm;
color: --text-primary;
display: flex;
align-items: center;
gap: 12px;
transition: background 0.2s;

/* Hover */
background: --bg-gray-50;

/* Danger Item (Delete) */
color: --status-error;
```

---

## 🔔 Notifications (התראות)

### Notification Card:

```css
/* Card */
background: --bg-white;
border-radius: 12px;
padding: 16px;
border-right: 4px solid --primary-green; /* RTL */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
margin-bottom: 12px;

/* Title */
font-weight: --font-semibold;
font-size: --text-base;
color: --text-primary;
margin-bottom: 4px;

/* Message */
font-size: --text-sm;
color: --text-secondary;
line-height: 1.5;

/* Time */
font-size: --text-xs;
color: --text-muted;
margin-top: 8px;
```

---

## 📊 Dashboard Home Page

### מבנה)

### מבנה:

```
┌─────────────────────────────────────────────┐
│ שלום, יוגב אביטן                            │
│ איך אני יכול לעזור לך היום?                │
├─────────────────────────────────────────────┤
│ [Metric Cards Row]                          │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │  1  │ │  6  │ │  0  │ │ ₪2K │ │ ₪0  │    │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘    │
├─────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │ מכירות אחרונות   │ │ התראות אחרונות    │ │
│ │                  │ │                  │ │
│ │ [Chart/Empty]    │ │ [Notification 1] │ │
│ │                  │ │ [Notification 2] │ │
│ │                  │ │ [Notification 3] │ │
│ └──────────────────┘ └──────────────────┘ │
├─────────────────────────────────────────────┤
│ פעולות מהירות                               │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │צרו   │ │הוסיפו│ │הגדירו│ │נהלו  │      │
│ │חנות  │ │מוצרים│ │תשלומים│ │הזמנות│      │
│ └──────┘ └──────┘ └──────┘ └──────┘      │
└─────────────────────────────────────────────┘
```

---

## 📦 Products Page (דף מוצרים)

### מבנה:

```
┌─────────────────────────────────────────────┐
│ מוצרים                                      │
│ נהל את כל המוצרים שלך                      │
├─────────────────────────────────────────────┤
│ [Search] [Import] [Export] [+ מוצר חדש]   │
├─────────────────────────────────────────────┤
│ [View Toggle] [Sort] [Filter] [Category]   │
├─────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ ☐ │ תמונה │ שם │ מחיר │ מקט │ אפשרויות│ │
│ ├────────────────────────────────────────┤ │
│ │ ☐ │ [img] │ מוצר │ ₪1500 │ SKU │ ... │ │
│ │ ☐ │ [img] │ טסט │ ₪150 │ - │ ... │ │
│ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 🛒 Orders Page (דף הזמנות)

### מבנה:

```
┌─────────────────────────────────────────────┐
│ הזמנות                                      │
│ נהל ועקוב אחר כל ההזמנות שלך               │
├─────────────────────────────────────────────┤
│ [+ יצירת הזמנה ידנית]                       │
├─────────────────────────────────────────────┤
│ [Search] [Status Filter] [Search Button]    │
├─────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ ☐ │ מספר │ לקוח │ תאריך │ סטטוס │ סכום│ │
│ ├────────────────────────────────────────┤ │
│ │ ☐ │ ORD-1│ יוסי │ 03/12 │ שולם │ ₪731│ │
│ │ ☐ │ ORD-2│ שרה │ 03/12 │ נשלח │ ₪194│ │
│ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 🎯 Spacing System (מערכת רווחים)

```css
/* Spacing Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### שימוש:

```css
/* Card Padding */
padding: --space-6; /* 24px */

/* Section Margin */
margin-bottom: --space-8; /* 32px */

/* Element Gap */
gap: --space-4; /* 16px */
```

---

## 🎨 Border Radius (רדיוסי פינות)

```css
--radius-sm: 4px;   /* קטן */
--radius-md: 8px;   /* בינוני */
--radius-lg: 12px;  /* גדול */
--radius-xl: 16px;  /* גדול מאוד */
--radius-full: 9999px; /* עגול מלא */
```

---

## 📐 Shadows (צללים)

```css
/* Small Shadow */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* Medium Shadow */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Large Shadow */
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);

/* Focus Shadow */
box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
```

---

## 🔄 RTL Support (תמיכה בעברית)

### כללים:

1. **Direction**
   ```css
   direction: rtl;
   text-align: right;
   ```

2. **Padding/Margin**
   ```css
   /* במקום padding-left */
   padding-right: 24px;
   
   /* במקום margin-left */
   margin-right: 16px;
   ```

3. **Border**
   ```css
   /* במקום border-left */
   border-right: 4px solid --primary-green;
   ```

4. **Flexbox**
   ```css
   /* Reverse order */
   flex-direction: row-reverse;
   ```

5. **Icons**
   ```css
   /* Icons משמאל */
   margin-right: auto;
   margin-left: 0;
   ```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  --sidebar-width: 0; /* נסגר */
  --main-margin: 0;
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  --sidebar-width: 200px;
}

/* Desktop */
@media (min-width: 1025px) {
  --sidebar-width: 260px;
}
```

---

## 🎯 Component Examples

### 1. Metric Card:

```tsx
<div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
  <div className="text-sm text-gray-600 mb-2">חנויות פעילות</div>
  <div className="text-3xl font-bold text-gray-900">1</div>
  <div className="text-xs text-gray-400 mt-2">סה"כ 1</div>
</div>
```

### 2. Icon Usage:

```tsx
// ✅ טוב - react-icons
import { HiHome, HiBell, HiShoppingCart } from 'react-icons/hi';

<HiHome className="w-5 h-5 text-gray-600" />
<HiBell className="w-6 h-6 text-green-500" />

// ❌ רע - אימוג'ים
<span>🏠</span>
<span>🔔</span>
```

### 2. Status Badge:

```tsx
<span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
  שולם
</span>
```

### 3. Table Row:

```tsx
<tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
  <td className="p-4">
    <input type="checkbox" />
  </td>
  <td className="p-4 font-medium">ORD-000001</td>
  <td className="p-4">
    <div>יוסי כהן</div>
      <div className="text-sm text-gray-500">yossi@example.com</div>
    </div>
  </td>
  <td className="p-4 text-sm text-gray-600">14:44 03/12/2025</td>
  <td className="p-4">
    <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
      שולם
    </span>
  </td>
  <td className="p-4 font-semibold">₪731.48</td>
  <td className="p-4">
    <button className="p-2 hover:bg-gray-100 rounded">
      ⋮
    </button>
  </td>
</tr>
```

---

## ✅ Design Principles

1. **פשטות** - עיצוב נקי ומינימלי
2. **עקביות** - אותם רכיבים באותו עיצוב
3. **מהירות** - תגובה מיידית לכל פעולה
4. **RTL First** - עברית היא שפת ברירת המחדל
5. **Accessibility** - נגישות מלאה
6. **Mobile Friendly** - תמיכה במובייל

---

## 📋 Checklist לעיצוב

לפני כל קומפוננטה חדשה, ודא:

- [ ] **RTL Support** - הכל מיושר ימינה
- [ ] **Colors** - משתמש בערכת הצבעים
- [ ] **Spacing** - משתמש במערכת הרווחים
- [ ] **Typography** - משתמש במערכת הטיפוגרפיה
- [ ] **Shadows** - צללים עקביים
- [ ] **Border Radius** - רדיוסי פינות עקביים
- [ ] **Hover States** - מצבי hover לכל רכיב אינטראקטיבי
- [ ] **Loading States** - מצבי טעינה (Skeleton)
- [ ] **Error States** - מצבי שגיאה
- [ ] **Empty States** - מצבים ריקים

---

## 🎨 Tailwind CSS Classes Reference

### Colors:
```css
bg-green-500    /* Primary Green */
bg-gray-50      /* Light Background */
bg-white        /* White */
text-gray-900   /* Primary Text */
text-gray-600   /* Secondary Text */
text-gray-400   /* Muted Text */
```

### Spacing:
```css
p-4, p-6, p-8   /* Padding */
m-4, m-6, m-8   /* Margin */
gap-4, gap-6    /* Gap */
```

### Typography:
```css
text-3xl, text-2xl, text-xl  /* Headings */
text-base, text-sm, text-xs   /* Body */
font-bold, font-semibold      /* Weights */
```

### Borders & Radius:
```css
border border-gray-200        /* Border */
rounded-lg, rounded-md        /* Radius */
```

### Shadows:
```css
shadow-sm, shadow-md         /* Shadows */
```

---

## 📐 Layout Grid

### Desktop:
```
Sidebar: 260px (fixed)
Main Content: calc(100% - 260px)
Padding: 24px
```

### Tablet:
```
Sidebar: 200px (collapsible)
Main Content: calc(100% - 200px)
Padding: 20px
```

### Mobile:
```
Sidebar: Hidden (drawer)
Main Content: 100%
Padding: 16px
```

---

## 🎯 סיכום

העיצוב מבוסס על:
- ✅ **Tailwind CSS** - עיצוב מהיר ועקבי
- ✅ **RTL First** - תמיכה מלאה בעברית
- ✅ **Green Primary** - צבע ראשי ירוק
- ✅ **Clean & Modern** - עיצוב נקי ומודרני
- ✅ **Consistent** - עקביות בכל הרכיבים

**הכל מוכן לפיתוח!** 🚀

</div>

