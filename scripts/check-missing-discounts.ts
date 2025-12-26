import { query } from '../src/lib/db';

async function checkMissingDiscounts() {
  try {
    console.log('🔍 בודק קופונים שלא מופיעים בדוח...\n');

    // כל הקופונים הפעילים
    const allCodes = await query(`
      SELECT 
        dc.id,
        dc.code,
        dc.discount_type,
        dc.created_at,
        dc.usage_count,
        dc.is_active,
        dc.store_id
      FROM discount_codes dc
      WHERE dc.is_active = true
        AND dc.store_id = 1
      ORDER BY dc.created_at DESC
    `);

    console.log(`📋 כל הקופונים הפעילים: ${allCodes.length}\n`);

    // תאריכים של 7 ימים אחרונים
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const start_date = startDate.toISOString().split('T')[0];
    const end_date = new Date().toISOString().split('T')[0];

    console.log(`תאריך התחלה: ${start_date}`);
    console.log(`תאריך סיום: ${end_date}\n`);

    // קופונים שמופיעים בדוח
    const codesInReport = await query(`
      SELECT DISTINCT
        dc.code as discount_code
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
    `, [1, start_date, end_date]);

    const codesInReportSet = new Set(codesInReport.map((r: any) => r.discount_code));

    console.log(`📊 קופונים שמופיעים בדוח: ${codesInReport.length}\n`);

    // קופונים שלא מופיעים בדוח
    const missingCodes = allCodes.filter((dc: any) => !codesInReportSet.has(dc.code));

    console.log(`❌ קופונים שלא מופיעים בדוח: ${missingCodes.length}\n`);

    for (const dc of missingCodes) {
      console.log(`קופון: ${dc.code}`);
      console.log(`  - ID: ${dc.id}`);
      console.log(`  - סוג: ${dc.discount_type}`);
      console.log(`  - נוצר: ${dc.created_at}`);
      console.log(`  - שימושים: ${dc.usage_count}`);

      // בדיקת הזמנות עם הקופון הזה
      const ordersWithCode = await query(`
        SELECT 
          o.id,
          o.order_number,
          o.financial_status,
          o.created_at,
          DATE(o.created_at) as order_date,
          o.total_discounts,
          o.total_price
        FROM orders o
        WHERE o.discount_codes @> jsonb_build_array($1::text)
          AND o.created_at >= $2::date
          AND o.created_at <= $3::date + interval '1 day'
        ORDER BY o.created_at DESC
      `, [dc.code, start_date, end_date]);

      console.log(`  - הזמנות בטווח התאריכים: ${ordersWithCode.length}`);
      
      if (ordersWithCode.length > 0) {
        for (const order of ordersWithCode) {
          console.log(`    * הזמנה #${order.order_number}: ${order.financial_status} (${order.order_date})`);
        }
      } else {
        console.log(`    * אין הזמנות בטווח התאריכים`);
      }

      // בדיקת כל ההזמנות עם הקופון הזה (ללא הגבלת תאריכים)
      const allOrdersWithCode = await query(`
        SELECT 
          o.id,
          o.order_number,
          o.financial_status,
          o.created_at
        FROM orders o
        WHERE o.discount_codes @> jsonb_build_array($1::text)
        ORDER BY o.created_at DESC
        LIMIT 5
      `, [dc.code]);

      if (allOrdersWithCode.length > 0) {
        console.log(`  - כל ההזמנות עם קופון זה (5 אחרונות):`);
        for (const order of allOrdersWithCode) {
          console.log(`    * הזמנה #${order.order_number}: ${order.financial_status} (${order.created_at})`);
        }
      } else {
        console.log(`  - אין הזמנות עם קופון זה בכלל`);
      }

      console.log('');
    }

  } catch (error: any) {
    console.error('❌ שגיאה:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkMissingDiscounts();

