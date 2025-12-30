/**
 * Server-side data loading for storefront sections
 * טעינת נתונים בשרת עבור סקשנים בפרונט
 */

import { getProductsList } from './queries';
import { query } from '@/lib/db';

interface FeaturedProductsData {
  products: Array<{
    id: number;
    title: string;
    handle: string;
    image: string | null;
    price: number;
    compare_at_price: number | null;
    vendor?: string;
    available?: number;
    rating?: number | null;
    reviews_count?: number;
  }>;
}

/**
 * טוען מוצרים עבור FeaturedProducts section בשרת
 */
export async function loadFeaturedProductsData(
  storeId: number,
  settings: {
    products_count?: number;
    product_selection_mode?: string;
    selected_collection_ids?: number[];
    selected_product_ids?: number[];
  }
): Promise<FeaturedProductsData> {
  const productsCount = settings.products_count || 8;
  const productSelectionMode = settings.product_selection_mode || 'all';
  const selectedCollectionIds = Array.isArray(settings.selected_collection_ids) 
    ? settings.selected_collection_ids 
    : [];
  const selectedProductIds = Array.isArray(settings.selected_product_ids) 
    ? settings.selected_product_ids 
    : [];

  let products: any[] = [];

  // Manual selection - load specific products
  if (productSelectionMode === 'manual' && selectedProductIds.length > 0) {
    const idsParam = selectedProductIds.join(',');
    const productsResult = await query<{
      id: number;
      title: string;
      handle: string;
      vendor: string | null;
      image: string | null;
      price: number;
      compare_at_price: number | null;
      available: number;
      rating: number | null;
      reviews_count: number;
    }>(
      `SELECT 
        p.id,
        p.title,
        p.handle,
        p.vendor,
        (SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) as image,
        (SELECT price FROM product_variants WHERE product_id = p.id ORDER BY position LIMIT 1) as price,
        (SELECT compare_at_price FROM product_variants WHERE product_id = p.id ORDER BY position LIMIT 1) as compare_at_price,
        (SELECT COALESCE(inventory_quantity, 0) FROM product_variants WHERE product_id = p.id ORDER BY position LIMIT 1) as available,
        COALESCE((
          SELECT AVG(rating)::numeric(3,1)
          FROM product_reviews
          WHERE product_id = p.id AND is_approved = true AND is_published = true
        ), 0) as rating,
        COALESCE((
          SELECT COUNT(*)
          FROM product_reviews
          WHERE product_id = p.id AND is_approved = true AND is_published = true
        ), 0) as reviews_count
      FROM products p
      WHERE p.store_id = $1 AND p.id = ANY($2::int[]) AND p.status = 'active'
      ORDER BY array_position($2::int[], p.id)`,
      [storeId, selectedProductIds]
    );

    products = productsResult.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.image,
      price: p.price ? Number(p.price) : 0,
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      vendor: p.vendor || undefined,
      available: p.available ? Number(p.available) : 0,
      rating: p.rating ? Number(p.rating) : null,
      reviews_count: p.reviews_count ? Number(p.reviews_count) : 0,
    }));
  }
  // Collection selection - load products from collections
  else if (productSelectionMode === 'collection' && selectedCollectionIds.length > 0) {
    // Load products from all selected collections
    const allProducts: any[] = [];
    const seenProductIds = new Set<number>();

    for (const collectionId of selectedCollectionIds) {
      const collectionProducts = await getProductsList(storeId, {
        limit: productsCount * 2, // Get more to have options after dedup
        collectionId,
      });

      // Add products that haven't been seen yet (avoid duplicates)
      for (const product of collectionProducts) {
        if (!seenProductIds.has(product.id)) {
          seenProductIds.add(product.id);
          allProducts.push({
            id: product.id,
            title: product.title,
            handle: product.handle,
            image: product.image,
            price: product.price || 0,
            compare_at_price: product.compare_at_price || null,
            vendor: product.vendor || undefined,
            available: product.available || 0,
            rating: null, // Will be loaded separately if needed
            reviews_count: 0,
          });
        }
      }
    }

    // Limit to requested number of products
    products = allProducts.slice(0, productsCount);
  }
  // All products - load all products
  else {
    const allProducts = await getProductsList(storeId, {
      limit: productsCount,
    });

    products = allProducts.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.image,
      price: p.price || 0,
      compare_at_price: p.compare_at_price || null,
      vendor: p.vendor || undefined,
      available: p.available || 0,
      rating: null,
      reviews_count: 0,
    }));
  }

  // Load ratings for all products in parallel
  if (products.length > 0) {
    const productIds = products.map(p => p.id);
    const ratingsResult = await query<{
      product_id: number;
      rating: number;
      reviews_count: number;
    }>(
      `SELECT 
        product_id,
        AVG(rating)::numeric(3,1) as rating,
        COUNT(*)::int as reviews_count
      FROM product_reviews
      WHERE product_id = ANY($1::int[]) AND is_approved = true AND is_published = true
      GROUP BY product_id`,
      [productIds]
    );

    const ratingsMap = new Map(
      ratingsResult.map(r => [r.product_id, { rating: Number(r.rating), reviews_count: r.reviews_count }])
    );

    // Update products with ratings
    products = products.map(p => {
      const ratingData = ratingsMap.get(p.id);
      return {
        ...p,
        rating: ratingData?.rating || null,
        reviews_count: ratingData?.reviews_count || 0,
      };
    });
  }

  return { products };
}

interface FeaturedCollectionsData {
  collections: Array<{
    id: number;
    title: string;
    handle: string;
    image_url: string | null;
    description: string | null;
    product_count?: number;
  }>;
}

/**
 * טוען קטגוריות עבור FeaturedCollections section בשרת
 */
export async function loadFeaturedCollectionsData(
  storeId: number,
  settings: {
    collection_selection_mode?: string;
    selected_collection_ids?: number[];
  }
): Promise<FeaturedCollectionsData> {
  const collectionSelectionMode = settings.collection_selection_mode || 'all';
  const selectedCollectionIds = Array.isArray(settings.selected_collection_ids) 
    ? settings.selected_collection_ids 
    : [];

  let collections: any[] = [];

  if (collectionSelectionMode === 'manual' && selectedCollectionIds.length > 0) {
    // Load specific collections
    const collectionsResult = await query<{
      id: number;
      title: string;
      handle: string;
      image_url: string | null;
      description: string | null;
      product_count: number;
    }>(
      `SELECT 
        pc.id,
        pc.title,
        pc.handle,
        pc.image_url,
        pc.description,
        COUNT(pcm.product_id)::int as product_count
      FROM product_collections pc
      LEFT JOIN product_collection_map pcm ON pcm.collection_id = pc.id
      LEFT JOIN products p ON p.id = pcm.product_id AND p.status = 'active'
      WHERE pc.store_id = $1 AND pc.id = ANY($2::int[])
      GROUP BY pc.id, pc.title, pc.handle, pc.image_url, pc.description
      ORDER BY array_position($2::int[], pc.id)`,
      [storeId, selectedCollectionIds]
    );

    collections = collectionsResult;
  } else {
    // Load all collections
    const collectionsResult = await query<{
      id: number;
      title: string;
      handle: string;
      image_url: string | null;
      description: string | null;
      product_count: number;
    }>(
      `SELECT 
        pc.id,
        pc.title,
        pc.handle,
        pc.image_url,
        pc.description,
        COUNT(pcm.product_id)::int as product_count
      FROM product_collections pc
      LEFT JOIN product_collection_map pcm ON pcm.collection_id = pc.id
      LEFT JOIN products p ON p.id = pcm.product_id AND p.status = 'active'
      WHERE pc.store_id = $1 AND pc.published_scope = 'web'
      GROUP BY pc.id, pc.title, pc.handle, pc.image_url, pc.description
      ORDER BY pc.created_at DESC
      LIMIT 100`,
      [storeId]
    );

    collections = collectionsResult;
  }

  return { collections };
}

