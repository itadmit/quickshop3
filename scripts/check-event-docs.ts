/**
 * Script לבדיקת תיעוד אירועים ב-README
 * 
 * בודק שכל מודול שמשתמש ב-eventBus.emit מתועד ב-README שלו
 * 
 * שימוש:
 * npm run check:event-docs
 */

import fs from 'fs';
import path from 'path';

const modulesDir = path.join(process.cwd(), 'src/app/(dashboard)');

if (!fs.existsSync(modulesDir)) {
  console.error(`❌ Directory not found: ${modulesDir}`);
  process.exit(1);
}

const modules = fs.readdirSync(modulesDir);
const missingEventDocs: string[] = [];

modules.forEach(module => {
  const modulePath = path.join(modulesDir, module);
  const readmePath = path.join(modulePath, 'README.md');
  
  // בדוק רק תיקיות עם README
  if (!fs.statSync(modulePath).isDirectory() || !fs.existsSync(readmePath)) {
    return;
  }
  
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  
  // בדוק אם יש שימוש ב-eventBus בקוד של המודול
  const moduleCodeFiles: string[] = [];
  
  function findCodeFiles(dir: string) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findCodeFiles(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        moduleCodeFiles.push(filePath);
      }
    });
  }
  
  findCodeFiles(modulePath);
  
  // בדוק אם יש eventBus.emitEvent או eventBus.emit בקוד
  let hasEventEmission = false;
  for (const codeFile of moduleCodeFiles) {
    try {
      const content = fs.readFileSync(codeFile, 'utf-8');
      if (content.includes('eventBus.emitEvent') || content.includes('eventBus.emit')) {
        hasEventEmission = true;
        break;
      }
    } catch (error) {
      // דלג על קבצים שלא ניתן לקרוא
    }
  }
  
  // אם יש event emission בקוד אבל אין תיעוד ב-README
  if (hasEventEmission) {
    // בדוק אם יש תיעוד אירועים ב-README
    const hasEventDocs = 
      readmeContent.includes('Events Emitted') ||
      readmeContent.includes('אירועים שנשלחים') ||
      readmeContent.includes('eventBus') ||
      readmeContent.includes('Event');
    
    if (!hasEventDocs) {
      missingEventDocs.push(module);
    }
  }
});

if (missingEventDocs.length > 0) {
  console.error('❌ Modules with events but no documentation:');
  missingEventDocs.forEach(m => console.error(`  - ${m}`));
  console.error('\nכל מודול שמשתמש ב-eventBus חייב לתעד את האירועים ב-README');
  process.exit(1);
}

console.log('✅ All events are documented');

