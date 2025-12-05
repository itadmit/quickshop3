#!/usr/bin/env node
/**
 * Script להגדרת Upstash QStash CRON Job
 * 
 * שימוש:
 * 1. קבל QSTASH_TOKEN מ-https://console.upstash.com/qstash
 * 2. הוסף ל-.env.local: QSTASH_TOKEN=...
 * 3. הרץ: npm run setup:qstash
 * 
 * זה יגדיר CRON job שיקרא ל-/api/cron/sync-visitors כל 5 דקות
 */

const { Client } = require('@upstash/qstash');
const { readFileSync } = require('fs');
const { join } = require('path');

// טעינת .env.local
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      let value = match[2].trim();
      // הסרת גרשיים כפולים או יחידים מהתחלה וסוף
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  });
} catch (e) {
  console.error('⚠️  לא נמצא .env.local, מנסה משתני סביבה קיימים...');
}

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const VERCEL_URL = process.env.VERCEL_URL;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// קביעת APP_URL לפי סדר עדיפות
let APP_URL = process.argv[2] || process.env.APP_URL || NEXT_PUBLIC_APP_URL;
if (!APP_URL && VERCEL_URL) {
  APP_URL = `https://${VERCEL_URL}`;
}
if (!APP_URL || APP_URL.includes('localhost')) {
  // אם אין APP_URL או שהוא localhost, נדרוש אותו
  console.error('❌ שגיאה: APP_URL לא מוגדר או הוא localhost');
  console.log('\n💡 הוסף ל-.env.local:');
  console.log('   APP_URL=https://your-domain.vercel.app');
  console.log('   או: APP_URL=https://your-custom-domain.com');
  console.log('\n   לדוגמה:');
  console.log('   APP_URL=https://quickshop3.vercel.app');
  console.log('\n   או העבר כפרמטר:');
  console.log('   npm run setup:qstash -- https://your-domain.vercel.app');
  process.exit(1);
}

if (!QSTASH_TOKEN) {
  console.error('❌ שגיאה: QSTASH_TOKEN לא נמצא ב-.env.local');
  console.log('\n💡 הוראות:');
  console.log('1. היכנס ל-https://console.upstash.com/qstash');
  console.log('2. לחץ על "Create Token" או העתק את ה-Token הקיים');
  console.log('3. הוסף ל-.env.local:');
  console.log('   QSTASH_TOKEN=your_token_here');
  console.log('   QSTASH_URL=https://qstash.upstash.io (אופציונלי)');
  console.log('   APP_URL=https://your-domain.com (חובה לפרודקשן)');
  process.exit(1);
}

async function setupQStashCron() {
  // בדיקה שהטוקן תקין
  if (!QSTASH_TOKEN || QSTASH_TOKEN.length < 20) {
    console.error('❌ שגיאה: QSTASH_TOKEN לא תקין');
    console.error('   הטוקן צריך להיות ארוך יותר (לפחות 20 תווים)');
    process.exit(1);
  }

  const qstash = new Client({
    token: QSTASH_TOKEN,
    baseUrl: QSTASH_URL,
  });

  const cronUrl = `${APP_URL}/api/cron/sync-visitors`;
  const schedule = '*/5 * * * *'; // כל 5 דקות

  try {
    console.log('🚀 מגדיר QStash CRON Job...\n');
    console.log(`🔑 Token: ${QSTASH_TOKEN.substring(0, 30)}...`);
    console.log(`🌐 QStash URL: ${QSTASH_URL}`);
    console.log(`📍 Destination URL: ${cronUrl}`);
    console.log(`⏰ Schedule: ${schedule} (כל 5 דקות)\n`);

    // בדיקת חיבור - נסיון לקבל רשימת schedules
    console.log('🔍 בודק חיבור ל-QStash...');
    try {
      const schedules = await qstash.schedules.list();
      console.log(`   ✓ חיבור הצליח, נמצאו ${schedules.length} CRON jobs קיימים\n`);
      
      // מחיקת CRON קיים (אם קיים)
      const existing = schedules.find(s => s.destination === cronUrl);
      if (existing) {
        console.log(`🗑️  נמצא CRON קיים (ID: ${existing.scheduleId}), מוחק...`);
        await qstash.schedules.delete(existing.scheduleId);
        console.log('   ✓ נמחק\n');
      }
    } catch (e) {
      console.log(`   ⚠️  לא ניתן לקבל רשימת CRON jobs: ${e.message}`);
      console.log('   ממשיך ליצירת CRON חדש...\n');
    }

    // יצירת CRON חדש
    console.log('✨ יוצר CRON חדש...');
    const scheduleResult = await qstash.schedules.create({
      destination: cronUrl,
      cron: schedule,
      body: JSON.stringify({ source: 'qstash-cron' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ CRON Job הוגדר בהצלחה!\n');
    console.log(`📋 Schedule ID: ${scheduleResult.scheduleId}`);
    console.log(`🔗 URL: ${cronUrl}`);
    console.log(`⏰ Schedule: ${schedule}`);
    console.log('\n💡 הערה: CRON יתחיל לרוץ אוטומטית כל 5 דקות');
    console.log('   ניתן לבדוק את הסטטוס ב-https://console.upstash.com/qstash\n');

  } catch (error) {
    console.error('❌ שגיאה בהגדרת QStash CRON:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data || error.response, null, 2));
    }
    if (error.message.includes('unable to authenticate')) {
      console.error('\n💡 פתרון אפשרי:');
      console.error('   1. ודא שה-QSTASH_TOKEN נכון מה-Console: https://console.upstash.com/qstash');
      console.error('   2. ודא שהטוקן לא מכיל רווחים או תווים מיוחדים');
      console.error('   3. נסה ליצור Token חדש מה-Console');
    }
    process.exit(1);
  }
}

setupQStashCron();

