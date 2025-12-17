import { NextRequest, NextResponse } from 'next/server';
import { CartCalculator } from '@/lib/services/cartCalculator';

const VISITOR_SESSION_COOKIE_NAME = 'quickshop3_visitor_session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { storeId, items, discountCode, shippingRate, customerId, customerSegment, customerOrdersCount, customerLifetimeValue, customerTier } = body;
    
    // אם לא נשלח discountCode, נטען אותו מהשרת (session)
    if (!discountCode) {
      const visitorSessionId = req.cookies.get(VISITOR_SESSION_COOKIE_NAME)?.value;
      if (visitorSessionId && storeId) {
        const { queryOne } = await import('@/lib/db');
        const cartData = await queryOne<{ discount_code: string | null }>(
          `SELECT discount_code 
           FROM visitor_carts 
           WHERE visitor_session_id = $1 AND store_id = $2
           ORDER BY updated_at DESC 
           LIMIT 1`,
          [visitorSessionId, typeof storeId === 'string' ? parseInt(storeId, 10) : storeId]
        );
        if (cartData?.discount_code) {
          discountCode = cartData.discount_code;
        }
      }
    }


    // בדיקת תקינות storeId (חייב להיות מספר חיובי)
    const storeIdNum = typeof storeId === 'string' ? parseInt(storeId, 10) : Number(storeId);
    if (!storeId || isNaN(storeIdNum) || storeIdNum <= 0) {
      return NextResponse.json(
        { error: 'storeId is required and must be a positive number', received: { storeId, storeIdType: typeof storeId } },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items is required and must be an array', received: { itemsType: typeof items, itemsIsArray: Array.isArray(items) } },
        { status: 400 }
      );
    }

    // סינון מוצרי מתנה אם אין פריטים רגילים
    const regularItems = items.filter((item: any) => 
      !item.properties?.some((prop: any) => prop.name === 'מתנה')
    );
    
    // אם אין פריטים רגילים (רק מתנות או ריק), עגלה ריקה
    if (regularItems.length === 0) {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        itemsDiscount: 0,
        subtotalAfterDiscount: 0,
        shipping: shippingRate?.price || 0,
        shippingDiscount: 0,
        shippingAfterDiscount: shippingRate?.price || 0,
        discounts: [],
        giftProducts: [], // לא מחזירים מתנות אם אין פריטים רגילים
        total: shippingRate?.price || 0,
        isValid: true,
        errors: [],
        warnings: [],
      });
    }

    // בדיקת תקינות items + המרה לטיפוסים נכונים
    const validatedItems = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      
      // בדיקת שדות חובה
      if (!item.variant_id || !item.product_id) {
        return NextResponse.json(
          { error: `Item at index ${index} is missing variant_id or product_id` },
          { status: 400 }
        );
      }

      // המרת price למספר (אם מגיע כ-string)
      const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: `Invalid price for item at index ${index}: ${item.price}` },
          { status: 400 }
        );
      }

      // המרת quantity למספר (אם מגיע כ-string)
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for item at index ${index}: ${item.quantity}` },
          { status: 400 }
        );
      }

      // בדיקה אם זה מוצר מתנה (properties כולל name='מתנה')
      const isGiftProduct = item.properties?.some((prop: any) => prop.name === 'מתנה');
      
      // הוספת פריט עם טיפוסים נכונים
      // מוצרי מתנה תמיד במחיר 0
      validatedItems.push({
        variant_id: Number(item.variant_id),
        product_id: Number(item.product_id),
        product_title: item.product_title || '',
        variant_title: item.variant_title || 'Default Title',
        price: isGiftProduct ? 0 : price, // מתנה = מחיר 0
        quantity: quantity,
        image: item.image || undefined,
        properties: item.properties || undefined,
      });
    }

    // בדיקת תקינות shippingRate אם קיים (אחרי המרת items)
    // הטיפול ב-shippingRate נעשה בתוך יצירת ה-CartCalculator

    const calculator = new CartCalculator({
      storeId: storeIdNum,
      items: validatedItems,
      discountCode: discountCode || undefined,
      shippingRate: shippingRate ? {
        id: Number(shippingRate.id),
        name: shippingRate.name,
        price: typeof shippingRate.price === 'string' ? parseFloat(shippingRate.price) : Number(shippingRate.price),
        free_shipping_threshold: shippingRate.free_shipping_threshold 
          ? (typeof shippingRate.free_shipping_threshold === 'string' 
              ? parseFloat(shippingRate.free_shipping_threshold) 
              : Number(shippingRate.free_shipping_threshold))
          : null,
      } : undefined,
      customerId: customerId ? Number(customerId) : undefined,
      customerSegment: customerSegment || undefined,
      customerOrdersCount: customerOrdersCount ? Number(customerOrdersCount) : undefined,
      customerLifetimeValue: customerLifetimeValue 
        ? (typeof customerLifetimeValue === 'string' ? parseFloat(customerLifetimeValue) : Number(customerLifetimeValue))
        : undefined,
      customerTier: customerTier || undefined,
    });

    // Load discount code if provided (before calculation)
    if (discountCode) {
      await calculator.loadDiscountCode(discountCode);
    }

    // Calculate cart (this will also load automatic discounts)
    const result = await calculator.calculate();

    // Include discountCode in response so client can sync
    // IMPORTANT: No cache for prices and calculations - always fresh data for discounts and promotions
    const response = NextResponse.json({
      ...result,
      discountCode: discountCode || null, // Include current discount code in response
    });
    
    // Prevent caching of price calculations
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error: any) {
    console.error('Cart calculation error:', error);
    console.error('Error stack:', error.stack);
    
    // אם זו שגיאת validation, החזר 400
    if (error.message && error.message.includes('Invalid') || error.message.includes('missing')) {
      return NextResponse.json(
        { error: error.message || 'שגיאה בנתוני העגלה' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'שגיאה בחישוב העגלה' },
      { status: 500 }
    );
  }
}

