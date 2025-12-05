/**
 * Template Service - ניהול תבניות ותרגומיהן
 * 
 * מטפל בתבניות שנוצרות ב-Customizer ותרגומיהן
 */

import { query, queryOne } from '@/lib/db';

export interface Template {
  id: number;
  store_id: number;
  name: string;
  type: string;
  page_type: string | null;
  settings: any;
}

export interface TemplateTranslation {
  key: string;
  value: string;
}

/**
 * מקבל תבנית לפי שם וחנות
 */
export async function getTemplate(
  name: string,
  storeId: number
): Promise<Template | null> {
  return queryOne<Template>(
    'SELECT id, store_id, name, type, page_type, settings FROM templates WHERE store_id = $1 AND name = $2',
    [storeId, name]
  );
}

/**
 * מקבל תרגומי תבנית
 */
export async function getTemplateTranslations(
  templateId: number,
  locale: string,
  defaultLocale: string = 'he-IL'
): Promise<Record<string, string>> {
  // נסה לטעון תרגום ב-locale הנוכחי
  let translations = await query<TemplateTranslation>(
    'SELECT key, value FROM template_translations WHERE template_id = $1 AND locale = $2',
    [templateId, locale]
  );
  
  // אם אין תרגום, נסה שפת ברירת מחדל
  if (translations.length === 0 && locale !== defaultLocale) {
    translations = await query<TemplateTranslation>(
      'SELECT key, value FROM template_translations WHERE template_id = $1 AND locale = $2',
      [templateId, defaultLocale]
    );
  }
  
  // המרה ל-object
  const result: Record<string, string> = {};
  translations.forEach(t => {
    result[t.key] = t.value;
  });
  
  return result;
}

/**
 * מקבל תבנית עם תרגומיה
 */
export async function getTemplateWithTranslations(
  name: string,
  storeId: number,
  locale: string
): Promise<{
  template: Template | null;
  translations: Record<string, string>;
}> {
  const template = await getTemplate(name, storeId);
  
  if (!template) {
    return { template: null, translations: {} };
  }
  
  const translations = await getTemplateTranslations(template.id, locale);
  
  return { template, translations };
}

/**
 * שומר תבנית חדשה
 */
export async function saveTemplate(
  storeId: number,
  name: string,
  type: string,
  pageType: string | null,
  settings: any
): Promise<Template> {
  const result = await queryOne<{ id: number }>(
    `INSERT INTO templates (store_id, name, type, page_type, settings)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (store_id, name) 
     DO UPDATE SET type = $3, page_type = $4, settings = $5, updated_at = now()
     RETURNING id`,
    [storeId, name, type, pageType, JSON.stringify(settings)]
  );
  
  if (!result) {
    throw new Error('Failed to save template');
  }
  
  const template = await queryOne<Template>(
    'SELECT id, store_id, name, type, page_type, settings FROM templates WHERE id = $1',
    [result.id]
  );
  
  if (!template) {
    throw new Error('Failed to retrieve template');
  }
  
  return template;
}

/**
 * שומר תרגום תבנית
 */
export async function saveTemplateTranslation(
  templateId: number,
  storeId: number,
  key: string,
  locale: string,
  value: string
): Promise<void> {
  await query(
    `INSERT INTO template_translations (template_id, store_id, key, locale, value)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (template_id, key, locale)
     DO UPDATE SET value = $5, updated_at = now()`,
    [templateId, storeId, key, locale, value]
  );
}

/**
 * שומר מספר תרגומים בבת אחת
 */
export async function saveTemplateTranslations(
  templateId: number,
  storeId: number,
  locale: string,
  translations: Record<string, string>
): Promise<void> {
  // מחיקה של תרגומים קיימים לשפה הזו
  await query(
    'DELETE FROM template_translations WHERE template_id = $1 AND locale = $2',
    [templateId, locale]
  );
  
  // הוספת תרגומים חדשים
  for (const [key, value] of Object.entries(translations)) {
    await saveTemplateTranslation(templateId, storeId, key, locale, value);
  }
}

/**
 * מקבל רשימת תבניות לחנות
 */
export async function getStoreTemplates(
  storeId: number,
  pageType?: string
): Promise<Template[]> {
  if (pageType) {
    return query<Template>(
      'SELECT id, store_id, name, type, page_type, settings FROM templates WHERE store_id = $1 AND page_type = $2 ORDER BY name',
      [storeId, pageType]
    );
  }
  
  return query<Template>(
    'SELECT id, store_id, name, type, page_type, settings FROM templates WHERE store_id = $1 ORDER BY name',
    [storeId]
  );
}

