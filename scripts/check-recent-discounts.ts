import { query } from '../src/lib/db';

async function checkRecentDiscounts() {
  try {
    console.log('🔍 בודק הזמנות אחרונות עם קופונים...\n');

    // בדיקת הזמנות אחרונות עם קופונים (7 ימים אחרונים)
    const recentOrders = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.financial_status,
        o.created_at,
        DATE(o.created_at) as order_date,
        o.discount_codes,
        o.total_discounts,
        o.total_price,
        o.store_id
      FROM orders o
      WHERE o.discount_codes IS NOT NULL 
        AND jsonb_typeof(o.discount_codes) = 'array'
        AND jsonb_array_length(o.discount_codes) > 0
        AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY o.created_at DESC
    `);

    console.log(`📦 נמצאו ${recentOrders.length} הזמנות עם קופונים (7 ימים אחרונים):\n`);
    
    for (const order of recentOrders) {
      const codes = Array.isArray(order.discount_codes) 
        ? order.discount_codes.map((c: any) => typeof c === 'string' ? c : c.code || c).join(', ')
        : JSON.stringify(order.discount_codes);
      
      console.log(`הזמנה #${order.order_number}:`);
      console.log(`  - ID: ${order.id}`);
      console.log(`  - סטטוס תשלום: ${order.financial_status}`);
      console.log(`  - תאריך: ${order.created_at} (${order.order_date})`);
      console.log(`  - קופונים: ${codes}`);
      console.log(`  - סכום הנחה: ₪${order.total_discounts}`);
      console.log(`  - סכום כולל: ₪${order.total_price}`);
      console.log('');
    }

    // בדיקת השאילתה המדויקת מהדוח עם תאריכים של 7 ימים אחרונים
    console.log(`\n📊 בודק דוח עם תאריכים של 7 ימים אחרונים...\n`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const start_date = startDate.toISOString().split('T')[0];
    const end_date = new Date().toISOString().split('T')[0];

    console.log(`תאריך התחלה: ${start_date}`);
    console.log(`תאריך סיום: ${end_date}\n`);

    const reportData = await query(`
      SELECT 
        dc.code as discount_code,
        dc.discount_type,
        COALESCE(dc.usage_count, 0) as usage_count,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total_discounts) as total_discount_amount,
        SUM(o.total_price) as revenue_generated,
        AVG(o.total_price) as avg_order_value
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE 
          WHEN o.discount_codes IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(o.discount_codes) = 'array' THEN o.discount_codes
          ELSE '[]'::jsonb
        END
      ) as dc_elem
      JOIN discount_codes dc ON dc.code = COALESCE(
        dc_elem->>'code',
        CASE 
          WHEN jsonb_typeof(dc_elem) = 'string' THEN dc_elem#>>'{}'
          WHEN jsonb_typeof(dc_elem) = 'number' THEN dc_elem::text
          ELSE NULL
        END
      )
      WHERE o.store_id = $1
        AND o.created_at >= $2::date
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
        AND o.discount_codes IS NOT NULL
        AND jsonb_typeof(o.discount_codes) = 'array'
        AND jsonb_array_length(o.discount_codes) > 0
        AND dc.store_id = $1
      GROUP BY dc.id, dc.code, dc.discount_type
      ORDER BY total_discount_amount DESC
      LIMIT 50
    `, [1, start_date, end_date]);

    console.log(`📈 תוצאות הדוח:\n`);
    
    if (reportData.length === 0) {
      console.log('❌ לא נמצאו קופונים בדוח');
    } else {
      for (const row of reportData) {
        console.log(`קופון: ${row.discount_code}`);
        console.log(`  - סוג: ${row.discount_type}`);
        console.log(`  - שימושים בטבלה: ${row.usage_count}`);
        console.log(`  - הזמנות בדוח: ${row.orders_count}`);
        console.log(`  - סכום הנחה: ₪${row.total_discount_amount}`);
        console.log(`  - הכנסות: ₪${row.revenue_generated}`);
        console.log('');
      }
    }

    // בדיקת הזמנות ספציפיות שלא מופיעות בדוח
    console.log(`\n🔍 בודק הזמנות שלא מופיעות בדוח (pending/refunded)...\n`);

    const excludedOrders = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.financial_status,
        o.created_at,
        o.discount_codes,
        o.total_discounts,
        o.total_price
      FROM orders o
      WHERE o.store_id = 1
        AND o.created_at >= $1::date
        AND o.created_at <= $2::date + interval '1 day'
        AND o.discount_codes IS NOT NULL
        AND jsonb_typeof(o.discount_codes) = 'array'
        AND jsonb_array_length(o.discount_codes) > 0
        AND o.financial_status NOT IN ('paid', 'partially_paid', 'authorized')
      ORDER BY o.created_at DESC
    `, [start_date, end_date]);

    console.log(`📋 הזמנות שלא מופיעות בדוח (${excludedOrders.length}):\n`);
    
    for (const order of excludedOrders) {
      const codes = Array.isArray(order.discount_codes) 
        ? order.discount_codes.map((c: any) => typeof c === 'string' ? c : c.code || c).join(', ')
        : JSON.stringify(order.discount_codes);
      
      console.log(`הזמנה #${order.order_number}:`);
      console.log(`  - סטטוס: ${order.financial_status} (לא נכלל בדוח)`);
      console.log(`  - תאריך: ${order.created_at}`);
      console.log(`  - קופונים: ${codes}`);
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ שגיאה:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkRecentDiscounts();



