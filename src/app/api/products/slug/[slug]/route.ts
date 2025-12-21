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
    const [images, variantsRaw, rawOptions] = await Promise.all([
      query<ProductImage>(
        'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position',
        [productId]
      ),
      query<ProductVariant>(
        'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY position',
        [productId]
      ),
      query<ProductOption & { values: any }>(
        `SELECT po.*, 
         COALESCE(
           (SELECT json_agg(json_build_object('id', pov.id, 'value', pov.value, 'position', pov.position, 'metadata', pov.metadata) ORDER BY pov.position)
            FROM product_option_values pov WHERE pov.option_id = po.id),
           '[]'::json
         ) as values
         FROM product_options po WHERE po.product_id = $1 ORDER BY po.position`,
        [productId]
      ),
    ]);

    // המלאי כבר נמצא ב-product_variants.inventory_quantity
    const variants = variantsRaw;

    // Parse and normalize option values (handle nested JSON strings)
    const extractValueRecursively = (val: any, depth = 0): string => {
      if (depth > 5) return ''; // Prevent infinite recursion
      if (!val) return '';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'string') {
        if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed === 'object' && parsed.value !== undefined) {
              return extractValueRecursively(parsed.value, depth + 1);
            }
            if (parsed && typeof parsed === 'object') {
              return extractValueRecursively(parsed.value || parsed.label || parsed.name || val, depth + 1);
            }
            return String(parsed);
          } catch {
            return val;
          }
        }
        return val;
      }
      if (val && typeof val === 'object') {
        if (val.value !== undefined) {
          return extractValueRecursively(val.value, depth + 1);
        }
        return extractValueRecursively(val.label || val.name || '', depth + 1);
      }
      return '';
    };

    const options = rawOptions.map(option => {
      let values = option.values;
      
      // Parse if string
      if (typeof values === 'string') {
        try {
          values = JSON.parse(values);
        } catch {
          values = [];
        }
      }
      
      // Ensure array
      if (!Array.isArray(values)) {
        values = values ? [values] : [];
      }
      
      // Normalize values - extract actual value strings
      const normalizedValues = values.map((v: any) => {
        const extractedValue = extractValueRecursively(v);
        // Return as object with id, value, position for compatibility
        return {
          id: v.id || (typeof v === 'object' && v.id ? v.id : Date.now()),
          value: extractedValue,
          position: v.position || 1,
          metadata: v.metadata || {},
        };
      }).filter((v: any) => v.value); // Filter out empty values
      
      return { ...option, values: normalizedValues };
    });

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

