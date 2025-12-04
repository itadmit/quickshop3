#!/usr/bin/env ts-node
/**
 * Script to setup database schema on Neon
 * Usage: npm run setup-db
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('💡 Create .env.local file with your Neon connection string');
  process.exit(1);
}

async function setupDatabase() {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('🔄 Connecting to Neon database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');

    // Read schema file
    const schemaPath = join(process.cwd(), 'sql', 'schema.sql');
    console.log('📖 Reading schema file...');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and execute each statement
    console.log('🚀 Executing schema...');
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    let errors = 0;

    for (const statement of statements) {
      try {
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.length === 0) {
          continue;
        }

        await pool.query(statement);
        executed++;
        
        // Show progress every 10 statements
        if (executed % 10 === 0) {
          process.stdout.write(`\r   Executed ${executed} statements...`);
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.error(`\n❌ Error executing statement:`, error.message);
          errors++;
        }
      }
    }

    console.log(`\n✅ Schema setup complete!`);
    console.log(`   Executed: ${executed} statements`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} (some may be expected)`);
    }

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\n📊 Created ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, index) => {
      if (index < 10) {
        console.log(`   - ${row.table_name}`);
      } else if (index === 10) {
        console.log(`   ... and ${tablesResult.rows.length - 10} more`);
      }
    });

  } catch (error: any) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();

