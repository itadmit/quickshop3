import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Product, ProductWithDetails, ProductImage, ProductVariant, ProductOption } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const idsParam = searchParams.get('ids'); // Comma-separated product IDs
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let sql = `
      SELECT p.* FROM products p
      WHERE p.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      // Search in title, handle, AND SKU from product_variants
      sql += ` AND (p.title ILIKE $${paramIndex} OR p.handle ILIKE $${paramIndex} OR EXISTS (
        SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.sku IS NOT NULL AND pv.sku ILIKE $${paramIndex}
      ))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (categoryId && categoryId !== 'all') {
      sql += ` AND EXISTS (
        SELECT 1 FROM product_collection_map pcm 
        WHERE pcm.product_id = p.id AND pcm.collection_id = $${paramIndex}
      )`;
      params.push(parseInt(categoryId));
      paramIndex++;
    }

    if (idsParam) {
      const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        sql += ` AND p.id = ANY($${paramIndex}::int[])`;
        params.push(ids);
        paramIndex++;
      }
    }

    // Build ORDER BY clause
    let orderBy = 'p.created_at';
    if (sortBy === 'title') {
      orderBy = 'p.title';
    } else if (sortBy === 'price') {
      orderBy = `(SELECT MIN(CAST(price AS DECIMAL)) FROM product_variants WHERE product_id = p.id)`;
    } else if (sortBy === 'created_at') {
      orderBy = 'p.created_at';
    }

    sql += ` ORDER BY ${orderBy} ${sortOrder.toUpperCase()} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const products = await query<Product>(sql, params);

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM products p WHERE p.store_id = $1`;
    const countParams: any[] = [storeId];
    let countParamIndex = 2;

    if (status && status !== 'all') {
      countSql += ` AND p.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (search) {
      // Search in title, handle, AND SKU from product_variants
      countSql += ` AND (p.title ILIKE $${countParamIndex} OR p.handle ILIKE $${countParamIndex} OR EXISTS (
        SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.sku IS NOT NULL AND pv.sku ILIKE $${countParamIndex}
      ))`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (categoryId && categoryId !== 'all') {
      countSql += ` AND EXISTS (
        SELECT 1 FROM product_collection_map pcm 
        WHERE pcm.product_id = p.id AND pcm.collection_id = $${countParamIndex}
      )`;
      countParams.push(parseInt(categoryId));
      countParamIndex++;
    }

    if (idsParam) {
      const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        countSql += ` AND p.id = ANY($${countParamIndex}::int[])`;
        countParams.push(ids);
        countParamIndex++;
      }
    }

    const totalResult = await queryOne<{ total: string }>(countSql, countParams);
    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Get images, variants, options, and collections for each product
    const productsWithDetails: ProductWithDetails[] = await Promise.all(
      products.map(async (product) => {
        const [images, variants, rawOptions, collections] = await Promise.all([
          query<ProductImage>(
            'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position',
            [product.id]
          ),
          query<ProductVariant>(
            'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY position',
            [product.id]
          ),
          // Use same format as single product API - get options with values in one query
          query<ProductOption & { values: any }>(
            `SELECT po.id, po.product_id, po.name, po.type, po.position, po.created_at,
             COALESCE(
               (SELECT json_agg(json_build_object('id', pov.id, 'value', pov.value, 'position', pov.position, 'metadata', pov.metadata) ORDER BY pov.position)
                FROM product_option_values pov WHERE pov.option_id = po.id),
               '[]'::json
             ) as values
             FROM product_options po WHERE po.product_id = $1 ORDER BY po.position`,
            [product.id]
          ),
          query<{ id: number; title: string; handle: string }>(
            `SELECT c.id, c.title, c.handle 
             FROM product_collections c
             INNER JOIN product_collection_map pcm ON pcm.collection_id = c.id
             WHERE pcm.product_id = $1
             ORDER BY pcm.position`,
            [product.id]
          ),
        ]);

        // Parse values if they come as string from PostgreSQL and normalize format
        const options = rawOptions.map(option => {
          let values = option.values;
          
          // If values is a string, parse it (PostgreSQL json_agg returns as string)
          if (typeof values === 'string') {
            try {
              values = JSON.parse(values);
            } catch {
              values = [];
            }
          }
          
          // Ensure values is an array
          if (!Array.isArray(values)) {
            values = values ? [values] : [];
          }
          
          // Extract just the value property from each item if it's an object
          // Handle nested JSON strings (double-encoded or more)
          const extractValueRecursively = (val: any, depth = 0): string => {
            // Prevent infinite recursion
            if (depth > 5) return '';
            
            if (!val) return '';
            if (typeof val === 'number') return String(val);
            if (typeof val === 'string') {
              // If it's a JSON string, try to parse it recursively
              if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
                try {
                  const parsed = JSON.parse(val);
                  // If parsed is an object with a 'value' property, recurse
                  if (parsed && typeof parsed === 'object' && parsed.value !== undefined) {
                    return extractValueRecursively(parsed.value, depth + 1);
                  }
                  // If parsed is an object but no 'value', try to find it
                  if (parsed && typeof parsed === 'object') {
                    return extractValueRecursively(parsed.value || parsed.label || parsed.name || val, depth + 1);
                  }
                  return String(parsed);
                } catch {
                  // Not valid JSON, return as-is
                  return val;
                }
              }
              return val;
            }
            if (val && typeof val === 'object') {
              // If object has a 'value' property, recurse on it
              if (val.value !== undefined) {
                return extractValueRecursively(val.value, depth + 1);
              }
              // Try other common property names
              return extractValueRecursively(val.label || val.name || '', depth + 1);
            }
            return '';
          };
          
          const normalizedValues = values
            .map(extractValueRecursively)
            .filter(Boolean)
            .filter((v, idx, arr) => arr.indexOf(v) === idx); // Remove duplicates
          
          return { ...option, values: normalizedValues };
        });

        return {
          ...product,
          images,
          variants,
          options,
          collections: collections as any,
        };
      })
    );

    return NextResponse.json({ 
      products: productsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;

    const sql = `
      INSERT INTO products (
        store_id, title, handle, body_html, vendor, product_type,
        status, published_at, archived_at, published_scope, sell_when_sold_out, sold_by_weight,
        show_price_per_100ml, price_per_100ml, availability, available_date,
        track_inventory, low_stock_alert, seo_title, seo_description,
        video_url, length, width, height, exclusive_to_tiers, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, now(), now())
      RETURNING *
    `;

    // Generate unique slug if not provided
    const handle = body.handle || await generateUniqueSlug(body.title, 'products', storeId);

    // Handle exclusive_to_tiers - convert array to JSONB or null
    let exclusiveToTiers = null;
    if (body.exclusive_to_tier && Array.isArray(body.exclusive_to_tier) && body.exclusive_to_tier.length > 0) {
      exclusiveToTiers = JSON.stringify(body.exclusive_to_tier);
    }

    const product = await queryOne<Product>(sql, [
      storeId,
      body.title,
      handle,
      body.body_html || null,
      body.vendor || null,
      body.product_type || null,
      body.status || 'active',
      body.published_at || null,
      body.archived_at || null,
      body.published_scope || 'web',
      body.sell_when_sold_out || false,
      body.sold_by_weight || false,
      body.show_price_per_100ml || false,
      body.price_per_100ml || null,
      body.availability || 'IN_STOCK',
      body.available_date || null,
      body.track_inventory !== false,
      body.low_stock_alert || null,
      body.seo_title || null,
      body.seo_description || null,
      body.video_url || null,
      body.length || null,
      body.width || null,
      body.height || null,
      exclusiveToTiers,
    ]);

    if (!product) {
      throw new Error('Failed to create product');
    }

    // Emit product.created event
    await eventBus.emitEvent('product.created', { product }, {
      store_id: storeId,
      source: 'api',
    });

    // Emit product.published event if status is 'active'
    if (product.status === 'active') {
      await eventBus.emitEvent('product.published', { product }, {
        store_id: storeId,
        source: 'api',
      });
    }

    // Handle images if provided
    if (body.images && Array.isArray(body.images)) {
      for (let i = 0; i < body.images.length; i++) {
        const image = body.images[i];
        await query(
          `INSERT INTO product_images (product_id, position, src, alt, created_at, updated_at)
           VALUES ($1, $2, $3, $4, now(), now())`,
          [product.id, i + 1, image.src || image, image.alt || null]
        );
      }
    }

    // Handle default variant if no variants exist (for SKU, price, etc.)
    const hasVariants = body.variants && Array.isArray(body.variants) && body.variants.length > 0;
    if (!hasVariants) {
      // Create default variant with SKU, price, etc.
      await query(
        `INSERT INTO product_variants (
          product_id, title, price, compare_at_price, sku, taxable,
          inventory_quantity, position, inventory_policy, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
        [
          product.id,
          'Default Title',
          body.price || '0.00',
          body.compare_at_price || null,
          body.sku || null,
          body.taxable !== false,
          body.inventory_quantity || 0,
          1,
          'deny',
        ]
      );
    }

    // Handle collections if provided
    if (body.collections && Array.isArray(body.collections)) {
      for (const collectionId of body.collections) {
        if (typeof collectionId === 'number') {
          // Get max position for this collection
          const maxPosition = await queryOne<{ max_position: number }>(
            'SELECT COALESCE(MAX(position), 0) as max_position FROM product_collection_map WHERE collection_id = $1',
            [collectionId]
          );

          await query(
            `INSERT INTO product_collection_map (product_id, collection_id, position)
             VALUES ($1, $2, $3)`,
            [product.id, collectionId, (maxPosition?.max_position || 0) + 1]
          );
        }
      }
    }

    // Handle tags if provided
    if (body.tags && Array.isArray(body.tags)) {
      for (const tagName of body.tags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          // Find or create tag
          let tag = await queryOne<{ id: number }>(
            'SELECT id FROM product_tags WHERE store_id = $1 AND name = $2',
            [storeId, tagName.trim()]
          );

          if (!tag) {
            // Create new tag
            const newTag = await queryOne<{ id: number }>(
              `INSERT INTO product_tags (store_id, name, created_at)
               VALUES ($1, $2, now())
               RETURNING id`,
              [storeId, tagName.trim()]
            );
            tag = newTag;
          }

          if (tag) {
            await query(
              'INSERT INTO product_tag_map (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [product.id, tag.id]
            );
          }
        }
      }
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

