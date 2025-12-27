#!/usr/bin/env ts-node
/**
 * Migration script from old QuickShop to new system
 * 
 * Usage:
 *   ts-node scripts/migrate-from-old-quickshop.ts --store-slug argania --new-store-id 1
 */

import mysql from 'mysql2/promise';
import { migrateProduct } from '../lib/migration/migrate-store';
import { OldProduct, OldProductVariant } from '../lib/migration/old-quickshop-types';

// Old database connection
const OLD_DB_CONFIG = {
  host: 'quickshop-mysql.choq2s2o8d8y.us-east-1.rds.amazonaws.com',
  user: 'root',
  password: 'aA0542284283!!',
  database: 'quicdvuk_ecom',
};

interface MigrationOptions {
  storeSlug: string;
  newStoreId: number;
  limit?: number;
  dryRun?: boolean;
}

/**
 * Get old store ID by slug
 */
async function getOldStoreId(connection: mysql.Connection, slug: string): Promise<number | null> {
  const [rows] = await connection.execute<any[]>(
    'SELECT id FROM stores WHERE slug = ?',
    [slug]
  );
  
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * Get products from old store
 */
async function getOldProducts(
  connection: mysql.Connection,
  storeId: number,
  limit?: number
): Promise<OldProduct[]> {
  let sql = `
    SELECT * FROM products 
    WHERE store_id = ? AND is_hidden = 0
    ORDER BY id ASC
  `;
  
  const params: any[] = [storeId];
  
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  
  const [rows] = await connection.execute<any[]>(sql, params);
  return rows as OldProduct[];
}

/**
 * Get variants for a product
 */
async function getOldVariants(
  connection: mysql.Connection,
  productId: number
): Promise<OldProductVariant[]> {
  const [rows] = await connection.execute<any[]>(
    'SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC',
    [productId]
  );
  
  return rows as OldProductVariant[];
}

/**
 * Main migration function
 */
async function migrateStore(options: MigrationOptions) {
  console.log(`🚀 Starting migration for store: ${options.storeSlug}`);
  console.log(`   New store ID: ${options.newStoreId}`);
  console.log(`   Dry run: ${options.dryRun ? 'YES' : 'NO'}`);
  if (options.limit) {
    console.log(`   Limit: ${options.limit} products`);
  }
  console.log('');

  // Connect to old database
  let oldConnection: mysql.Connection;
  try {
    console.log('📡 Connecting to old database...');
    oldConnection = await mysql.createConnection(OLD_DB_CONFIG);
    console.log('✅ Connected to old database');
  } catch (error) {
    console.error('❌ Failed to connect to old database:', error);
    process.exit(1);
  }

  try {
    // Get old store ID
    console.log(`🔍 Looking for store: ${options.storeSlug}...`);
    const oldStoreId = await getOldStoreId(oldConnection, options.storeSlug);
    
    if (!oldStoreId) {
      console.error(`❌ Store not found: ${options.storeSlug}`);
      process.exit(1);
    }
    
    console.log(`✅ Found store ID: ${oldStoreId}`);
    console.log('');

    // Get products
    console.log('📦 Fetching products...');
    const products = await getOldProducts(oldConnection, oldStoreId, options.limit);
    console.log(`✅ Found ${products.length} products`);
    console.log('');

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
      console.log('');
      for (const product of products) {
        const variants = await getOldVariants(oldConnection, product.id);
        console.log(`  Product: ${product.name}`);
        console.log(`    Type: ${product.product_type || 'regular'}`);
        console.log(`    Variants: ${variants.length}`);
        console.log(`    Images: ${product.product_image || 'none'}`);
        console.log('');
      }
      return;
    }

    // Migrate each product
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i + 1}/${products.length}] Migrating: ${product.name}`);
      
      try {
        // Get variants
        const variants = await getOldVariants(oldConnection, product.id);
        console.log(`  Variants: ${variants.length}`);
        
        // Migrate product
        const { productId, variantIds } = await migrateProduct(
          product,
          variants,
          options.newStoreId
        );
        
        console.log(`  ✅ Created product ID: ${productId} with ${variantIds.length} variants`);
        results.success++;
      } catch (error: any) {
        console.error(`  ❌ Failed: ${error.message}`);
        results.failed++;
        results.errors.push(`${product.name}: ${error.message}`);
      }
      
      console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    if (results.errors.length > 0) {
      console.log('');
      console.log('Errors:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }
    console.log('='.repeat(60));

  } finally {
    await oldConnection.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: MigrationOptions = {
  storeSlug: '',
  newStoreId: 0,
  dryRun: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--store-slug' && args[i + 1]) {
    options.storeSlug = args[i + 1];
    i++;
  } else if (arg === '--new-store-id' && args[i + 1]) {
    options.newStoreId = parseInt(args[i + 1]);
    i++;
  } else if (arg === '--limit' && args[i + 1]) {
    options.limit = parseInt(args[i + 1]);
    i++;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
}

if (!options.storeSlug || !options.newStoreId) {
  console.error('Usage:');
  console.error('  ts-node scripts/migrate-from-old-quickshop.ts --store-slug <slug> --new-store-id <id> [--limit <n>] [--dry-run]');
  console.error('');
  console.error('Example:');
  console.error('  ts-node scripts/migrate-from-old-quickshop.ts --store-slug argania --new-store-id 1 --limit 5 --dry-run');
  process.exit(1);
}

// Run migration
migrateStore(options).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

