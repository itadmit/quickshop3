# 🎨 אפיון קסטומייזר - Quickshop3 Theme Customizer Specification

<div dir="rtl">

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [פילוסופיית המערכת](#פילוסופיית-המערכת)
3. [ארכיטקטורה מבוססת ביצועים](#ארכיטקטורה-מבוססת-ביצועים)
4. [מבנה נתונים](#מבנה-נתונים)
5. [ממשק משתמש - שתי רמות](#ממשק-משתמש---שתי-רמות)
6. [עורך קוד למתקדמים](#עורך-קוד-למתקדמים)
7. [סקשנים זמינים](#סקשנים-זמינים)
8. [מערכת תבניות](#מערכת-תבניות)
9. [אינטגרציה עם הסטורפרונט](#אינטגרציה-עם-הסטורפרונט)
10. [API Endpoints](#api-endpoints)
11. [אסטרטגיית ביצועים וסקייל](#אסטרטגיית-ביצועים-וסקייל)
12. [Checklist יישום](#checklist-יישום)

---

## 🎯 סקירה כללית

### מהו הקסטומייזר?

הקסטומייזר הוא **עורך ויזואלי מתקדם** שמאפשר לבעלי חנויות לערוך את כל העמודים בחנות שלהם - מתחרה ישיר בשופיפיי, אבל **בעברית ועם תמיכה מלאה ב-RTL**.

### 🎯 יעדי מפתח:

1. **מתחרים בשופיפיי** - לא פחות טוב, יותר טוב בעברית
2. **פשטות ללקוח הפשוט** - ממשק אינטואיטיבי ללא קוד
3. **עוצמה למתכנתים** - גישה מלאה ל-CSS, HTML, JavaScript
4. **סקייל** - בנוי לאלפי חנויות במקביל
5. **ביצועים** - לא מעמיס על השרת
6. **תאימות מלאה למערכת הקיימת** - עובד עם הארכיטקטורה, DB, ו-Event System הקיימים

### 🔗 אינטגרציה עם המערכת הקיימת:

הקסטומייזר **משתלב לחלוטין** עם המערכת הקיימת של Quickshop3:

- ✅ **מבנה URL:** `/dashboard/customize` (דשבורד) + `/shops/{storeSlug}/preview` (תצוגה מקדימה)
- ✅ **Event-Driven:** כל פעולה פולטת אירועים (`customizer.page.published`, `customizer.section.updated`, וכו')
- ✅ **Server Actions:** שימוש ב-Server Actions לפעולות מהירות (פרסום, שמירה)
- ✅ **DB Schema:** משתמש בטבלאות הקיימות + טבלאות חדשות לקסטומייזר
- ✅ **Storefront Integration:** עובד עם הסטורפרונט הקיים (`/shops/[storeSlug]/`)
- ✅ **Client-Side Dashboard:** הקסטומייזר הוא Client Component (100% `use client`)
- ✅ **Documentation Driven:** כל פיצ'ר מתועד ב-README (לפי המתודולוגיה הקיימת)

---

## 🧠 פילוסופיית המערכת

### "שני עולמות, מערכת אחת"

```
┌───────────────────────────────────────────────────────────────────┐
│                     קסטומייזר Quickshop3                           │
├─────────────────────────────┬─────────────────────────────────────┤
│                             │                                     │
│    🎨 מצב ויזואלי            │    💻 מצב מפתח                       │
│    (לקוחות פשוטים)           │    (מתכנתים/בוני אתרים)              │
│                             │                                     │
│  ✓ Drag & Drop              │  ✓ עורך CSS מלא                     │
│  ✓ הגדרות בטאבים            │  ✓ עורך HTML/JSX                    │
│  ✓ Color Picker             │  ✓ Custom JavaScript               │
│  ✓ בחירת תמונות             │  ✓ גישה ל-Schema                    │
│  ✓ טקסט ישיר                │  ✓ יצירת סקשנים מותאמים            │
│  ✓ אין צורך בידע טכני       │  ✓ Liquid-like syntax               │
│                             │  ✓ API מלא                         │
│                             │                                     │
├─────────────────────────────┴─────────────────────────────────────┤
│                        🔄 מתג ראשי                                 │
│              [מצב ויזואלי]  ←→  [מצב מפתח]                        │
└───────────────────────────────────────────────────────────────────┘
```

### עקרונות יסוד:

| עיקרון | למשתמש פשוט | למתכנת |
|--------|-------------|--------|
| **עריכה** | WYSIWYG בזמן אמת | גישה לקוד |
| **סקשנים** | Drag & Drop | יצירת סקשנים חדשים |
| **עיצוב** | בחירה מוגדרת מראש | CSS מלא |
| **התאמה** | הגדרות טאבים | Schema מותאם |
| **מתקדם** | - | JavaScript injection |

---

## 🏗️ ארכיטקטורה מבוססת ביצועים

### 🚀 איך שופיפיי עושים את זה (ואיך נעשה יותר טוב):

#### שופיפיי:
- שומרים הגדרות ב-JSON files על CDN
- Liquid מקומפל בצד השרת
- Edge caching אגרסיבי
- Theme files מאוחסנים per-store

#### אנחנו (Quickshop3):
```
┌─────────────────────────────────────────────────────────────────────┐
│                    אסטרטגיית ביצועים                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1️⃣ JSON Configuration Files (Vercel Edge)                          │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │  /config/{store_id}/                                      │   │
│     │    ├── settings.json     (הגדרות כלליות)                  │   │
│     │    ├── home.json         (עמוד בית)                       │   │
│     │    ├── product.json      (עמוד מוצר)                      │   │
│     │    ├── collection.json   (עמוד קטגוריה)                   │   │
│     │    ├── cart.json         (עמוד עגלה)                      │   │
│     │    └── custom_css.css    (CSS מותאם)                      │   │
│     └──────────────────────────────────────────────────────────┘   │
│                                                                     │
│  2️⃣ Database (Neon PostgreSQL) - Source of Truth                    │
│     - שומר את כל הנתונים המקוריים                                  │
│     - Version History                                               │
│     - Draft vs Published states                                     │
│                                                                     │
│  3️⃣ Cache Strategy                                                   │
│     - Publish → Generate JSON → Upload to Edge                      │
│     - Storefront קורא JSON מ-Edge (מהיר!)                          │
│     - Fallback ל-DB רק אם אין cache                                │
│                                                                     │
│  4️⃣ ISR (Incremental Static Regeneration)                           │
│     - עמודים נבנים מראש                                            │
│     - Revalidate on demand כשיש שינוי                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### זרימת נתונים:

```
📝 עריכה בקסטומייזר
        ↓
💾 שמירה ל-DB (Draft)
        ↓
👁️ Preview Mode (קורא מ-DB)
        ↓
🚀 Publish
        ↓
┌───────────────────────────────┐
│  1. Generate JSON files       │
│  2. Upload to Edge/CDN        │
│  3. Invalidate ISR cache      │
│  4. Update version in DB      │
└───────────────────────────────┘
        ↓
🌐 Storefront (קורא מ-Edge - מהיר!)
```

### Stack טכנולוגי:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Customizer UI                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   React Client Component (use client)                   │   │
│  │   - Monaco Editor (לעריכת קוד)                          │   │
│  │   - Sidebar Editor (Visual Mode)                         │   │
│  │   - Preview Frame (iframe with PostMessage)             │   │
│  │   - Drag & Drop (dnd-kit)                               │   │
│  │   - Color Picker (react-colorful)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      API Layer                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Next.js API Routes + Server Actions                    │   │
│  │   - CRUD operations → DB                                │   │
│  │   - Publish → Generate JSON → Edge                      │   │
│  │   - Preview → Direct DB read                            │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Storage                                     │
│  ┌──────────────────┐  ┌──────────────────────────────────┐   │
│  │   PostgreSQL     │  │   Vercel Edge / Cloudflare R2    │   │
│  │   (Neon)         │  │   - JSON config files            │   │
│  │   - Source of    │  │   - Custom CSS                   │   │
│  │     truth        │  │   - Fast global access           │   │
│  │   - Drafts       │  │                                  │   │
│  │   - History      │  │                                  │   │
│  └──────────────────┘  └──────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Storefront (SSR + ISR)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   1. Try read from Edge JSON (fast!)                    │   │
│  │   2. Fallback to DB if not found                        │   │
│  │   3. Render sections dynamically                        │   │
│  │   4. Apply custom CSS                                   │   │
│  │   5. Execute custom JS (sandboxed)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ מבנה נתונים

### טבלאות בסיס:

```sql
-- תבניות (Templates)
CREATE TABLE theme_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,           -- 'new-york'
  display_name VARCHAR(255) NOT NULL,   -- 'ניו יורק'
  description TEXT,
  thumbnail_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,     -- תבניות בתשלום בעתיד
  price DECIMAL(10,2) DEFAULT 0,
  version VARCHAR(20) DEFAULT '1.0.0',
  -- Section Schema - מגדיר אילו סקשנים התבנית תומכת
  available_sections JSONB DEFAULT '[]',
  -- Default Settings Schema
  default_settings_schema JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- הגדרות חנות (Theme Settings) - הגדרות גלובליות
CREATE TABLE store_theme_settings (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  template_id INT REFERENCES theme_templates(id),
  
  -- Published vs Draft
  published_settings_json JSONB DEFAULT '{}',
  draft_settings_json JSONB DEFAULT '{}',
  
  -- Custom Code (למתכנתים)
  custom_css TEXT DEFAULT '',
  custom_js TEXT DEFAULT '',
  custom_head_code TEXT DEFAULT '',  -- קוד להזרקה ל-head
  
  -- Cache
  published_at TIMESTAMP,
  edge_json_url TEXT,  -- URL לקובץ JSON ב-Edge
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id)
);

-- מבנה עמודים (Page Layouts)
CREATE TABLE page_layouts (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  template_id INT REFERENCES theme_templates(id),
  page_type VARCHAR(50) NOT NULL,       -- 'home', 'product', 'collection', etc.
  page_handle VARCHAR(255),             -- לעמוד ספציפי (אופציונלי)
  
  -- Published vs Draft  
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  edge_json_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, page_type, page_handle)
);

-- סקשנים בעמוד (Page Sections)
CREATE TABLE page_sections (
  id SERIAL PRIMARY KEY,
  page_layout_id INT REFERENCES page_layouts(id) ON DELETE CASCADE,
  section_type VARCHAR(100) NOT NULL,
  section_id VARCHAR(100) NOT NULL,     -- unique ID for referencing in code
  position INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,      -- locked sections can't be moved/deleted
  
  -- Settings
  settings_json JSONB NOT NULL DEFAULT '{}',
  
  -- Custom overrides (למתכנתים)
  custom_css TEXT DEFAULT '',
  custom_classes TEXT DEFAULT '',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- בלוקים בתוך סקשנים (Section Blocks)
CREATE TABLE section_blocks (
  id SERIAL PRIMARY KEY,
  section_id INT REFERENCES page_sections(id) ON DELETE CASCADE,
  block_type VARCHAR(100) NOT NULL,
  block_id VARCHAR(100) NOT NULL,       -- unique ID
  position INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  settings_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- סקשנים מותאמים (Custom Sections - למתכנתים)
CREATE TABLE custom_sections (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Schema for settings
  settings_schema JSONB NOT NULL DEFAULT '[]',
  blocks_schema JSONB DEFAULT '[]',
  
  -- Render template
  template_code TEXT NOT NULL,          -- JSX/TSX template
  css_code TEXT DEFAULT '',
  
  -- Preview
  preview_data JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- היסטוריית גרסאות (Version History)
CREATE TABLE page_layout_versions (
  id SERIAL PRIMARY KEY,
  page_layout_id INT REFERENCES page_layouts(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_by INT REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  
  -- Restore capability
  is_restorable BOOLEAN DEFAULT TRUE
);

-- Indexes לביצועים
CREATE INDEX idx_page_layouts_store ON page_layouts(store_id);
CREATE INDEX idx_page_layouts_published ON page_layouts(store_id, is_published);
CREATE INDEX idx_page_sections_layout ON page_sections(page_layout_id);
CREATE INDEX idx_page_sections_position ON page_sections(page_layout_id, position);
CREATE INDEX idx_section_blocks_section ON section_blocks(section_id);
CREATE INDEX idx_custom_sections_store ON custom_sections(store_id, is_active);
```

### מבנה JSON Configuration File (נשמר ב-Edge):

```json
// /config/{store_id}/home.json
{
  "version": "1.0.0",
  "generated_at": "2024-01-15T10:30:00Z",
  "page_type": "home",
  "global_settings": {
    "colors": {
      "primary": "#000000",
      "secondary": "#666666",
      "accent": "#10B981",
      "background": "#FFFFFF"
    },
    "typography": {
      "heading_font": "Heebo",
      "body_font": "Heebo",
      "base_font_size": 16
    }
  },
  "sections": {
    "header": {
      "type": "header",
      "position": 1,
      "settings": { ... },
      "blocks": []
    },
    "slideshow_main": {
      "type": "slideshow",
      "position": 2,
      "settings": {
        "container_type": "full_width",
        "auto_rotate": true,
        "interval": 5
      },
      "blocks": [
        {
          "id": "slide_1",
          "type": "image_slide",
          "settings": {
            "image": "https://...",
            "heading": "קולקציה חדשה",
            "button_text": "קנה עכשיו",
            "button_link": "/collections/new"
          }
        }
      ]
    },
    "collection_list_home": {
      "type": "collection_list",
      "position": 3,
      "settings": { ... },
      "blocks": [ ... ]
    }
  },
  "section_order": ["header", "slideshow_main", "collection_list_home", "footer"],
  "custom_css": ".my-custom-class { ... }",
  "custom_js": ""
}
```

---

## 🖥️ ממשק משתמש - שתי רמות

### 🎨 מצב ויזואלי (למשתמש פשוט):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← דשבורד]  עמוד: [עמוד בית ▼]  [🖥️][📱][📱]  [👁️ תצוגה מקדימה]  [💾 שמור] [🚀 פרסם] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🎨 ויזואלי]  [💻 מפתח]                                                      │
├───────────────────┬─────────────────────────────────────────────────────────┤
│                   │                                                         │
│   📋 סקשנים        │              PREVIEW FRAME                             │
│   ──────────────  │              (iframe)                                   │
│                   │                                                         │
│   HEADER ⚙️ 🔒    │   ┌─────────────────────────────────────────────────┐ │
│   ├─ בר הודעות   │   │                                                 │ │
│   └─ תפריט       │   │              [HEADER PREVIEW]                   │ │
│                   │   │                                                 │ │
│   + הוסף סקשן     │   │              [SLIDESHOW PREVIEW]                │ │
│   ──────────────  │   │                                                 │ │
│                   │   │              [COLLECTION LIST]                  │ │
│   ☰ סליידשו  ⚙️👁️🗑️│ │               - FACE                           │ │
│     + הוסף בלוק   │   │               - LIPS                           │ │
│     ├─ שקופית 1   │   │               - BRUSHES                        │ │
│     └─ שקופית 2   │   │                                                 │ │
│                   │   │              [NEWSLETTER]                       │ │
│   ☰ קטגוריות ⚙️👁️🗑️│ │                                                 │ │
│     + הוסף בלוק   │   │              [FOOTER]                          │ │
│     ├─ FACE       │   │                                                 │ │
│     ├─ LIPS       │   └─────────────────────────────────────────────────┘ │
│     └─ BRUSHES    │                                                         │
│                   │   לחיצה על סקשן בתצוגה → פתיחת ההגדרות                │
│   ☰ ניוזלטר  ⚙️👁️🗑️│                                                        │
│                   │                                                         │
│   + הוסף סקשן     │                                                         │
│   ──────────────  │                                                         │
│                   │                                                         │
│   FOOTER ⚙️ 🔒    │                                                         │
│                   │                                                         │
│   ──────────────  │                                                         │
│   ⚙️ הגדרות תבנית │                                                         │
│                   │                                                         │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

### 💻 מצב מפתח (למתכנתים):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← דשבורד]  עמוד: [עמוד בית ▼]  [🖥️][📱][📱]  [👁️ תצוגה מקדימה]  [💾 שמור] [🚀 פרסם] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🎨 ויזואלי]  [💻 מפתח]                                                      │
├───────────────────┬─────────────────────────────────────────────────────────┤
│                   │                                                         │
│ 📁 קבצים          │  ┌───────────────────────────────────────────────────┐ │
│ ─────────────────│  │ [CSS] [HTML] [JS] [Schema]                        │ │
│                   │  ├───────────────────────────────────────────────────┤ │
│ 📄 Settings       │  │                                                   │ │
│ 📄 CSS גלובלי     │  │   /* Custom CSS for this store */                │ │
│ 📄 JavaScript     │  │                                                   │ │
│ 📄 Head Code      │  │   .hero-section {                                 │ │
│                   │  │     background: linear-gradient(...);            │ │
│ 📁 סקשנים         │  │     padding: 4rem 2rem;                          │ │
│ ├─ header         │  │   }                                               │ │
│ ├─ slideshow      │  │                                                   │ │
│ ├─ collection_list│  │   .product-card {                                 │ │
│ ├─ newsletter     │  │     border-radius: 12px;                         │ │
│ └─ footer         │  │     transition: transform 0.3s ease;             │ │
│                   │  │   }                                               │ │
│ 📁 סקשנים מותאמים │  │                                                   │ │
│ └─ + צור חדש      │  │   .product-card:hover {                           │ │
│                   │  │     transform: translateY(-4px);                  │ │
│ ─────────────────│  │   }                                               │ │
│ 📋 תיעוד API      │  │                                                   │ │
│ 📋 Liquid Reference│  │   @media (max-width: 768px) {                    │ │
│                   │  │     .hero-section { padding: 2rem 1rem; }        │ │
│                   │  │   }                                               │ │
│                   │  │                                                   │ │
│                   │  └───────────────────────────────────────────────────┘ │
│                   │                                                         │
│                   │  ┌───────────────────────────────────────────────────┐ │
│                   │  │             LIVE PREVIEW                          │ │
│                   │  │             (מתעדכן בזמן אמת)                      │ │
│                   │  └───────────────────────────────────────────────────┘ │
│                   │                                                         │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 💻 עורך קוד למתקדמים

### 1. עורך CSS גלובלי:

```typescript
// מאפשר עריכת CSS שמתווסף לכל הסטורפרונט
interface CustomCSSEditor {
  // CSS שחל על כל העמודים
  globalCSS: string;
  
  // CSS variables מותאמים
  cssVariables: {
    '--primary-color': string;
    '--font-family': string;
    // ...
  };
  
  // CSS לעמוד ספציפי
  pageCSS: {
    home: string;
    product: string;
    collection: string;
  };
}
```

### 2. עורך JavaScript:

```typescript
// מאפשר הוספת קוד JS מותאם
interface CustomJSEditor {
  // JavaScript גלובלי
  globalJS: string;
  
  // Event hooks
  hooks: {
    onPageLoad: string;
    onAddToCart: string;
    onCheckoutStart: string;
  };
  
  // External scripts (head injection)
  headScripts: string;
}
```

### 3. יצירת סקשנים מותאמים:

```typescript
// Schema Editor - מגדיר את המבנה של סקשן חדש
interface CustomSectionDefinition {
  name: string;          // 'my_custom_banner'
  displayName: string;   // 'באנר מותאם אישי'
  
  // הגדרות שהמשתמש יכול לשנות
  settings: SettingDefinition[];
  
  // בלוקים שאפשר להוסיף
  blocks?: BlockDefinition[];
  
  // הקוד שמרנדר את הסקשן
  template: string;      // JSX template
  
  // CSS של הסקשן
  styles: string;
  
  // Data שהסקשן צריך (products, collections, etc.)
  dataRequirements?: DataRequirement[];
}

// דוגמה לסקשן מותאם:
const myCustomBanner: CustomSectionDefinition = {
  name: 'promo_countdown',
  displayName: 'באנר מבצע עם טיימר',
  settings: [
    {
      id: 'heading',
      type: 'text',
      label: 'כותרת',
      default: 'מבצע מוגבל!'
    },
    {
      id: 'end_date',
      type: 'datetime',
      label: 'תאריך סיום'
    },
    {
      id: 'background_color',
      type: 'color',
      label: 'צבע רקע',
      default: '#FF0000'
    },
    {
      id: 'link',
      type: 'url',
      label: 'קישור'
    }
  ],
  template: `
    <section 
      className="promo-countdown" 
      style={{ backgroundColor: settings.background_color }}
    >
      <h2>{settings.heading}</h2>
      <CountdownTimer endDate={settings.end_date} />
      <a href={settings.link} className="promo-cta">
        לצפייה במבצע
      </a>
    </section>
  `,
  styles: `
    .promo-countdown {
      padding: 2rem;
      text-align: center;
      color: white;
    }
    .promo-cta {
      display: inline-block;
      padding: 1rem 2rem;
      background: white;
      color: inherit;
      border-radius: 4px;
      margin-top: 1rem;
    }
  `
};
```

### 4. Section Schema Language (SSL):

```yaml
# schema.yml - מגדיר section בפורמט פשוט
name: featured_testimonials
display_name: ביקורות לקוחות
description: הצגת ביקורות לקוחות מרוצים

settings:
  - id: heading
    type: text
    label: כותרת
    default: "מה הלקוחות אומרים"
    
  - id: subheading
    type: textarea
    label: תת כותרת
    
  - id: layout
    type: select
    label: פריסה
    options:
      - value: grid
        label: גריד
      - value: slider
        label: סליידר
      - value: masonry
        label: מזונרי
    default: grid
    
  - id: columns
    type: range
    label: עמודות
    min: 1
    max: 4
    default: 3
    
  - id: show_rating
    type: checkbox
    label: הצג דירוג
    default: true

blocks:
  - type: testimonial
    name: ביקורת
    settings:
      - id: author
        type: text
        label: שם הכותב
        
      - id: content
        type: richtext
        label: תוכן הביקורת
        
      - id: rating
        type: range
        min: 1
        max: 5
        default: 5
        label: דירוג
        
      - id: image
        type: image
        label: תמונה
```

### 5. Monaco Editor Integration:

```typescript
// קונפיגורציה לעורך הקוד
const monacoConfig = {
  // תמיכה בשפות
  languages: ['css', 'javascript', 'typescript', 'html', 'json', 'yaml'],
  
  // Autocomplete מותאם
  customCompletions: {
    css: [
      // CSS Variables של המערכת
      '--color-primary',
      '--color-secondary',
      '--font-family-heading',
      '--spacing-sm',
      '--spacing-md',
      '--spacing-lg',
      // Class names של הסקשנים
      '.section-container',
      '.product-card',
      '.collection-item',
    ],
    javascript: [
      // API של הסטורפרונט
      'Quickshop.cart.add()',
      'Quickshop.cart.update()',
      'Quickshop.events.on()',
      'Quickshop.ui.openCart()',
    ]
  },
  
  // Linting
  linting: {
    css: true,
    javascript: true,
  },
  
  // Theme
  theme: 'vs-dark',
  
  // Features
  features: {
    formatOnSave: true,
    minimap: true,
    wordWrap: true,
  }
};
```

---

## 📦 סקשנים זמינים

### קטגוריות סקשנים:

#### 1. 🎯 Hero & Header
| סקשן | תיאור | בלוקים | מצב מתקדם |
|------|-------|--------|-----------|
| `announcement_bar` | בר הודעות עליון | text, link | CSS מותאם |
| `header` | Header עם תפריט | logo, menu_item | Custom dropdown |
| `slideshow` | סליידשו Hero | image_slide, video_slide | Custom animations |
| `hero_banner` | באנר Hero בודד | - | Full CSS control |
| `hero_video` | וידאו Hero | - | Video controls |

#### 2. 🛍️ Collections & Products
| סקשן | תיאור | בלוקים | מצב מתקדם |
|------|-------|--------|-----------|
| `collection_list` | רשימת קטגוריות | collection | Card template |
| `featured_collection` | קטגוריה מוצגת | - | Product card override |
| `featured_product` | מוצר מוצג | - | Full product template |
| `product_grid` | גריד מוצרים | - | Filter controls |
| `new_arrivals` | מוצרים חדשים | - | Auto-query options |
| `best_sellers` | מוצרים נמכרים | - | Sort algorithm |
| `recently_viewed` | נצפו לאחרונה | - | Cookie/storage control |

#### 3. 📝 Content
| סקשן | תיאור | בלוקים | מצב מתקדם |
|------|-------|--------|-----------|
| `image_with_text` | תמונה עם טקסט | - | Layout control |
| `image_with_text_overlay` | תמונה עם שכבת טקסט | - | Overlay CSS |
| `rich_text` | טקסט עשיר | - | Custom HTML |
| `video` | וידאו | - | Player API |
| `before_after_slider` | לפני/אחרי | - | Slider control |
| `collapsible_tabs` | טאבים מתקפלים | tab | JS events |
| `testimonials` | ביקורות | testimonial | Carousel control |
| `faq` | שאלות נפוצות | question | Schema.org |

#### 4. 📣 Marketing
| סקשן | תיאור | בלוקים | מצב מתקדם |
|------|-------|--------|-----------|
| `newsletter` | הרשמה לניוזלטר | - | Form customization |
| `promo_banner` | באנר פרסומי | - | A/B testing |
| `countdown` | ספירה לאחור | - | Timer logic |
| `instagram` | אינסטגרם פיד | - | API integration |
| `trust_badges` | תגי אמון | badge | Icon library |
| `popup` | פופאפ | - | Trigger rules |

#### 5. 🧭 Navigation & Footer
| סקשן | תיאור | בלוקים | מצב מתקדם |
|------|-------|--------|-----------|
| `footer` | Footer | column, link | Full HTML |
| `mobile_sticky_bar` | בר תחתון למובייל | button | Action control |
| `mega_menu` | מגה מניו | menu_group | Custom structure |

#### 6. ⚡ Advanced (למתכנתים)
| סקשן | תיאור | שימוש |
|------|-------|-------|
| `custom_html` | HTML מותאם | כל HTML |
| `custom_liquid` | תחביר דינמי | Liquid-like |
| `custom_section` | סקשן מותאם | יצירה מלאה |
| `embed_code` | קוד חיצוני | Scripts, iframes |
| `api_section` | סקשן מ-API | External data |

---

## 🔄 עמודי Template דינמיים (Loop Pages)

### הקונספט:

עמודים כמו **עמוד מוצר** ו**עמוד קטגוריה** הם עמודי לופ - אותו Template משמש להרבה עמודים שונים. הקסטומייזר מאפשר לערוך את ה-Template עם **widgets דינמיים** שמושכים מידע מהאובייקט הנוכחי.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    עמודי Template דינמיים                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📦 עמוד מוצר (Product Template)                                    │
│  ─────────────────────────────────────                              │
│  Template אחד → משרת את כל המוצרים                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Header] ← סטטי                                             │   │
│  │                                                               │   │
│  │  [Product Images] ← {{ product.images }}                     │   │
│  │  [Product Title]  ← {{ product.title }}                      │   │
│  │  [Product Price]  ← {{ product.price }}                      │   │
│  │  [Variant Selector] ← {{ product.variants }}                 │   │
│  │  [Add to Cart Button] ← דינמי                                │   │
│  │                                                               │   │
│  │  [Product Description] ← {{ product.description }}           │   │
│  │  [Custom Static Section] ← סטטי (ניתן להוסיף)                │   │
│  │  [Related Products] ← {{ product.related }}                  │   │
│  │                                                               │   │
│  │  [Footer] ← סטטי                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📁 עמוד קטגוריה (Collection Template)                              │
│  ─────────────────────────────────────                              │
│  Template אחד → משרת את כל הקטגוריות                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Header] ← סטטי                                             │   │
│  │                                                               │   │
│  │  [Collection Header] ← {{ collection.title }}                │   │
│  │  [Collection Image]  ← {{ collection.image }}                │   │
│  │  [Filters Sidebar]   ← דינמי                                 │   │
│  │  [Product Grid]      ← {{ collection.products }}             │   │
│  │  [Pagination]        ← דינמי                                 │   │
│  │                                                               │   │
│  │  [Custom Banner] ← סטטי (ניתן להוסיף)                        │   │
│  │  [Footer] ← סטטי                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### סוגי Widgets:

#### 1. Dynamic Widgets (וידג'טים דינמיים):
מושכים מידע מהאובייקט הנוכחי (מוצר/קטגוריה)

```typescript
// Product Page Dynamic Widgets
const PRODUCT_DYNAMIC_WIDGETS = {
  'product_images': {
    name: 'גלריית תמונות',
    variable: '{{ product.images }}',
    settings: ['layout', 'zoom', 'thumbnails_position']
  },
  'product_title': {
    name: 'שם המוצר',
    variable: '{{ product.title }}',
    settings: ['font_size', 'font_weight', 'alignment']
  },
  'product_price': {
    name: 'מחיר',
    variable: '{{ product.price }}',
    settings: ['show_compare_price', 'show_discount_badge']
  },
  'product_variants': {
    name: 'בחירת וריאנט',
    variable: '{{ product.variants }}',
    settings: ['style', 'show_availability']
  },
  'product_quantity': {
    name: 'בחירת כמות',
    variable: '{{ cart.quantity }}',
    settings: ['style', 'min', 'max']
  },
  'add_to_cart': {
    name: 'כפתור הוספה לסל',
    variable: '{{ product.available }}',
    settings: ['text', 'style', 'sticky_mobile']
  },
  'product_description': {
    name: 'תיאור המוצר',
    variable: '{{ product.description }}',
    settings: ['show_full', 'read_more']
  },
  'product_reviews': {
    name: 'ביקורות',
    variable: '{{ product.reviews }}',
    settings: ['layout', 'per_page']
  },
  'related_products': {
    name: 'מוצרים קשורים',
    variable: '{{ product.related }}',
    settings: ['count', 'algorithm']
  },
  'product_meta': {
    name: 'מידע נוסף (SKU, ברקוד)',
    variable: '{{ product.meta }}',
    settings: ['show_sku', 'show_barcode', 'show_vendor']
  },
  'social_share': {
    name: 'שיתוף ברשתות',
    variable: '{{ product.url }}',
    settings: ['networks', 'style']
  }
};

// Collection Page Dynamic Widgets
const COLLECTION_DYNAMIC_WIDGETS = {
  'collection_header': {
    name: 'כותרת קטגוריה',
    variable: '{{ collection.title }}',
    settings: ['show_image', 'show_description', 'alignment']
  },
  'collection_image': {
    name: 'תמונת קטגוריה',
    variable: '{{ collection.image }}',
    settings: ['height', 'overlay']
  },
  'product_grid': {
    name: 'גריד מוצרים',
    variable: '{{ collection.products }}',
    settings: ['columns', 'card_style', 'per_page']
  },
  'collection_filters': {
    name: 'פילטרים',
    variable: '{{ collection.filters }}',
    settings: ['position', 'show_price', 'show_availability']
  },
  'collection_sort': {
    name: 'מיון',
    variable: '{{ collection.sort_options }}',
    settings: ['default_sort', 'options']
  },
  'subcollections': {
    name: 'תת-קטגוריות',
    variable: '{{ collection.children }}',
    settings: ['layout', 'show_count']
  },
  'pagination': {
    name: 'עימוד',
    variable: '{{ collection.pagination }}',
    settings: ['style', 'per_page']
  }
};
```

#### 2. Static Widgets (וידג'טים סטטיים):
תוכן קבוע שניתן להוסיף בין הוידג'טים הדינמיים

```typescript
const STATIC_WIDGETS = {
  'rich_text': 'טקסט עשיר',
  'image': 'תמונה',
  'video': 'וידאו',
  'banner': 'באנר',
  'trust_badges': 'תגי אמון',
  'faq': 'שאלות נפוצות',
  'custom_html': 'HTML מותאם',
  'spacer': 'רווח',
  'divider': 'קו מפריד'
};
```

### ממשק עריכת Template:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← דשבורד]  Template: [עמוד מוצר ▼]  [🖥️][📱]  [👁️ תצוגה]  [💾 שמור]         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ⚠️ אתה עורך את ה-TEMPLATE - שינויים ישפיעו על כל עמודי המוצר              │
│                                                                             │
├───────────────────┬─────────────────────────────────────────────────────────┤
│                   │                                                         │
│  📋 מבנה Template │              PREVIEW                                   │
│  ─────────────────│              (מציג מוצר לדוגמה)                         │
│                   │                                                         │
│  HEADER 🔒        │   ┌─────────────────────────────────────────────────┐ │
│                   │   │  [Logo]              [Menu]          [Cart]    │ │
│  ─────────────────│   ├─────────────────────────────────────────────────┤ │
│                   │   │                                                 │ │
│  ☰ גלריית תמונות  │   │  [████████████]   שם המוצר                     │ │
│    ⚙️ 👁️          │   │  [████████████]   ₪199.00  ̶₪̶2̶4̶9̶              │ │
│                   │   │  [████████████]                                 │ │
│  ☰ שם המוצר      │   │                    צבע: [🔵][⚫][⚪]             │ │
│    ⚙️ 👁️          │   │  [thumb][thumb]    מידה: [S][M][L][XL]          │ │
│                   │   │                                                 │ │
│  ☰ מחיר          │   │                    כמות: [-] 1 [+]              │ │
│    ⚙️ 👁️          │   │                                                 │ │
│                   │   │                    [  הוסף לסל  ]               │ │
│  ☰ בחירת וריאנט  │   │                                                 │ │
│    ⚙️ 👁️          │   │  ─────────────────────────────────────────────  │ │
│                   │   │                                                 │ │
│  ☰ כפתור הוסף לסל│   │  תיאור המוצר:                                   │ │
│    ⚙️ 👁️          │   │  Lorem ipsum dolor sit amet...                 │ │
│                   │   │                                                 │ │
│  + הוסף widget   │   │  ─────────────────────────────────────────────  │ │
│  ─────────────────│   │                                                 │ │
│                   │   │  🛡️ משלוח חינם  ✓ החזרות  🔒 תשלום מאובטח      │ │
│  ☰ תיאור המוצר   │   │  (תגי אמון - סטטי)                              │ │
│    ⚙️ 👁️          │   │                                                 │ │
│                   │   │  ─────────────────────────────────────────────  │ │
│  ☰ תגי אמון 📌    │   │                                                 │ │
│    (סטטי)         │   │  מוצרים קשורים:                                 │ │
│                   │   │  [Card][Card][Card][Card]                       │ │
│  ☰ מוצרים קשורים │   │                                                 │ │
│    ⚙️ 👁️          │   │                                                 │ │
│                   │   └─────────────────────────────────────────────────┘ │
│  + הוסף widget   │                                                         │
│  ─────────────────│   📝 מוצר לדוגמה: [חולצה כחולה ▼]                      │
│                   │   (ניתן לבחור מוצר אחר לתצוגה מקדימה)                  │
│  FOOTER 🔒        │                                                         │
│                   │                                                         │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

### הגדרות Widget דינמי:

```
┌─────────────────────────────────┐
│ ← גלריית תמונות             ••• │
├─────────────────────────────────┤
│                                 │
│ 🔗 מקור: {{ product.images }}  │
│    (אוטומטי מהמוצר)             │
│                                 │
│ ───────────────────────────────│
│ Layout                          │
│ [Grid] [Slider] [Stack]         │
│                                 │
│ תמונות בשורה                   │
│ [●─────────────────────] 1      │
│                                 │
│ מיקום Thumbnails               │
│ [למטה ▼]                        │
│                                 │
│ הפעל Zoom                       │
│ [○ ●]                           │
│                                 │
│ הפעל Lightbox                   │
│ [○ ●]                           │
│                                 │
│ ───────────────────────────────│
│ Mobile                          │
│ ───────────────────────────────│
│ Swipe בין תמונות               │
│ [● ○]                           │
│                                 │
│ הצג נקודות (dots)               │
│ [● ○]                           │
│                                 │
└─────────────────────────────────┘
```

### מבנה נתונים ל-Template Pages:

```sql
-- Page Templates (עמודי לופ)
CREATE TABLE page_templates (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,  -- 'product', 'collection', 'blog_post', 'page'
  name VARCHAR(100),                    -- 'default', 'minimal', 'full-width'
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Published vs Draft
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, template_type, name)
);

-- Template Widgets (וידג'טים ב-template)
CREATE TABLE template_widgets (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES page_templates(id) ON DELETE CASCADE,
  widget_type VARCHAR(100) NOT NULL,   -- 'product_images', 'product_title', 'rich_text', etc.
  widget_id VARCHAR(100) NOT NULL,     -- unique identifier
  position INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  is_dynamic BOOLEAN DEFAULT TRUE,     -- true = pulls from object, false = static
  
  -- Settings
  settings_json JSONB NOT NULL DEFAULT '{}',
  
  -- Custom styling
  custom_css TEXT DEFAULT '',
  custom_classes TEXT DEFAULT '',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Override per specific product/collection (אופציונלי)
CREATE TABLE template_overrides (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES page_templates(id) ON DELETE CASCADE,
  object_type VARCHAR(50) NOT NULL,    -- 'product', 'collection'
  object_id INT NOT NULL,              -- product_id or collection_id
  
  -- Override specific widgets
  widget_overrides JSONB DEFAULT '{}', -- { "widget_id": { "settings": {...} } }
  
  -- Or completely different structure
  custom_widgets JSONB DEFAULT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, object_type, object_id)
);
```

### Override למוצר/קטגוריה ספציפיים:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💡 אפשרויות עריכה:                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ עריכת Template (ברירת מחדל)                                             │
│     שינויים ישפיעו על כל המוצרים/קטגוריות                                  │
│                                                                             │
│  2️⃣ Override למוצר ספציפי                                                  │
│     "אני רוצה שעמוד המוצר 'שעון יוקרה' יראה אחרת"                          │
│     → יוצר override שדורס את ה-template הכללי                              │
│                                                                             │
│  3️⃣ Templates מרובים                                                       │
│     - "Default" - ברירת מחדל                                               │
│     - "Minimal" - מינימליסטי                                               │
│     - "Full Gallery" - דגש על תמונות                                       │
│     → בחירת template בעריכת מוצר                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Liquid-like Syntax לוידג'טים דינמיים:

```typescript
// הסינטקס הפנימי (לא חשוף למשתמש הפשוט, רק למתכנתים)
interface DynamicVariable {
  // Product variables
  'product.title': string;
  'product.description': string;
  'product.price': number;
  'product.compare_at_price': number;
  'product.images': Image[];
  'product.variants': Variant[];
  'product.available': boolean;
  'product.vendor': string;
  'product.type': string;
  'product.tags': string[];
  'product.metafields': Record<string, any>;
  
  // Collection variables
  'collection.title': string;
  'collection.description': string;
  'collection.image': Image;
  'collection.products': Product[];
  'collection.products_count': number;
  'collection.filters': Filter[];
  'collection.sort_options': SortOption[];
  
  // Global variables
  'shop.name': string;
  'shop.currency': string;
  'cart.item_count': number;
  'customer.logged_in': boolean;
}

// איך זה עובד בפועל:
const ProductTitleWidget = ({ product, settings }) => {
  return (
    <h1 
      className={`product-title ${settings.alignment}`}
      style={{ fontSize: settings.font_size }}
    >
      {product.title}  {/* ← הוידג'ט יודע לשלוף את הנתון */}
    </h1>
  );
};
```

### רינדור ב-Storefront:

```typescript
// src/app/(storefront)/shops/[storeSlug]/products/[handle]/page.tsx
export default async function ProductPage({ params }) {
  const store = await getStoreBySlug(params.storeSlug);
  const product = await getProductByHandle(params.handle);
  
  // 1. Check for specific override
  const override = await getTemplateOverride(store.id, 'product', product.id);
  
  // 2. Get template (default or assigned)
  const templateName = product.template_name || 'default';
  const template = await getPageTemplate(store.id, 'product', templateName);
  
  // 3. Merge override if exists
  const finalWidgets = override 
    ? mergeOverrides(template.widgets, override.widget_overrides)
    : template.widgets;
  
  // 4. Render
  return (
    <ProductPageRenderer
      product={product}
      widgets={finalWidgets}
      globalSettings={store.theme_settings}
    />
  );
}

// ProductPageRenderer
function ProductPageRenderer({ product, widgets, globalSettings }) {
  return (
    <>
      {widgets.map((widget) => {
        const Component = WIDGET_COMPONENTS[widget.widget_type];
        
        // Inject product data into dynamic widgets
        const data = widget.is_dynamic 
          ? extractDataForWidget(widget.widget_type, product)
          : null;
        
        return (
          <Component
            key={widget.widget_id}
            data={data}
            settings={widget.settings_json}
            customCSS={widget.custom_css}
          />
        );
      })}
    </>
  );
}
```

---

## 🎭 מערכת תבניות

### תבנית "New York" (ברירת מחדל):

```typescript
const newYorkTemplate: ThemeTemplate = {
  id: 'new-york',
  name: 'ניו יורק',
  description: 'תבנית מודרנית ומינימליסטית בהשראת עיצוב נקי',
  version: '1.0.0',
  
  // סקשנים זמינים בתבנית
  availableSections: [
    'announcement_bar', 'header', 'slideshow', 'hero_banner',
    'collection_list', 'featured_collection', 'featured_product',
    'product_grid', 'new_arrivals', 'best_sellers',
    'image_with_text', 'image_with_text_overlay', 'rich_text',
    'video', 'testimonials', 'faq', 'newsletter',
    'trust_badges', 'footer', 'mobile_sticky_bar',
    // למתכנתים:
    'custom_html', 'custom_liquid', 'custom_section'
  ],
  
  // הגדרות ברירת מחדל
  defaultSettings: {
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#10B981',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#000000',
      muted: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
    },
    typography: {
      headingFont: 'Heebo',
      bodyFont: 'Heebo',
      baseFontSize: 16,
      lineHeight: 1.6,
      headingWeight: 700,
      bodyWeight: 400,
    },
    layout: {
      containerMaxWidth: 1200,
      containerPadding: 24,
      sectionSpacing: 64,
      gridGap: 24,
    },
    buttons: {
      borderRadius: 4,
      padding: '12px 24px',
      primaryStyle: 'solid',
      secondaryStyle: 'outline',
    },
    cards: {
      borderRadius: 8,
      shadow: 'sm',
      hoverEffect: 'lift',
    },
    animations: {
      enabled: true,
      duration: 300,
      easing: 'ease-out',
    }
  },
  
  // Default page layouts
  pageDefaults: {
    home: {
      sections: [
        { type: 'announcement_bar', locked: true },
        { type: 'header', locked: true },
        { type: 'slideshow' },
        { type: 'collection_list' },
        { type: 'featured_collection' },
        { type: 'image_with_text_overlay' },
        { type: 'new_arrivals' },
        { type: 'testimonials' },
        { type: 'newsletter' },
        { type: 'footer', locked: true },
      ]
    },
    product: {
      sections: [
        { type: 'header', locked: true },
        { type: 'product_info', locked: true },
        { type: 'product_tabs' },
        { type: 'related_products' },
        { type: 'recently_viewed' },
        { type: 'footer', locked: true },
      ]
    },
    collection: {
      sections: [
        { type: 'header', locked: true },
        { type: 'collection_header' },
        { type: 'collection_filters' },
        { type: 'product_grid', locked: true },
        { type: 'footer', locked: true },
      ]
    },
    cart: {
      sections: [
        { type: 'header', locked: true },
        { type: 'cart_content', locked: true },
        { type: 'recommended_products' },
        { type: 'trust_badges' },
        { type: 'footer', locked: true },
      ]
    }
  }
};
```

### תבניות עתידיות:

| תבנית | סגנון | קהל יעד | מחיר |
|-------|-------|---------|------|
| **Paris** | אלגנטי, רומנטי, serif fonts | אופנה, תכשיטים | $49 |
| **Tokyo** | מינימליסטי, lots of whitespace | טכנולוגיה, עיצוב | $49 |
| **London** | קלאסי, יוקרתי, dark mode | פרימיום, לקסוס | $79 |
| **Berlin** | אורבני, תעשייתי, bold | streetwear, אמנות | $49 |
| **Tel Aviv** | צבעוני, playful, RTL-optimized | ישראלי, מקומי | $29 |

---

## 🔗 אינטגרציה עם הסטורפרונט

### 1. קריאת הגדרות (Production):

```typescript
// src/lib/customizer/getPageConfig.ts

// נסיון ראשון - Edge JSON (מהיר!)
export async function getPageConfig(storeId: number, pageType: string) {
  // 1. Try Edge cache first
  const edgeUrl = `${EDGE_BASE_URL}/config/${storeId}/${pageType}.json`;
  
  try {
    const response = await fetch(edgeUrl, {
      next: { revalidate: 60 } // ISR - revalidate every 60 seconds
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log('Edge cache miss, falling back to DB');
  }
  
  // 2. Fallback to DB
  return await getPageConfigFromDB(storeId, pageType);
}

// קריאה מ-DB (backup)
async function getPageConfigFromDB(storeId: number, pageType: string) {
  const layout = await db.query(`
    SELECT pl.*, sts.published_settings_json as theme_settings
    FROM page_layouts pl
    JOIN store_theme_settings sts ON sts.store_id = pl.store_id
    WHERE pl.store_id = $1 
      AND pl.page_type = $2 
      AND pl.is_published = true
  `, [storeId, pageType]);
  
  const sections = await db.query(`
    SELECT ps.*, sb.id as block_id, sb.block_type, sb.settings_json as block_settings
    FROM page_sections ps
    LEFT JOIN section_blocks sb ON sb.section_id = ps.id
    WHERE ps.page_layout_id = $1 AND ps.is_visible = true
    ORDER BY ps.position, sb.position
  `, [layout.id]);
  
  return transformToConfigFormat(layout, sections);
}
```

### 2. רינדור דינמי:

```typescript
// src/components/storefront/PageRenderer.tsx
import dynamic from 'next/dynamic';

// Lazy load sections for performance
const SECTION_COMPONENTS = {
  slideshow: dynamic(() => import('./sections/Slideshow')),
  collection_list: dynamic(() => import('./sections/CollectionList')),
  featured_product: dynamic(() => import('./sections/FeaturedProduct')),
  // ... more sections
  
  // Advanced sections
  custom_html: dynamic(() => import('./sections/CustomHTML')),
  custom_section: dynamic(() => import('./sections/CustomSection')),
};

export async function PageRenderer({ 
  config, 
  customCSS, 
  customJS 
}: PageRendererProps) {
  return (
    <>
      {/* Custom CSS */}
      {customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
      
      {/* Sections */}
      {config.section_order.map((sectionId) => {
        const section = config.sections[sectionId];
        const Component = SECTION_COMPONENTS[section.type];
        
        if (!Component) {
          console.warn(`Unknown section: ${section.type}`);
          return null;
        }
        
        return (
          <Component
            key={sectionId}
            settings={section.settings}
            blocks={section.blocks}
            globalSettings={config.global_settings}
            className={section.custom_classes}
          />
        );
      })}
      
      {/* Custom JS (sandboxed) */}
      {customJS && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){${customJS}})();`
          }}
        />
      )}
    </>
  );
}
```

### 3. Preview Mode (לקסטומייזר):

```typescript
// src/app/(storefront)/shops/[storeSlug]/preview/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const pageType = searchParams.get('page') || 'home';
  
  // Validate preview token
  const session = await validatePreviewToken(token);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Read DRAFT from DB (not published)
  const config = await getDraftPageConfig(session.storeId, pageType);
  
  // Add preview mode indicator
  return renderPage(config, { isPreview: true });
}
```

---

## 🎯 Event-Driven Architecture

### אירועי הקסטומייזר:

הקסטומייזר **משתלב לחלוטין** במערכת האירועים הקיימת של Quickshop3:

#### Events Emitted (אירועים שנשלחים):

| Event Topic | מתי נשלח | Payload | Source |
|------------|----------|---------|--------|
| `customizer.page.published` | כשעמוד מתפרסם | `{ store_id, page_type, page_handle }` | dashboard |
| `customizer.page.draft_saved` | כששינויים נשמרים כ-draft | `{ store_id, page_type }` | dashboard |
| `customizer.section.added` | כשסקשן נוסף | `{ store_id, page_type, section_type, section_id }` | dashboard |
| `customizer.section.updated` | כשסקשן עודכן | `{ store_id, section_id, changes }` | dashboard |
| `customizer.section.deleted` | כשסקשן נמחק | `{ store_id, section_id }` | dashboard |
| `customizer.template.applied` | כשתבנית מוחלת | `{ store_id, template_id, template_name }` | dashboard |
| `customizer.theme_settings.updated` | כשהגדרות תבנית משתנות | `{ store_id, settings }` | dashboard |
| `customizer.custom_section.created` | כשסקשן מותאם נוצר | `{ store_id, section_name }` | dashboard |

#### Events Listened (אירועים שהקסטומייזר מאזין להם):

| Event Topic | מה קורה | מתי |
|------------|---------|-----|
| `product.created` | עדכון רשימת מוצרים זמינים לוידג'טים | כשנוצר מוצר חדש |
| `product.updated` | עדכון תצוגה מקדימה | כשמוצר משתנה |
| `collection.created` | עדכון רשימת קטגוריות זמינות | כשנוצרת קטגוריה חדשה |
| `store.settings.updated` | עדכון הגדרות חנות | כשהגדרות חנות משתנות |

### דוגמה לשימוש ב-Event Bus:

```typescript
// src/lib/customizer/publish.ts
import { eventBus } from '@/lib/events/eventBus';

export async function publishPage(storeId: number, pageType: string) {
  // ... לוגיקת פרסום ...
  
  // ✅ חובה: פליטת אירוע
  await eventBus.emit('customizer.page.published', {
    store_id: storeId,
    page_type: pageType,
    page_handle: pageHandle,
    edge_json_url: edgeUrl,
    version: versionNumber
  }, {
    store_id: storeId,
    source: 'dashboard',
    user_id: getUserIdFromRequest()
  });
  
  return { success: true, edgeUrl };
}
```

---

## 🔌 API Endpoints & Server Actions

### Pages API & Server Actions:

#### API Routes (לקריאות נתונים):

```http
# קבלת מבנה עמוד (draft)
GET /api/customizer/pages/:pageType?handle=:handle

# קבלת Template (עבור עמודי לופ)
GET /api/customizer/templates/:templateType

# קבלת רשימת תבניות זמינות
GET /api/customizer/templates
```

#### Server Actions (לפעולות מהירות):

```typescript
// src/app/(dashboard)/customize/actions.ts
'use server';

import { eventBus } from '@/lib/events/eventBus';
import { getStoreIdFromRequest } from '@/lib/auth';

// שמירת שינויים (draft) - Server Action
export async function savePageDraft(
  pageType: string,
  sections: Section[],
  sectionOrder: string[]
) {
  const storeId = await getStoreIdFromRequest();
  
  // שמירה ל-DB
  await db.query(`
    UPDATE page_layouts 
    SET draft_sections = $1, draft_section_order = $2
    WHERE store_id = $3 AND page_type = $4
  `, [sections, sectionOrder, storeId, pageType]);
  
  // ✅ פליטת אירוע
  await eventBus.emit('customizer.page.draft_saved', {
    store_id: storeId,
    page_type: pageType
  }, {
    store_id: storeId,
    source: 'dashboard'
  });
  
  return { success: true };
}

// פרסום עמוד - Server Action
export async function publishPage(pageType: string) {
  const storeId = await getStoreIdFromRequest();
  
  // ... לוגיקת פרסום ...
  
  // ✅ פליטת אירוע
  await eventBus.emit('customizer.page.published', {
    store_id: storeId,
    page_type: pageType
  }, {
    store_id: storeId,
    source: 'dashboard'
  });
  
  return { success: true, edgeUrl };
}

// שחזור לפורסם - Server Action
export async function discardDraft(pageType: string) {
  const storeId = await getStoreIdFromRequest();
  
  // שחזור מ-published ל-draft
  await db.query(`
    UPDATE page_layouts 
    SET draft_sections = published_sections,
        draft_section_order = published_section_order
    WHERE store_id = $1 AND page_type = $2
  `, [storeId, pageType]);
  
  return { success: true };
}
```

**למה Server Actions?**
- ✅ מהיר יותר מ-API Routes
- ✅ פחות overhead
- ✅ תגובה מיידית
- ✅ עובד טוב עם Forms

### Sections API:

```http
# הוספת סקשן
POST /api/customizer/pages/:pageType/sections
{
  "section_type": "collection_list",
  "position": 4,
  "settings": {}
}

# עדכון סקשן
PUT /api/customizer/sections/:sectionId
{
  "settings": {...},
  "custom_css": "...",
  "custom_classes": "..."
}

# מחיקת סקשן
DELETE /api/customizer/sections/:sectionId

# שינוי סדר
POST /api/customizer/pages/:pageType/sections/reorder
{
  "order": ["header", "slideshow", "collection_list", "footer"]
}
```

### Custom Code API (למתכנתים):

```http
# קבלת CSS גלובלי
GET /api/customizer/code/css

# עדכון CSS גלובלי
PUT /api/customizer/code/css
{
  "css": ".my-class { ... }"
}

# קבלת JavaScript
GET /api/customizer/code/js

# עדכון JavaScript
PUT /api/customizer/code/js
{
  "js": "Quickshop.events.on('addToCart', ...)"
}

# קבלת Head code
GET /api/customizer/code/head

# עדכון Head code
PUT /api/customizer/code/head
{
  "code": "<script>...</script>"
}
```

### Custom Sections API (למתכנתים):

```http
# רשימת סקשנים מותאמים
GET /api/customizer/custom-sections

# יצירת סקשן מותאם
POST /api/customizer/custom-sections
{
  "name": "promo_countdown",
  "display_name": "באנר מבצע עם טיימר",
  "settings_schema": [...],
  "template_code": "...",
  "css_code": "..."
}

# עדכון סקשן מותאם
PUT /api/customizer/custom-sections/:id

# מחיקת סקשן מותאם
DELETE /api/customizer/custom-sections/:id
```

### Theme Settings API:

```http
# קבלת הגדרות תבנית
GET /api/customizer/theme-settings

# עדכון הגדרות
PUT /api/customizer/theme-settings
{
  "colors": { "primary": "#000000" },
  "typography": { "headingFont": "Heebo" }
}

# איפוס לברירת מחדל
POST /api/customizer/theme-settings/reset
```

### Version History API:

```http
# היסטוריית גרסאות
GET /api/customizer/pages/:pageType/versions

# שחזור גרסה
POST /api/customizer/pages/:pageType/versions/:versionId/restore

# יצירת snapshot ידני
POST /api/customizer/pages/:pageType/versions
{
  "notes": "לפני שינוי גדול"
}
```

---

## 🚀 אסטרטגיית ביצועים וסקייל

### 1. Caching Strategy:

```
┌─────────────────────────────────────────────────────────────┐
│                   Cache Layers                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Browser Cache                                     │
│  - Static assets (CSS, JS, images)                         │
│  - Cache-Control: public, max-age=31536000                 │
│                                                             │
│  Layer 2: CDN/Edge Cache (Vercel Edge)                     │
│  - JSON configuration files                                │
│  - Cache-Control: public, s-maxage=60, stale-while-revalidate │
│                                                             │
│  Layer 3: ISR (Incremental Static Regeneration)            │
│  - Pre-rendered pages                                      │
│  - Revalidate on demand when config changes                │
│                                                             │
│  Layer 4: In-Memory Cache (server)                         │
│  - Frequently accessed configs                             │
│  - TTL: 60 seconds                                         │
│                                                             │
│  Layer 5: Database                                          │
│  - Source of truth                                         │
│  - Only hit on cache miss or preview mode                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Publish Flow:

```typescript
// src/lib/customizer/publish.ts
export async function publishPage(storeId: number, pageType: string) {
  // 1. Get draft config from DB
  const draftConfig = await getDraftConfig(storeId, pageType);
  
  // 2. Validate config
  await validateConfig(draftConfig);
  
  // 3. Generate JSON file
  const jsonContent = generateConfigJSON(draftConfig);
  
  // 4. Upload to Edge storage
  const edgeUrl = await uploadToEdge(storeId, pageType, jsonContent);
  
  // 5. Update DB (mark as published)
  await db.query(`
    UPDATE page_layouts 
    SET is_published = true,
        published_at = NOW(),
        edge_json_url = $3
    WHERE store_id = $1 AND page_type = $2
  `, [storeId, pageType, edgeUrl]);
  
  // 6. Invalidate ISR cache
  await revalidatePath(`/shops/${storeSlug}`);
  await revalidatePath(`/shops/${storeSlug}/${pageType}`);
  
  // 7. Create version snapshot
  await createVersionSnapshot(storeId, pageType, draftConfig);
  
  // 8. Emit event
  EventBus.emit('customizer.page.published', { storeId, pageType });
  
  return { success: true, edgeUrl };
}
```

### 3. Database Optimization:

```sql
-- Partial indexes for common queries
CREATE INDEX idx_page_layouts_published 
  ON page_layouts(store_id, page_type) 
  WHERE is_published = true;

-- JSONB indexes for settings queries
CREATE INDEX idx_section_settings_gin 
  ON page_sections 
  USING GIN (settings_json);

-- Materialized view for section counts
CREATE MATERIALIZED VIEW store_section_stats AS
SELECT 
  store_id,
  COUNT(*) as total_sections,
  COUNT(DISTINCT section_type) as unique_types
FROM page_layouts pl
JOIN page_sections ps ON ps.page_layout_id = pl.id
GROUP BY store_id;

-- Refresh on publish
CREATE OR REPLACE FUNCTION refresh_section_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY store_section_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 4. Request Optimization:

```typescript
// Batch API calls in customizer
const useCustomizerData = (pageType: string) => {
  return useSWR(
    `/api/customizer/pages/${pageType}/full`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
};

// Single API call returns everything needed
// GET /api/customizer/pages/home/full
{
  "page": { ... },
  "sections": [ ... ],
  "theme_settings": { ... },
  "custom_css": "...",
  "available_sections": [ ... ],
  "recent_versions": [ ... ]
}
```

---

## 📁 מבנה קבצים מומלץ

### מבנה תיקיות:

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── customize/
│   │       ├── page.tsx                    # דף הקסטומייזר הראשי
│   │       ├── actions.ts                 # Server Actions
│   │       ├── components/
│   │       │   ├── CustomizerLayout.tsx   # Layout עם Sidebar + Preview
│   │       │   ├── Sidebar.tsx            # Sidebar Editor
│   │       │   ├── PreviewFrame.tsx       # Preview iframe
│   │       │   ├── SectionList.tsx        # רשימת סקשנים
│   │       │   ├── SectionSettings.tsx    # הגדרות סקשן
│   │       │   ├── BlockSettings.tsx      # הגדרות בלוק
│   │       │   ├── AddSectionDialog.tsx   # דיאלוג הוספת סקשן
│   │       │   ├── CodeEditor.tsx          # עורך קוד (Monaco)
│   │       │   └── ...
│   │       └── README.md                   # תיעוד המודול (חובה!)
│   │
│   ├── (storefront)/
│   │   └── shops/
│   │       └── [storeSlug]/
│   │           └── preview/
│   │               └── route.ts            # Preview Mode Route
│   │
│   └── api/
│       └── customizer/
│           ├── pages/
│           │   └── route.ts               # GET pages
│           ├── sections/
│           │   └── route.ts               # CRUD sections
│           ├── templates/
│           │   └── route.ts               # GET templates
│           └── theme-settings/
│               └── route.ts               # GET theme settings
│
├── lib/
│   └── customizer/
│       ├── getPageConfig.ts               # קריאת הגדרות עמוד
│       ├── getTemplateConfig.ts           # קריאת הגדרות template
│       ├── publish.ts                     # פונקציית פרסום
│       ├── generateJSON.ts                # יצירת JSON ל-Edge
│       ├── validateConfig.ts              # ולידציה של הגדרות
│       └── types.ts                       # TypeScript types
│
└── components/
    └── storefront/
        └── sections/                      # קומפוננטות סקשנים
            ├── Slideshow.tsx
            ├── CollectionList.tsx
            ├── FeaturedProduct.tsx
            ├── DynamicSection.tsx         # רינדור דינמי של סקשנים
            └── ...
```

### README של מודול הקסטומייזר:

```markdown
# Customizer Module – מודול קסטומייזר

## Core Features | תכונות ליבה

- [ ] Visual Editor (WYSIWYG)
- [ ] Developer Mode (Code Editor)
- [ ] Page Templates (Home, Product, Collection, etc.)
- [ ] Section Management
- [ ] Block Management
- [ ] Theme Settings
- [ ] Preview Mode
- [ ] Publish Flow
- [ ] Version History

## Events | אירועים

### Events Emitted | אירועים שנשלחים

| Event Topic | מתי נשלח | Payload |
|------------|----------|---------|
| `customizer.page.published` | כשעמוד מתפרסם | `{ store_id, page_type }` |
| `customizer.section.added` | כשסקשן נוסף | `{ store_id, section_type }` |

### Events Listened | אירועים שמאזינים להם

| Event Topic | מה קורה | מתי |
|------------|---------|-----|
| `product.created` | עדכון רשימת מוצרים | כשנוצר מוצר |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customizer/pages/:pageType` | Get page config |
| POST | `/api/customizer/pages/:pageType/publish` | Publish page |

## Server Actions

| Function | Description |
|----------|-------------|
| `savePageDraft` | Save draft changes |
| `publishPage` | Publish page |
| `discardDraft` | Discard draft changes |
```

---

## ✅ Checklist יישום

### Phase 1: Foundation (שבוע 1-2)

- [ ] **Database**
  - [ ] יצירת טבלאות (לפי הסכמה למעלה)
  - [ ] Migration scripts
  - [ ] Indexes ואופטימיזציה
  - [ ] Seed data לתבנית New York
  
- [ ] **API Layer & Server Actions**
  - [ ] API Routes לקריאות נתונים (GET)
  - [ ] Server Actions לפעולות (POST/PUT/DELETE)
  - [ ] Event emission לכל פעולה
  - [ ] Error handling ו-validation
  
- [ ] **Edge Storage**
  - [ ] Setup Vercel Blob / R2
  - [ ] Upload/Download functions
  - [ ] Publish flow עם JSON generation
  - [ ] Cache invalidation
  
- [ ] **Event Integration**
  - [ ] Event listeners רלוונטיים
  - [ ] Event emission לכל פעולה
  - [ ] תיעוד אירועים ב-README

### Phase 2: Visual Editor (שבוע 2-3)

- [ ] **Layout**
  - [ ] Main layout (Sidebar + Preview) - Client Component
  - [ ] Device preview (Desktop/Tablet/Mobile)
  - [ ] Mode switcher (Visual/Developer)
  - [ ] RTL support מלא
  
- [ ] **Sidebar - Visual Mode**
  - [ ] Sections list (Client Component)
  - [ ] Drag & Drop (dnd-kit)
  - [ ] Section settings panel
  - [ ] Block settings panel
  - [ ] Add section dialog
  - [ ] Template widgets list (לעמודי לופ)
  
- [ ] **Preview**
  - [ ] iframe implementation
  - [ ] PostMessage communication
  - [ ] Click-to-select section
  - [ ] Highlight on hover
  - [ ] Preview mode route (`/shops/[storeSlug]/preview`)
  
- [ ] **Integration**
  - [ ] Server Actions integration
  - [ ] Auto-save (debounced)
  - [ ] Loading states
  - [ ] Error handling

### Phase 3: Developer Tools (שבוע 3-4)

- [ ] **Code Editors**
  - [ ] Monaco Editor integration
  - [ ] CSS editor with autocomplete
  - [ ] JavaScript editor
  - [ ] Head code editor
  
- [ ] **Custom Sections**
  - [ ] Schema editor
  - [ ] Template editor
  - [ ] Preview with mock data
  - [ ] Publish custom section

### Phase 4: Section Components (שבוע 4-5)

- [ ] **Core Sections**
  - [ ] Header
  - [ ] Footer
  - [ ] Slideshow
  - [ ] Collection List
  - [ ] Featured Product
  - [ ] Product Grid
  - [ ] Image with Text
  - [ ] Newsletter
  - [ ] Testimonials
  - [ ] FAQ
  
- [ ] **Settings Editors**
  - [ ] Text input
  - [ ] Number/Range
  - [ ] Select/Radio
  - [ ] Color picker
  - [ ] Image picker
  - [ ] Collection picker
  - [ ] Product picker
  - [ ] Toggle/Checkbox
  - [ ] Rich text

### Phase 5: Integration & Polish (שבוע 5-6)

- [ ] **Storefront Integration**
  - [ ] getPageConfig function (קורא מ-Edge JSON)
  - [ ] DynamicSection component (רינדור דינמי)
  - [ ] Template widgets rendering (לעמודי לופ)
  - [ ] Custom CSS injection
  - [ ] Custom JS sandboxing
  - [ ] Preview mode route
  
- [ ] **Features**
  - [ ] Preview mode (קורא draft מ-DB)
  - [ ] Publish flow (Generate JSON → Edge → Invalidate cache)
  - [ ] Version history
  - [ ] Undo/Redo
  - [ ] Auto-save (debounced)
  
- [ ] **Event Integration**
  - [ ] כל פעולה פולטת אירוע
  - [ ] Event listeners רלוונטיים
  - [ ] תיעוד מלא ב-README

### Phase 6: Performance & Testing (שבוע 6-7)

- [ ] **Performance**
  - [ ] Edge caching
  - [ ] ISR setup
  - [ ] Lazy loading
  - [ ] Bundle optimization
  
- [ ] **Testing**
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Performance tests
  
- [ ] **Polish**
  - [ ] RTL support
  - [ ] Keyboard shortcuts
  - [ ] Error handling
  - [ ] Loading states
  - [ ] Empty states
  - [ ] Tooltips & Help

---

## 🎯 סיכום

הקסטומייזר של Quickshop3 מציע:

### ✅ למשתמש הפשוט:
- עריכה ויזואלית WYSIWYG
- Drag & Drop אינטואיטיבי
- תבניות מוכנות
- ללא צורך בידע טכני
- תצוגה מקדימה בזמן אמת

### ✅ למתכנת/בונה אתרים:
- עורך CSS מלא (Monaco)
- עורך JavaScript
- יצירת סקשנים מותאמים
- גישה מלאה ל-Schema
- API עשיר

### ✅ מבחינת ביצועים:
- Edge caching אגרסיבי
- JSON configuration files
- ISR לעמודים
- לא מעמיס על השרת
- מוכן לסקייל של אלפי חנויות

### ✅ מול שופיפיי:
- אותן יכולות (ויותר)
- עברית מלאה + RTL
- ממשק בעברית
- מחיר תחרותי

**מתחרים בשופיפיי - ובעברית!** 🇮🇱🚀

---

## 📚 תיעוד ופיתוח

### מתודולוגיית פיתוח:

הקסטומייזר עוקב אחרי **מתודולוגיית הפיתוח הקיימת** של Quickshop3:

1. **Documentation Driven Development**
   - כל פיצ'ר מתועד ב-README של המודול
   - לא מתחילים פיתוח בלי תיעוד

2. **Event-Driven Architecture**
   - כל פעולה פולטת אירוע
   - מודולים לא תלויים זה בזה ישירות

3. **Client-Side Dashboard**
   - הקסטומייזר הוא 100% Client Component
   - כל הלוגיקה רצה בדפדפן

4. **Server Actions לפעולות**
   - פרסום, שמירה = Server Actions
   - קריאות נתונים = API Routes

5. **Modular Structure**
   - כל קומפוננטה במודול שלה
   - קל לתחזק ולהרחיב

### קבצים רלוונטיים:

- `src/app/(dashboard)/customize/README.md` - תיעוד המודול (חובה!)
- `src/lib/customizer/` - לוגיקה עסקית
- `src/components/storefront/sections/` - קומפוננטות סקשנים
- `sql/migrations/add_customizer_tables.sql` - Migration scripts

### Checklist לפני PR:

- [ ] README עודכן עם הפיצ'ר החדש
- [ ] אירועים פולטים (eventBus.emit)
- [ ] אירועים מתועדים ב-README
- [ ] Server Actions במקום API Routes (לפעולות)
- [ ] Client Components מסומנים כ-`use client`
- [ ] RTL support מלא
- [ ] Error handling
- [ ] Loading states

**זכור:** הקסטומייזר הוא חלק מהמערכת - הוא צריך לעקוב אחרי כל הכללים! 🎯

</div>
