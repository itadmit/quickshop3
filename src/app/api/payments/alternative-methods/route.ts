import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/payments/alternative-methods
 * 
 * Get alternative payment methods settings (bank transfer, cash on delivery)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get store settings from store_settings table
    const storeSettings = await queryOne<{ settings: any }>(
      `SELECT settings FROM store_settings WHERE store_id = $1`,
      [user.store_id]
    );

    const settings = storeSettings?.settings || {};
    const paymentMethods = settings.payment_methods || {};

    return NextResponse.json({
      bank_transfer_enabled: paymentMethods.bank_transfer_enabled || false,
      bank_transfer_details: paymentMethods.bank_transfer_details || '',
      cash_on_delivery_enabled: paymentMethods.cash_on_delivery_enabled || false,
      cod_fee: paymentMethods.cod_fee || 0,
      minimum_order_amount: paymentMethods.minimum_order_amount || 0,
    });
  } catch (error: any) {
    console.error('Error getting alternative payment methods:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments/alternative-methods
 * 
 * Update alternative payment methods settings
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bank_transfer_enabled,
      bank_transfer_details,
      cash_on_delivery_enabled,
      cod_fee,
      minimum_order_amount,
    } = body;

    // Get current settings from store_settings table
    const storeSettings = await queryOne<{ settings: any }>(
      `SELECT settings FROM store_settings WHERE store_id = $1`,
      [user.store_id]
    );

    const currentSettings = storeSettings?.settings || {};
    
    // Merge payment methods settings
    const updatedSettings = {
      ...currentSettings,
      payment_methods: {
        ...currentSettings.payment_methods,
        bank_transfer_enabled: bank_transfer_enabled ?? false,
        bank_transfer_details: bank_transfer_details ?? '',
        cash_on_delivery_enabled: cash_on_delivery_enabled ?? false,
        cod_fee: cod_fee ?? 0,
        minimum_order_amount: minimum_order_amount ?? 0,
      },
    };

    // Upsert store settings (insert if not exists, update if exists)
    await query(
      `INSERT INTO store_settings (store_id, settings, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (store_id) 
       DO UPDATE SET settings = $2, updated_at = now()`,
      [user.store_id, JSON.stringify(updatedSettings)]
    );

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating alternative payment methods:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
