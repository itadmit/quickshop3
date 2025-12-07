
import { join } from 'path';
import { readFileSync } from 'fs';

// Load .env.local
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
} catch (e) {}

// Load .env
try {
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
} catch (e) {}

import { query } from '../src/lib/db';
import { calculateCart } from '../src/lib/services/cartCalculator';

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m"
};

async function runTests() {
  console.log(`${colors.bold}${colors.blue}🚀 Starting Discount & Coupon Tests...${colors.reset}\n`);

  let storeId: number;
  let product1Id: number;
  let product2Id: number;
  let variant1Id: number;
  let variant2Id: number;

  // ==========================================
  // 1. SETUP - Create Test Data
  // ==========================================
  try {
    console.log(`${colors.yellow}📦 Setting up test data...${colors.reset}`);

    // Create Store
    const storeRes = await query<{ id: number }>(
      `INSERT INTO stores (name, slug, owner_id) 
       VALUES ('Test Store', 'test-store-' || floor(random() * 10000)::text, 1) 
       RETURNING id`
    );
    storeId = storeRes[0].id;

    // Create Products
    const prod1Res = await query<{ id: number }>(
      `INSERT INTO products (store_id, title, handle, status) 
       VALUES ($1, 'Test Product 1', 'test-prod-1', 'active') RETURNING id`,
      [storeId]
    );
    product1Id = prod1Res[0].id;

    const prod2Res = await query<{ id: number }>(
      `INSERT INTO products (store_id, title, handle, status) 
       VALUES ($1, 'Test Product 2', 'test-prod-2', 'active') RETURNING id`,
      [storeId]
    );
    product2Id = prod2Res[0].id;

    // Create Variants
    const var1Res = await query<{ id: number }>(
      `INSERT INTO product_variants (product_id, title, price, inventory_quantity) 
       VALUES ($1, 'Default', 100, 100) RETURNING id`,
      [product1Id]
    );
    variant1Id = var1Res[0].id; // Price: 100

    const var2Res = await query<{ id: number }>(
      `INSERT INTO product_variants (product_id, title, price, inventory_quantity) 
       VALUES ($1, 'Default', 50, 100) RETURNING id`,
      [product2Id]
    );
    variant2Id = var2Res[0].id; // Price: 50

    console.log(`${colors.green}✅ Test data created successfully (Store ID: ${storeId})${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Setup failed:${colors.reset}`, error);
    return;
  }

  // Helper to create discounts
  const createAutoDiscount = async (data: any) => {
    await query(
      `INSERT INTO automatic_discounts (
        store_id, name, discount_type, value, is_active, priority, 
        applies_to, can_combine_with_codes, minimum_order_amount, minimum_quantity
      ) VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8, $9)`,
      [
        storeId, data.name, data.type, data.value, data.priority || 0,
        data.applies_to || 'all', data.combine ?? true, 
        data.min_amount || null, data.min_qty || null
      ]
    );
  };

  const createCoupon = async (data: any) => {
    await query(
      `INSERT INTO discount_codes (
        store_id, code, discount_type, value, is_active, 
        applies_to, can_combine_with_automatic, minimum_order_amount
      ) VALUES ($1, $2, $3, $4, true, $5, $6, $7)`,
      [
        storeId, data.code, data.type, data.value, 
        data.applies_to || 'all', data.combine ?? true, data.min_amount || null
      ]
    );
  };

  // ==========================================
  // 2. RUN TESTS
  // ==========================================

  const baseCartItems = [
    {
      variant_id: variant1Id,
      product_id: product1Id,
      product_title: 'Test Product 1',
      variant_title: 'Default',
      price: 100,
      quantity: 1
    },
    {
      variant_id: variant2Id,
      product_id: product2Id,
      product_title: 'Test Product 2',
      variant_title: 'Default',
      price: 50,
      quantity: 2
    }
  ]; // Total: 100*1 + 50*2 = 200

  try {
    // --- Test 1: Automatic Percentage Discount ---
    console.log(`🧪 ${colors.bold}Test 1: Automatic 10% Discount${colors.reset}`);
    await createAutoDiscount({ name: 'Auto 10%', type: 'percentage', value: 10, priority: 10 });
    
    let result = await calculateCart({
      storeId,
      items: baseCartItems
    });

    if (result.total === 180 && result.discounts.length === 1 && result.discounts[0].amount === 20) {
      console.log(`${colors.green}✅ Passed (Total: 180, Discount: 20)${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Failed (Expected 180, got ${result.total})${colors.reset}`);
      console.log(result);
    }
    console.log('-----------------------------------');

    // --- Test 2: Coupon Fixed Amount ---
    console.log(`🧪 ${colors.bold}Test 2: Coupon ₪50 Off${colors.reset}`);
    await createCoupon({ code: 'SAVE50', type: 'fixed_amount', value: 50 });

    // Note: Auto 10% still exists. Base 200 - 10%(20) = 180. Then Coupon 50. Total should be 130.
    result = await calculateCart({
      storeId,
      items: baseCartItems,
      discountCode: 'SAVE50'
    });

    if (result.total === 130 && result.discounts.length === 2) {
      console.log(`${colors.green}✅ Passed (Total: 130, Auto: 20, Coupon: 50)${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Failed (Expected 130, got ${result.total})${colors.reset}`);
      console.log(result.discounts);
    }
    console.log('-----------------------------------');

    // --- Test 3: Minimum Order Amount (Fail) ---
    console.log(`🧪 ${colors.bold}Test 3: Coupon Min Amount ₪300 (Should Fail)${colors.reset}`);
    await createCoupon({ code: 'BIGSPENDER', type: 'percentage', value: 50, min_amount: 300 });

    result = await calculateCart({
      storeId,
      items: baseCartItems, // Total 200 (before discounts)
      discountCode: 'BIGSPENDER'
    });

    if (result.isValid && result.warnings.length > 0 && result.discounts.length === 1) { 
      // Should only have the auto discount, coupon should fail
      console.log(`${colors.green}✅ Passed (Coupon rejected correctly)${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Failed${colors.reset}`);
      console.log('Discounts:', result.discounts.length);
      console.log('Warnings:', result.warnings);
    }
    console.log('-----------------------------------');

    // --- Test 4: Prevent Combination ---
    console.log(`🧪 ${colors.bold}Test 4: Exclusive Coupon (No Stacking)${colors.reset}`);
    await createCoupon({ code: 'EXCLUSIVE', type: 'fixed_amount', value: 100, combine: false });

    // Auto discount exists (priority 10). Coupon (no priority, but calculate logic runs auto first).
    // If coupon cannot combine with auto, and auto is applied, coupon usually validates logic.
    // Wait, `can_combine_with_automatic: false` on coupon means: "If automatic discounts applied, don't apply this coupon".
    // Let's see engine logic.
    
    result = await calculateCart({
      storeId,
      items: baseCartItems,
      discountCode: 'EXCLUSIVE'
    });

    // Auto discount applied (20). Coupon checks combining. 
    // Since appliedAutomaticCount > 0 and coupon.combine=false -> Coupon should throw error/warning.
    
    if (result.warnings.some(w => w.includes('לא ניתן לשילוב'))) {
      console.log(`${colors.green}✅ Passed (Exclusive coupon rejected because auto discount exists)${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Failed${colors.reset}`);
      console.log(result.warnings);
    }
    console.log('-----------------------------------');

    // --- Test 5: Free Shipping ---
    console.log(`🧪 ${colors.bold}Test 5: Free Shipping Automatic${colors.reset}`);
    // Clean previous auto discounts to simplify
    await query(`DELETE FROM automatic_discounts WHERE store_id = $1`, [storeId]);
    
    await createAutoDiscount({ name: 'Free Ship', type: 'free_shipping', priority: 5, min_amount: 150 });

    result = await calculateCart({
      storeId,
      items: baseCartItems, // 200
      shippingRate: { id: 1, name: 'Standard', price: 30, free_shipping_threshold: null }
    });

    if (result.shippingAfterDiscount === 0 && result.total === 200) {
      console.log(`${colors.green}✅ Passed (Shipping is 0)${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Failed (Shipping: ${result.shippingAfterDiscount}, Total: ${result.total})${colors.reset}`);
    }
    console.log('-----------------------------------');

  } catch (error) {
    console.error(`${colors.red}❌ Test run failed:${colors.reset}`, error);
  } finally {
    // ==========================================
    // 3. CLEANUP
    // ==========================================
    console.log(`\n${colors.yellow}🧹 Cleaning up...${colors.reset}`);
    await query('DELETE FROM discount_code_products WHERE discount_code_id IN (SELECT id FROM discount_codes WHERE store_id = $1)', [storeId]);
    await query('DELETE FROM discount_codes WHERE store_id = $1', [storeId]);
    await query('DELETE FROM automatic_discounts WHERE store_id = $1', [storeId]);
    await query('DELETE FROM product_variants WHERE product_id IN ($1, $2)', [product1Id, product2Id]);
    await query('DELETE FROM products WHERE store_id = $1', [storeId]);
    await query('DELETE FROM stores WHERE id = $1', [storeId]);
    console.log(`${colors.green}✨ Done.${colors.reset}`);
    process.exit(0);
  }
}

runTests();

