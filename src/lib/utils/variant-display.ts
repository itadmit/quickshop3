/**
 * פונקציות עזר להצגת variant titles ב-UI
 * אם variant_title הוא "Default Title", לא מציגים אותו - רק את שם המוצר
 */

/**
 * בודק אם צריך להציג variant title
 * @param variantTitle - ה-title של ה-variant
 * @returns true אם צריך להציג, false אם לא
 */
export function shouldShowVariantTitle(variantTitle: string | null | undefined): boolean {
  if (!variantTitle) return false;
  return variantTitle !== 'Default Title';
}

/**
 * מחזיר variant display name - אם זה "Default Title" מחזיר את שם המוצר
 * @param variantTitle - ה-title של ה-variant
 * @param option1 - option1
 * @param option2 - option2
 * @param option3 - option3
 * @param productTitle - שם המוצר (להצגה במקום "Default Title")
 * @returns string | null - שם להצגה או null אם לא צריך להציג
 */
export function getVariantDisplayName(
  variantTitle: string | null | undefined,
  option1?: string | null,
  option2?: string | null,
  option3?: string | null,
  productTitle?: string | null
): string | null {
  // אם יש options, בנה מהם
  const options = [option1, option2, option3].filter(Boolean) as string[];
  if (options.length > 0) {
    return options.join(' / ');
  }
  
  // אם יש title ולא זה Default Title, השתמש בו
  if (variantTitle && variantTitle !== 'Default Title') {
    return variantTitle;
  }
  
  // אם זה "Default Title", הצג את שם המוצר זמנית
  if (variantTitle === 'Default Title' && productTitle) {
    return productTitle;
  }
  
  // אחרת, לא צריך להציג כלום
  return null;
}

