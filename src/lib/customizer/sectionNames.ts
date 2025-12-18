/**
 * Section Names in Hebrew
 * שמות הסקשנים בעברית
 */

export const SECTION_NAMES: Record<string, string> = {
  // Header & Footer
  'header': 'כותרת עליונה',
  'footer': 'כותרת תחתונה',
  
  // Home Page Sections
  'hero_banner': 'באנר ראשי',
  'featured_collections': 'קטגוריות פופולריות',
  'featured_products': 'מוצרים מומלצים',
  'image_with_text': 'מדיה עם טקסט',
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
  'multicolumn': 'עמודות מרובות',
  'collage': 'קולאז׳',
  'custom_html': 'קוד HTML מותאם',
  'announcement_bar': 'בר הודעות',
  
  // Product Page Sections
  'product_header': 'כותרת מוצר',
  'product_gallery': 'גלריית מוצר',
  'product_info': 'מידע מוצר',
  'product_title': 'שם המוצר',
  'product_name': 'שם המוצר',
  'product_price': 'מחיר המוצר',
  'product_variants': 'וריאציות המוצר',
  'product_variations': 'וריאציות המוצר',
  'product_add_to_cart': 'הוספה לסל',
  'product_description': 'תיאור המוצר',
  'product_custom_fields': 'שדות מותאמים אישית',
  'product_reviews': 'ביקורות',
  'related_products': 'מוצרים קשורים',
  'recently_viewed': 'נצפו לאחרונה',
  'product_recently_viewed': 'נצפו לאחרונה',
  
  // Collection Page Sections
  'collection_header': 'כותרת קטגוריה',
  'collection_filters': 'מסננים',
  'collection_products': 'רשימת מוצרים',
  'collection_title': 'שם הקטגוריה',
  'collection_description': 'תיאור הקטגוריה',
  'collection_grid': 'רשת מוצרים',
};

/**
 * Get section name in Hebrew
 * @param sectionType - Section type (e.g., 'hero_banner')
 * @returns Section name in Hebrew
 */
export function getSectionName(sectionType: string): string {
  return SECTION_NAMES[sectionType] || sectionType;
}
