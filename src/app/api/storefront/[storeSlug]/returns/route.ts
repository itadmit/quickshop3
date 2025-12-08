import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomer } from '@/lib/storefront-auth';
import { z } from 'zod';

const createReturnSchema = z.object({
  orderId: z.number(),
  reason: z.string().min(1, 'סיבת ההחזרה היא חובה'),
  items: z
    .array(
      z.object({
        orderItemId: z.number(),
        quantity: z.number().int().positive('כמות חייבת להיות מספר חיובי'),
        reason: z.string().optional(),
      })
    )
    .min(1, 'חייב לבחור לפחות פריט אחד להחזרה'),
  notes: z.string().optional(),
});

// GET - קבלת החזרות של לקוח בפרונט
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [returns, totalResult] = await Promise.all([
      query<{
        id: number;
        order_id: number;
        status: string;
        reason: string;
        items: any;
        refund_amount: number | null;
        refund_method: string | null;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT r.*, o.order_number, o.total_price as order_total
         FROM returns r
         JOIN orders o ON r.order_id = o.id
         WHERE r.store_id = $1 AND r.customer_id = $2
         ORDER BY r.created_at DESC
         LIMIT $3 OFFSET $4`,
        [auth.store.id, auth.customerId, limit, (page - 1) * limit]
      ),
      queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM returns WHERE store_id = $1 AND customer_id = $2',
        [auth.store.id, auth.customerId]
      ),
    ]);

    const total = totalResult?.count || 0;

    return NextResponse.json({
      returns: returns.map((r) => ({
        id: r.id,
        orderId: r.order_id,
        status: r.status,
        reason: r.reason,
        items: r.items,
        refundAmount: r.refund_amount,
        refundMethod: r.refund_method,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching storefront returns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - יצירת החזרה חדשה בפרונט
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    const body = await req.json();
    const data = createReturnSchema.parse(body);

    // בדיקה שההזמנה שייכת ללקוח ולחנות
    const order = await queryOne<{
      id: number;
      order_number: number;
      financial_status: string;
      total_price: number;
    }>(
      `SELECT id, order_number, financial_status, total_price
       FROM orders
       WHERE id = $1 AND store_id = $2 AND customer_id = $3`,
      [data.orderId, auth.store.id, auth.customerId]
    );

    if (!order) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    // בדיקה שההזמנה שולמה (לא ניתן להחזיר הזמנה שלא שולמה)
    if (order.financial_status !== 'paid') {
      return NextResponse.json(
        { error: 'לא ניתן להחזיר הזמנה שלא שולמה' },
        { status: 400 }
      );
    }

    // קבלת פריטי ההזמנה
    const orderItems = await query<{
      id: number;
      quantity: number;
      title: string;
    }>(
      'SELECT id, quantity, title FROM order_line_items WHERE order_id = $1',
      [order.id]
    );

    // בדיקה שהפריטים להחזרה תואמים להזמנה
    for (const returnItem of data.items) {
      const orderItem = orderItems.find((item) => item.id === returnItem.orderItemId);

      if (!orderItem) {
        return NextResponse.json(
          { error: `פריט ${returnItem.orderItemId} לא נמצא בהזמנה` },
          { status: 400 }
        );
      }

      // בדיקה שהכמות להחזרה לא עולה על הכמות שהוזמנה
      if (returnItem.quantity > orderItem.quantity) {
        return NextResponse.json(
          {
            error: `כמות להחזרה (${returnItem.quantity}) גדולה מכמות שהוזמנה (${orderItem.quantity})`,
          },
          { status: 400 }
        );
      }

      // בדיקה אם יש החזרה ממתינה (PENDING) לפריט הזה
      const pendingReturns = await query<{ items: any }>(
        'SELECT items FROM returns WHERE order_id = $1 AND status = $2',
        [order.id, 'PENDING']
      );

      // בדיקה אם הפריט הזה כבר נמצא בהחזרה ממתינה
      for (const pendingRet of pendingReturns) {
        const pendingRetItems = Array.isArray(pendingRet.items)
          ? pendingRet.items
          : [];
        const pendingRetItem = pendingRetItems.find(
          (item: any) => item.orderItemId === returnItem.orderItemId
        );
        if (pendingRetItem) {
          return NextResponse.json(
            {
              error:
                'לפריט זה כבר יש בקשת החזרה ממתינה. לא ניתן ליצור החזרה נוספת לאותו פריט',
            },
            { status: 400 }
          );
        }
      }

      // בדיקה כמה כבר הוחזר מהפריט הזה (מהחזרות מאושרות/הושלמות)
      const approvedReturns = await query<{ items: any }>(
        'SELECT items FROM returns WHERE order_id = $1 AND status IN ($2, $3)',
        [order.id, 'APPROVED', 'COMPLETED']
      );

      let totalReturnedQty = 0;
      for (const ret of approvedReturns) {
        const retItems = Array.isArray(ret.items) ? ret.items : [];
        const retItem = retItems.find(
          (item: any) => item.orderItemId === returnItem.orderItemId
        );
        if (retItem) {
          totalReturnedQty += retItem.quantity || 0;
        }
      }

      if (totalReturnedQty + returnItem.quantity > orderItem.quantity) {
        return NextResponse.json(
          {
            error: `סה"כ כמות מוחזרת (${totalReturnedQty + returnItem.quantity}) גדולה מכמות שהוזמנה (${orderItem.quantity})`,
          },
          { status: 400 }
        );
      }
    }

    // יצירת ההחזרה
    const result = await queryOne<{ id: number }>(
      `INSERT INTO returns (store_id, order_id, customer_id, reason, items, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        auth.store.id,
        data.orderId,
        auth.customerId,
        data.reason,
        JSON.stringify(data.items),
        data.notes || null,
        'PENDING',
      ]
    );

    if (!result) {
      throw new Error('Failed to create return');
    }

    // יצירת אירוע (אם יש eventBus)
    try {
      const { eventBus } = await import('@/lib/events/eventBus');
      await eventBus.emit('return.created', {
        store_id: auth.store.id,
        payload: {
          returnId: result.id,
          orderId: order.id,
          orderNumber: order.order_number,
          customerId: auth.customerId,
          reason: data.reason,
        },
      });
    } catch (error) {
      console.error('Error emitting return.created event:', error);
      // לא נכשל את כל התהליך אם יצירת האירוע נכשלה
    }

    return NextResponse.json(
      {
        id: result.id,
        orderId: data.orderId,
        status: 'PENDING',
        reason: data.reason,
        items: data.items,
        notes: data.notes,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating storefront return:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת החזרה' },
      { status: 500 }
    );
  }
}

