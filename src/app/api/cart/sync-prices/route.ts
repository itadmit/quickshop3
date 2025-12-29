/**
 * API Route: Sync Cart Prices
 * מעדכן את המחירים בעגלה לפי המחירים העדכניים בשרת
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const variantIds = searchParams.get('variantIds');

    if (!storeId || !variantIds) {
      return NextResponse.json(
        { error: 'storeId and variantIds are required' },
        { status: 400 }
      );
    }

    const variantIdArray = variantIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    if (variantIdArray.length === 0) {
      return NextResponse.json({ prices: {} });
    }

    // שאילתה מהירה לקבלת מחירים עדכניים
    const variants = await query<{ id: number; price: number }>(
      `SELECT id, price 
       FROM product_variants 
       WHERE id = ANY($1::integer[])`,
      [variantIdArray]
    );

    // מיפוי: variant_id -> price
    const prices: { [variantId: number]: number } = {};
    variants.forEach(variant => {
      prices[variant.id] = variant.price;
    });

    return NextResponse.json({ prices });
  } catch (error: any) {
    console.error('[Cart Sync] Error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

