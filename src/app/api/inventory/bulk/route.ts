import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/inventory/bulk - Bulk update inventory
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body; // Array of { inventory_id, available, reason }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    const results = [];

    for (const update of updates) {
      const { inventory_id, available, reason } = update;

      if (!inventory_id || available === undefined) {
        continue;
      }

      // Verify inventory belongs to store
      const existingInventory = await queryOne(
        `SELECT vi.*, p.store_id 
         FROM variant_inventory vi
         INNER JOIN product_variants pv ON pv.id = vi.variant_id
         INNER JOIN products p ON p.id = pv.product_id
         WHERE vi.id = $1 AND p.store_id = $2`,
        [inventory_id, user.store_id]
      );

      if (!existingInventory) {
        results.push({ inventory_id, success: false, error: 'Not found' });
        continue;
      }

      try {
        const updated = await queryOne(
          `UPDATE variant_inventory 
           SET available = $1, updated_at = now()
           WHERE id = $2
           RETURNING *`,
          [available, inventory_id]
        );

        // Emit event
        await eventBus.emitEvent('inventory.updated', {
          inventory: updated,
          variant_id: updated.variant_id,
          available: updated.available,
          reason,
        }, {
          store_id: user.store_id,
          source: 'api',
          user_id: user.id,
        });

        results.push({ inventory_id, success: true, inventory: updated });
      } catch (error: any) {
        results.push({ inventory_id, success: false, error: error.message });
      }
    }

    return NextResponse.json(quickshopList('results', results));
  } catch (error: any) {
    console.error('Error bulk updating inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk update inventory' },
      { status: 500 }
    );
  }
}

