const { Pool } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');

// Load .env.local
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
} catch (e) {
  // Ignore if .env.local doesn't exist
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

async function verifyTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying translation tables...\n');
    
    const tables = [
      'translation_keys',
      'translations',
      'templates',
      'template_translations'
    ];
    
    for (const tableName of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`✅ ${tableName} - exists`);
        
        // Count rows
        const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`   Rows: ${countResult.rows[0].count}`);
      } else {
        console.log(`❌ ${tableName} - NOT FOUND`);
      }
    }
    
    console.log('\n✨ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTables();

