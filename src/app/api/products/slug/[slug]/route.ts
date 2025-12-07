import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Product, ProductWithDetails, ProductImage, ProductVariant, ProductOption } from '@/types/product';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/products/slug/[slug] - Get product by slug (handle)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const storeId = user.store_id;

    // Next.js already decodes the slug from params automatically
    // So slug is already decoded (e.g., "מוצר-בדיקה")
    // But if it's still encoded (double-encoded), decode it again
    let decodedSlug = slug;
    try {
      // Try to decode - if it fails, it's already decoded
      if (slug.includes('%')) {
        decodedSlug = decodeURIComponent(slug);
      }
    } catch {
      // Already decoded, use as is
      decodedSlug = slug;
    }

    const product = await queryOne<Product>(
      'SELECT * FROM products WHERE store_id = $1 AND handle = $2',
      [storeId, decodedSlug]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productId = product.id;

    // Get related data
    const [images, variantsRaw, options] = await Promise.all([
      query<ProductImage>(
        'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position',
        [productId]
      ),
      query<ProductVariant>(
        'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY position',
        [productId]
      ),
      query<ProductOption>(
        `SELECT po.*, 
         (SELECT json_agg(json_build_object('id', pov.id, 'value', pov.value, 'position', pov.position))
          FROM product_option_values pov WHERE pov.option_id = po.id) as values
         FROM product_options po WHERE po.product_id = $1 ORDER BY po.position`,
        [productId]
      ),
    ]);

    // המלאי כבר נמצא ב-product_variants.inventory_quantity
    const variants = variantsRaw;

    // Get collections
    const collections = await query(
      `SELECT pc.* FROM product_collections pc
       INNER JOIN product_collection_map pcm ON pc.id = pcm.collection_id
       WHERE pcm.product_id = $1`,
      [productId]
    );

    // Get tags
    const tags = await query(
      `SELECT pt.* FROM product_tags pt
       INNER JOIN product_tag_map ptm ON pt.id = ptm.tag_id
       WHERE ptm.product_id = $1`,
      [productId]
    );

    const productWithDetails: ProductWithDetails = {
      ...product,
      images,
      variants,
      options,
      collections,
      tags,
    };

    return NextResponse.json({ product: productWithDetails });
  } catch (error: any) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

