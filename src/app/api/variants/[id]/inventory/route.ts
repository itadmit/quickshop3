import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

/**
 * GET /api/variants/[id]/inventory
 * בדיקת מלאי זמין של variant
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
      const variant = await queryOne<{ inventory_quantity: number }>(
        `SELECT inventory_quantity 
         FROM product_variants 
         WHERE id = $1`,
        [variantId]
      );

      return NextResponse.json({
        variant_id: variantId,
        available: variant?.inventory_quantity || 0,
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

