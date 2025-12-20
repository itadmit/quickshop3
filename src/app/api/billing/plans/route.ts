/**
 * Billing Plans API
 * 
 * GET /api/billing/plans - Get available subscription plans
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const plans = await query<{
      id: number;
      name: string;
      display_name: string;
      description: string;
      price: number;
      vat_percentage: number;
      commission_percentage: number;
      features: Record<string, boolean>;
      has_checkout: boolean;
      is_recommended: boolean;
      display_order: number;
    }>(`
      SELECT 
        id, name, display_name, description,
        price, vat_percentage, commission_percentage,
        features, has_checkout, is_recommended, display_order
      FROM qs_subscription_plans
      WHERE is_active = true
      ORDER BY display_order ASC
    `);
    
    // Calculate totals with VAT
    const plansWithTotals = plans.map(plan => {
      const vatAmount = Math.round(plan.price * (plan.vat_percentage / 100) * 100) / 100;
      const totalPrice = Math.round((plan.price + vatAmount) * 100) / 100;
      
      return {
        ...plan,
        vat_amount: vatAmount,
        total_price: totalPrice,
        commission_display: plan.commission_percentage > 0 
          ? `${(plan.commission_percentage * 100).toFixed(1)}%`
          : null,
      };
    });
    
    return NextResponse.json({
      success: true,
      plans: plansWithTotals,
    });
  } catch (error) {
    console.error('[Billing Plans] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

