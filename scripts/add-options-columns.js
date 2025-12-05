#!/usr/bin/env node
/**
 * Script to add type and metadata columns to product_options tables
 * Usage: node scripts/add-options-columns.js
 */

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
  // .env.local might not exist, that's ok
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('💡 Create .env.local file with your database connection string');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

async function addColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding columns to product_options tables...\n');
    
    // Check if type column exists
    const typeCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_options' AND column_name = 'type'
      )
    `);
    
    if (!typeCheck.rows[0].exists) {
      console.log('➕ Adding type column to product_options...');
      await client.query(`
        ALTER TABLE product_options 
        ADD COLUMN type VARCHAR(50) DEFAULT 'button' CHECK (type IN ('button', 'color', 'pattern', 'image'))
      `);
      
      await client.query(`
        CREATE INDEX idx_product_options_type ON product_options(type)
      `);
      
      await client.query(`
        UPDATE product_options SET type = 'button' WHERE type IS NULL
      `);
      
      console.log('✅ Added type column to product_options');
    } else {
      console.log('✓ type column already exists in product_options');
    }
    
    // Check if metadata column exists
    const metadataCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_option_values' AND column_name = 'metadata'
      )
    `);
    
    if (!metadataCheck.rows[0].exists) {
      console.log('➕ Adding metadata column to product_option_values...');
      await client.query(`
        ALTER TABLE product_option_values 
        ADD COLUMN metadata JSONB DEFAULT NULL
      `);
      
      console.log('✅ Added metadata column to product_option_values');
    } else {
      console.log('✓ metadata column already exists in product_option_values');
    }
    
    console.log('\n🎉 Done! Columns added successfully.');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

addColumns();

