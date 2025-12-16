import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { eventBus } from '@/lib/events/eventBus';

const VISITOR_SESSION_COOKIE_NAME = 'quickshop3_visitor_session';

interface CartItem {
  variant_id: number;
  product_id: number;
  product_title: string;
  variant_title: string;
  price: number;
  quantity: number;
  image?: string;
}

// GET /api/cart - Get cart for visitor session
export async function GET(request: NextRequest) {
  try {
    const visitorSessionId = request.cookies.get(VISITOR_SESSION_COOKIE_NAME)?.value;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!visitorSessionId) {
      return NextResponse.json({ items: [] });
    }

    if (!storeId) {
      return NextResponse.json({ items: [] });
    }

    // Get cart from database (by visitor_session_id and store_id)
    const cartData = await queryOne<{ items: string | any[] }>(
      `SELECT items FROM visitor_carts 
       WHERE visitor_session_id = $1 AND store_id = $2
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [visitorSessionId, parseInt(storeId)]
    );

    if (!cartData || !cartData.items) {
      return NextResponse.json({ items: [] });
    }

    const items = typeof cartData.items === 'string' 
      ? JSON.parse(cartData.items) 
      : Array.isArray(cartData.items) 
        ? cartData.items 
        : [];

    // IMPORTANT: No cache for cart - prices may change due to discounts and promotions
    const response = NextResponse.json({ items });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error: any) {
    console.error('Error getting cart:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בטעינת העגלה' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Save cart for visitor session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, storeId } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    let visitorSessionId = request.cookies.get(VISITOR_SESSION_COOKIE_NAME)?.value;
    let isNewCart = false;

    // Create visitor session if doesn't exist
    if (!visitorSessionId) {
      visitorSessionId = crypto.randomUUID();
      isNewCart = true;
    } else {
      // Check if cart already exists
      // Note: visitor_carts table uses composite PRIMARY KEY (visitor_session_id, store_id), no 'id' column
      const existingCart = await queryOne<{ visitor_session_id: string }>(
        `SELECT visitor_session_id FROM visitor_carts WHERE visitor_session_id = $1 AND store_id = $2`,
        [visitorSessionId, storeId]
      );
      isNewCart = !existingCart;
    }

    // Save cart to database
    await query(
      `INSERT INTO visitor_carts (visitor_session_id, store_id, items, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (visitor_session_id, store_id) 
       DO UPDATE SET items = $3, updated_at = now()`,
      [visitorSessionId, storeId, JSON.stringify(items)]
    );

    // Emit cart.created event if this is a new cart
    if (isNewCart && items.length > 0) {
      const total = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
      await eventBus.emitEvent('cart.created', {
        cart: {
          visitor_session_id: visitorSessionId,
          items: items,
          total: total,
          item_count: items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
        },
      }, {
        store_id: parseInt(storeId),
        source: 'api',
      });
    }

    // החזר את הפריטים שנשמרו כדי לוודא סינכרון
    const response = NextResponse.json({ success: true, items });

    // Set cookie if it doesn't exist
    if (!request.cookies.get(VISITOR_SESSION_COOKIE_NAME)) {
      response.cookies.set(VISITOR_SESSION_COOKIE_NAME, visitorSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error saving cart:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בשמירת העגלה' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const visitorSessionId = request.cookies.get(VISITOR_SESSION_COOKIE_NAME)?.value;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!visitorSessionId || !storeId) {
      return NextResponse.json({ success: true });
    }

    await query(
      `DELETE FROM visitor_carts 
       WHERE visitor_session_id = $1 AND store_id = $2`,
      [visitorSessionId, storeId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בניקוי העגלה' },
      { status: 500 }
    );
  }
}

