/**
 * Server-side Translation Helpers
 * עזרים לתרגומים בצד השרת
 */

import { getTranslation, loadNamespaceTranslations } from './translations';

/**
 * מקבל translation function לשרת
 */
export async function getTranslations(
  locale: string,
  namespace: string = 'common',
  storeId?: number
) {
  return async (key: string, params?: Record<string, string | number>) => {
    return getTranslation(key, {
      storeId,
      locale,
      namespace,
      params,
    });
  };
}

/**
 * טוען את כל התרגומים של namespace מסוים
 */
export async function getNamespaceTranslations(
  locale: string,
  namespace: string
) {
  return loadNamespaceTranslations(locale, namespace);
}

