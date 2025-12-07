#!/usr/bin/env ts-node

/**
 * Reset Database Script - מאפס את כל הדאטהבייס ומריץ את הסכמה המלאה
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// טוען .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL לא מוגדר ב-.env.local');
  process.exit(1);
}

async function resetDatabase() {
  console.log('🔄 מתחיל איפוס דאטהבייס...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    // 1. Drop all tables
    console.log('1️⃣  מוחק את כל הטבלאות...');
    await pool.query('DROP SCHEMA public CASCADE;');
    await pool.query('CREATE SCHEMA public;');
    await pool.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('✅ כל הטבלאות נמחקו\n');

    // 2. Run schema.sql
    console.log('2️⃣  מריץ את schema.sql...');
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('✅ הסכמה נוצרה בהצלחה\n');

    console.log('✅ איפוס הדאטהבייס הושלם בהצלחה!');
    console.log('💡 כעת תוכל להריץ: npm run seed לטעינת נתונים לדוגמה');

  } catch (error) {
    console.error('❌ שגיאה באיפוס הדאטהבייס:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

resetDatabase();

