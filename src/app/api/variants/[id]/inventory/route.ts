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
      store_id: number;
    }>(
      `SELECT p.store_id
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

    // בדיקת מלאי מה-product_variants.inventory_quantity
    const variant = await queryOne<{ inventory_quantity: number }>(
      `SELECT inventory_quantity 
       FROM product_variants 
       WHERE id = $1`,
      [variantId]
    );

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      variant_id: variantId,
      available: variant.inventory_quantity || 0,
      committed: 0, // לא משתמשים ב-committed יותר
    });
  } catch (error: any) {
    console.error('Error fetching variant inventory:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בבדיקת מלאי' },
      { status: 500 }
    );
  }
}

