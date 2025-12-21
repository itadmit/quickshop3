import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { jwtVerify } from 'jose';

export interface StorefrontAuthResult {
  success: boolean;
  customerId?: number;
  customer?: any;
  store?: any;
  error?: NextResponse;
}

/**
 * אימות לקוח בסטורפרונט
 * בודק שהטוקן תקף, החנות קיימת, והלקוח קיים במערכת
 */
export async function verifyStorefrontCustomer(
  req: NextRequest,
  storeSlug: string
): Promise<StorefrontAuthResult> {
  try {
    // Find store by slug, domain or id
    let store = await queryOne<{ id: number; name: string; myshopify_domain: string }>(
      'SELECT id, name, myshopify_domain FROM stores WHERE slug = $1 OR myshopify_domain = $1 OR id::text = $1',
      [storeSlug]
    );

    if (!store) {
      return {
        success: false,
        error: NextResponse.json({ error: 'החנות לא נמצאה' }, { status: 404 }),
      };
    }

    // קבלת token
    const authHeader = req.headers.get('authorization');
    const token =
      authHeader?.replace('Bearer ', '') ||
      req.headers.get('x-customer-token') ||
      req.headers.get('x-customer-id');

    if (!token) {
      return {
        success: false,
        error: NextResponse.json({ error: 'אימות נדרש' }, { status: 401 }),
      };
    }

    // אימות JWT
    let customerId: number | null = null;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);

      // בדיקה שהטוקן שייך לחנות הנכונה
      if ((payload as any).store_id !== store.id) {
        return {
          success: false,
          error: NextResponse.json({ error: 'אימות נכשל' }, { status: 401 }),
        };
      }

      customerId = (payload as any).customer_id as number;
    } catch (jwtError) {
      // אם זה לא JWT, נניח שזה customerId ישיר (backward compatibility)
      const parsedId = parseInt(token);
      if (!isNaN(parsedId)) {
        customerId = parsedId;
      }
    }

    if (!customerId) {
      return {
        success: false,
        error: NextResponse.json({ error: 'אימות נכשל' }, { status: 401 }),
      };
    }

    // **בדיקה קריטית: וידוא שהלקוח עדיין קיים במערכת**
    const customer = await queryOne<{ id: number; email: string; first_name: string | null; last_name: string | null }>(
      'SELECT id, email, first_name, last_name FROM customers WHERE id = $1 AND store_id = $2',
      [customerId, store.id]
    );

    if (!customer) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'חשבון הלקוח לא נמצא או נמחק' },
          { status: 401 }
        ),
      };
    }

    return {
      success: true,
      customerId: customer.id,
      customer,
      store,
    };
  } catch (error) {
    console.error('[Storefront Auth] Error:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'שגיאה באימות' },
        { status: 500 }
      ),
    };
  }
}

/**
 * אימות לקוח אופציונלי (לא מחזיר שגיאה אם אין טוקן)
 */
export async function verifyStorefrontCustomerOptional(
  req: NextRequest,
  storeSlug: string
): Promise<StorefrontAuthResult & { store: any }> {
  // Find store by slug, domain or id
  let store = await queryOne<{ id: number; name: string; myshopify_domain: string }>(
    'SELECT id, name, myshopify_domain FROM stores WHERE slug = $1 OR myshopify_domain = $1 OR id::text = $1',
    [storeSlug]
  );

  if (!store) {
    return {
      success: false,
      store: null,
      error: NextResponse.json({ error: 'החנות לא נמצאה' }, { status: 404 }),
    };
  }

  // קבלת token
  const authHeader = req.headers.get('authorization');
  const token =
    authHeader?.replace('Bearer ', '') ||
    req.headers.get('x-customer-token') ||
    req.headers.get('x-customer-id');

  // אם אין טוקן, זה בסדר
  if (!token) {
    return {
      success: true,
      store,
    };
  }

  // אם יש טוקן, נבדוק אותו
  let customerId: number | null = null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);

    if ((payload as any).store_id !== store.id) {
      return {
        success: true,
        store,
      };
    }

    customerId = (payload as any).customer_id as number;
  } catch (jwtError) {
    const parsedId = parseInt(token);
    if (!isNaN(parsedId)) {
      customerId = parsedId;
    }
  }

  if (customerId) {
    // בדיקה שהלקוח עדיין קיים
    const customer = await queryOne<{ id: number; email: string; first_name: string | null; last_name: string | null }>(
      'SELECT id, email, first_name, last_name FROM customers WHERE id = $1 AND store_id = $2',
      [customerId, store.id]
    );

    if (customer) {
      return {
        success: true,
        customerId: customer.id,
        customer,
        store,
      };
    }
  }

  return {
    success: true,
    store,
  };
}

