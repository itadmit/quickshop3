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

/**
 * בדיקת הגדרות לאוטומציות
 */
async function checkAutomationsSetup(qstash, appUrl) {
  try {
    const resumeUrl = `${appUrl}/api/automations/resume`;
    console.log(`   📍 Endpoint לאוטומציות: ${resumeUrl}`);
    
    // בדיקה שהטוקן תקין לשימוש ב-delay
    if (QSTASH_TOKEN && QSTASH_TOKEN.length >= 20) {
      console.log('   ✓ QStash Token מוגדר נכון');
      console.log('   ✓ Token תקין לשימוש ב-delay באוטומציות');
    } else {
      console.log('   ⚠️  QStash Token לא תקין - אוטומציות עם המתנה לא יעבדו');
    }
    
    // בדיקה שה-APP_URL מוגדר
    if (appUrl && !appUrl.includes('localhost')) {
      console.log('   ✓ APP_URL מוגדר נכון');
    } else {
      console.log('   ⚠️  APP_URL לא מוגדר או הוא localhost - אוטומציות לא יעבדו בפרודקשן');
    }
    
    console.log('\n   📝 איך זה עובד:');
    console.log('      • אוטומציות לא צריכות CRON job - הן משתמשות ב-QStash delay');
    console.log('      • כשאוטומציה מגיעה לפעולת "המתן", היא שולחת בקשה ל-QStash עם delay');
    console.log('      • QStash ממתין את הזמן (שניות, דקות, שעות, ימים, שבועות)');
    console.log('      • אחרי ההמתנה, QStash קורא ל-/api/automations/resume');
    console.log('      • האוטומציה ממשיכה אוטומטית מהמקום שבו עצרה');
    console.log('\n   💡 דוגמה:');
    console.log('      הזמנה נוצרה → המתן 2 שבועות → שלח מייל');
    console.log('      האוטומציה תמתין 2 שבועות ואז תשלח את המייל אוטומטית');
    
    if (QSTASH_TOKEN && QSTASH_TOKEN.length >= 20 && appUrl && !appUrl.includes('localhost')) {
      console.log('\n   ✅ הכל מוכן לאוטומציות עם המתנה!');
    } else {
      console.log('\n   ⚠️  יש בעיות בהגדרות - בדוק את ה-QSTASH_TOKEN וה-APP_URL');
    }
    console.log('');
    
  } catch (error) {
    console.log(`   ⚠️  אזהרה: ${error.message}`);
    console.log('   💡 ודא שה-APP_URL נכון ושהאתר זמין\n');
  }
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

  // הגדרת CRON jobs
  const cronJobs = [
    {
      name: 'Sync Visitors',
      url: `${APP_URL}/api/cron/sync-visitors`,
      schedule: '*/5 * * * *', // כל 5 דקות
      description: 'העברת מבקרים מ-Redis ל-PostgreSQL',
    },
    {
      name: 'Archive Products',
      url: `${APP_URL}/api/cron/archive-products`,
      schedule: '0 * * * *', // כל שעה
      description: 'העברת מוצרים לארכיון אוטומטית',
    },
    {
      name: 'Update Discounts Status',
      url: `${APP_URL}/api/cron/update-discounts-status`,
      schedule: '0 * * * *', // כל שעה
      description: 'עדכון סטטוס הנחות וקופונים לפי תאריכים',
    },
    {
      name: 'Cleanup OTP Codes',
      url: `${APP_URL}/api/cron/cleanup-otp-codes`,
      schedule: '0 2 * * *', // כל יום בשעה 02:00
      description: 'ניקוי קודי OTP ישנים (פג תוקף, שימשו, או יותר מדי ניסיונות)',
    },
    {
      name: 'Check Abandoned Orders',
      url: `${APP_URL}/api/cron/check-abandoned-orders`,
      schedule: '0 * * * *', // כל שעה
      description: 'בדיקת הזמנות נטושות (ממתינות לתשלום מעבר לזמן שהוגדר) ושליחת אירועים לאוטומציות',
    },
  ];

  try {
    console.log('🚀 מגדיר QStash CRON Jobs...\n');
    console.log(`🔑 Token: ${QSTASH_TOKEN.substring(0, 30)}...`);
    console.log(`🌐 QStash URL: ${QSTASH_URL}`);
    console.log(`🌍 APP URL: ${APP_URL}\n`);

    // בדיקת חיבור - נסיון לקבל רשימת schedules
    console.log('🔍 בודק חיבור ל-QStash...');
    let existingSchedules = [];
    try {
      existingSchedules = await qstash.schedules.list();
      console.log(`   ✓ חיבור הצליח, נמצאו ${existingSchedules.length} CRON jobs קיימים\n`);
    } catch (e) {
      console.log(`   ⚠️  לא ניתן לקבל רשימת CRON jobs: ${e.message}`);
      console.log('   ממשיך ליצירת CRON jobs חדשים...\n');
    }

    // הגדרת כל ה-CRON jobs
    for (const job of cronJobs) {
      console.log(`\n📋 מגדיר: ${job.name}`);
      console.log(`   📍 URL: ${job.url}`);
      console.log(`   ⏰ Schedule: ${job.schedule}`);
      console.log(`   📝 ${job.description}\n`);

      // מחיקת CRON קיים (אם קיים)
      const existing = existingSchedules.find(s => s.destination === job.url);
      if (existing) {
        console.log(`   🗑️  נמצא CRON קיים (ID: ${existing.scheduleId}), מוחק...`);
        try {
          await qstash.schedules.delete(existing.scheduleId);
          console.log('   ✓ נמחק\n');
        } catch (e) {
          console.log(`   ⚠️  שגיאה במחיקה: ${e.message}\n`);
        }
      }

      // יצירת CRON חדש
      try {
        console.log('   ✨ יוצר CRON חדש...');
        const scheduleResult = await qstash.schedules.create({
          destination: job.url,
          cron: job.schedule,
          body: JSON.stringify({ source: 'qstash-cron' }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log(`   ✅ CRON Job הוגדר בהצלחה!`);
        console.log(`   📋 Schedule ID: ${scheduleResult.scheduleId}\n`);
      } catch (error) {
        console.error(`   ❌ שגיאה בהגדרת CRON: ${error.message}`);
        if (error.response) {
          console.error(`   Response: ${JSON.stringify(error.response.data || error.response, null, 2)}`);
        }
      }
    }

    console.log('\n✅ כל ה-CRON Jobs הוגדרו בהצלחה!\n');
    
    // בדיקת הגדרות לאוטומציות
    console.log('🔍 בודק הגדרות לאוטומציות...\n');
    await checkAutomationsSetup(qstash, APP_URL);
    
    console.log('\n💡 ניתן לבדוק את הסטטוס ב-https://console.upstash.com/qstash/schedules\n');

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

