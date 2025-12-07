#!/usr/bin/env tsx

import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL לא מוגדר');
  process.exit(1);
}

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🌱 מתחיל seeding...\n');

    // 1. Create store owner
    console.log('1️⃣  יוצר בעל חנות...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const owner = await pool.query(
      `INSERT INTO store_owners (email, name, password_hash, email_verified)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email) DO UPDATE SET name = $2
       RETURNING id`,
      ['admin@example.com', 'Admin User', hashedPassword]
    );
    const ownerId = owner.rows[0].id;
    console.log(`✅ בעל חנות נוצר (ID: ${ownerId})\n`);

    // 2. Create store
    console.log('2️⃣  יוצר חנות...');
    const store = await pool.query(
      `INSERT INTO stores (owner_id, name, slug, currency, locale, timezone, plan, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (slug) DO UPDATE SET name = $2
       RETURNING id`,
      [ownerId, 'החנות שלי', 'my-store', 'ILS', 'he-IL', 'Asia/Jerusalem', 'free']
    );
    const storeId = store.rows[0].id;
    console.log(`✅ חנות נוצרה (ID: ${storeId})\n`);

    // 3. Create a category
    console.log('3️⃣  יוצר קטגוריה...');
    const category = await pool.query(
      `INSERT INTO product_collections (store_id, title, handle, published_at, published_scope, sort_order, is_published)
       VALUES ($1, $2, $3, now(), $4, $5, true)
       ON CONFLICT (store_id, handle) DO UPDATE SET title = $2
       RETURNING id`,
      [storeId, 'כללי', 'general', 'web', 'manual']
    );
    const categoryId = category.rows[0].id;
    console.log(`✅ קטגוריה נוצרה (ID: ${categoryId})\n`);

    // 4. Create a product
    console.log('4️⃣  יוצר מוצר...');
    const product = await pool.query(
      `INSERT INTO products (store_id, title, handle, body_html, status, published_at, published_scope)
       VALUES ($1, $2, $3, $4, $5, now(), $6)
       ON CONFLICT (store_id, handle) DO UPDATE SET title = $2
       RETURNING id`,
      [storeId, 'מוצר לדוגמה', 'example-product', '<p>תיאור המוצר</p>', 'active', 'web']
    );
    const productId = product.rows[0].id;
    console.log(`✅ מוצר נוצר (ID: ${productId})\n`);

    // 5. Create a variant with inventory
    console.log('5️⃣  יוצר variant עם מלאי...');
    const variant = await pool.query(
      `INSERT INTO product_variants (product_id, title, price, sku, position, taxable, inventory_quantity, inventory_policy)
       VALUES ($1, $2, $3, $4, 1, true, $5, $6)
       RETURNING id`,
      [productId, 'Default Title', '99.90', 'SKU-001', 20, 'deny']
    );
    const variantId = variant.rows[0].id;
    console.log(`✅ Variant נוצר (ID: ${variantId}, מלאי: 20)\n`);

    // 6. Link product to category
    console.log('6️⃣  מקשר מוצר לקטגוריה...');
    await pool.query(
      `INSERT INTO product_collection_map (product_id, collection_id, position)
       VALUES ($1, $2, 1)
       ON CONFLICT (product_id, collection_id) DO NOTHING`,
      [productId, categoryId]
    );
    console.log(`✅ מוצר קושר לקטגוריה\n`);

    console.log('✅ Seeding הושלם בהצלחה!');
    console.log('\n📝 פרטי התחברות:');
    console.log('   Email: admin@example.com');
    console.log('   Password: 123456\n');

  } catch (error) {
    console.error('❌ שגיאה:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();

