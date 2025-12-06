import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

/**
 * GET /api/variants/[id]/options
 * קבלת אפשרויות (options) של variant עם שמות האפשרויות
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

    // קבלת variant עם option1, option2, option3 ו-store_id לבדיקת multi-tenancy
    const variant = await queryOne<{
      product_id: number;
      option1: string | null;
      option2: string | null;
      option3: string | null;
      store_id: number;
    }>(
      `SELECT pv.product_id, pv.option1, pv.option2, pv.option3, p.store_id
       FROM product_variants pv
       INNER JOIN products p ON pv.product_id = p.id
       WHERE pv.id = $1`,
      [variantId]
    );

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // קבלת שמות האפשרויות מה-product_options
    const options = await query<{
      id: number;
      name: string;
      position: number;
    }>(
      `SELECT id, name, position 
       FROM product_options 
       WHERE product_id = $1 
       ORDER BY position`,
      [variant.product_id]
    );

    // בניית רשימת properties
    const properties: Array<{ name: string; value: string }> = [];
    
    options.forEach((option, index) => {
      let value: string | null = null;
      if (index === 0 && variant.option1) value = variant.option1;
      else if (index === 1 && variant.option2) value = variant.option2;
      else if (index === 2 && variant.option3) value = variant.option3;
      
      if (value) {
        properties.push({
          name: option.name,
          value: value,
        });
      }
    });

    return NextResponse.json({
      variant_id: variantId,
      properties,
    });
  } catch (error: any) {
    console.error('Error fetching variant options:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בקבלת אפשרויות' },
      { status: 500 }
    );
  }
}

