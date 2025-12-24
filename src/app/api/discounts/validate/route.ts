import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, storeId, subtotal, totalQuantity } = body;

    // בדיקת תקינות פרמטרים
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { error: 'code is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!storeId || typeof storeId !== 'number') {
      return NextResponse.json(
        { error: 'storeId is required and must be a number' },
        { status: 400 }
      );
    }

    if (subtotal !== undefined && (typeof subtotal !== 'number' || subtotal < 0)) {
      return NextResponse.json(
        { error: 'subtotal must be a non-negative number' },
        { status: 400 }
      );
    }

    const discount = await queryOne<{
      id: number;
      code: string;
      discount_type: string;
      value: string | null;
      minimum_order_amount: string | null;
      maximum_order_amount: string | null;
      minimum_quantity: number | null;
      maximum_quantity: number | null;
      usage_limit: number | null;
      usage_count: number;
      applies_to: string;
      is_active: boolean;
      starts_at: Date | null;
      ends_at: Date | null;
    }>(
      `SELECT 
        id, code, discount_type, value,
        minimum_order_amount, maximum_order_amount,
        minimum_quantity, maximum_quantity,
        usage_limit, usage_count, applies_to, is_active,
        starts_at, ends_at
      FROM discount_codes
      WHERE store_id = $1 AND code = $2 AND is_active = true`,
      [storeId, code.toUpperCase()]
    );

    if (!discount) {
      return NextResponse.json({
        valid: false,
        error: `קופון ${code} לא נמצא או לא פעיל`,
      });
    }

    // Check dates
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return NextResponse.json({
        valid: false,
        error: `קופון ${code} עדיין לא פעיל`,
      });
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      return NextResponse.json({
        valid: false,
        error: `קופון ${code} פג תוקף`,
      });
    }

    // Check usage
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return NextResponse.json({
        valid: false,
        error: `קופון ${code} הגיע למגבלת השימוש`,
      });
    }

    // Check minimum order amount
    if (subtotal && discount.minimum_order_amount && subtotal < parseFloat(discount.minimum_order_amount)) {
      return NextResponse.json({
        valid: false,
        error: `סכום מינימום להזמנה: ₪${parseFloat(discount.minimum_order_amount).toFixed(2)}`,
      });
    }

    // Check minimum quantity
    if (totalQuantity !== undefined && discount.minimum_quantity && totalQuantity < discount.minimum_quantity) {
      return NextResponse.json({
        valid: false,
        error: `קופון ${code} דורש כמות מינימום של ${discount.minimum_quantity} פריטים`,
      });
    }

    // Check maximum quantity
    if (totalQuantity !== undefined && discount.maximum_quantity && totalQuantity > discount.maximum_quantity) {
      return NextResponse.json({
        valid: false,
        error: `קופון ${code} תקף עד כמות מקסימום של ${discount.maximum_quantity} פריטים`,
      });
    }

    return NextResponse.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        discount_type: discount.discount_type,
        value: discount.value ? parseFloat(discount.value) : null,
      },
    });
  } catch (error: any) {
    console.error('Discount validation error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה באימות קופון' },
      { status: 500 }
    );
  }
}

