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

## 🔌 API Endpoints

### Pages API:

```http
# קבלת מבנה עמוד (draft)
GET /api/customizer/pages/:pageType?handle=:handle

# שמירת שינויים (draft)
PUT /api/customizer/pages/:pageType
Content-Type: application/json
{
  "sections": [...],
  "section_order": [...],
  "custom_css": "..."
}

# פרסום עמוד
POST /api/customizer/pages/:pageType/publish

# שחזור לפורסם
POST /api/customizer/pages/:pageType/discard-draft
```

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

## ✅ Checklist יישום

### Phase 1: Foundation (שבוע 1-2)

- [ ] **Database**
  - [ ] יצירת טבלאות
  - [ ] Migration scripts
  - [ ] Indexes ואופטימיזציה
  
- [ ] **API Layer**
  - [ ] Pages CRUD
  - [ ] Sections CRUD
  - [ ] Blocks CRUD
  - [ ] Theme Settings CRUD
  
- [ ] **Edge Storage**
  - [ ] Setup Vercel Blob / R2
  - [ ] Upload/Download functions
  - [ ] Publish flow

### Phase 2: Visual Editor (שבוע 2-3)

- [ ] **Layout**
  - [ ] Main layout (Sidebar + Preview)
  - [ ] Device preview (Desktop/Tablet/Mobile)
  - [ ] Mode switcher (Visual/Developer)
  
- [ ] **Sidebar - Visual Mode**
  - [ ] Sections list
  - [ ] Drag & Drop (dnd-kit)
  - [ ] Section settings panel
  - [ ] Block settings panel
  - [ ] Add section dialog
  
- [ ] **Preview**
  - [ ] iframe implementation
  - [ ] PostMessage communication
  - [ ] Click-to-select section
  - [ ] Highlight on hover

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
  - [ ] getPageConfig function
  - [ ] DynamicSection component
  - [ ] Custom CSS injection
  - [ ] Custom JS sandboxing
  
- [ ] **Features**
  - [ ] Preview mode
  - [ ] Publish flow
  - [ ] Version history
  - [ ] Undo/Redo
  - [ ] Auto-save

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

</div>
