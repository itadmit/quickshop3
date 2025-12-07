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
  console.error('Error loading .env.local:', e.message);
}

// Try loading .env as fallback
try {
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
} catch (e) {
  // .env might not exist, that's ok
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting database...\n');
    
    // Read schema file
    const schemaPath = join(process.cwd(), 'sql', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Drop all tables - get all table names from information_schema
    console.log('🗑️  Dropping existing tables...');
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    
    if (tables.length > 0) {
      // Drop all tables in one query
      await client.query(`DROP TABLE IF EXISTS ${tables.map(t => `"${t}"`).join(', ')} CASCADE`);
    }
    
    // Execute schema
    console.log('📋 Creating tables from schema...');
    await client.query(schema);
    
    // Insert initial data
    console.log('📦 Inserting initial data...');
    
    // Create store owner
    const ownerResult = await client.query(`
      INSERT INTO store_owners (email, name, password_hash, email_verified)
      VALUES ('admin@nike.com', 'Nike Admin', '$2a$10$dummyhash', true)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const ownerId = ownerResult.rows[0].id;
    
    // Create store with slug "nike"
    const storeResult = await client.query(`
      INSERT INTO stores (owner_id, name, slug, currency, locale, timezone, plan, is_active)
      VALUES ($1, 'Nike', 'nike', 'ILS', 'he-IL', 'Asia/Jerusalem', 'free', true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [ownerId]);
    const storeId = storeResult.rows[0].id;
    
    // Initialize contact categories for all stores
    console.log('\n📦 Initializing contact categories...');
    try {
      const storesResult = await client.query('SELECT id FROM stores');
      for (const store of storesResult.rows) {
        await client.query(`
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
    } catch (error) {
      console.log(`   ⚠️  Could not initialize contact categories: ${error.message}`);
    }
    
    console.log('\n✅ Database reset complete!');
    console.log('📊 Initial store created:');
    console.log('   - Slug: nike');
    console.log('   - Name: Nike');
    console.log('   - Owner: admin@nike.com');
    console.log('   - Store ID: ' + storeId);
    
    // Import demo data using SeedService via tsx
    console.log('\n🌱 Importing demo data...');
    try {
      const { execSync } = require('child_process');
      const seedScriptPath = join(__dirname, 'seed-demo-data-ts.ts');
      
      // Set store ID as environment variable
      process.env.SEED_STORE_ID = storeId.toString();
      
      execSync(`npx tsx ${seedScriptPath}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, SEED_STORE_ID: storeId.toString() },
      });
      
      console.log('\n✅ Demo data imported successfully!');
    } catch (seedError) {
      console.error('⚠️  Warning: Failed to import demo data:', seedError.message);
      console.log('   You can import demo data later from the admin dashboard.');
      console.log('   Or run: npx tsx scripts/seed-demo-data-ts.ts');
    }
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase().catch(console.error);
