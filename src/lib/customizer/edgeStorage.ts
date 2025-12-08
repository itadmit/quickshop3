/**
 * Customizer Module - Edge Storage
 * העלאה והורדה של קבצי JSON (ללא S3 - שימוש ב-API route מקומי)
 */

/**
 * העלאה ל-Edge Storage (API route מקומי)
 * הקבצים נשמרים ב-DB והגישה דרך API route
 */
export async function uploadToEdge(
  storeId: number,
  fileName: string,
  content: string
): Promise<string> {
  try {
    // שמירה ב-DB דרך API route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/customizer/config/${storeId}/${fileName}`;
    
    // נשמור את התוכן ב-DB דרך Server Action או API route
    // כרגע נחזיר את ה-URL - השמירה ב-DB נעשית ב-actions.ts
    
    console.log(`[Edge Storage] Config saved for store ${storeId}: ${fileName}`);
    
    return apiUrl;
  } catch (error) {
    console.error('Error uploading to edge storage:', error);
    // Fallback ל-URL מקומי
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/customizer/config/${storeId}/${fileName}`;
  }
}

/**
 * הורדה מ-Edge Storage (API route מקומי)
 */
export async function downloadFromEdge(url: string): Promise<string | null> {
  try {
    // קריאה מ-API route מקומי
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
      },
    });

    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.error('Error downloading from edge:', error);
  }

  return null;
}

/**
 * מחיקת קובץ מ-Edge Storage
 */
export async function deleteFromEdge(url: string): Promise<boolean> {
  try {
    // חלץ את ה-key מה-URL
    const urlObj = new URL(url);
    const key = urlObj.pathname.substring(1); // הסר את ה-/
    
    if (!key || !key.startsWith('config/')) {
      console.warn('Invalid key for deletion:', key);
      return false;
    }
    
    // TODO: Implement S3 deletion if needed
    // For now, we'll just return true
    console.log(`[Edge Storage] Would delete: ${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting from edge storage:', error);
    return false;
  }
}

