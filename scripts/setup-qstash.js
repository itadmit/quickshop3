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
      process.env[match[1]] = match[2].trim();
    }
  });
} catch (e) {
  console.error('⚠️  לא נמצא .env.local, מנסה משתני סביבה קיימים...');
}

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3099';

if (!QSTASH_TOKEN) {
  console.error('❌ שגיאה: QSTASH_TOKEN לא נמצא ב-.env.local');
  console.log('\n💡 הוראות:');
  console.log('1. היכנס ל-https://console.upstash.com/qstash');
  console.log('2. לחץ על "Create Token"');
  console.log('3. העתק את ה-Token');
  console.log('4. הוסף ל-.env.local: QSTASH_TOKEN=your_token_here');
  console.log('   (אופציונלי: QSTASH_URL=https://qstash.upstash.io)');
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
    console.log(`📍 URL: ${cronUrl}`);
    console.log(`⏰ Schedule: ${schedule} (כל 5 דקות)\n`);

    // מחיקת CRON קיים (אם קיים)
    console.log('🗑️  בודק CRON jobs קיימים...');
    try {
      const schedules = await qstash.schedules.list();
      const existing = schedules.find(s => s.destination === cronUrl);
      if (existing) {
        console.log(`   נמצא CRON קיים (ID: ${existing.scheduleId}), מוחק...`);
        await qstash.schedules.delete(existing.scheduleId);
        console.log('   ✓ נמחק\n');
      }
    } catch (e) {
      // אין CRON קיים, ממשיכים
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
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

setupQStashCron();

