import { NextRequest, NextResponse } from 'next/server';
import { CartCalculator } from '@/lib/services/cartCalculator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, items, discountCode, shippingRate, customerId, customerSegment, customerOrdersCount, customerLifetimeValue } = body;

    if (!storeId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'storeId and items are required' },
        { status: 400 }
      );
    }

    const calculator = new CartCalculator({
      storeId,
      items,
      discountCode,
      shippingRate: shippingRate || undefined,
      customerId: customerId || undefined,
      customerSegment: customerSegment || undefined,
      customerOrdersCount: customerOrdersCount || undefined,
      customerLifetimeValue: customerLifetimeValue || undefined,
    });

    // Calculate cart
    const result = await calculator.calculate();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Cart calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בחישוב העגלה' },
      { status: 500 }
    );
  }
}

