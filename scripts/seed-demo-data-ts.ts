/**
 * Seed Demo Data (TypeScript)
 * יוצר נתוני דמו אחרי reset של המסד נתונים
 */

import { SeedService } from '../src/lib/seed/seed-service';

async function seedDemoData() {
  try {
    // Get store ID from environment or default to 1
    const storeId = parseInt(process.env.SEED_STORE_ID || '1', 10);
    
    console.log(`🌱 Importing demo data for store ID: ${storeId}...\n`);
    
    const seedService = new SeedService(storeId);
    const result = await seedService.seedAll();
    
    console.log('\n✅ Demo data imported successfully!');
    if (result.stats) {
      console.log('📊 Statistics:');
      console.log(`   - Products: ${result.stats.products || 0}`);
      console.log(`   - Collections: ${result.stats.collections || 0}`);
      console.log(`   - Customers: ${result.stats.customers || 0}`);
      console.log(`   - Orders: ${result.stats.orders || 0}`);
      console.log(`   - Discounts: ${result.stats.discounts || 0}`);
      console.log(`   - Shipping Zones: ${result.stats.shippingZones || 0}`);
      console.log(`   - Blog Posts: ${result.stats.blogPosts || 0}`);
      console.log(`   - Pages: ${result.stats.pages || 0}`);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error importing demo data:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedDemoData();

