/**
 * Admin Transactions API
 * 
 * GET /api/admin/transactions - List all billing transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest, isSuperAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const type = searchParams.get('type'); // 'subscription' or 'commission'
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`t.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get transactions with store info
    const transactions = await query<{
      id: number;
      store_name: string;
      type: string;
      amount: number;
      vat_amount: number;
      total_amount: number;
      status: string;
      description: string;
      payplus_transaction_uid: string | null;
      created_at: string;
    }>(`
      SELECT 
        t.id,
        s.name as store_name,
        t.type,
        t.amount,
        t.vat_amount,
        t.total_amount,
        t.status,
        t.description,
        t.payplus_transaction_uid,
        t.created_at
      FROM qs_billing_transactions t
      JOIN stores s ON t.store_id = s.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return NextResponse.json({
      transactions,
      page,
      limit,
    });

  } catch (error) {
    console.error('[Admin Transactions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

