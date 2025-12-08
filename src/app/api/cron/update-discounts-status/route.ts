import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

/**
 * CRON Job: עדכון סטטוס הנחות וקופונים לפי תאריכים
 * נקרא כל שעה דרך Upstash QStash
 * 
 * תהליך:
 * 1. מפעיל הנחות/קופונים שהגיע הזמן שלהם (starts_at <= now() ו-is_active = false)
 * 2. מפסיק הנחות/קופונים שפג תוקף (ends_at < now() ו-is_active = true)
 * 
 * הערה: זה לא מחליף את הבדיקה בזמן אמת, אלא משפר ביצועים ורשימות בדשבורד
 */
async function handler(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[CRON update-discounts-status] Starting at ${timestamp}`);
    
    const now = new Date().toISOString();
    
    // 1. הפעלת הנחות אוטומטיות שהגיע הזמן שלהן
    console.log(`[CRON update-discounts-status] Activating automatic discounts that should start...`);
    const activatedAutomatic = await query(
      `UPDATE automatic_discounts 
       SET is_active = true, updated_at = now()
       WHERE starts_at IS NOT NULL 
       AND starts_at <= $1 
       AND is_active = false
       RETURNING id, name, store_id`,
      [now]
    );

    // 2. הפסקת הנחות אוטומטיות שפג תוקף
    console.log(`[CRON update-discounts-status] Deactivating automatic discounts that expired...`);
    const deactivatedAutomatic = await query(
      `UPDATE automatic_discounts 
       SET is_active = false, updated_at = now()
       WHERE ends_at IS NOT NULL 
       AND ends_at < $1 
       AND is_active = true
       RETURNING id, name, store_id`,
      [now]
    );

    // 3. הפעלת קופונים שהגיע הזמן שלהם
    console.log(`[CRON update-discounts-status] Activating discount codes that should start...`);
    const activatedCodes = await query(
      `UPDATE discount_codes 
       SET is_active = true, updated_at = now()
       WHERE starts_at IS NOT NULL 
       AND starts_at <= $1 
       AND is_active = false
       RETURNING id, code, store_id`,
      [now]
    );

    // 4. הפסקת קופונים שפג תוקף
    console.log(`[CRON update-discounts-status] Deactivating discount codes that expired...`);
    const deactivatedCodes = await query(
      `UPDATE discount_codes 
       SET is_active = false, updated_at = now()
       WHERE ends_at IS NOT NULL 
       AND ends_at < $1 
       AND is_active = true
       RETURNING id, code, store_id`,
      [now]
    );

    const duration = Date.now() - startTime;
    
    const summary = {
      automatic_discounts: {
        activated: activatedAutomatic.length,
        deactivated: deactivatedAutomatic.length,
      },
      discount_codes: {
        activated: activatedCodes.length,
        deactivated: deactivatedCodes.length,
      },
    };

    console.log(`[CRON update-discounts-status] ✅ Completed in ${duration}ms`);
    console.log(`[CRON update-discounts-status] Summary:`, JSON.stringify(summary, null, 2));
    
    if (activatedAutomatic.length > 0) {
      console.log(`[CRON update-discounts-status] Activated automatic discounts:`, 
        activatedAutomatic.map((d: any) => `ID: ${d.id}, Name: ${d.name}, Store: ${d.store_id}`).join(', '));
    }
    if (deactivatedAutomatic.length > 0) {
      console.log(`[CRON update-discounts-status] Deactivated automatic discounts:`, 
        deactivatedAutomatic.map((d: any) => `ID: ${d.id}, Name: ${d.name}, Store: ${d.store_id}`).join(', '));
    }
    if (activatedCodes.length > 0) {
      console.log(`[CRON update-discounts-status] Activated discount codes:`, 
        activatedCodes.map((d: any) => `ID: ${d.id}, Code: ${d.code}, Store: ${d.store_id}`).join(', '));
    }
    if (deactivatedCodes.length > 0) {
      console.log(`[CRON update-discounts-status] Deactivated discount codes:`, 
        deactivatedCodes.map((d: any) => `ID: ${d.id}, Code: ${d.code}, Store: ${d.store_id}`).join(', '));
    }

    return NextResponse.json({
      success: true,
      ...summary,
      timestamp,
      duration_ms: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[CRON update-discounts-status] ❌ Error after ${duration}ms:`, error);
    console.error(`[CRON update-discounts-status] Error stack:`, error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update discounts status',
        timestamp,
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}

// QStash signature verification
const hasQStashConfig = process.env.QSTASH_TOKEN && process.env.QSTASH_CURRENT_SIGNING_KEY;

export const GET = hasQStashConfig 
  ? verifySignatureAppRouter(handler)
  : handler;

export const POST = hasQStashConfig
  ? verifySignatureAppRouter(handler)
  : handler;

