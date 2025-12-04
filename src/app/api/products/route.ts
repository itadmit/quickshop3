import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Product, ProductWithDetails, ProductImage, ProductVariant, ProductOption } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { generateUniqueSlug } from '@/lib/utils/slug';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('store_id') || '1'; // TODO: Get from auth
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT * FROM products 
      WHERE store_id = $1
    `;
    const params: any[] = [storeId];

    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const products = await query<Product>(sql, params);

    // Get images and variants for each product
    const productsWithDetails: ProductWithDetails[] = await Promise.all(
      products.map(async (product) => {
        const [images, variants, options] = await Promise.all([
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
        ]);

        return {
          ...product,
          images,
          variants,
          options,
        };
      })
    );

    return NextResponse.json({ products: productsWithDetails });
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
    const body = await request.json();
    const storeId = body.store_id || 1; // TODO: Get from auth

    const sql = `
      INSERT INTO products (
        store_id, title, handle, body_html, vendor, product_type,
        status, published_scope, sell_when_sold_out, sold_by_weight,
        show_price_per_100ml, price_per_100ml, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
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
          position, inventory_policy, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
        [
          product.id,
          'Default Title',
          body.price || '0.00',
          body.compare_at_price || null,
          body.sku || null,
          body.taxable !== false,
          1,
          'deny',
        ]
      );

      // Handle inventory if enabled
      if (body.track_inventory !== false && body.inventory_quantity !== undefined) {
        const variant = await queryOne<{ id: number }>(
          'SELECT id FROM product_variants WHERE product_id = $1 ORDER BY position LIMIT 1',
          [product.id]
        );
        if (variant) {
          const existingInventory = await queryOne<{ id: number }>(
            'SELECT id FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
            [variant.id]
          );
          
          if (existingInventory) {
            await query(
              `UPDATE variant_inventory SET available = $1, updated_at = now() WHERE variant_id = $2`,
              [body.inventory_quantity || 0, variant.id]
            );
          } else {
            await query(
              `INSERT INTO variant_inventory (variant_id, available, committed, created_at, updated_at)
               VALUES ($1, $2, $3, now(), now())`,
              [variant.id, body.inventory_quantity || 0, 0]
            );
          }
        }
      }
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

