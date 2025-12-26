import { query } from '../src/lib/db';

async function checkNewDiscount() {
  try {
    console.log('🔍 בודק קופונים חדשים והזמנות...\n');

    // בדיקת קופונים שנוצרו היום
    const todayCodes = await query(`
      SELECT 
        dc.id,
        dc.code,
        dc.discount_type,
        dc.created_at,
        dc.usage_count,
        dc.is_active
      FROM discount_codes dc
      WHERE DATE(dc.created_at) = CURRENT_DATE
      ORDER BY dc.created_at DESC
    `);

    console.log(`📅 קופונים שנוצרו היום: ${todayCodes.length}\n`);
    
    for (const dc of todayCodes) {
      console.log(`קופון: ${dc.code}`);
      console.log(`  - ID: ${dc.id}`);
      console.log(`  - סוג: ${dc.discount_type}`);
      console.log(`  - נוצר: ${dc.created_at}`);
      console.log(`  - שימושים: ${dc.usage_count}`);
      console.log(`  - פעיל: ${dc.is_active}`);
      console.log('');

      // בדיקת הזמנות עם הקופון הזה
      const ordersWithCode = await query(`
        SELECT 
          o.id,
          o.order_number,
          o.financial_status,
          o.created_at,
          o.total_discounts,
          o.total_price
        FROM orders o
        WHERE o.discount_codes @> jsonb_build_array($1)
        ORDER BY o.created_at DESC
      `, [dc.code]);

      console.log(`  📦 הזמנות עם קופון זה: ${ordersWithCode.length}`);
      for (const order of ordersWithCode) {
        console.log(`    - הזמנה #${order.order_number}: ${order.financial_status} (נוצר: ${order.created_at})`);
      }
      console.log('');
    }

    // בדיקת הזמנות שנוצרו היום עם קופונים
    const todayOrders = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.financial_status,
        o.created_at,
        o.discount_codes,
        o.total_discounts,
        o.total_price
      FROM orders o
      WHERE DATE(o.created_at) = CURRENT_DATE
        AND o.discount_codes IS NOT NULL
        AND jsonb_typeof(o.discount_codes) = 'array'
        AND jsonb_array_length(o.discount_codes) > 0
      ORDER BY o.created_at DESC
    `);

    console.log(`\n📦 הזמנות שנוצרו היום עם קופונים: ${todayOrders.length}\n`);
    
    for (const order of todayOrders) {
      console.log(`הזמנה #${order.order_number}:`);
      console.log(`  - סטטוס: ${order.financial_status}`);
      console.log(`  - נוצר: ${order.created_at}`);
      console.log(`  - קופונים: ${JSON.stringify(order.discount_codes)}`);
      console.log('');
    }

    // בדיקת השאילתה המדויקת מהדוח עם תאריכים של היום
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📊 בודק דוח עם תאריכים של היום (${today})...\n`);

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
    `, [1, today, today]);

    console.log(`📈 תוצאות הדוח (היום):\n`);
    
    if (reportData.length === 0) {
      console.log('❌ לא נמצאו קופונים בדוח');
    } else {
      for (const row of reportData) {
        console.log(`קופון: ${row.discount_code}`);
        console.log(`  - סוג: ${row.discount_type}`);
        console.log(`  - שימושים: ${row.usage_count}`);
        console.log(`  - הזמנות: ${row.orders_count}`);
        console.log(`  - סכום הנחה: ₪${row.total_discount_amount}`);
        console.log(`  - הכנסות: ₪${row.revenue_generated}`);
        console.log('');
      }
    }

  } catch (error: any) {
    console.error('❌ שגיאה:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkNewDiscount();

