import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer LTV data
    const customerData = await query<{
      customer_id: number;
      first_name: string;
      last_name: string;
      email: string;
      first_order_date: string;
      last_order_date: string;
      total_orders: string;
      total_spent: string;
    }>(`
      SELECT 
        c.id as customer_id,
        c.first_name,
        c.last_name,
        c.email,
        MIN(o.created_at) as first_order_date,
        MAX(o.created_at) as last_order_date,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      WHERE c.store_id = $1
      GROUP BY c.id, c.first_name, c.last_name, c.email
      HAVING COUNT(o.id) > 0
      ORDER BY total_spent DESC
      LIMIT 200
    `, [user.store_id]);

    const customers = customerData.map(c => {
      const totalSpent = parseFloat(c.total_spent) || 0;
      const totalOrders = parseInt(c.total_orders) || 0;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const firstDate = c.first_order_date ? new Date(c.first_order_date) : new Date();
      const lastDate = c.last_order_date ? new Date(c.last_order_date) : new Date();
      const daysAsCustomer = Math.max(1, Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Simple LTV prediction: (total_spent / days_as_customer) * 365
      const dailyValue = totalSpent / Math.max(daysAsCustomer, 1);
      const predictedLtv = dailyValue * 365;

      return {
        customer_id: c.customer_id,
        customer_name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'אורח',
        email: c.email || '',
        first_order_date: c.first_order_date,
        last_order_date: c.last_order_date,
        total_orders: totalOrders,
        total_spent: totalSpent,
        avg_order_value: avgOrderValue,
        days_as_customer: daysAsCustomer,
        predicted_ltv: predictedLtv,
      };
    });

    // Calculate stats
    const ltvValues = customers.map(c => c.total_spent).sort((a, b) => a - b);
    const stats = {
      avg_ltv: customers.length > 0 ? customers.reduce((acc, c) => acc + c.total_spent, 0) / customers.length : 0,
      median_ltv: ltvValues.length > 0 ? ltvValues[Math.floor(ltvValues.length / 2)] : 0,
      total_customers: customers.length,
      customers_with_orders: customers.filter(c => c.total_orders > 0).length,
      avg_orders_per_customer: customers.length > 0 ? customers.reduce((acc, c) => acc + c.total_orders, 0) / customers.length : 0,
      avg_customer_lifespan_days: customers.length > 0 ? customers.reduce((acc, c) => acc + c.days_as_customer, 0) / customers.length : 0,
    };

    // LTV Distribution
    const ranges = [
      { min: 0, max: 100, label: '₪0-100' },
      { min: 100, max: 500, label: '₪100-500' },
      { min: 500, max: 1000, label: '₪500-1,000' },
      { min: 1000, max: 5000, label: '₪1,000-5,000' },
      { min: 5000, max: 10000, label: '₪5,000-10,000' },
      { min: 10000, max: Infinity, label: '₪10,000+' },
    ];

    const ltv_distribution = ranges.map(range => ({
      range: range.label,
      count: customers.filter(c => c.total_spent >= range.min && c.total_spent < range.max).length,
    }));

    return NextResponse.json({ customers, stats, ltv_distribution });
  } catch (error: any) {
    console.error('Error fetching customer LTV:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

