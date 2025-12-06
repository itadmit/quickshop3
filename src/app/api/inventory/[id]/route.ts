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
    const inventoryId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();
    const { available, committed, location_id } = body;

    // Get existing inventory
    const existingInventory = await queryOne(
      `SELECT vi.*, p.store_id 
       FROM variant_inventory vi
       INNER JOIN product_variants pv ON pv.id = vi.variant_id
       INNER JOIN products p ON p.id = pv.product_id
       WHERE vi.id = $1 AND p.store_id = $2`,
      [inventoryId, storeId]
    );

    if (!existingInventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (available !== undefined) {
      updates.push(`available = $${paramIndex}`);
      values.push(available);
      paramIndex++;
    }

    if (committed !== undefined) {
      updates.push(`committed = $${paramIndex}`);
      values.push(committed);
      paramIndex++;
    }

    if (location_id !== undefined) {
      updates.push(`location_id = $${paramIndex}`);
      values.push(location_id);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(quickshopItem('inventory', existingInventory));
    }

    updates.push(`updated_at = now()`);
    values.push(inventoryId);

    const inventory = await queryOne(
      `UPDATE variant_inventory 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    // Check for low stock
    if (available !== undefined && available < 10) {
      await eventBus.emitEvent('inventory.low_stock', {
        inventory: inventory,
        variant_id: inventory.variant_id,
        available: available,
      }, {
        store_id: storeId,
        source: 'api',
        user_id: user.id,
      });
    }

    await eventBus.emitEvent('inventory.updated', {
      inventory: inventory,
      variant_id: inventory.variant_id,
      available: inventory.available,
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

