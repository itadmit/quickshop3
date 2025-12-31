import { queryOne, query } from '@/lib/db';
import { getCached } from '@/lib/cache';

/**
 * מזהה את החנות לפי slug - עם Redis cache
 * ✅ אופטימיזציה: query אחד + Redis cache
 */
export async function getStoreBySlug(slug: string) {
  return getCached(
    `store:${slug}`,
    async () => {
      // ✅ ONE QUERY ONLY - Join with store_settings
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
          s.id,
          s.name,
          s.slug,
          s.domain,
          s.myshopify_domain,
          s.currency,
          s.locale,
          s.timezone,
          s.plan,
          s.is_active,
          COALESCE(
            (ss.settings->>'logo')::text,
            (ss.settings->'branding'->>'logo')::text
          ) as logo,
          ss.settings
         FROM stores s
         LEFT JOIN store_settings ss ON ss.store_id = s.id
         WHERE s.slug = $1 AND s.is_active = true`,
        [slug]
      );

      return store;
    },
    300 // 5 minutes cache - stores don't change often
  );
}

/**
 * מקבל את storeId לפי slug
 */
export async function getStoreIdBySlug(slug: string): Promise<number | null> {
  const store = await getStoreBySlug(slug);
  return store?.id || null;
}

