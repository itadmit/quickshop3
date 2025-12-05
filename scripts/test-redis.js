/**
 * סקריפט בדיקה ל-Upstash Redis
 * הרץ: node scripts/test-redis.js
 */

const { Redis } = require('@upstash/redis');

async function testRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('❌ שגיאה: לא נמצאו משתני סביבה');
    console.log('ודא שיש לך ב-.env:');
    console.log('UPSTASH_REDIS_REST_URL=...');
    console.log('UPSTASH_REDIS_REST_TOKEN=...');
    process.exit(1);
  }

  console.log('🔴 בודק חיבור ל-Upstash Redis...\n');

  try {
    const redis = new Redis({
      url,
      token,
    });

    // בדיקה 1: כתיבה וקריאה
    console.log('1️⃣ בודק כתיבה וקריאה...');
    await redis.set('test:connection', 'success');
    const value = await redis.get('test:connection');
    
    if (value === 'success') {
      console.log('   ✅ כתיבה וקריאה עובדים!');
    } else {
      console.log('   ❌ שגיאה בכתיבה/קריאה');
      process.exit(1);
    }

    // בדיקה 2: SETEX (עם TTL)
    console.log('\n2️⃣ בודק SETEX (עם TTL)...');
    await redis.setex('test:ttl', 10, 'test-value');
    const ttlValue = await redis.get('test:ttl');
    
    if (ttlValue === 'test-value') {
      console.log('   ✅ SETEX עובד!');
    } else {
      console.log('   ❌ שגיאה ב-SETEX');
      process.exit(1);
    }

    // בדיקה 3: SADD/SMEMBERS (Set operations)
    console.log('\n3️⃣ בודק Set operations...');
    await redis.sadd('test:set', 'user1', 'user2', 'user3');
    const members = await redis.smembers('test:set');
    
    if (members.length === 3) {
      console.log('   ✅ Set operations עובדים!');
    } else {
      console.log('   ❌ שגיאה ב-Set operations');
      process.exit(1);
    }

    // בדיקה 4: EXISTS
    console.log('\n4️⃣ בודק EXISTS...');
    const exists = await redis.exists('test:connection');
    
    if (exists === 1) {
      console.log('   ✅ EXISTS עובד!');
    } else {
      console.log('   ❌ שגיאה ב-EXISTS');
      process.exit(1);
    }

    // ניקוי
    console.log('\n🧹 מנקה נתוני בדיקה...');
    await redis.del('test:connection', 'test:ttl', 'test:set');

    console.log('\n✅ כל הבדיקות עברו בהצלחה!');
    console.log('🎉 Upstash Redis מוכן לשימוש!\n');
    
  } catch (error) {
    console.error('\n❌ שגיאה בחיבור ל-Redis:');
    console.error(error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n💡 טיפ: ודא שה-Token נכון ב-.env');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 טיפ: ודא שה-URL נכון ב-.env');
    }
    
    process.exit(1);
  }
}

// טעינת .env או .env.local
const { readFileSync } = require('fs');
const { join } = require('path');

try {
  // נסה .env.local קודם
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (e) {
  // נסה .env
  try {
    const envFile = readFileSync(join(process.cwd(), '.env'), 'utf-8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  } catch (e2) {
    // אין קובץ .env
  }
}

testRedis();

