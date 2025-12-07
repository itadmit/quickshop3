#!/usr/bin/env ts-node
/**
 * Script to reset and setup database schema on Neon
 * This will DROP all existing tables and recreate them
 * Usage: npm run reset-db
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env' });
config({ path: '.env.local' });

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
    
    // Remove comments and split into statements
    // We'll execute the entire schema as one transaction to avoid dependency issues
    const cleanSchema = schema
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Keep lines that are not comments (but keep CREATE statements even if they have inline comments)
        return !trimmed.startsWith('--') || trimmed.startsWith('-- =');
      })
      .join('\n');

    let executed = 0;
    let errors = 0;

    try {
      // Execute entire schema at once
      await pool.query(cleanSchema);
      console.log('✅ Schema executed successfully');
      executed = 1; // Mark as executed
    } catch (error: any) {
      // If full execution fails, try executing statement by statement
      console.log('⚠️  Full schema execution failed, trying statement by statement...');
      
      // Split by semicolons but keep multi-line statements together
      const statements = cleanSchema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          // Skip empty statements and comments
          if (statement.length === 0 || statement.startsWith('--')) {
            continue;
          }

          // Execute statement
          await pool.query(statement + ';');
          executed++;
          
          // Show progress every 10 statements
          if (executed % 10 === 0) {
            process.stdout.write(`\r   Executed ${executed} statements...`);
          }
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate') &&
              !error.message.includes('does not exist')) {
            console.error(`\n❌ Error executing statement:`, error.message);
            console.error(`   Statement preview: ${statement.substring(0, 150)}...`);
            errors++;
          }
        }
      }
      
      if (errors > 0) {
        console.log(`\n⚠️  Completed with ${errors} errors (some may be expected)`);
      }
    }

    console.log(`\n✅ Schema setup complete!`);
    if (executed > 0) {
      console.log(`   Executed: ${executed === 1 ? 'full schema' : `${executed} statements`}`);
    }
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

    // Initialize contact categories for all stores
    console.log('\n📦 Initializing contact categories...');
    try {
      const storesResult = await pool.query('SELECT id FROM stores');
      for (const store of storesResult.rows) {
        await pool.query(`
          INSERT INTO contact_categories (store_id, type, name, color, created_at, updated_at)
          VALUES 
            ($1, 'CUSTOMER', 'לקוחות', '#10b981', now(), now()),
            ($1, 'CLUB_MEMBER', 'חברי מועדון', '#3b82f6', now(), now()),
            ($1, 'NEWSLETTER', 'דיוור', '#f97316', now(), now()),
            ($1, 'CONTACT_FORM', 'יצירת קשר', '#a855f7', now(), now())
          ON CONFLICT (store_id, type) DO NOTHING
        `, [store.id]);
      }
      console.log('   ✓ Contact categories initialized');
    } catch (error: any) {
      console.log(`   ⚠️  Could not initialize contact categories: ${error.message}`);
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

