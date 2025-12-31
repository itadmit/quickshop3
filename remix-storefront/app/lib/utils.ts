// ============================================
// Client & Server Utilities
// פונקציות שימושיות שיכולות לרוץ גם ב-client וגם ב-server
// ============================================

/**
 * פורמט מחיר
 */
export function formatPrice(price: number, currency: string = 'ILS'): string {
  const symbol = currency === 'ILS' ? '₪' : '$';
  return `${symbol}${price.toLocaleString('he-IL', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * חישוב אחוז הנחה
 */
export function getDiscountPercent(price: number, compareAt: number): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

