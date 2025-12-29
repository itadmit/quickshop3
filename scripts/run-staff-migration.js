const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute migration
    const migrationPath = path.join(__dirname, '../sql/migrations/008_staff_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration: 008_staff_system.sql');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('- staff_users');
    console.log('- staff_store_access');
    console.log('- staff_invitations');
    console.log('- staff_sessions');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

