/**
 * פונקציה שמבנה variant title מ-option1/option2/option3
 * אם יש options, מחזיר אותם מופרדים ב-" / "
 * אחרת מחזיר null (כדי שהמערכת תשתמש ב-Default Title)
 */
export function buildVariantTitle(
  option1: string | null | undefined,
  option2: string | null | undefined,
  option3: string | null | undefined
): string | null {
  const options = [option1, option2, option3].filter(Boolean) as string[];
  
  if (options.length > 0) {
    return options.join(' / ');
  }
  
  return null;
}

/**
 * פונקציה שמעדכנת variant title אם יש options
 * אם יש options, מעדכנת את ה-title
 * אם אין options, משאירה את ה-title הקיים (או Default Title)
 */
export function getVariantTitle(
  existingTitle: string | null | undefined,
  option1: string | null | undefined,
  option2: string | null | undefined,
  option3: string | null | undefined
): string {
  const titleFromOptions = buildVariantTitle(option1, option2, option3);
  
  if (titleFromOptions) {
    return titleFromOptions;
  }
  
  // אם אין options, השתמש ב-title הקיים או Default Title
  return existingTitle || 'Default Title';
}

