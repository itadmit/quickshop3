import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cohort data - customers grouped by first purchase month
    const cohortData = await query<{
      cohort_month: string;
      order_month: string;
      customers_count: string;
      total_revenue: string;
    }>(`
      WITH customer_cohorts AS (
        SELECT 
          customer_id,
          DATE_TRUNC('month', MIN(created_at)) as cohort_month
        FROM orders
        WHERE store_id = $1 AND customer_id IS NOT NULL AND financial_status IN ('paid', 'partially_paid', 'authorized')
        GROUP BY customer_id
      ),
      monthly_activity AS (
        SELECT 
          cc.cohort_month,
          DATE_TRUNC('month', o.created_at) as order_month,
          COUNT(DISTINCT o.customer_id) as customers_count,
          SUM(o.total_price) as total_revenue
        FROM orders o
        JOIN customer_cohorts cc ON cc.customer_id = o.customer_id
        WHERE o.store_id = $1 AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
        GROUP BY cc.cohort_month, DATE_TRUNC('month', o.created_at)
      )
      SELECT 
        cohort_month::text,
        order_month::text,
        customers_count,
        total_revenue
      FROM monthly_activity
      WHERE cohort_month >= NOW() - INTERVAL '12 months'
      ORDER BY cohort_month, order_month
    `, [user.store_id]);

    // Get initial cohort sizes
    const cohortSizes = await query<{
      cohort_month: string;
      initial_customers: string;
    }>(`
      SELECT 
        DATE_TRUNC('month', MIN(created_at))::text as cohort_month,
        COUNT(DISTINCT customer_id) as initial_customers
      FROM orders
      WHERE store_id = $1 AND customer_id IS NOT NULL AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY customer_id
      HAVING DATE_TRUNC('month', MIN(created_at)) >= NOW() - INTERVAL '12 months'
    `, [user.store_id]);

    // Build cohort map
    const cohortMap = new Map<string, number>();
    const cohortSizeMap = new Map<string, number>();
    
    cohortSizes.forEach(cs => {
      const key = cs.cohort_month.substring(0, 7);
      cohortSizeMap.set(key, (cohortSizeMap.get(key) || 0) + 1);
    });

    // Group data by cohort
    const cohortsGrouped = new Map<string, { order_month: string; customers: number; revenue: number }[]>();
    
    cohortData.forEach(row => {
      const cohortKey = row.cohort_month.substring(0, 7);
      const orderKey = row.order_month.substring(0, 7);
      
      if (!cohortsGrouped.has(cohortKey)) {
        cohortsGrouped.set(cohortKey, []);
      }
      cohortsGrouped.get(cohortKey)!.push({
        order_month: orderKey,
        customers: parseInt(row.customers_count),
        revenue: parseFloat(row.total_revenue) || 0,
      });
    });

    // Build cohorts array
    const cohorts = Array.from(cohortsGrouped.entries())
      .map(([cohortMonth, data]) => {
        const cohortDate = new Date(cohortMonth + '-01');
        const initialSize = cohortSizeMap.get(cohortMonth) || 1;

        const months = data.map(d => {
          const orderDate = new Date(d.order_month + '-01');
          const monthDiff = (orderDate.getFullYear() - cohortDate.getFullYear()) * 12 + 
                           (orderDate.getMonth() - cohortDate.getMonth());
          return {
            month: monthDiff,
            retention_rate: (d.customers / initialSize) * 100,
            revenue: d.revenue,
            customers: d.customers,
          };
        }).filter(m => m.month >= 0 && m.month < 12);

        return {
          cohort_month: cohortMonth,
          customers_count: initialSize,
          months,
        };
      })
      .sort((a, b) => b.cohort_month.localeCompare(a.cohort_month));

    // Calculate totals
    const allRetentionRates = cohorts.flatMap(c => c.months.filter(m => m.month > 0).map(m => m.retention_rate));
    const totals = {
      total_customers: Array.from(cohortSizeMap.values()).reduce((a, b) => a + b, 0),
      avg_retention: allRetentionRates.length > 0 ? allRetentionRates.reduce((a, b) => a + b, 0) / allRetentionRates.length : 0,
    };

    return NextResponse.json({ cohorts, totals });
  } catch (error: any) {
    console.error('Error fetching customer cohorts:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

