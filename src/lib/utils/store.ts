import { queryOne, query } from '@/lib/db';

/**
 * מזהה את החנות לפי slug
 */
export async function getStoreBySlug(slug: string) {
  const store = await queryOne<{
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    myshopify_domain: string | null;
    currency: string;
    locale: string;
    timezone: string;
    plan: string;
    is_active: boolean;
    logo: string | null;
    settings: any;
  }>(
    `SELECT 
      id, name, slug, domain, myshopify_domain, currency, locale, timezone, plan, is_active,
      NULL::text as logo,
      NULL::jsonb as settings
     FROM stores 
     WHERE slug = $1 AND is_active = true`,
    [slug]
  );
  
  // Try to get logo from store_settings if exists (silently fail if table doesn't exist)
  if (store) {
    try {
      // Check if table exists first by querying information_schema
      const tableExists = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'store_settings'`
      );
      
      if (tableExists && tableExists.count > 0) {
        const settings = await queryOne<{ settings: any }>(
          'SELECT settings FROM store_settings WHERE store_id = $1',
          [store.id]
        );
        if (settings?.settings) {
          const parsedSettings = typeof settings.settings === 'string' 
            ? JSON.parse(settings.settings) 
            : settings.settings;
          store.settings = parsedSettings;
          // Extract logo from settings if exists
          if (parsedSettings?.logo) {
            store.logo = parsedSettings.logo;
          } else if (parsedSettings?.branding?.logo) {
            store.logo = parsedSettings.branding.logo;
          }
        }
      }
    } catch (error: any) {
      // Silently ignore if store_settings table doesn't exist or any other error
      // Only log if it's not a "relation does not exist" error
      if (!error.message?.includes('does not exist')) {
        console.warn('Could not fetch store settings:', error);
      }
    }
  }

  return store;
}

/**
 * מקבל את storeId לפי slug
 */
export async function getStoreIdBySlug(slug: string): Promise<number | null> {
  const store = await getStoreBySlug(slug);
  return store?.id || null;
}

