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
    const { updates } = body; // Array of { variant_id, available, reason }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    const results = [];

    for (const update of updates) {
      const { variant_id, available, reason } = update;

      if (!variant_id || available === undefined) {
        continue;
      }

      // Verify variant belongs to store
      const existingVariant = await queryOne(
        `SELECT pv.*, p.store_id 
         FROM product_variants pv
         INNER JOIN products p ON p.id = pv.product_id
         WHERE pv.id = $1 AND p.store_id = $2`,
        [variant_id, user.store_id]
      );

      if (!existingVariant) {
        results.push({ variant_id, success: false, error: 'Not found' });
        continue;
      }

      try {
        const oldQuantity = existingVariant.inventory_quantity || 0;
        const change = available - oldQuantity;

        const updated = await queryOne(
          `UPDATE product_variants 
           SET inventory_quantity = $1, updated_at = now()
           WHERE id = $2
           RETURNING *`,
          [available, variant_id]
        );

        // Save inventory history directly to system_logs
        await query(
          `INSERT INTO system_logs (store_id, level, source, message, context)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            user.store_id,
            'info',
            'inventory',
            `עדכון מלאי: ${change > 0 ? '+' : ''}${change} יחידות (${oldQuantity} → ${available})${reason ? ` - ${reason}` : ''}`,
            JSON.stringify({
              variant_id: variant_id,
              old_quantity: oldQuantity,
              new_quantity: available,
              change: change,
              reason: reason || 'bulk_update',
              user_id: user.id,
            })
          ]
        );

        // Emit event
        await eventBus.emitEvent('inventory.updated', {
          variant_id: variant_id,
          quantity: available,
          old_quantity: oldQuantity,
          change: change,
          reason: reason || 'bulk_update',
        }, {
          store_id: user.store_id,
          source: 'inventory',
          user_id: user.id,
        });

        results.push({ variant_id, success: true, inventory: {
          id: updated.id,
          variant_id: updated.id,
          available: updated.inventory_quantity || 0,
        } });
      } catch (error: any) {
        results.push({ variant_id, success: false, error: error.message });
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

