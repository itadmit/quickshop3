import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// PUT /api/inventory/:id - Update inventory level
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const variantId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();
    const { available } = body;

    // Get existing variant and verify it belongs to the store
    const existingVariant = await queryOne<{
      id: number;
      product_id: number;
      sku: string | null;
      title: string;
      option1: string | null;
      option2: string | null;
      option3: string | null;
      inventory_quantity: number;
      store_id: number;
      product_title: string;
    }>(
      `SELECT pv.*, p.store_id, p.title as product_title
       FROM product_variants pv
       INNER JOIN products p ON p.id = pv.product_id
       WHERE pv.id = $1 AND p.store_id = $2`,
      [variantId, storeId]
    );

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (available === undefined) {
      return NextResponse.json(quickshopItem('inventory', {
        id: existingVariant.id,
        variant_id: existingVariant.id,
        product_id: existingVariant.product_id,
        sku: existingVariant.sku,
        product_title: existingVariant.product_title,
        variant_title: existingVariant.title,
        option1: existingVariant.option1,
        option2: existingVariant.option2,
        option3: existingVariant.option3,
        available: existingVariant.inventory_quantity || 0,
        committed: 0,
        incoming: 0,
      }));
    }

    // Update inventory quantity on the variant
    const updatedVariant = await queryOne(
      `UPDATE product_variants 
       SET inventory_quantity = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [available, variantId]
    );

    // Get product title for response
    const product = await queryOne(
      `SELECT title FROM products WHERE id = $1`,
      [updatedVariant.product_id]
    );

    const inventory = {
      id: updatedVariant.id,
      variant_id: updatedVariant.id,
      product_id: updatedVariant.product_id,
      sku: updatedVariant.sku,
      product_title: product?.title || '',
      variant_title: updatedVariant.title,
      option1: updatedVariant.option1,
      option2: updatedVariant.option2,
      option3: updatedVariant.option3,
      available: updatedVariant.inventory_quantity || 0,
      committed: 0,
      incoming: 0,
    };

    // Check for low stock
    if (available < 10) {
      await eventBus.emitEvent('inventory.low_stock', {
        variant_id: variantId,
        quantity: available,
      }, {
        store_id: storeId,
        source: 'api',
        user_id: user.id,
      });
    }

    await eventBus.emitEvent('inventory.updated', {
      variant_id: variantId,
      quantity: available,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('inventory', inventory));
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

