/**
 * Section Names in Hebrew
 * שמות הסקשנים בעברית
 */

export const SECTION_NAMES: Record<string, string> = {
  // Header & Footer
  'header': 'כותרת עליונה',
  'footer': 'כותרת תחתונה',
  'announcement_bar': 'בר הודעות',
  
  // Hero Sections
  'hero_banner': 'באנר ראשי',
  'slideshow': 'מצגת תמונות',
  
  // Store Sections
  'featured_collections': 'קטגוריות פופולריות',
  'featured_products': 'מוצרים מומלצים',
  
  // Content Sections
  'image_with_text': 'מדיה עם טקסט',
  'multicolumn': 'עמודות מרובות',
  'collage': 'קולאז׳',
  'rich_text': 'טקסט עשיר',
  'gallery': 'גלריה',
  'video': 'וידאו',
  'newsletter': 'ניוזלטר',
  'testimonials': 'המלצות לקוחות',
  'contact_form': 'טופס יצירת קשר',
  'faq': 'שאלות ותשובות',
  'logo_list': 'רשימת לוגואים',
  'map': 'מפה',
  'custom_html': 'קוד HTML מותאם',
  
  // Product Page Sections
  'product_breadcrumbs': 'פירורי לחם',
  'product_header': 'כותרת מוצר',
  'product_gallery': 'גלריית מוצר',
  'product_name': 'שם מוצר',
  'product_title': 'כותרת מוצר',
  'product_price': 'מחיר מוצר',
  'product_variants': 'וריאציות מוצר',
  'product_variations': 'וריאציות מוצר',
  'product_add_to_cart': 'כפתור הוסף לסל',
  'product_description': 'תיאור מוצר',
  'product_custom_fields': 'שדות מותאמים אישית',
  'product_info': 'מידע מוצר',
  'product_reviews': 'ביקורות מוצר',
  'related_products': 'מוצרים קשורים',
  'product_recently_viewed': 'צפית לאחרונה',
  'recently_viewed': 'צפית לאחרונה',
  
  // Collection Page Sections
  'collection_header': 'כותרת קטגוריה',
  'collection_description': 'תיאור קטגוריה',
  'collection_filters': 'מסננים',
  'collection_products': 'רשימת מוצרים',
  'collection_pagination': 'עמודים',
  
  // Elements
  'element_heading': 'כותרת',
  'element_content': 'תוכן',
  'element_button': 'כפתור',
  'element_image': 'תמונה',
  'element_video': 'וידאו',
  'element_divider': 'מפריד',
  'element_spacer': 'רווח',
  'element_marquee': 'טקסט נע',
  
  // Checkout Page Sections
  'checkout_form': 'טופס תשלום',
};

/**
 * Get section name in Hebrew
 * @param sectionType - Section type (e.g., 'hero_banner')
 * @returns Section name in Hebrew
 */
export function getSectionName(sectionType: string): string {
  return SECTION_NAMES[sectionType] || sectionType;
}
