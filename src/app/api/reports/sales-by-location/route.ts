import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/reports/sales-by-location
 * דוח מכירות לפי מיקום גיאוגרפי
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // ביקורים לפי מדינה
    const countryVisits = await query<{
      country: string;
      country_code: string;
      visits: string;
      purchases: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(country, ''), 'Unknown') as country,
        COALESCE(NULLIF(country_code, ''), 'XX') as country_code,
        COUNT(*) as visits,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as purchases
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY COALESCE(NULLIF(country, ''), 'Unknown'), COALESCE(NULLIF(country_code, ''), 'XX')
      ORDER BY visits DESC
    `, [user.store_id, start_date, end_date]);

    // הזמנות והכנסות לפי מדינה (מכתובת משלוח)
    const countryOrders = await query<{
      country: string;
      orders: string;
      revenue: string;
    }>(`
      SELECT 
        COALESCE(
          (shipping_address->>'country')::text,
          (billing_address->>'country')::text,
          'Unknown'
        ) as country,
        COUNT(*) as orders,
        SUM(total_price) as revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY 1
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    // ביקורים לפי עיר
    const cityVisits = await query<{
      city: string;
      country: string;
      country_code: string;
      visits: string;
      purchases: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(city, ''), 'Unknown') as city,
        COALESCE(NULLIF(country, ''), 'Unknown') as country,
        COALESCE(NULLIF(country_code, ''), 'XX') as country_code,
        COUNT(*) as visits,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as purchases
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY 
        COALESCE(NULLIF(city, ''), 'Unknown'),
        COALESCE(NULLIF(country, ''), 'Unknown'),
        COALESCE(NULLIF(country_code, ''), 'XX')
      ORDER BY visits DESC
      LIMIT 50
    `, [user.store_id, start_date, end_date]);

    // הזמנות לפי עיר
    const cityOrders = await query<{
      city: string;
      orders: string;
      revenue: string;
    }>(`
      SELECT 
        COALESCE(
          (shipping_address->>'city')::text,
          (billing_address->>'city')::text,
          'Unknown'
        ) as city,
        COUNT(*) as orders,
        SUM(total_price) as revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY 1
      ORDER BY revenue DESC
      LIMIT 50
    `, [user.store_id, start_date, end_date]);

    // שילוב נתונים
    const ordersByCountry: Record<string, { orders: number; revenue: number }> = {};
    countryOrders.forEach((c) => {
      ordersByCountry[c.country.toLowerCase()] = {
        orders: parseInt(c.orders),
        revenue: parseFloat(c.revenue) || 0,
      };
    });

    const ordersByCity: Record<string, { orders: number; revenue: number }> = {};
    cityOrders.forEach((c) => {
      ordersByCity[c.city.toLowerCase()] = {
        orders: parseInt(c.orders),
        revenue: parseFloat(c.revenue) || 0,
      };
    });

    const countries = countryVisits.map((c) => {
      const countryKey = c.country.toLowerCase();
      const visits = parseInt(c.visits);
      const orders = ordersByCountry[countryKey]?.orders || parseInt(c.purchases);
      const revenue = ordersByCountry[countryKey]?.revenue || 0;
      
      return {
        country: c.country,
        country_code: c.country_code,
        city: '',
        visits,
        orders,
        revenue,
        conversion_rate: visits > 0 ? (orders / visits) * 100 : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const cities = cityVisits.map((c) => {
      const cityKey = c.city.toLowerCase();
      const visits = parseInt(c.visits);
      const orders = ordersByCity[cityKey]?.orders || parseInt(c.purchases);
      const revenue = ordersByCity[cityKey]?.revenue || 0;
      
      return {
        country: c.country,
        country_code: c.country_code,
        city: c.city,
        visits,
        orders,
        revenue,
        conversion_rate: visits > 0 ? (orders / visits) * 100 : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      countries,
      cities,
      totals: {
        total_visits: countryVisits.reduce((acc, c) => acc + parseInt(c.visits), 0),
        total_orders: countries.reduce((acc, c) => acc + c.orders, 0),
        total_revenue: countries.reduce((acc, c) => acc + c.revenue, 0),
        countries_count: countries.length,
        cities_count: cities.length,
      },
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching sales by location:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

