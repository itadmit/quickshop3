#!/usr/bin/env node
/**
 * הגדרת QStash CRON עם Token קשיח לבדיקה
 */

const { Client } = require('@upstash/qstash');

// ערכים קשיחים לבדיקה
const QSTASH_TOKEN = "eyJVc2VySUQiOiI0YTJjM2ZkNi00NTM5LTQ1NzEtODUxNy1lZjVjZjU4NzRlN2YiLCJQYXNzd29yZCI6IjU1N2YyZjM5ODJhNzQ4MWQ5ZjA5Nzk1MDBmOTZhNWQ3In0=";
const QSTASH_URL = "https://qstash.upstash.io";

// קבלת APP_URL מהארגומנטים או משתנה סביבה
const APP_URL = process.argv[2] || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

if (!APP_URL || APP_URL.includes('localhost')) {
  console.error('❌ שגיאה: APP_URL לא מוגדר או הוא localhost');
  console.log('\n💡 שימוש:');
  console.log('   node scripts/setup-qstash-with-token.js https://your-domain.vercel.app');
  console.log('   או הוסף ל-.env.local: APP_URL=https://your-domain.vercel.app');
  process.exit(1);
}

async function setupQStashCron() {
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
    process.exit(1);
  }
}

setupQStashCron().catch(console.error);

