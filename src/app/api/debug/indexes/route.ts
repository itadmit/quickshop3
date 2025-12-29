/**
 * API endpoint לבדיקת אינדקסים
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Checking stores table indexes...\n');
    
    // בדיקת אינדקסים
    const indexes = await query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'stores'
      ORDER BY indexname;
    `);
    
    // בדיקת מספר רשומות
    const count = await query(`SELECT COUNT(*) as count FROM stores`);
    
    // בדיקת ביצועים של השאילתה - 3 פעמים
    const timings = [];
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      await query(`SELECT * FROM stores WHERE slug = 'new' AND is_active = true`);
      timings.push(Date.now() - start);
    }
    
    // EXPLAIN ANALYZE
    const explainResult = await query(`
      EXPLAIN ANALYZE
      SELECT * FROM stores WHERE slug = 'new' AND is_active = true
    `);
    
    return NextResponse.json({
      success: true,
      indexes: indexes.map((idx: any) => ({
        name: idx.indexname,
        definition: idx.indexdef
      })),
      totalStores: count[0]?.count || 0,
      queryTimings: {
        first: `${timings[0]}ms`,
        second: `${timings[1]}ms`, 
        third: `${timings[2]}ms`,
        average: `${Math.round(timings.reduce((a, b) => a + b, 0) / 3)}ms`
      },
      queryPlan: explainResult.map((row: any) => row['QUERY PLAN'] || row['query plan'] || JSON.stringify(row))
    });
  } catch (error: any) {
    console.error('Error checking indexes:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

