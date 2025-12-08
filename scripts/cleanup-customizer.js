/**
 * Cleanup Customizer - מחיקת כל הנתונים והקבצים של הקסטומייזר
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

async function cleanupCustomizer() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🧹 Cleaning up customizer data...');

    // Delete in correct order due to foreign keys
    await pool.query('DELETE FROM section_blocks');
    console.log('✓ Deleted section_blocks');

    await pool.query('DELETE FROM page_sections');
    console.log('✓ Deleted page_sections');

    await pool.query('DELETE FROM page_layouts');
    console.log('✓ Deleted page_layouts');

    // Drop tables if they exist
    const tables = [
      'store_theme_settings',
      'page_templates',
      'template_widgets',
      'page_layout_versions',
      'custom_sections',
      'theme_templates'
    ];

    for (const table of tables) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✓ Dropped table ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${table}:`, error.message);
      }
    }

    console.log('✅ Customizer cleanup completed!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

cleanupCustomizer();
