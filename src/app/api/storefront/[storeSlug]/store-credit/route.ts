import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomer } from '@/lib/storefront-auth';

// GET - קבלת קרדיט בחנות של לקוח בסטורפרונט
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    // אימות לקוח (כולל בדיקה שהלקוח קיים)
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    // מציאת קרדיט בחנות של הלקוח
    const storeCredit = await queryOne<{
      id: number;
      balance: number;
      currency: string;
      expires_at: Date | null;
    }>(
      `SELECT id, balance, currency, expires_at
       FROM store_credits
       WHERE store_id = $1 AND customer_id = $2`,
      [auth.store.id, auth.customerId]
    );

    if (!storeCredit) {
      // אם אין קרדיט, נחזיר null או אובייקט עם יתרה 0
      return NextResponse.json({
        balance: 0,
        currency: 'ILS',
        expiresAt: null,
      });
    }

    // קבלת 10 העסקאות האחרונות
    const transactions = await query<{
      id: number;
      amount: number;
      transaction_type: string;
      description: string | null;
      created_at: Date;
      order_id: number | null;
    }>(
      `SELECT t.id, t.amount, t.transaction_type, t.description, t.created_at, t.order_id
       FROM store_credit_transactions t
       WHERE t.store_credit_id = $1
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [storeCredit.id]
    );

    return NextResponse.json({
      id: storeCredit.id,
      balance: parseFloat(storeCredit.balance.toString()),
      currency: storeCredit.currency,
      expiresAt: storeCredit.expires_at,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: parseFloat(t.amount.toString()),
        transactionType: t.transaction_type,
        description: t.description,
        createdAt: t.created_at,
        orderId: t.order_id,
      })),
    });
  } catch (error) {
    console.error('Error fetching storefront store credit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

