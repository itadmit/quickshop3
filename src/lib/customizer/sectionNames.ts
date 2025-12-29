/**
 * Section Names in Hebrew
 * שמות הסקשנים בעברית
 */

export const SECTION_NAMES: Record<string, string> = {
  'header': 'כותרת עליונה',
  'hero_banner': 'באנר ראשי',
  'featured_collections': 'קטגוריות פופולריות',
  'featured_products': 'מוצרים מומלצים',
  'image_with_text': 'מדיה עם טקסט',
  'multicolumn': 'עמודות מרובות',
  'collage': 'קולאז׳',
  'rich_text': 'טקסט עשיר',
  'newsletter': 'ניוזלטר',
  'gallery': 'גלריה',
  'video': 'וידאו',
  'slideshow': 'מצגת תמונות',
  'testimonials': 'המלצות לקוחות',
  'contact_form': 'טופס יצירת קשר',
  'faq': 'שאלות ותשובות',
  'logo_list': 'רשימת לוגואים',
  'map': 'מפה',
  'footer': 'כותרת תחתונה',
  'product_breadcrumbs': 'פירורי לחם',
  'product_header': 'כותרת מוצר',
  'product_gallery': 'גלריית מוצר',
  'product_info': 'מידע מוצר',
  'related_products': 'מוצרים קשורים',
  'collection_header': 'כותרת קטגוריה',
  'collection_description': 'תיאור קטגוריה',
  'collection_filters': 'מסננים',
  'collection_products': 'רשימת מוצרים',
  'element_heading': 'כותרת',
  'element_content': 'תוכן',
  'element_button': 'כפתור',
  'element_image': 'תמונה',
  'element_video': 'וידאו',
  'element_divider': 'מפריד',
  'element_spacer': 'רווח',
  'element_marquee': 'טקסט נע',
};

/**
 * Get section name in Hebrew
 * @param sectionType - Section type (e.g., 'hero_banner')
 * @returns Section name in Hebrew
 */
export function getSectionName(sectionType: string): string {
  return SECTION_NAMES[sectionType] || sectionType;
}
