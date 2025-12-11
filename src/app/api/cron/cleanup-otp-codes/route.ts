import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

/**
 * CRON Job: ניקוי קודי OTP ישנים
 * נקרא כל יום דרך Upstash QStash
 * 
 * תהליך:
 * 1. מוחק קודי OTP שפג תוקף לפני יותר מ-24 שעות
 * 2. מוחק קודי OTP שכבר שימשו לפני יותר מ-7 ימים
 * 3. מוחק קודי OTP עם יותר מדי ניסיונות שגויים לפני יותר מ-24 שעות
 * 
 * זה מונע הצטברות של קודי OTP ישנים במסד הנתונים
 */
async function handler(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[CRON cleanup-otp-codes] Starting at ${timestamp}`);
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 שעות אחורה
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 ימים אחורה
    
    // 1. מוחק קודי OTP שפג תוקף לפני יותר מ-24 שעות
    console.log(`[CRON cleanup-otp-codes] Deleting expired OTP codes older than 24 hours...`);
    const deletedExpired = await query(
      `DELETE FROM otp_codes 
       WHERE expires_at < $1 
       AND (used_at IS NULL OR used_at IS NOT NULL)`,
      [oneDayAgo.toISOString()]
    );

    // 2. מוחק קודי OTP שכבר שימשו לפני יותר מ-7 ימים
    console.log(`[CRON cleanup-otp-codes] Deleting used OTP codes older than 7 days...`);
    const deletedUsed = await query(
      `DELETE FROM otp_codes 
       WHERE used_at IS NOT NULL 
       AND used_at < $1`,
      [sevenDaysAgo.toISOString()]
    );

    // 3. מוחק קודי OTP עם יותר מדי ניסיונות שגויים לפני יותר מ-24 שעות
    console.log(`[CRON cleanup-otp-codes] Deleting OTP codes with max attempts exceeded older than 24 hours...`);
    const deletedMaxAttempts = await query(
      `DELETE FROM otp_codes 
       WHERE attempts >= max_attempts 
       AND expires_at < $1`,
      [oneDayAgo.toISOString()]
    );

    const totalDeleted = deletedExpired.length + deletedUsed.length + deletedMaxAttempts.length;
    const duration = Date.now() - startTime;
    
    const summary = {
      expired_codes_deleted: deletedExpired.length,
      used_codes_deleted: deletedUsed.length,
      max_attempts_codes_deleted: deletedMaxAttempts.length,
      total_deleted: totalDeleted,
    };

    console.log(`[CRON cleanup-otp-codes] ✅ Completed in ${duration}ms`);
    console.log(`[CRON cleanup-otp-codes] Summary:`, JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      ...summary,
      timestamp,
      duration_ms: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[CRON cleanup-otp-codes] ❌ Error after ${duration}ms:`, error);
    console.error(`[CRON cleanup-otp-codes] Error stack:`, error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to cleanup OTP codes',
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



