import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon?: string;
  fee?: number;
  details?: string;
}

/**
 * GET /api/storefront/[storeSlug]/payment-methods
 * 
 * Get available payment methods for a store's checkout
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;

    // Get store
    const store = await queryOne<any>(
      `SELECT id FROM stores WHERE slug = $1`,
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get store settings from store_settings table
    const storeSettings = await queryOne<{ settings: any }>(
      `SELECT settings FROM store_settings WHERE store_id = $1`,
      [store.id]
    );

    const settings = storeSettings?.settings || {};
    const paymentSettings = settings.payment_methods || {};
    const methods: PaymentMethod[] = [];

    // Check for active payment provider (credit card)
    const activeProvider = await queryOne<any>(
      `SELECT id, provider, display_name FROM store_payment_integrations 
       WHERE store_id = $1 AND is_active = true
       ORDER BY is_default DESC LIMIT 1`,
      [store.id]
    );

    if (activeProvider) {
      methods.push({
        id: 'credit_card',
        name: activeProvider.display_name || 'כרטיס אשראי',
        description: 'תשלום מאובטח בכרטיס אשראי',
        icon: 'credit_card',
      });
    }

    // Check for bank transfer
    if (paymentSettings.bank_transfer_enabled) {
      methods.push({
        id: 'bank_transfer',
        name: 'העברה בנקאית',
        description: 'העברת כסף ישירות לחשבון הבנק',
        icon: 'bank',
        details: paymentSettings.bank_transfer_details,
      });
    }

    // Check for cash on delivery
    if (paymentSettings.cash_on_delivery_enabled) {
      methods.push({
        id: 'cash',
        name: 'מזומן בהזמנה',
        description: 'תשלום במזומן בעת המשלוח',
        icon: 'cash',
        fee: paymentSettings.cod_fee || 0,
      });
    }

    return NextResponse.json({
      methods,
      defaultMethod: methods[0]?.id || null,
      minimum_order_amount: paymentSettings.minimum_order_amount || 0,
    });
  } catch (error: any) {
    console.error('Error getting payment methods:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
