/**
 * Customizer Module - Section Names
 * מיפוי שמות סקשנים בעברית
 */

import { SectionType } from './types';

/**
 * מיפוי סוגי סקשנים לשמות בעברית
 */
export const SECTION_NAMES: Record<SectionType, string> = {
  announcement_bar: 'בר הודעות',
  header: 'כותרת עליונה',
  slideshow: 'סליידשו',
  hero_banner: 'באנר Hero',
  hero_video: 'וידאו Hero',
  collection_list: 'רשימת קטגוריות',
  featured_collection: 'קטגוריה מוצגת',
  featured_product: 'מוצר מוצג',
  product_grid: 'גריד מוצרים',
  new_arrivals: 'מוצרים חדשים',
  best_sellers: 'מוצרים נמכרים',
  recently_viewed: 'נצפו לאחרונה',
  image_with_text: 'תמונה עם טקסט',
  image_with_text_overlay: 'תמונה עם שכבת טקסט',
  rich_text: 'טקסט עשיר',
  video: 'וידאו',
  before_after_slider: 'סליידר לפני ואחרי',
  collapsible_tabs: 'כרטיסיות מתקפלות',
  testimonials: 'ביקורות',
  faq: 'שאלות נפוצות',
  newsletter: 'הרשמה לניוזלטר',
  promo_banner: 'באנר פרסומי',
  countdown: 'ספירה לאחור',
  instagram: 'אינסטגרם',
  trust_badges: 'תגי אמון',
  popup: 'פופאפ',
  footer: 'כותרת תחתונה',
  mobile_sticky_bar: 'בר תחתון למובייל',
  mega_menu: 'תפריט מגה',
  custom_html: 'HTML מותאם',
  custom_liquid: 'Liquid מותאם',
  custom_section: 'סקשן מותאם',
  embed_code: 'קוד מוטמע',
  api_section: 'סקשן API',
};

/**
 * מחזיר את השם בעברית של סקשן לפי סוגו
 */
export function getSectionName(sectionType: SectionType | string): string {
  return SECTION_NAMES[sectionType as SectionType] || sectionType;
}

