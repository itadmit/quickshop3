// API Route for Plugin Subscription

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { subscribeToPlugin } from '@/lib/plugins/billing';

/**
 * POST /api/plugins/[slug]/subscribe - רכישת תוסף בתשלום
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { cardToken, paymentProviderSlug } = body;

    if (!cardToken) {
      return NextResponse.json(
        { error: 'cardToken is required' },
        { status: 400 }
      );
    }

    const result = await subscribeToPlugin(
      user.store_id,
      slug,
      cardToken,
      paymentProviderSlug || 'quickshop_payments'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to subscribe' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
    });
  } catch (error: any) {
    console.error('Error subscribing to plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe to plugin' },
      { status: 500 }
    );
  }
}

