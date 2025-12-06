/**
 * Script לבדיקת README בכל מודול
 * 
 * בודק שכל מודול בדשבורד יש לו README.md
 * 
 * שימוש:
 * npm run check:docs
 */

import fs from 'fs';
import path from 'path';

const modulesDir = path.join(process.cwd(), 'src/app/(dashboard)');

if (!fs.existsSync(modulesDir)) {
  console.error(`❌ Directory not found: ${modulesDir}`);
  process.exit(1);
}

const modules = fs.readdirSync(modulesDir);
const missingReadme: string[] = [];

modules.forEach(module => {
  const modulePath = path.join(modulesDir, module);
  const readmePath = path.join(modulePath, 'README.md');
  
  // בדוק רק תיקיות (לא קבצים)
  if (fs.statSync(modulePath).isDirectory()) {
    // דלג על תיקיות מיוחדות
    if (module.startsWith('.') || module === 'node_modules') {
      return;
    }
    
    if (!fs.existsSync(readmePath)) {
      missingReadme.push(module);
    }
  }
});

if (missingReadme.length > 0) {
  console.error('❌ Missing README.md in modules:');
  missingReadme.forEach(m => console.error(`  - ${m}`));
  console.error('\nכל מודול בדשבורד חייב לכלול README.md עם צ\'קליסט תכונות');
  process.exit(1);
}

console.log('✅ All modules have README.md');

