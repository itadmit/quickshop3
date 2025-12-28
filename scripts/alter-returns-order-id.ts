import { getDb } from '../src/lib/db';

async function alterReturnsOrderId() {
  try {
    console.log('🔄 Altering returns table to allow NULL order_id...');
    
    const db = getDb();
    await db.query('ALTER TABLE returns ALTER COLUMN order_id DROP NOT NULL');
    
    console.log('✅ Successfully altered returns table - order_id can now be NULL');
    
    // Verify the change
    const result = await db.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'returns' AND column_name = 'order_id'
    `);
    
    if (result.rows.length > 0) {
      console.log(`\n📊 Verification:`);
      console.log(`   Column: ${result.rows[0].column_name}`);
      console.log(`   Nullable: ${result.rows[0].is_nullable}`);
      
      if (result.rows[0].is_nullable === 'YES') {
        console.log('   ✅ order_id is now nullable - manual returns are supported!');
      } else {
        console.log('   ⚠️  order_id is still NOT NULL - something went wrong');
      }
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error altering returns table:', error.message);
    process.exit(1);
  }
}

alterReturnsOrderId();

