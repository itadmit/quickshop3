import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customers who haven't ordered in a while but have ordered before
    const customerData = await query<{
      customer_id: number;
      first_name: string;
      last_name: string;
      email: string;
      last_order_date: string;
      total_orders: string;
      total_spent: string;
    }>(`
      SELECT 
        c.id as customer_id,
        c.first_name,
        c.last_name,
        c.email,
        MAX(o.created_at) as last_order_date,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_spent
      FROM customers c
      JOIN orders o ON o.customer_id = c.id AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      WHERE c.store_id = $1
      GROUP BY c.id, c.first_name, c.last_name, c.email
      HAVING MAX(o.created_at) < NOW() - INTERVAL '30 days'
      ORDER BY MAX(o.created_at) ASC
      LIMIT 200
    `, [user.store_id]);

    const now = new Date();
    const customers = customerData.map(c => {
      const lastOrderDate = new Date(c.last_order_date);
      const daysSince = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalSpent = parseFloat(c.total_spent) || 0;
      const totalOrders = parseInt(c.total_orders) || 0;
      
      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      if (daysSince > 90) riskLevel = 'high';
      else if (daysSince > 60) riskLevel = 'medium';

      return {
        customer_id: c.customer_id,
        customer_name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'אורח',
        email: c.email || '',
        last_order_date: c.last_order_date,
        days_since_last_order: daysSince,
        total_orders: totalOrders,
        total_spent: totalSpent,
        avg_order_value: totalOrders > 0 ? totalSpent / totalOrders : 0,
        risk_level: riskLevel,
      };
    });

    // Calculate stats
    const stats = {
      high_risk: customers.filter(c => c.risk_level === 'high').length,
      medium_risk: customers.filter(c => c.risk_level === 'medium').length,
      low_risk: customers.filter(c => c.risk_level === 'low').length,
      potential_revenue_loss: customers.reduce((acc, c) => acc + c.avg_order_value, 0),
    };

    // Risk distribution
    const ranges = [
      { min: 30, max: 45, label: '30-45 ימים' },
      { min: 45, max: 60, label: '45-60 ימים' },
      { min: 60, max: 90, label: '60-90 ימים' },
      { min: 90, max: 120, label: '90-120 ימים' },
      { min: 120, max: 180, label: '120-180 ימים' },
      { min: 180, max: Infinity, label: '180+ ימים' },
    ];

    const risk_distribution = ranges.map(range => ({
      days: range.label,
      count: customers.filter(c => c.days_since_last_order >= range.min && c.days_since_last_order < range.max).length,
    }));

    return NextResponse.json({ customers, stats, risk_distribution });
  } catch (error: any) {
    console.error('Error fetching customers at risk:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

