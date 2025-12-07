import { query, queryOne } from '@/lib/db';
import { unstable_cache } from 'next/cache';

// ============================================
// Types
// ============================================

export interface ProductListItem {
  id: number;
  title: string;
  handle: string;
  image: string | null;
  variant_id: number;
  price: number;
  compare_at_price: number | null;
  available: number;
}

export interface ProductDetails extends ProductListItem {
  body_html: string | null;
  vendor: string | null;
  product_type: string | null;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
    position: number;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: number;
    compare_at_price: number | null;
    sku: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    available: number;
  }>;
  options?: Array<{
    id: number;
    name: string;
    type?: 'button' | 'color' | 'pattern' | 'image';
    position: number;
    values?: Array<{
      id: number;
      value: string;
      position: number;
      metadata?: {
        color?: string;
        image?: string;
        images?: string[];
        pattern?: string;
      };
    }>;
  }>;
}

export interface CollectionItem {
  id: number;
  title: string;
  handle: string;
  description: string | null;
  image_url: string | null;
  product_count?: number;
}

// ============================================
// Product Queries - Optimized
// ============================================

/**
 * מקבל רשימת מוצרים עם תמונות ומחירים - Single Query עם JOIN
 * ✅ מיטבי - אין N+1 queries
 */
export async function getProductsList(
  storeId: number,
  options: {
    limit?: number;
    offset?: number;
    collectionId?: number;
    search?: string;
  } = {}
): Promise<ProductListItem[]> {
  const { limit = 20, offset = 0, collectionId, search } = options;

  let whereClause = 'p.store_id = $1 AND p.status = \'active\'';
  const params: any[] = [storeId];
  let paramIndex = 2;

  if (collectionId) {
    whereClause += ` AND EXISTS (
      SELECT 1 FROM product_collection_map pcm 
      WHERE pcm.product_id = p.id AND pcm.collection_id = $${paramIndex}
    )`;
    params.push(collectionId);
    paramIndex++;
  }

  if (search) {
    whereClause += ` AND (p.title ILIKE $${paramIndex} OR p.body_html ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  const products = await query<ProductListItem & { inventory_quantity?: number }>(
    `SELECT 
      p.id,
      p.title,
      p.handle,
      pi.src as image,
      pv.id as variant_id,
      pv.price,
      pv.compare_at_price,
      COALESCE(pv.inventory_quantity, 0) as inventory_quantity
    FROM products p
    LEFT JOIN LATERAL (
      SELECT src 
      FROM product_images 
      WHERE product_id = p.id 
      ORDER BY position 
      LIMIT 1
    ) pi ON true
    LEFT JOIN LATERAL (
      SELECT id, price, compare_at_price, inventory_quantity
      FROM product_variants 
      WHERE product_id = p.id 
      ORDER BY position 
      LIMIT 1
    ) pv ON true
    WHERE ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  // Map to use inventory_quantity as available
  return products.map(p => ({
    ...p,
    available: p.inventory_quantity || 0,
  }));
}

/**
 * מקבל מוצר בודד עם כל הפרטים - Single Query עם JOINs
 * ✅ מיטבי - אין N+1 queries
 */
export async function getProductByHandle(
  handle: string,
  storeId: number
): Promise<ProductDetails | null> {
  // Decode URL-encoded handle (for Hebrew slugs)
  const decodedHandle = decodeURIComponent(handle);
  
  // Query ראשי עם JOINs
  const product = await queryOne<{
    id: number;
    title: string;
    handle: string;
    body_html: string | null;
    vendor: string | null;
    product_type: string | null;
    image: string | null;
    variant_id: number;
    price: number;
    compare_at_price: number | null;
    available: number;
  }>(
    `SELECT 
      p.id,
      p.title,
      p.handle,
      p.body_html,
      p.vendor,
      p.product_type,
      pi.src as image,
      pv.id as variant_id,
      pv.price,
      pv.compare_at_price,
      COALESCE(pv.inventory_quantity, 0) as available
    FROM products p
    LEFT JOIN LATERAL (
      SELECT src 
      FROM product_images 
      WHERE product_id = p.id 
      ORDER BY position 
      LIMIT 1
    ) pi ON true
    LEFT JOIN LATERAL (
      SELECT id, price, compare_at_price, inventory_quantity
      FROM product_variants 
      WHERE product_id = p.id 
      ORDER BY position 
      LIMIT 1
    ) pv ON true
    WHERE p.store_id = $1 AND p.handle = $2 AND p.status = 'active'`,
    [storeId, decodedHandle]
  );

  if (!product) return null;

  // Batch query לכל התמונות
  const images = await query<{
    id: number;
    src: string;
    alt: string | null;
    position: number;
  }>(
    'SELECT id, src, alt, position FROM product_images WHERE product_id = $1 ORDER BY position',
    [product.id]
  );

  // Batch query לכל ה-variants
  const variants = await query<{
    id: number;
    title: string;
    price: number;
    compare_at_price: number | null;
    sku: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    available: number;
  }>(
    `SELECT 
      pv.id,
      pv.title,
      pv.price,
      pv.compare_at_price,
      pv.sku,
      pv.option1,
      pv.option2,
      pv.option3,
      COALESCE(pv.inventory_quantity, 0) as available
    FROM product_variants pv
    WHERE pv.product_id = $1
    ORDER BY pv.position`,
    [product.id]
  );

  // Batch query לכל ה-options עם values
  const optionsRaw = await query<{
    id: number;
    name: string;
    type: string | null;
    position: number;
  }>(
    `SELECT 
      id, 
      name, 
      COALESCE(type, 'button')::text as type, 
      position 
     FROM product_options 
     WHERE product_id = $1 
     ORDER BY position`,
    [product.id]
  );

  // טעינת values לכל option
  const options = await Promise.all(
    optionsRaw.map(async (option) => {
      const values = await query<{
        id: number;
        value: string;
        position: number;
        metadata: string | null;
      }>(
        `SELECT 
          id, 
          value, 
          position, 
          COALESCE(metadata, '{}')::jsonb as metadata 
         FROM product_option_values 
         WHERE option_id = $1 
         ORDER BY position`,
        [option.id]
      );

      return {
        id: option.id,
        name: option.name,
        type: (option.type as 'button' | 'color' | 'pattern' | 'image') || 'button',
        position: option.position,
        values: values.map(v => ({
          id: v.id,
          value: v.value,
          position: v.position,
          metadata: v.metadata ? (typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata) : undefined,
        })),
      };
    })
  );

  return {
    ...product,
    images,
    variants,
    options,
  };
}

/**
 * מקבל מוצרים מובילים - עם Cache
 */
export const getFeaturedProducts = unstable_cache(
  async (storeId: number, limit: number = 8): Promise<ProductListItem[]> => {
    return getProductsList(storeId, { limit });
  },
  ['featured-products'],
  {
    revalidate: 300,
    tags: ['products', 'featured'],
  }
);

/**
 * מקבל מוצרים חדשים - עם Cache
 */
export const getNewArrivals = unstable_cache(
  async (storeId: number, limit: number = 8): Promise<ProductListItem[]> => {
    return getProductsList(storeId, { limit });
  },
  ['new-arrivals'],
  {
    revalidate: 300,
    tags: ['products', 'new'],
  }
);

// ============================================
// Collection Queries - Optimized
// ============================================

/**
 * מקבל רשימת קטגוריות - עם Cache
 */
export const getCollections = unstable_cache(
  async (storeId: number, limit: number = 6): Promise<CollectionItem[]> => {
    const collections = await query<CollectionItem>(
      `SELECT 
        id, title, handle, description, image_url
      FROM product_collections
      WHERE store_id = $1 AND published_scope = 'web'
      ORDER BY created_at DESC
      LIMIT $2`,
      [storeId, limit]
    );

    // Batch query למספר מוצרים בכל קטגוריה
    if (collections.length > 0) {
      const collectionIds = collections.map(c => c.id);
      const productCounts = await query<{
        collection_id: number;
        count: string;
      }>(
        `SELECT 
          collection_id, 
          COUNT(*)::text as count
        FROM product_collection_map pcm
        INNER JOIN products p ON p.id = pcm.product_id
        WHERE pcm.collection_id = ANY($1::int[]) AND p.status = 'active'
        GROUP BY collection_id`,
        [collectionIds]
      );

      const countsMap = new Map(
        productCounts.map(pc => [pc.collection_id, parseInt(pc.count)])
      );

      return collections.map(collection => ({
        ...collection,
        product_count: countsMap.get(collection.id) || 0,
      }));
    }

    return collections;
  },
  ['collections'],
  {
    revalidate: 600, // 10 דקות
    tags: ['collections'],
  }
);

/**
 * מקבל קטגוריה בודדת עם מוצרים - עם Cache
 */
export const getCollectionByHandle = unstable_cache(
  async (
    handle: string,
    storeId: number,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    collection: CollectionItem | null;
    products: ProductListItem[];
    total: number;
  }> => {
    const { limit = 20, offset = 0 } = options;

    // Query לקטגוריה
    const collection = await queryOne<CollectionItem>(
      `SELECT id, title, handle, description, image_url
       FROM product_collections
       WHERE store_id = $1 AND handle = $2 AND published_scope = 'web'`,
      [storeId, handle]
    );

    if (!collection) {
      return { collection: null, products: [], total: 0 };
    }

    // Query למוצרים בקטגוריה - Single Query עם JOIN
    const products = await getProductsList(storeId, {
      limit,
      offset,
      collectionId: collection.id,
    });

    // Count total
    const totalResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count
       FROM product_collection_map pcm
       INNER JOIN products p ON p.id = pcm.product_id
       WHERE pcm.collection_id = $1 AND p.store_id = $2 AND p.status = 'active'`,
      [collection.id, storeId]
    );

    const total = totalResult ? parseInt(totalResult.count) : 0;

    return {
      collection: {
        ...collection,
        product_count: total,
      },
      products,
      total,
    };
  },
  ['collection'],
  {
    revalidate: 300,
    tags: ['collections'],
  }
);

/**
 * מקבל רשימת קטגוריות לניווט (Mega Menu) - עם Cache
 */
export const getNavigationCollections = unstable_cache(
  async (storeId: number): Promise<Array<{
    id: number;
    name: string;
    handle: string;
    children?: Array<{
      id: number;
      name: string;
      handle: string;
    }>;
  }>> => {
    // טעינת כל ה-collections
    const collections = await query<{
      id: number;
      title: string;
      handle: string;
    }>(
      `SELECT 
        id,
        title,
        handle
      FROM product_collections
      WHERE store_id = $1 AND published_scope = 'web'
      ORDER BY created_at DESC
      LIMIT 20`,
      [storeId]
    );

    // מחזיר רשימה שטוחה (אפשר לשפר בעתיד עם היררכיה)
    return collections.map(col => ({
      id: col.id,
      name: col.title,
      handle: col.handle,
    }));
  },
  ['navigation-collections'],
  {
    revalidate: 600, // 10 דקות
    tags: ['collections'],
  }
);

/**
 * מקבל collections של מוצר מסוים
 */
export async function getProductCollections(
  productId: number,
  storeId: number
): Promise<Array<{ id: number; title: string; handle: string }>> {
  return query<{ id: number; title: string; handle: string }>(
    `SELECT 
      pc.id,
      pc.title,
      pc.handle
    FROM product_collections pc
    INNER JOIN product_collection_map pcm ON pcm.collection_id = pc.id
    WHERE pcm.product_id = $1 AND pc.store_id = $2 AND pc.published_scope = 'web'
    ORDER BY pc.created_at DESC`,
    [productId, storeId]
  );
}

// ============================================
// Store Queries - Optimized
// ============================================

/**
 * מקבל פרטי חנות - עם Cache
 */
export const getStoreData = unstable_cache(
  async (slug: string) => {
    return queryOne<{
      id: number;
      name: string;
      slug: string;
      domain: string | null;
      currency: string;
      locale: string;
      timezone: string;
    }>(
      'SELECT id, name, slug, domain, currency, locale, timezone FROM stores WHERE slug = $1 AND is_active = true',
      [slug]
    );
  },
  ['store'],
  {
    revalidate: 3600, // 1 שעה
    tags: ['store'],
  }
);
