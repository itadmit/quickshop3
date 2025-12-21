import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

const channelNames: Record<string, string> = {
  'web': 'אתר',
  'online_store': 'חנות אונליין',
  'pos': 'נקודת מכירה',
  'mobile': 'אפליקציה',
  'api': 'API',
  'draft_order': 'הזמנת טיוטה',
  'other': 'אחר',
};

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    const channelData = await query<{
      source_name: string;
      orders: string;
      revenue: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(source_name, ''), 'online_store') as source_name,
        COUNT(*) as orders,
        SUM(total_price) as revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY source_name
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    const totalRevenue = channelData.reduce((acc, c) => acc + (parseFloat(c.revenue) || 0), 0);

    const channels = channelData.map(c => {
      const revenue = parseFloat(c.revenue) || 0;
      const orders = parseInt(c.orders) || 0;
      return {
        channel: c.source_name,
        channel_display: channelNames[c.source_name] || c.source_name || 'חנות אונליין',
        orders,
        revenue,
        avg_order_value: orders > 0 ? revenue / orders : 0,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      };
    });

    const totals = {
      total_revenue: totalRevenue,
      total_orders: channels.reduce((acc, c) => acc + c.orders, 0),
    };

    return NextResponse.json({ channels, totals, period: { start_date, end_date } });
  } catch (error: any) {
    console.error('Error fetching sales by channel:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

