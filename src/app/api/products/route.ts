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
        status, published_scope, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
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

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

