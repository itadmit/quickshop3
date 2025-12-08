/**
 * Customizer Module - Widget Definitions
 * הגדרות וידג'טים לעמודי לופ (product/collection)
 */

import { SettingDefinition } from './types';

// ============================================
// Product Page Dynamic Widgets
// ============================================

export const PRODUCT_DYNAMIC_WIDGETS = {
  product_images: {
    name: 'גלריית תמונות',
    variable: '{{ product.images }}',
    settings: [
      {
        id: 'layout',
        type: 'select',
        label: 'פריסה',
        options: [
          { value: 'grid', label: 'גריד' },
          { value: 'slider', label: 'סליידר' },
          { value: 'stack', label: 'מערמה' },
        ],
        default: 'grid',
      },
      {
        id: 'thumbnails_position',
        type: 'select',
        label: 'מיקום Thumbnails',
        options: [
          { value: 'bottom', label: 'למטה' },
          { value: 'right', label: 'מימין' },
          { value: 'left', label: 'משמאל' },
        ],
        default: 'bottom',
      },
      {
        id: 'enable_zoom',
        type: 'checkbox',
        label: 'הפעל Zoom',
        default: true,
      },
      {
        id: 'enable_lightbox',
        type: 'checkbox',
        label: 'הפעל Lightbox',
        default: true,
      },
    ] as SettingDefinition[],
  },
  product_title: {
    name: 'שם המוצר',
    variable: '{{ product.title }}',
    settings: [
      {
        id: 'font_size',
        type: 'select',
        label: 'גודל גופן',
        options: [
          { value: 'text-2xl', label: 'קטן' },
          { value: 'text-3xl', label: 'בינוני' },
          { value: 'text-4xl', label: 'גדול' },
        ],
        default: 'text-3xl',
      },
      {
        id: 'font_weight',
        type: 'select',
        label: 'משקל גופן',
        options: [
          { value: 'normal', label: 'רגיל' },
          { value: 'semibold', label: 'חצי מודגש' },
          { value: 'bold', label: 'מודגש' },
        ],
        default: 'bold',
      },
      {
        id: 'alignment',
        type: 'select',
        label: 'יישור',
        options: [
          { value: 'right', label: 'ימין' },
          { value: 'center', label: 'מרכז' },
          { value: 'left', label: 'שמאל' },
        ],
        default: 'right',
      },
    ] as SettingDefinition[],
  },
  product_price: {
    name: 'מחיר',
    variable: '{{ product.price }}',
    settings: [
      {
        id: 'show_compare_price',
        type: 'checkbox',
        label: 'הצג מחיר מקורי',
        default: true,
      },
      {
        id: 'show_discount_badge',
        type: 'checkbox',
        label: 'הצג תג הנחה',
        default: true,
      },
      {
        id: 'font_size',
        type: 'select',
        label: 'גודל גופן',
        options: [
          { value: 'text-lg', label: 'קטן' },
          { value: 'text-xl', label: 'בינוני' },
          { value: 'text-2xl', label: 'גדול' },
        ],
        default: 'text-xl',
      },
    ] as SettingDefinition[],
  },
  product_variants: {
    name: 'בחירת וריאנט',
    variable: '{{ product.variants }}',
    settings: [
      {
        id: 'style',
        type: 'select',
        label: 'סגנון',
        options: [
          { value: 'buttons', label: 'כפתורים' },
          { value: 'dropdown', label: 'תפריט נפתח' },
          { value: 'swatches', label: 'דוגמיות צבע' },
        ],
        default: 'buttons',
      },
      {
        id: 'show_availability',
        type: 'checkbox',
        label: 'הצג זמינות',
        default: true,
      },
    ] as SettingDefinition[],
  },
  product_quantity: {
    name: 'בחירת כמות',
    variable: '{{ cart.quantity }}',
    settings: [
      {
        id: 'style',
        type: 'select',
        label: 'סגנון',
        options: [
          { value: 'input', label: 'שדה קלט' },
          { value: 'buttons', label: 'כפתורים +/-' },
        ],
        default: 'buttons',
      },
      {
        id: 'min',
        type: 'number',
        label: 'מינימום',
        default: 1,
      },
      {
        id: 'max',
        type: 'number',
        label: 'מקסימום',
        default: 10,
      },
    ] as SettingDefinition[],
  },
  add_to_cart: {
    name: 'כפתור הוספה לסל',
    variable: '{{ product.available }}',
    settings: [
      {
        id: 'text',
        type: 'text',
        label: 'טקסט כפתור',
        default: 'הוסף לסל',
      },
      {
        id: 'style',
        type: 'select',
        label: 'סגנון',
        options: [
          { value: 'primary', label: 'ראשי' },
          { value: 'secondary', label: 'משני' },
          { value: 'outline', label: 'מסומן' },
        ],
        default: 'primary',
      },
      {
        id: 'sticky_mobile',
        type: 'checkbox',
        label: 'דביק במובייל',
        default: false,
      },
    ] as SettingDefinition[],
  },
  product_description: {
    name: 'תיאור המוצר',
    variable: '{{ product.description }}',
    settings: [
      {
        id: 'show_full',
        type: 'checkbox',
        label: 'הצג תיאור מלא',
        default: false,
      },
      {
        id: 'read_more',
        type: 'checkbox',
        label: 'הצג "קרא עוד"',
        default: true,
      },
      {
        id: 'truncate_length',
        type: 'number',
        label: 'אורך קיצור (תווים)',
        default: 200,
      },
    ] as SettingDefinition[],
  },
  related_products: {
    name: 'מוצרים קשורים',
    variable: '{{ product.related }}',
    settings: [
      {
        id: 'count',
        type: 'number',
        label: 'מספר מוצרים',
        default: 4,
        min: 1,
        max: 12,
      },
      {
        id: 'algorithm',
        type: 'select',
        label: 'אלגוריתם',
        options: [
          { value: 'same_collection', label: 'מאותה קטגוריה' },
          { value: 'same_tags', label: 'עם אותם תגים' },
          { value: 'recently_viewed', label: 'נצפו לאחרונה' },
        ],
        default: 'same_collection',
      },
      {
        id: 'columns',
        type: 'range',
        label: 'עמודות',
        min: 2,
        max: 4,
        default: 4,
      },
    ] as SettingDefinition[],
  },
  product_meta: {
    name: 'מידע נוסף (SKU, ברקוד)',
    variable: '{{ product.meta }}',
    settings: [
      {
        id: 'show_sku',
        type: 'checkbox',
        label: 'הצג SKU',
        default: true,
      },
      {
        id: 'show_barcode',
        type: 'checkbox',
        label: 'הצג ברקוד',
        default: false,
      },
      {
        id: 'show_vendor',
        type: 'checkbox',
        label: 'הצג ספק',
        default: false,
      },
    ] as SettingDefinition[],
  },
  social_share: {
    name: 'שיתוף ברשתות',
    variable: '{{ product.url }}',
    settings: [
      {
        id: 'networks',
        type: 'checkbox',
        label: 'רשתות',
        options: [
          { value: 'facebook', label: 'פייסבוק' },
          { value: 'twitter', label: 'טוויטר' },
          { value: 'whatsapp', label: 'וואטסאפ' },
          { value: 'email', label: 'אימייל' },
        ],
        default: ['facebook', 'whatsapp'],
      },
      {
        id: 'style',
        type: 'select',
        label: 'סגנון',
        options: [
          { value: 'icons', label: 'אייקונים' },
          { value: 'buttons', label: 'כפתורים' },
        ],
        default: 'icons',
      },
    ] as SettingDefinition[],
  },
};

// ============================================
// Collection Page Dynamic Widgets
// ============================================

export const COLLECTION_DYNAMIC_WIDGETS = {
  collection_header: {
    name: 'כותרת קטגוריה',
    variable: '{{ collection.title }}',
    settings: [
      {
        id: 'show_image',
        type: 'checkbox',
        label: 'הצג תמונה',
        default: true,
      },
      {
        id: 'show_description',
        type: 'checkbox',
        label: 'הצג תיאור',
        default: true,
      },
      {
        id: 'alignment',
        type: 'select',
        label: 'יישור',
        options: [
          { value: 'right', label: 'ימין' },
          { value: 'center', label: 'מרכז' },
          { value: 'left', label: 'שמאל' },
        ],
        default: 'right',
      },
    ] as SettingDefinition[],
  },
  collection_image: {
    name: 'תמונת קטגוריה',
    variable: '{{ collection.image }}',
    settings: [
      {
        id: 'height',
        type: 'select',
        label: 'גובה',
        options: [
          { value: 'small', label: 'קטן (200px)' },
          { value: 'medium', label: 'בינוני (400px)' },
          { value: 'large', label: 'גדול (600px)' },
        ],
        default: 'medium',
      },
      {
        id: 'overlay',
        type: 'checkbox',
        label: 'הצג overlay',
        default: false,
      },
    ] as SettingDefinition[],
  },
  product_grid: {
    name: 'גריד מוצרים',
    variable: '{{ collection.products }}',
    settings: [
      {
        id: 'columns',
        type: 'range',
        label: 'עמודות',
        min: 2,
        max: 6,
        default: 4,
      },
      {
        id: 'card_style',
        type: 'select',
        label: 'סגנון כרטיס',
        options: [
          { value: 'minimal', label: 'מינימליסטי' },
          { value: 'detailed', label: 'מפורט' },
          { value: 'compact', label: 'קומפקטי' },
        ],
        default: 'minimal',
      },
      {
        id: 'per_page',
        type: 'number',
        label: 'מוצרים לעמוד',
        default: 24,
        min: 12,
        max: 48,
      },
    ] as SettingDefinition[],
  },
  collection_filters: {
    name: 'פילטרים',
    variable: '{{ collection.filters }}',
    settings: [
      {
        id: 'position',
        type: 'select',
        label: 'מיקום',
        options: [
          { value: 'sidebar', label: 'סיידבר' },
          { value: 'top', label: 'למעלה' },
        ],
        default: 'sidebar',
      },
      {
        id: 'show_price',
        type: 'checkbox',
        label: 'הצג פילטר מחיר',
        default: true,
      },
      {
        id: 'show_availability',
        type: 'checkbox',
        label: 'הצג פילטר זמינות',
        default: true,
      },
    ] as SettingDefinition[],
  },
  collection_sort: {
    name: 'מיון',
    variable: '{{ collection.sort_options }}',
    settings: [
      {
        id: 'default_sort',
        type: 'select',
        label: 'מיון ברירת מחדל',
        options: [
          { value: 'manual', label: 'ידני' },
          { value: 'price_asc', label: 'מחיר: נמוך לגבוה' },
          { value: 'price_desc', label: 'מחיר: גבוה לנמוך' },
          { value: 'name_asc', label: 'שם: א-ת' },
          { value: 'name_desc', label: 'שם: ת-א' },
          { value: 'created_desc', label: 'חדש ביותר' },
        ],
        default: 'manual',
      },
    ] as SettingDefinition[],
  },
  pagination: {
    name: 'עימוד',
    variable: '{{ collection.pagination }}',
    settings: [
      {
        id: 'style',
        type: 'select',
        label: 'סגנון',
        options: [
          { value: 'numbers', label: 'מספרים' },
          { value: 'prev_next', label: 'קודם/הבא' },
          { value: 'load_more', label: 'טען עוד' },
        ],
        default: 'numbers',
      },
      {
        id: 'per_page',
        type: 'number',
        label: 'מוצרים לעמוד',
        default: 24,
      },
    ] as SettingDefinition[],
  },
};

// ============================================
// Static Widgets
// ============================================

export const STATIC_WIDGETS = {
  rich_text: {
    name: 'טקסט עשיר',
    type: 'rich_text',
  },
  image: {
    name: 'תמונה',
    type: 'image',
  },
  video: {
    name: 'וידאו',
    type: 'video',
  },
  banner: {
    name: 'באנר',
    type: 'banner',
  },
  trust_badges: {
    name: 'תגי אמון',
    type: 'trust_badges',
  },
  faq: {
    name: 'שאלות נפוצות',
    type: 'faq',
  },
  custom_html: {
    name: 'HTML מותאם',
    type: 'custom_html',
  },
  spacer: {
    name: 'רווח',
    type: 'spacer',
  },
  divider: {
    name: 'קו מפריד',
    type: 'divider',
  },
};

// ============================================
// Helper Functions
// ============================================

export function getWidgetDefinition(
  widgetType: string,
  templateType: 'product' | 'collection'
) {
  if (templateType === 'product') {
    return PRODUCT_DYNAMIC_WIDGETS[widgetType as keyof typeof PRODUCT_DYNAMIC_WIDGETS];
  } else {
    return COLLECTION_DYNAMIC_WIDGETS[widgetType as keyof typeof COLLECTION_DYNAMIC_WIDGETS];
  }
}

export function getAllDynamicWidgets(templateType: 'product' | 'collection') {
  if (templateType === 'product') {
    return PRODUCT_DYNAMIC_WIDGETS;
  } else {
    return COLLECTION_DYNAMIC_WIDGETS;
  }
}

export function getAllStaticWidgets() {
  return STATIC_WIDGETS;
}

