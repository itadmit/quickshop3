import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

/**
 * CRON Job: העברת מוצרים לארכיון אוטומטית
 * נקרא כל שעה דרך Upstash QStash
 * 
 * תהליך:
 * 1. מוצא מוצרים עם archived_at <= now() ו-status != 'archived'
 * 2. מעדכן אותם ל-status = 'archived'
 */
async function handler(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[CRON archive-products] Starting at ${timestamp}`);
    
    const now = new Date().toISOString();
    
    // מצא מוצרים שצריכים לעבור לארכיון
    console.log(`[CRON archive-products] Checking for products to archive (archived_at <= ${now})`);
    const productsToArchive = await query<{ id: number; store_id: number; title: string }>(
      `SELECT id, store_id, title 
       FROM products 
       WHERE archived_at IS NOT NULL 
       AND archived_at <= $1 
       AND status != 'archived'`,
      [now]
    );

    console.log(`[CRON archive-products] Found ${productsToArchive.length} products to archive`);

    if (productsToArchive.length === 0) {
      const duration = Date.now() - startTime;
      console.log(`[CRON archive-products] Completed successfully in ${duration}ms - No products to archive`);
      return NextResponse.json({
        success: true,
        archived: 0,
        message: 'No products to archive',
        timestamp: now,
        duration_ms: duration,
      });
    }

    // עדכן את כל המוצרים לארכיון
    console.log(`[CRON archive-products] Archiving ${productsToArchive.length} products...`);
    const result = await query(
      `UPDATE products 
       SET status = 'archived', updated_at = now()
       WHERE archived_at IS NOT NULL 
       AND archived_at <= $1 
       AND status != 'archived'
       RETURNING id, title, store_id`,
      [now]
    );

    const duration = Date.now() - startTime;
    console.log(`[CRON archive-products] ✅ Successfully archived ${result.length} products in ${duration}ms`);
    console.log(`[CRON archive-products] Archived products:`, result.map((p: any) => `ID: ${p.id}, Title: ${p.title}, Store: ${p.store_id}`).join(', '));

    return NextResponse.json({
      success: true,
      archived: result.length,
      products: result.map((p: any) => ({
        id: p.id,
        title: p.title,
        store_id: p.store_id,
      })),
      timestamp: now,
      duration_ms: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[CRON archive-products] ❌ Error after ${duration}ms:`, error);
    console.error(`[CRON archive-products] Error stack:`, error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to archive products',
        timestamp,
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}

// QStash signature verification (אם יש QSTASH_TOKEN ו-QSTASH_CURRENT_SIGNING_KEY)
const hasQStashConfig = process.env.QSTASH_TOKEN && process.env.QSTASH_CURRENT_SIGNING_KEY;

export const GET = hasQStashConfig 
  ? verifySignatureAppRouter(handler)
  : handler;

export const POST = hasQStashConfig
  ? verifySignatureAppRouter(handler)
  : handler;

