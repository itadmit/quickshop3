import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

const VISITOR_SESSION_COOKIE_NAME = 'quickshop3_visitor_session';

// GET /api/cart/discount-code - Get discount code for visitor session
export async function GET(request: NextRequest) {
  try {
    const visitorSessionId = request.cookies.get(VISITOR_SESSION_COOKIE_NAME)?.value;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!visitorSessionId || !storeId) {
      return NextResponse.json({ discountCode: null });
    }

    // Get discount code from database
    const cartData = await queryOne<{ discount_code: string | null }>(
      `SELECT discount_code 
       FROM visitor_carts 
       WHERE visitor_session_id = $1 AND store_id = $2
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [visitorSessionId, parseInt(storeId)]
    );

    // IMPORTANT: No cache - discount codes may change
    const response = NextResponse.json({ 
      discountCode: cartData?.discount_code || null 
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error: any) {
    console.error('Error getting discount code:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בטעינת קוד קופון' },
      { status: 500 }
    );
  }
}

// POST /api/cart/discount-code - Save discount code for visitor session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discountCode, storeId } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    let visitorSessionId = request.cookies.get(VISITOR_SESSION_COOKIE_NAME)?.value;

    // Create visitor session if doesn't exist
    if (!visitorSessionId) {
      visitorSessionId = crypto.randomUUID();
    }

    // Update or insert discount code in visitor_carts
    // If cart doesn't exist, create it with empty items
    await query(
      `INSERT INTO visitor_carts (visitor_session_id, store_id, items, discount_code, updated_at)
       VALUES ($1, $2, '[]'::jsonb, $3, now())
       ON CONFLICT (visitor_session_id, store_id) 
       DO UPDATE SET discount_code = $3, updated_at = now()`,
      [visitorSessionId, storeId, discountCode || null]
    );

    const response = NextResponse.json({ 
      success: true, 
      discountCode: discountCode || null 
    });

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
    console.error('Error saving discount code:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בשמירת קוד קופון' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/discount-code - Remove discount code
export async function DELETE(request: NextRequest) {
  try {
    const visitorSessionId = request.cookies.get(VISITOR_SESSION_COOKIE_NAME)?.value;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!visitorSessionId || !storeId) {
      return NextResponse.json({ success: true });
    }

    // Remove discount code from visitor_carts
    await query(
      `UPDATE visitor_carts 
       SET discount_code = NULL, updated_at = now()
       WHERE visitor_session_id = $1 AND store_id = $2`,
      [visitorSessionId, storeId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing discount code:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהסרת קוד קופון' },
      { status: 500 }
    );
  }
}

