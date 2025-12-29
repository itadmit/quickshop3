/**
 * בדיקת אינדקסים בטבלת stores
 */

import { query } from '../src/lib/db';

async function checkIndexes() {
  console.log('🔍 Checking stores table indexes...\n');
  
  // בדיקת אינדקסים
  const indexes = await query(`
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'stores'
    ORDER BY indexname;
  `);
  
  console.log('📋 Existing indexes:');
  indexes.forEach((idx: any) => {
    console.log(`  ✓ ${idx.indexname}`);
    console.log(`    ${idx.indexdef}\n`);
  });
  
  // בדיקת מספר רשומות
  const count = await query(`SELECT COUNT(*) as count FROM stores`);
  console.log(`📊 Total stores: ${count[0].count}\n`);
  
  // בדיקת ביצועים של השאילתה
  console.log('⏱️  Testing query performance...\n');
  
  const start = Date.now();
  const result = await query(`
    EXPLAIN ANALYZE
    SELECT * FROM stores WHERE slug = 'new' AND is_active = true
  `);
  const duration = Date.now() - start;
  
  console.log('Query plan:');
  result.forEach((row: any) => {
    console.log(`  ${row['QUERY PLAN']}`);
  });
  
  console.log(`\n⏱️  Query took: ${duration}ms\n`);
  
  // בדיקת סטטיסטיקות
  const stats = await query(`
    SELECT 
      schemaname,
      tablename,
      n_live_tup as rows,
      n_dead_tup as dead_rows,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE tablename = 'stores';
  `);
  
  if (stats.length > 0) {
    console.log('📊 Table statistics:');
    console.log(`  Rows: ${stats[0].rows}`);
    console.log(`  Dead rows: ${stats[0].dead_rows}`);
    console.log(`  Last analyze: ${stats[0].last_analyze || 'Never'}`);
    console.log(`  Last vacuum: ${stats[0].last_vacuum || 'Never'}`);
  }
  
  process.exit(0);
}

checkIndexes().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

