/**
 * סקריפט דיבוג ל-Redis - בדיקת מה יש ב-Redis
 */

const { Redis } = require('@upstash/redis');
const { readFileSync } = require('fs');
const { join } = require('path');

// טעינת .env
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (e) {
  try {
    const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  } catch (e2) {}
}

async function debugRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('❌ לא נמצאו משתני סביבה');
    process.exit(1);
  }

  const redis = new Redis({ url, token });

  console.log('🔍 בודק מה יש ב-Redis...\n');

  try {
    // בדיקת מבקרים
    const visitorsSet = await redis.smembers('active_visitors_set');
    console.log(`📊 מבקרים ב-set: ${visitorsSet.length}`);
    
    if (visitorsSet.length > 0) {
      console.log('\nמבקרים:');
      for (const visitorId of visitorsSet.slice(0, 10)) {
        const key = `active_visitor:${visitorId}`;
        const data = await redis.get(key);
        if (data) {
          let visitor;
          if (typeof data === 'string') {
            visitor = JSON.parse(data);
          } else {
            visitor = data;
          }
          console.log(`  - ${visitorId}`);
          console.log(`    store_slug: ${visitor.store_slug || 'N/A'}`);
          console.log(`    store_id: ${visitor.store_id || 'N/A'}`);
          console.log(`    last_activity: ${new Date(visitor.last_activity).toLocaleString('he-IL')}`);
          console.log(`    ip_address: ${visitor.ip_address || 'N/A'}`);
        }
      }
    }

    // בדיקת משתמשים
    const usersSet = await redis.smembers('active_users_set');
    console.log(`\n👥 משתמשים ב-set: ${usersSet.length}`);
    
    if (usersSet.length > 0) {
      console.log('\nמשתמשים:');
      for (const userId of usersSet.slice(0, 10)) {
        const key = `active_user:${userId}`;
        const data = await redis.get(key);
        if (data) {
          let user;
          if (typeof data === 'string') {
            user = JSON.parse(data);
          } else {
            user = data;
          }
          console.log(`  - User ID: ${userId}`);
          console.log(`    store_id: ${user.store_id || 'N/A'}`);
          console.log(`    email: ${user.email || 'N/A'}`);
        }
      }
    }

    console.log('\n✅ סיום בדיקה');
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  }
}

debugRedis();

