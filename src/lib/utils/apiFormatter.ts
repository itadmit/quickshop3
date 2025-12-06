/**
 * Quickshop API Formatter Utility
 * 
 * כלי עזר להבטחת תאימות לפורמט API אחיד
 * כל API endpoint צריך להשתמש בפונקציות האלה כדי להחזיר תגובות בפורמט אחיד
 */

/**
 * עטיפה לרשימה (list) - מחזיר תגובה בפורמט Quickshop API
 * 
 * @example
 * // GET /api/orders → { "orders": [...] }
 * return Response.json(quickshopList('orders', orders));
 */
export function quickshopList<T>(key: string, items: T[]): { [key: string]: T[] } {
  return {
    [key]: items,
  };
}

/**
 * עטיפה לאובייקט בודד (single) - מחזיר תגובה בפורמט Quickshop API
 * 
 * @example
 * // GET /api/orders/:id → { "order": {...} }
 * return Response.json(quickshopItem('order', order));
 */
export function quickshopItem<T>(key: string, item: T): { [key: string]: T } {
  return {
    [key]: item,
  };
}

/**
 * עטיפה לרשימה עם page_info (cursor pagination) - מחזיר תגובה בפורמט Quickshop API
 * 
 * @example
 * // GET /api/orders?limit=20&cursor=123
 * return Response.json({
 *   ...quickshopList('orders', orders),
 *   page_info: {
 *     has_next_page: true,
 *     cursor: '12345'
 *   }
 * });
 */
export function quickshopListWithPagination<T>(
  key: string,
  items: T[],
  pageInfo: {
    has_next_page: boolean;
    cursor: string | null;
  }
): Record<string, T[] | { has_next_page: boolean; cursor: string | null }> {
  return {
    [key]: items,
    page_info: pageInfo,
  };
}


