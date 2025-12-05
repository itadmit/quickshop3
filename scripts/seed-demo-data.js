/**
 * Seed Demo Data Script
 * יוצר נתוני דמו אחרי reset של המסד נתונים
 */

const { execSync } = require('child_process');
const { join } = require('path');

// Load .env.local
try {
  const { readFileSync } = require('fs');
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
} catch (e) {
  // .env.local might not exist
}

// Try loading .env as fallback
try {
  const { readFileSync } = require('fs');
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
} catch (e) {
  // .env might not exist
}

async function seedDemoData() {
  try {
    console.log('🌱 Starting demo data import...\n');
    
    // Use tsx to run TypeScript seed script
    const seedScriptPath = join(__dirname, 'seed-demo-data-ts.ts');
    
    execSync(`npx tsx ${seedScriptPath}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    
    console.log('\n✅ Demo data imported successfully!');
  } catch (error) {
    console.error('❌ Error importing demo data:', error.message);
    console.log('   You can import demo data later from the admin dashboard.');
    process.exit(1);
  }
}

seedDemoData();

