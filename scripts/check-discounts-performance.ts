import { query } from '../src/lib/db';

async function checkDiscountsPerformance() {
  try {
    console.log('🔍 בודק הזמנות עם קופונים...\n');

    // בדיקת הזמנות אחרונות עם קופונים
    const recentOrders = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.financial_status,
        o.created_at,
        o.discount_codes,
        o.total_discounts,
        o.total_price,
        o.store_id
      FROM orders o
      WHERE o.discount_codes IS NOT NULL 
        AND jsonb_typeof(o.discount_codes) = 'array'
        AND jsonb_array_length(o.discount_codes) > 0
      ORDER BY o.created_at DESC
      LIMIT 20
    `);

    console.log(`📦 נמצאו ${recentOrders.length} הזמנות עם קופונים:\n`);
    
    for (const order of recentOrders) {
      console.log(`הזמנה #${order.order_number}:`);
      console.log(`  - ID: ${order.id}`);
      console.log(`  - סטטוס תשלום: ${order.financial_status}`);
      console.log(`  - תאריך: ${order.created_at}`);
      console.log(`  - קופונים: ${JSON.stringify(order.discount_codes)}`);
      console.log(`  - סכום הנחה: ₪${order.total_discounts}`);
      console.log(`  - סכום כולל: ₪${order.total_price}`);
      console.log(`  - Store ID: ${order.store_id}`);
      console.log('');
    }

    // בדיקת קופונים בטבלת discount_codes
    console.log('\n🎫 בודק קופונים בטבלת discount_codes...\n');
    
    const discountCodes = await query(`
      SELECT 
        dc.id,
        dc.code,
        dc.discount_type,
        dc.usage_count,
        dc.store_id,
        dc.is_active
      FROM discount_codes dc
      ORDER BY dc.created_at DESC
      LIMIT 20
    `);

    console.log(`📋 נמצאו ${discountCodes.length} קופונים:\n`);
    
    for (const dc of discountCodes) {
      console.log(`קופון: ${dc.code}`);
      console.log(`  - ID: ${dc.id}`);
      console.log(`  - סוג: ${dc.discount_type}`);
      console.log(`  - שימושים: ${dc.usage_count}`);
      console.log(`  - פעיל: ${dc.is_active}`);
      console.log(`  - Store ID: ${dc.store_id}`);
      console.log('');
    }

    // בדיקת התאמה בין הזמנות לקופונים
    console.log('\n🔗 בודק התאמה בין הזמנות לקופונים...\n');
    
    const matchingTest = await query(`
      SELECT 
        o.id as order_id,
        o.order_number,
        o.financial_status,
        o.created_at,
        dc_elem::text as discount_code_from_order,
        dc.id as discount_code_id,
        dc.code as discount_code_from_table,
        CASE 
          WHEN dc.id IS NOT NULL THEN '✅ תואם'
          ELSE '❌ לא תואם'
        END as match_status
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE 
          WHEN o.discount_codes IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(o.discount_codes) = 'array' THEN o.discount_codes
          ELSE '[]'::jsonb
        END
      ) as dc_elem
      LEFT JOIN discount_codes dc ON dc.code = COALESCE(
        dc_elem->>'code',
        CASE 
          WHEN jsonb_typeof(dc_elem) = 'string' THEN dc_elem#>>'{}'
          WHEN jsonb_typeof(dc_elem) = 'number' THEN dc_elem::text
          ELSE NULL
        END
      )
      WHERE o.discount_codes IS NOT NULL
        AND jsonb_typeof(o.discount_codes) = 'array'
        AND jsonb_array_length(o.discount_codes) > 0
      ORDER BY o.created_at DESC
      LIMIT 20
    `);

    console.log(`🔍 תוצאות התאמה:\n`);
    
    for (const match of matchingTest) {
      console.log(`הזמנה #${match.order_number}:`);
      console.log(`  - קופון בהזמנה: ${match.discount_code_from_order}`);
      console.log(`  - קופון בטבלה: ${match.discount_code_from_table || 'לא נמצא'}`);
      console.log(`  - סטטוס תשלום: ${match.financial_status}`);
      console.log(`  - ${match.match_status}`);
      console.log('');
    }

    // בדיקת השאילתה המדויקת מהדוח
    console.log('\n📊 בודק השאילתה מהדוח (רק הזמנות ששולמו)...\n');
    
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
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
        AND o.discount_codes IS NOT NULL
        AND jsonb_typeof(o.discount_codes) = 'array'
        AND jsonb_array_length(o.discount_codes) > 0
      GROUP BY dc.id, dc.code, dc.discount_type
      ORDER BY total_discount_amount DESC
      LIMIT 50
    `);

    console.log(`📈 תוצאות הדוח (7 ימים אחרונים):\n`);
    
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

checkDiscountsPerformance();

