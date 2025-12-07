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
      sql += ` AND (p.title ILIKE $${paramIndex} OR p.handle ILIKE $${paramIndex})`;
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
      countSql += ` AND (p.title ILIKE $${countParamIndex} OR p.handle ILIKE $${countParamIndex})`;
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

    const totalResult = await queryOne<{ total: string }>(countSql, countParams);
    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Get images, variants, options, and collections for each product
    const productsWithDetails: ProductWithDetails[] = await Promise.all(
      products.map(async (product) => {
        const [images, variants, options, collections] = await Promise.all([
          query<ProductImage>(
            'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position',
            [product.id]
          ),
          query<ProductVariant>(
            'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY position',
            [product.id]
          ),
          query<ProductOption>(
            'SELECT * FROM product_options WHERE product_id = $1 ORDER BY position',
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
        status, published_scope, sell_when_sold_out, sold_by_weight,
        show_price_per_100ml, price_per_100ml, availability, available_date,
        track_inventory, low_stock_alert, seo_title, seo_description,
        video_url, weight, length, width, height, price, compare_at_price,
        cost_per_item, sku, taxable, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, now(), now())
      RETURNING *
    `;

    // Generate unique slug if not provided
    const handle = body.handle || await generateUniqueSlug(body.title, 'products', storeId);

    const product = await queryOne<Product>(sql, [
      storeId,
      body.title,
      handle,
      body.body_html || null,
      body.vendor || null,
      body.product_type || null,
      body.status || 'draft',
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
      body.weight || null,
      body.length || null,
      body.width || null,
      body.height || null,
      body.price || 0,
      body.compare_at_price || null,
      body.cost_per_item || null,
      body.sku || null,
      body.taxable !== false,
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

