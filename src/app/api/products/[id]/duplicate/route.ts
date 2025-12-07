import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/products/[id]/duplicate - Duplicate a product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    // Get original product - verify it belongs to user's store
    const originalProduct = await queryOne<{
      id: number;
      store_id: number;
      title: string;
      handle: string;
      body_html: string | null;
      vendor: string | null;
      product_type: string | null;
      status: string;
      published_scope: string;
    }>(
      'SELECT * FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
    );

    if (!originalProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Generate unique handle
    const newTitle = `${originalProduct.title} (עותק)`;
    const uniqueHandle = await generateUniqueSlug(
      newTitle,
      'products',
      originalProduct.store_id
    );

    // Create duplicate product
    const duplicatedProduct = await queryOne<{ id: number }>(
      `INSERT INTO products (store_id, title, handle, body_html, vendor, product_type, status, published_scope, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
       RETURNING id`,
      [
        originalProduct.store_id,
        newTitle,
        uniqueHandle,
        originalProduct.body_html,
        originalProduct.vendor,
        originalProduct.product_type,
        'draft', // Always duplicate as draft
        originalProduct.published_scope,
      ]
    );

    if (!duplicatedProduct) {
      return NextResponse.json(
        { error: 'Failed to duplicate product' },
        { status: 500 }
      );
    }

    const newProductId = duplicatedProduct.id;

    // Duplicate images
    const images = await query<{ id: number; position: number; src: string; alt: string | null }>(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position',
      [productId]
    );
    for (const image of images) {
      await query(
        `INSERT INTO product_images (product_id, position, src, alt, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())`,
        [newProductId, image.position, image.src, image.alt]
      );
    }

    // Duplicate options and option values
    const options = await query<{ id: number; name: string; position: number }>(
      'SELECT * FROM product_options WHERE product_id = $1 ORDER BY position',
      [productId]
    );
    for (const option of options) {
      const newOption = await queryOne<{ id: number }>(
        `INSERT INTO product_options (product_id, name, position, created_at)
         VALUES ($1, $2, $3, now())
         RETURNING id`,
        [newProductId, option.name, option.position]
      );

      if (newOption) {
        const optionValues = await query<{ value: string; position: number }>(
          'SELECT * FROM product_option_values WHERE option_id = $1 ORDER BY position',
          [option.id]
        );
        for (const value of optionValues) {
          await query(
            `INSERT INTO product_option_values (option_id, value, position, created_at)
             VALUES ($1, $2, $3, now())`,
            [newOption.id, value.value, value.position]
          );
        }
      }
    }

    // Duplicate variants
    const variants = await query<{
      id: number;
      price: string;
      compare_at_price: string | null;
      sku: string | null;
      taxable: boolean;
      inventory_quantity: number;
      option1: string | null;
      option2: string | null;
      option3: string | null;
      weight: number | null;
      position: number;
    }>(
      'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY position',
      [productId]
    );
    for (const variant of variants) {
      await queryOne<{ id: number }>(
        `INSERT INTO product_variants (product_id, price, compare_at_price, sku, taxable, inventory_quantity, option1, option2, option3, weight, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
         RETURNING id`,
        [
          newProductId,
          variant.price,
          variant.compare_at_price,
          variant.sku ? `${variant.sku}-copy` : null,
          variant.taxable,
          variant.inventory_quantity || 0,
          variant.option1,
          variant.option2,
          variant.option3,
          variant.weight,
          variant.position,
        ]
      );
    }

    // Duplicate collections
    const collections = await query<{ collection_id: number }>(
      'SELECT collection_id FROM product_collection_map WHERE product_id = $1',
      [productId]
    );
    for (const collection of collections) {
      await query(
        'INSERT INTO product_collection_map (product_id, collection_id, position) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING',
        [newProductId, collection.collection_id]
      );
    }

    // Duplicate tags
    const tags = await query<{ tag_id: number }>(
      'SELECT tag_id FROM product_tag_map WHERE product_id = $1',
      [productId]
    );
    for (const tag of tags) {
      await query(
        'INSERT INTO product_tag_map (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [newProductId, tag.tag_id]
      );
    }

    // Get the full duplicated product
    const fullProduct = await queryOne<{ id: number; title: string; handle: string }>(
      'SELECT id, title, handle FROM products WHERE id = $1',
      [newProductId]
    );

    // Emit event
    await eventBus.emitEvent('product.created', { product: { id: newProductId } }, {
      store_id: originalProduct.store_id,
      source: 'api',
    });

    return NextResponse.json({
      success: true,
      product: fullProduct,
      message: 'Product duplicated successfully',
    });
  } catch (error: any) {
    console.error('Error duplicating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to duplicate product' },
      { status: 500 }
    );
  }
}

