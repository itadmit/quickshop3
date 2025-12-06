/**
 * Script לבדיקת אירועים ב-API Routes
 * 
 * בודק שכל API Route שמבצע פעולות (POST, PUT, DELETE) פולט אירועים
 * 
 * שימוש:
 * npm run check:events
 */

import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'src/app/api');

if (!fs.existsSync(apiDir)) {
  console.error(`❌ Directory not found: ${apiDir}`);
  process.exit(1);
}

/**
 * מצא את כל ה-API routes
 */
function getAllRoutes(dir: string, routes: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllRoutes(filePath, routes);
    } else if (file === 'route.ts' || file === 'route.js') {
      routes.push(filePath);
    }
  });

  return routes;
}

const routes = getAllRoutes(apiDir);
const routesWithoutEvents: string[] = [];

routes.forEach(route => {
  const content = fs.readFileSync(route, 'utf-8');
  
  // בדוק אם יש POST, PUT, או DELETE
  const hasMutation = 
    content.includes('export async function POST') ||
    content.includes('export async function PUT') ||
    content.includes('export async function DELETE');
  
  if (hasMutation) {
    // בדוק אם יש eventBus.emitEvent או eventBus.emit
    const hasEventEmission = 
      content.includes('eventBus.emitEvent') ||
      content.includes('eventBus.emit');
    
    if (!hasEventEmission) {
      // דלג על routes שלא צריכים events (כמו auth, files)
      const skipPatterns = [
        '/api/auth/',
        '/api/files/',
        '/api/analytics/active-users',
      ];
      
      const shouldSkip = skipPatterns.some(pattern => route.includes(pattern));
      
      if (!shouldSkip) {
        routesWithoutEvents.push(route.replace(process.cwd(), ''));
      }
    }
  }
});

if (routesWithoutEvents.length > 0) {
  console.error('❌ Routes without event emission:');
  routesWithoutEvents.forEach(r => console.error(`  - ${r}`));
  console.error('\nכל API Route שמבצע פעולות (POST, PUT, DELETE) חייב לפלוט אירועים');
  process.exit(1);
}

console.log('✅ All routes emit events');

