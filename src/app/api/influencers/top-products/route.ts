import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getInfluencerFromRequest } from '@/lib/auth/influencerAuth';

// GET /api/influencers/top-products - Get top selling products for influencer's coupons
export async function GET(request: NextRequest) {
  try {
    const influencer = await getInfluencerFromRequest(request);
    if (!influencer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top selling products from orders that used this influencer's coupons
    const products = await query<{
      product_id: number;
      product_title: string;
      quantity_sold: number;
      total_revenue: number;
      image_url: string | null;
    }>(
      `SELECT 
        oli.product_id,
        COALESCE(p.title, oli.title) as product_title,
        SUM(oli.quantity) as quantity_sold,
        SUM(oli.quantity * oli.price::numeric) as total_revenue,
        (SELECT pi.src FROM product_images pi WHERE pi.product_id = oli.product_id AND pi.position = 1 LIMIT 1) as image_url
      FROM order_line_items oli
      INNER JOIN orders o ON oli.order_id = o.id
      INNER JOIN discount_codes dc ON o.discount_codes @> jsonb_build_array(dc.code)
      LEFT JOIN products p ON oli.product_id = p.id
      WHERE dc.influencer_id = $1
        AND o.financial_status IN ('paid', 'partially_paid')
      GROUP BY oli.product_id, p.title, oli.title
      ORDER BY quantity_sold DESC
      LIMIT $2`,
      [influencer.id, limit]
    );

    return NextResponse.json({
      products: products.map(p => ({
        product_id: p.product_id,
        product_title: p.product_title,
        quantity_sold: Number(p.quantity_sold),
        total_revenue: Number(p.total_revenue),
        image_url: p.image_url,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching top products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch top products' },
      { status: 500 }
    );
  }
}

