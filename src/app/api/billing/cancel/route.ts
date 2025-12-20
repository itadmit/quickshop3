/**
 * Cancel Subscription API
 * 
 * POST /api/billing/cancel - Cancel subscription (at end of period)
 * DELETE /api/billing/cancel - Cancel immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface CancelRequest {
  store_id?: number;
  reason?: string;
  immediate?: boolean; // Cancel immediately or at end of period
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body: CancelRequest = await request.json();
    const { store_id, reason, immediate = false } = body;
    
    // Get store and verify ownership
    const targetStoreId = store_id || user.store_id;
    
    const store = await queryOne<{ id: number; name: string }>(`
      SELECT s.id, s.name
      FROM stores s
      JOIN store_owners so ON s.owner_id = so.id
      WHERE s.id = $1 AND so.id = $2
      LIMIT 1
    `, [targetStoreId, user.id]);
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get current subscription
    const subscription = await queryOne<{
      id: number;
      status: string;
      current_period_end: Date;
      plan_id: number;
    }>(`
      SELECT id, status, current_period_end, plan_id
      FROM qs_store_subscriptions
      WHERE store_id = $1
    `, [store.id]);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
    
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      return NextResponse.json(
        { error: 'Subscription already cancelled' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    
    if (immediate) {
      // Cancel immediately - block the store
      await query(`
        UPDATE qs_store_subscriptions
        SET 
          status = 'cancelled',
          cancelled_at = $1,
          cancellation_reason = $2,
          cancel_at_period_end = false,
          updated_at = $1
        WHERE store_id = $3
      `, [now, reason || 'ביטול מיידי על ידי המשתמש', store.id]);
      
      // Block the store
      await query(`
        UPDATE stores
        SET is_active = false, updated_at = now()
        WHERE id = $1
      `, [store.id]);
      
      return NextResponse.json({
        success: true,
        message: 'המנוי בוטל מיידית',
        effective_date: now.toISOString(),
      });
    } else {
      // Cancel at end of billing period (like Shopify)
      const effectiveDate = subscription.current_period_end || now;
      
      await query(`
        UPDATE qs_store_subscriptions
        SET 
          status = 'cancelled',
          cancelled_at = $1,
          cancellation_reason = $2,
          cancel_at_period_end = true,
          updated_at = $1
        WHERE store_id = $3
      `, [now, reason || 'ביטול על ידי המשתמש', store.id]);
      
      return NextResponse.json({
        success: true,
        message: 'המנוי יבוטל בסוף תקופת החיוב הנוכחית',
        effective_date: effectiveDate,
        access_until: effectiveDate,
      });
    }
    
  } catch (error) {
    console.error('[Cancel Subscription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

// Reactivate cancelled subscription
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { store_id } = body;
    
    // Get store
    const targetStoreId = store_id || user.store_id;
    
    const store = await queryOne<{ id: number }>(`
      SELECT s.id
      FROM stores s
      JOIN store_owners so ON s.owner_id = so.id
      WHERE s.id = $1 AND so.id = $2
      LIMIT 1
    `, [targetStoreId, user.id]);
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Check if subscription can be reactivated
    const subscription = await queryOne<{
      id: number;
      status: string;
      cancel_at_period_end: boolean;
      current_period_end: Date;
    }>(`
      SELECT id, status, cancel_at_period_end, current_period_end
      FROM qs_store_subscriptions
      WHERE store_id = $1
    `, [store.id]);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }
    
    // Can only reactivate if cancelled but not yet expired
    if (subscription.status !== 'cancelled' || !subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription cannot be reactivated' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    if (subscription.current_period_end && subscription.current_period_end < now) {
      return NextResponse.json(
        { error: 'Subscription period has ended. Please create a new subscription.' },
        { status: 400 }
      );
    }
    
    // Reactivate
    await query(`
      UPDATE qs_store_subscriptions
      SET 
        status = 'active',
        cancelled_at = NULL,
        cancellation_reason = NULL,
        cancel_at_period_end = false,
        updated_at = now()
      WHERE store_id = $1
    `, [store.id]);
    
    return NextResponse.json({
      success: true,
      message: 'המנוי הופעל מחדש',
    });
    
  } catch (error) {
    console.error('[Reactivate Subscription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}

