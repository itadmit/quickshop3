/**
 * Translation Service - מערכת תרגומים
 * 
 * טוען תרגומים מ-JSON files עם Fallback Strategy
 */

type TranslationData = Record<string, any>;

interface TranslationCache {
  [locale: string]: {
    [namespace: string]: TranslationData;
  };
}

const translationCache: TranslationCache = {};

/**
 * טוען תרגומים מ-JSON files
 */
export async function loadJSONTranslations(
  locale: string,
  namespace: string
): Promise<TranslationData> {
  const cacheKey = `${locale}:${namespace}`;
  
  // בדיקת cache
  if (translationCache[locale]?.[namespace]) {
    return translationCache[locale][namespace];
  }
  
  try {
    // טעינת קובץ JSON
    const translations = await import(`@/locales/${locale}/${namespace}.json`);
    
    // שמירה ב-cache
    if (!translationCache[locale]) {
      translationCache[locale] = {};
    }
    translationCache[locale][namespace] = translations.default || translations;
    
    return translationCache[locale][namespace];
  } catch (error) {
    // Fallback לשפת ברירת מחדל
    if (locale !== 'he-IL') {
      return loadJSONTranslations('he-IL', namespace);
    }
    
    // אם גם עברית לא קיימת, החזר אובייקט ריק
    return {};
  }
}

/**
 * מקבל תרגום לפי key path (לדוגמה: 'home.title')
 */
export function getNestedValue(obj: any, path: string): string | null {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  return typeof current === 'string' ? current : null;
}

/**
 * טוען תרגומים מ-Database (מותאם לכל חנות)
 */
export async function loadDBTranslations(
  storeId: number,
  locale: string,
  namespace: string
): Promise<TranslationData> {
  try {
    const { query } = await import('@/lib/db');
    
    const translations = await query<{
      key_path: string;
      value: string;
    }>(
      `SELECT 
        tk.key_path,
        COALESCE(t.value, tk.default_value) as value
      FROM translation_keys tk
      LEFT JOIN translations t ON t.translation_key_id = tk.id AND t.locale = $1
      WHERE tk.store_id = $2 AND tk.namespace = $3`,
      [locale, storeId, namespace]
    );
    
    // המרה ל-nested object
    const result: TranslationData = {};
    translations.forEach(trans => {
      const keys = trans.key_path.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = trans.value;
    });
    
    return result;
  } catch (error) {
    console.error('Error loading DB translations:', error);
    return {};
  }
}

/**
 * מקבל תרגום עם Fallback מלא (DB → JSON → Fallback)
 */
export async function getTranslation(
  key: string,
  options: {
    storeId?: number;
    locale: string;
    namespace: string;
    defaultLocale?: string;
    params?: Record<string, string | number>;
  }
): Promise<string> {
  const { storeId, locale, namespace, defaultLocale = 'he-IL', params } = options;
  
  let translation: string | null = null;
  
  // 1. נסה DB translation (אם יש storeId) - עדיפות גבוהה
  if (storeId) {
    const dbTranslations = await loadDBTranslations(storeId, locale, namespace);
    translation = getNestedValue(dbTranslations, key);
    
    // אם לא נמצא ב-locale הנוכחי, נסה שפת ברירת מחדל
    if (!translation && locale !== defaultLocale) {
      const defaultDBTranslations = await loadDBTranslations(storeId, defaultLocale, namespace);
      translation = getNestedValue(defaultDBTranslations, key);
    }
  }
  
  // 2. אם לא נמצא ב-DB, נסה JSON files
  if (!translation) {
    const jsonTranslations = await loadJSONTranslations(locale, namespace);
    translation = getNestedValue(jsonTranslations, key);
    
    // אם לא נמצא, נסה שפת ברירת מחדל
    if (!translation && locale !== defaultLocale) {
      const defaultJSONTranslations = await loadJSONTranslations(defaultLocale, namespace);
      translation = getNestedValue(defaultJSONTranslations, key);
    }
  }
  
  // 3. אם עדיין לא נמצא, החזר את ה-key עצמו
  if (!translation) {
    return key;
  }
  
  // 4. החלף params אם יש
  if (params) {
    return replaceParams(translation, params);
  }
  
  return translation;
}

/**
 * מחליף placeholders בטקסט (לדוגמה: {count} -> 5)
 */
function replaceParams(text: string, params: Record<string, string | number>): string {
  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * טוען כל התרגומים של namespace מסוים
 */
export async function loadNamespaceTranslations(
  locale: string,
  namespace: string
): Promise<TranslationData> {
  return loadJSONTranslations(locale, namespace);
}

