import { queryOne } from '@/lib/db';

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
  }>(
    'SELECT id, name, slug, domain, myshopify_domain, currency, locale, timezone, plan, is_active FROM stores WHERE slug = $1 AND is_active = true',
    [slug]
  );

  return store;
}

/**
 * מקבל את storeId לפי slug
 */
export async function getStoreIdBySlug(slug: string): Promise<number | null> {
  const store = await getStoreBySlug(slug);
  return store?.id || null;
}

