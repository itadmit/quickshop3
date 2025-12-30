/**
 * Server-side data loading for storefront sections
 * טעינת נתונים בשרת עבור סקשנים בפרונט
 */

import { getProductsList } from './queries';
import { query, queryOne } from '@/lib/db';

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

interface ProductReviewsData {
  reviews: Array<{
    id: number;
    product_id: number;
    customer_name: string;
    rating: number;
    title: string | null;
    content: string;
    created_at: Date;
  }>;
  average_rating: number;
  total_reviews: number;
}

/**
 * טוען ביקורות עבור ProductReviewsSection בשרת
 */
export async function loadProductReviewsData(
  productId: number
): Promise<ProductReviewsData> {
  const startTime = Date.now();
  console.log(`  📝 [loadProductReviewsData] Loading reviews for product ${productId}`);
  const reviews = await query<{
    id: number;
    product_id: number;
    customer_name: string;
    rating: number;
    title: string | null;
    content: string;
    created_at: Date;
  }>(
    `SELECT 
      id, 
      product_id, 
      COALESCE(reviewer_name, 'לקוח מאומת') as customer_name, 
      rating, 
      title, 
      review_text as content, 
      created_at
     FROM product_reviews
     WHERE product_id = $1 AND is_approved = true AND is_published = true
     ORDER BY created_at DESC`,
    [productId]
  );

  let averageRating = 0;
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    averageRating = sum / reviews.length;
  }

  console.log(`  ✅ [loadProductReviewsData] Loaded ${reviews.length} reviews in ${Date.now() - startTime}ms`);
  return {
    reviews,
    average_rating: averageRating,
    total_reviews: reviews.length,
  };
}

interface RelatedProductsData {
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
 * טוען מוצרים קשורים עבור RelatedProductsSection בשרת
 */
export async function loadRelatedProductsData(
  productId: number,
  storeId: number,
  limit: number = 4
): Promise<RelatedProductsData> {
  const startTime = Date.now();
  console.log(`  🔗 [loadRelatedProductsData] Loading ${limit} related products for product ${productId}`);
  // Get current product details
  const product = await queryOne<{
    id: number;
    vendor: string;
    product_type: string;
  }>(
    `SELECT p.id, p.vendor, p.product_type
     FROM products p
     WHERE p.id = $1 AND p.store_id = $2`,
    [productId, storeId]
  );

  if (!product) {
    return { products: [] };
  }

  // Get collection IDs for this product
  const collectionResult = await query<{ collection_id: number }>(
    'SELECT collection_id FROM product_collection_map WHERE product_id = $1',
    [productId]
  );
  const collectionIds = collectionResult.map(r => r.collection_id);

  const seenIds = new Set<number>([productId]);
  const relatedProducts: any[] = [];

  const addUniqueProducts = (products: any[]) => {
    for (const p of products) {
      if (!seenIds.has(p.id) && relatedProducts.length < limit) {
        seenIds.add(p.id);
        relatedProducts.push(p);
      }
    }
  };

  // Try to get products from same collections first
  if (collectionIds.length > 0 && relatedProducts.length < limit) {
    const sameCollectionProducts = await query<{
      id: number;
      title: string;
      handle: string;
      vendor: string | null;
      product_type: string | null;
      price: number;
      compare_at_price: number | null;
      availability: string;
      inventory_qty: number;
      rating: number;
      image: string | null;
    }>(
      `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
              pv.price, pv.compare_at_price,
              p.availability, COALESCE(pv.inventory_quantity, 0) as inventory_qty,
              COALESCE((
                SELECT AVG(rating)::numeric(3,1)
                FROM product_reviews
                WHERE product_id = p.id AND is_approved = true AND is_published = true
              ), 0) as rating,
              (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
       WHERE p.store_id = $1 
         AND p.id != $2
         AND p.status = 'active'
         AND (p.availability = 'in_stock' OR p.availability = 'preorder' OR p.availability = 'backorder')
         AND p.id IN (SELECT product_id FROM product_collection_map WHERE collection_id = ANY($3::int[]))
       ORDER BY RANDOM()
       LIMIT $4`,
      [storeId, productId, collectionIds, limit * 2]
    );
    addUniqueProducts(sameCollectionProducts);
  }

  // If not enough, add products from same vendor
  if (relatedProducts.length < limit && product.vendor) {
    const sameVendorProducts = await query<{
      id: number;
      title: string;
      handle: string;
      vendor: string | null;
      product_type: string | null;
      price: number;
      compare_at_price: number | null;
      availability: string;
      inventory_qty: number;
      rating: number;
      image: string | null;
    }>(
      `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
              pv.price, pv.compare_at_price,
              p.availability, COALESCE(pv.inventory_quantity, 0) as inventory_qty,
              COALESCE((
                SELECT AVG(rating)::numeric(3,1)
                FROM product_reviews
                WHERE product_id = p.id AND is_approved = true AND is_published = true
              ), 0) as rating,
              (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
       WHERE p.store_id = $1 
         AND p.id != $2
         AND p.status = 'active'
         AND (p.availability = 'in_stock' OR p.availability = 'preorder' OR p.availability = 'backorder')
         AND p.vendor = $3
       ORDER BY RANDOM()
       LIMIT $4`,
      [storeId, productId, product.vendor, limit * 2]
    );
    addUniqueProducts(sameVendorProducts);
  }

  // If still not enough, add products from same product type
  if (relatedProducts.length < limit && product.product_type) {
    const sameTypeProducts = await query<{
      id: number;
      title: string;
      handle: string;
      vendor: string | null;
      product_type: string | null;
      price: number;
      compare_at_price: number | null;
      availability: string;
      inventory_qty: number;
      rating: number;
      image: string | null;
    }>(
      `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
              pv.price, pv.compare_at_price,
              p.availability, COALESCE(pv.inventory_quantity, 0) as inventory_qty,
              COALESCE((
                SELECT AVG(rating)::numeric(3,1)
                FROM product_reviews
                WHERE product_id = p.id AND is_approved = true AND is_published = true
              ), 0) as rating,
              (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
       WHERE p.store_id = $1 
         AND p.id != $2
         AND p.status = 'active'
         AND (p.availability = 'in_stock' OR p.availability = 'preorder' OR p.availability = 'backorder')
         AND p.product_type = $3
       ORDER BY RANDOM()
       LIMIT $4`,
      [storeId, productId, product.product_type, limit * 2]
    );
    addUniqueProducts(sameTypeProducts);
  }

  // If still not enough, fill with random products from same store
  if (relatedProducts.length < limit) {
    const randomProducts = await query<{
      id: number;
      title: string;
      handle: string;
      vendor: string | null;
      product_type: string | null;
      price: number;
      compare_at_price: number | null;
      availability: string;
      inventory_qty: number;
      rating: number;
      image: string | null;
    }>(
      `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
              pv.price, pv.compare_at_price,
              p.availability, COALESCE(pv.inventory_quantity, 0) as inventory_qty,
              COALESCE((
                SELECT AVG(rating)::numeric(3,1)
                FROM product_reviews
                WHERE product_id = p.id AND is_approved = true AND is_published = true
              ), 0) as rating,
              (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
       WHERE p.store_id = $1 
         AND p.id != $2
         AND p.status = 'active'
         AND (p.availability = 'in_stock' OR p.availability = 'preorder' OR p.availability = 'backorder')
       ORDER BY RANDOM()
       LIMIT $3`,
      [storeId, productId, limit * 2]
    );
    addUniqueProducts(randomProducts);
  }

  // Load ratings and reviews count for all products
  if (relatedProducts.length > 0) {
    const productIds = relatedProducts.map(p => p.id);
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

    // Format products with ratings
    const formattedProducts = relatedProducts.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.image,
      price: p.price ? Number(p.price) : 0,
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      vendor: p.vendor || undefined,
      available: p.inventory_qty ? Number(p.inventory_qty) : 0,
      rating: ratingsMap.get(p.id)?.rating || (p.rating ? Number(p.rating) : null),
      reviews_count: ratingsMap.get(p.id)?.reviews_count || 0,
    }));

    console.log(`  ✅ [loadRelatedProductsData] Loaded ${formattedProducts.length} related products in ${Date.now() - startTime}ms`);
    return { products: formattedProducts };
  }

  console.log(`  ⚠️ [loadRelatedProductsData] No related products found in ${Date.now() - startTime}ms`);
  return { products: [] };
}

interface RecentlyViewedData {
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
 * טוען מוצרים פופולריים עבור RecentlyViewedSection בשרת
 * (במקום מוצרים שנצפו לאחרונה שדורשים localStorage)
 */
export async function loadRecentlyViewedData(
  storeId: number,
  excludeProductId: number,
  limit: number = 4
): Promise<RecentlyViewedData> {
  const startTime = Date.now();
  console.log(`  👁️ [loadRecentlyViewedData] Loading ${limit} popular products (excluding ${excludeProductId})`);
  // Load popular products (most viewed or best selling) instead of recently viewed
  // since recently viewed requires localStorage which is client-side only
  const products = await query<{
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
      (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image,
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
    WHERE p.store_id = $1 
      AND p.id != $2
      AND p.status = 'active'
      AND (p.availability = 'in_stock' OR p.availability = 'preorder' OR p.availability = 'backorder')
    ORDER BY p.created_at DESC
    LIMIT $3`,
    [storeId, excludeProductId, limit]
  );

  const formattedProducts = products.map(p => ({
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
  console.log(`  ✅ [loadRecentlyViewedData] Loaded ${formattedProducts.length} products in ${Date.now() - startTime}ms`);
  return { products: formattedProducts };
}

