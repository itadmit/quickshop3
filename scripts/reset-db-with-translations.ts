/**
 * Reset Database with Translations Tables
 * איפוס מסד נתונים עם טבלאות תרגומים
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database reset...');
    
    // קריאת schema.sql
    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    
    // ביצוע Schema
    console.log('📝 Executing schema...');
    await client.query(schemaSQL);
    
    console.log('✅ Database reset completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - translation_keys');
    console.log('   - translations');
    console.log('   - templates');
    console.log('   - template_translations');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

