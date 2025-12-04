#!/usr/bin/env ts-node
/**
 * Script to run a migration file
 * Usage: npm run run-migration <migration-file>
 * Example: npm run run-migration sql/migrations/add_automatic_discounts.sql
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

async function runMigration(migrationPath: string) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('🔄 Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');

    // Read migration file
    const fullPath = join(process.cwd(), migrationPath);
    console.log(`📖 Reading migration file: ${migrationPath}`);
    
    let migrationSQL: string;
    try {
      migrationSQL = readFileSync(fullPath, 'utf-8');
    } catch (error: any) {
      console.error(`❌ Error reading migration file: ${error.message}`);
      process.exit(1);
    }

    // Split by semicolons and execute each statement
    console.log('🚀 Executing migration...');
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^--\s*=/));

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
        
        // Show progress
        if (executed % 5 === 0) {
          process.stdout.write(`\r   Executed ${executed} statements...`);
        }
      } catch (error: any) {
        // Ignore "already exists" and "does not exist" errors (for IF NOT EXISTS / IF EXISTS)
        if (!error.message.includes('already exists') && 
            !error.message.includes('does not exist') &&
            !error.message.includes('duplicate')) {
          console.error(`\n❌ Error executing statement:`, error.message);
          console.error(`   Statement: ${statement.substring(0, 150)}...`);
          errors++;
        } else {
          // Count as executed even if it's an "already exists" error
          executed++;
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Executed: ${executed} statements`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} (check above for details)`);
    }

    // Verify tables/columns were created
    console.log('\n📊 Verifying changes...');
    
    // Check for automatic_discounts table
    const autoDiscountsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'automatic_discounts'
      )
    `);
    
    if (autoDiscountsCheck.rows[0].exists) {
      console.log('   ✓ automatic_discounts table exists');
    }

    // Check for new columns in discount_codes
    const discountCodesColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'discount_codes'
      AND column_name IN (
        'minimum_quantity', 'maximum_quantity',
        'customer_segment', 'minimum_orders_count', 'minimum_lifetime_value',
        'day_of_week', 'hour_start', 'hour_end',
        'can_combine_with_automatic', 'can_combine_with_other_codes',
        'max_combined_discounts', 'priority'
      )
      ORDER BY column_name
    `);

    if (discountCodesColumns.rows.length > 0) {
      console.log(`   ✓ Added ${discountCodesColumns.rows.length} new columns to discount_codes:`);
      discountCodesColumns.rows.forEach((row) => {
        console.log(`     - ${row.column_name}`);
      });
    }

  } catch (error: any) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please provide a migration file path');
  console.log('Usage: npm run run-migration <migration-file>');
  console.log('Example: npm run run-migration sql/migrations/add_automatic_discounts.sql');
  process.exit(1);
}

runMigration(migrationFile).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

