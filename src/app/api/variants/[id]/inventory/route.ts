import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

/**
 * GET /api/variants/[id]/inventory
 * בדיקת מלאי זמין של variant
 * Public API - אבל בודק שהמוצר שייך לחנות הנכונה דרך variant_id -> product_id -> store_id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variantId = parseInt(id);

    if (isNaN(variantId) || variantId <= 0) {
      return NextResponse.json(
        { error: 'Invalid variant ID' },
        { status: 400 }
      );
    }

    // Get variant with product and store info to verify multi-tenancy
    const variantWithStore = await queryOne<{ 
      inventory_quantity: number | null;
      store_id: number;
    }>(
      `SELECT pv.inventory_quantity, p.store_id
       FROM product_variants pv
       INNER JOIN products p ON pv.product_id = p.id
       WHERE pv.id = $1`,
      [variantId]
    );

    if (!variantWithStore) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // בדיקת מלאי מה-variant_inventory
    const inventory = await queryOne<{ available: number; committed: number }>(
      `SELECT available, committed 
       FROM variant_inventory 
       WHERE variant_id = $1 
       LIMIT 1`,
      [variantId]
    );

    // אם אין רשומה ב-variant_inventory, בדוק מה-product_variants
    if (!inventory) {
      return NextResponse.json({
        variant_id: variantId,
        available: variantWithStore.inventory_quantity || 0,
        committed: 0,
      });
    }

    return NextResponse.json({
      variant_id: variantId,
      available: inventory.available || 0,
      committed: inventory.committed || 0,
    });
  } catch (error: any) {
    console.error('Error fetching variant inventory:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בבדיקת מלאי' },
      { status: 500 }
    );
  }
}

