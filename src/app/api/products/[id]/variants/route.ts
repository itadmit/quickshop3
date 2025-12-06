import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ProductVariant } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/products/[id]/variants - Create variant
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
    const body = await request.json();

    // Verify product exists and belongs to user's store
    const product = await queryOne<{ store_id: number }>(
      'SELECT store_id FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get max position for this product
    const maxPosition = await queryOne<{ max: number }>(
      'SELECT COALESCE(MAX(position), 0) as max FROM product_variants WHERE product_id = $1',
      [productId]
    );

    const sql = `
      INSERT INTO product_variants (
        product_id, title, price, compare_at_price, sku, barcode,
        position, inventory_quantity, inventory_policy, inventory_management,
        weight, weight_unit, requires_shipping, taxable,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now(), now())
      RETURNING *
    `;

    const variant = await queryOne<ProductVariant>(sql, [
      productId,
      body.title || 'Default Title',
      body.price || '0.00',
      body.compare_at_price || null,
      body.sku || null,
      body.barcode || null,
      (maxPosition?.max || 0) + 1,
      body.inventory_quantity || 0,
      body.inventory_policy || 'deny',
      body.inventory_management || null,
      body.weight || null,
      body.weight_unit || 'kg',
      body.requires_shipping !== false,
      body.taxable !== false,
    ]);

    if (!variant) {
      throw new Error('Failed to create variant');
    }

    // Emit variant.created event
    await eventBus.emitEvent('variant.created', { variant }, {
      store_id: product.store_id,
      source: 'api',
    });

    return NextResponse.json(quickshopItem('variant', variant), { status: 201 });
  } catch (error: any) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create variant' },
      { status: 500 }
    );
  }
}

