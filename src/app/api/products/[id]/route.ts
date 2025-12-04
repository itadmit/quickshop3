import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Product, ProductWithDetails, ProductImage, ProductVariant, ProductOption } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { generateUniqueSlug } from '@/lib/utils/slug';

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    const product = await queryOne<Product>(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get related data
    const [images, variants, options] = await Promise.all([
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
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    // Get old product for comparison
    const oldProduct = await queryOne<Product>(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (!oldProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Generate unique slug if not provided or if title changed
    let handle = body.handle;
    if (!handle || (body.title && body.title !== oldProduct.title)) {
      handle = await generateUniqueSlug(body.title || oldProduct.title, 'products', oldProduct.store_id, productId);
    }

    const sql = `
      UPDATE products SET
        title = $1,
        handle = $2,
        body_html = $3,
        vendor = $4,
        product_type = $5,
        status = $6,
        published_at = $7,
        updated_at = now()
      WHERE id = $8
      RETURNING *
    `;

    const product = await queryOne<Product>(sql, [
      body.title || oldProduct.title,
      handle,
      body.body_html !== undefined ? body.body_html : oldProduct.body_html,
      body.vendor !== undefined ? body.vendor : oldProduct.vendor,
      body.product_type !== undefined ? body.product_type : oldProduct.product_type,
      body.status || oldProduct.status,
      body.published_at !== undefined ? body.published_at : oldProduct.published_at,
      productId,
    ]);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate changes
    const changes: Record<string, { old: any; new: any }> = {};
    if (oldProduct.title !== product.title) changes.title = { old: oldProduct.title, new: product.title };
    if (oldProduct.status !== product.status) changes.status = { old: oldProduct.status, new: product.status };
    if (oldProduct.body_html !== product.body_html) changes.body_html = { old: oldProduct.body_html, new: product.body_html };

    // Emit product.updated event
    await eventBus.emitEvent('product.updated', {
      product,
      changes,
    }, {
      store_id: product.store_id,
      source: 'api',
    });

    // Emit product.published event if status changed to 'active'
    if (oldProduct.status !== 'active' && product.status === 'active') {
      await eventBus.emitEvent('product.published', { product }, {
        store_id: product.store_id,
        source: 'api',
      });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  ) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    // Get product before deletion for event
    const product = await queryOne<Product>(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await query('DELETE FROM products WHERE id = $1', [productId]);

    // Emit product.deleted event
    await eventBus.emitEvent('product.deleted', { product }, {
      store_id: product.store_id,
      source: 'api',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

