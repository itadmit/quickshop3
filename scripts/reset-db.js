#!/usr/bin/env node
/**
 * Script to reset and setup database schema on Neon
 * This will DROP all existing tables and recreate them
 * Usage: node scripts/reset-db.js
 */

require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('💡 Create .env.local file with your Neon connection string');
  process.exit(1);
}

async function resetDatabase() {
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
        } catch (error) {
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

    // Execute the entire schema as one transaction
    console.log('🚀 Creating schema...');
    
    try {
      // Execute entire schema file
      await pool.query(schema);
      console.log('✅ Schema executed successfully!');
    } catch (error) {
      // If it fails, try executing statement by statement
      console.log('⚠️  Full schema execution failed, trying statement by statement...');
      
      // Remove comments and split by semicolons
      const cleanSchema = schema
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      const statements = cleanSchema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let executed = 0;
      let errors = 0;

      for (const statement of statements) {
        try {
          if (statement.length === 0) continue;
          
          await pool.query(statement);
          executed++;
          
          if (executed % 10 === 0) {
            process.stdout.write(`\r   Executed ${executed} statements...`);
          }
        } catch (error) {
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            errors++;
            if (errors <= 5) { // Show first 5 errors
              console.error(`\n❌ Error: ${error.message.substring(0, 100)}`);
            }
          }
        }
      }

      console.log(`\n✅ Schema setup complete!`);
      console.log(`   Executed: ${executed} statements`);
      if (errors > 0) {
        console.log(`   Errors: ${errors} (some may be expected)`);
      }
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

    // Create default user and store
    console.log('\n👤 Creating default user and store...');
    try {
      // Hash password
      const passwordHash = await bcrypt.hash('115599', 10);
      
      // Create store owner
      const ownerResult = await pool.query(
        `INSERT INTO store_owners (email, name, password_hash, email_verified)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id, email, name`,
        ['itadmit@gmail.com', 'Admin', passwordHash]
      );
      
      const owner = ownerResult.rows[0];
      console.log(`   ✓ Created/updated store owner: ${owner.email}`);

      // Generate Shopify-like domain from slug
      const myshopifyDomain = `nike-${Math.random().toString(36).substring(2, 7)}`;

      // Check if store with id=1 exists, if not create it
      const existingStore = await pool.query(
        'SELECT id FROM stores WHERE id = 1'
      );

      let store;
      if (existingStore.rows.length > 0) {
        // Update existing store
        const updateResult = await pool.query(
          `UPDATE stores SET
           owner_id = $1,
           name = $2,
           myshopify_domain = $3,
           domain = $4,
           currency = $5,
           locale = $6,
           timezone = $7,
           plan = $8,
           is_active = true
           WHERE id = 1
           RETURNING id, name, myshopify_domain, domain`,
          [
            owner.id,
            'Nike Store',
            myshopifyDomain,
            'nike',
            'ILS',
            'he-IL',
            'Asia/Jerusalem',
            'free'
          ]
        );
        store = updateResult.rows[0];
      } else {
        // Insert store with id=1 directly (PostgreSQL allows manual id insertion)
        const storeResult = await pool.query(
          `INSERT INTO stores (id, owner_id, name, myshopify_domain, domain, currency, locale, timezone, plan, is_active)
           VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, true)
           RETURNING id, name, myshopify_domain, domain`,
          [
            owner.id,
            'Nike Store',
            myshopifyDomain,
            'nike',
            'ILS',
            'he-IL',
            'Asia/Jerusalem',
            'free'
          ]
        );
        store = storeResult.rows[0];
        
        // Update sequence to point after the created store id
        await pool.query(`SELECT setval('stores_id_seq', GREATEST(1, (SELECT MAX(id) FROM stores)))`);
      }

      console.log(`   ✓ Created/updated store: ${store.name} (id: ${store.id}, domain: ${store.domain || store.myshopify_domain})`);
      
      console.log('\n✅ Default user and store created successfully!');
      console.log(`   📧 Email: itadmit@gmail.com`);
      console.log(`   🔑 Password: 115599`);
      console.log(`   📱 Phone: 0542284283`);
      console.log(`   🏪 Store ID: ${store.id}`);
      console.log(`   🔗 Store Slug: ${store.domain || 'nike'}`);
      
    } catch (error) {
      console.error('⚠️  Error creating default user/store:', error.message);
      // Don't fail the whole script if this fails
    }

  } catch (error) {
    console.error('\n❌ Error resetting database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();

