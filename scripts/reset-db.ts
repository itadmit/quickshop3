#!/usr/bin/env ts-node
/**
 * Script to reset and setup database schema on Neon
 * This will DROP all existing tables and recreate them
 * Usage: npm run reset-db
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

async function resetDatabase() {
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

    // Drop all tables (CASCADE to handle foreign keys)
    console.log('🗑️  Dropping all existing tables...');
    
    const dropResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    if (dropResult.rows.length > 0) {
      console.log(`   Found ${dropResult.rows.length} tables to drop`);
      
      // Drop all tables with CASCADE
      for (const row of dropResult.rows) {
        try {
          await pool.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
          console.log(`   ✓ Dropped ${row.tablename}`);
        } catch (error: any) {
          console.log(`   ⚠ Could not drop ${row.tablename}: ${error.message}`);
        }
      }
      
      console.log('✅ All tables dropped');
    } else {
      console.log('   No existing tables found');
    }

    // Read schema file
    const schemaPath = join(process.cwd(), 'sql', 'schema.sql');
    console.log('\n📖 Reading schema file...');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute the entire schema
    console.log('🚀 Creating schema...');
    
    // Split by semicolons but keep CREATE statements together
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('-- ='));

    let executed = 0;
    let errors = 0;

    for (const statement of statements) {
      try {
        // Skip comments
        if (statement.startsWith('--') || statement.length === 0) {
          continue;
        }

        // Execute statement
        await pool.query(statement);
        executed++;
        
        // Show progress every 5 statements
        if (executed % 5 === 0) {
          process.stdout.write(`\r   Executed ${executed} statements...`);
        }
      } catch (error: any) {
        // Ignore "already exists" errors (shouldn't happen after drop, but just in case)
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.error(`\n❌ Error executing statement:`, error.message);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
          errors++;
        }
      }
    }

    console.log(`\n✅ Schema setup complete!`);
    console.log(`   Executed: ${executed} statements`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} (check above for details)`);
    }

    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\n📊 Created ${tablesResult.rows.length} tables:`);
    const tablesToShow = tablesResult.rows.slice(0, 20);
    tablesToShow.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    if (tablesResult.rows.length > 20) {
      console.log(`   ... and ${tablesResult.rows.length - 20} more`);
    }

    console.log('\n🎉 Database reset and schema loaded successfully!');

  } catch (error: any) {
    console.error('\n❌ Error resetting database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();

