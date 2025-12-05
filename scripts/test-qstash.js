#!/usr/bin/env node
/**
 * בדיקת QStash עם ערכים קשיחים
 */

const { Client } = require('@upstash/qstash');

// ערכים קשיחים לבדיקה
const QSTASH_TOKEN = "eyJVc2VySUQiOiI0YTJjM2ZkNi00NTM5LTQ1NzEtODUxNy1lZjVjZjU4NzRlN2YiLCJQYXNzd29yZCI6IjU1N2YyZjM5ODJhNzQ4MWQ5ZjA5Nzk1MDBmOTZhNWQ3In0=";
const QSTASH_URL = "https://qstash.upstash.io";
const QSTASH_CURRENT_SIGNING_KEY = "sig_5BFuSQhBauurz3Hd4iT4EFo8L4H7";
const QSTASH_NEXT_SIGNING_KEY = "sig_7EacXWKnZ75Yipofo9i61H1p9UQB";

async function testQStash() {
  console.log('🧪 בודק QStash עם ערכים קשיחים...\n');
  console.log(`🔑 Token: ${QSTASH_TOKEN.substring(0, 30)}...`);
  console.log(`🌐 URL: ${QSTASH_URL}`);
  console.log(`🔐 Current Signing Key: ${QSTASH_CURRENT_SIGNING_KEY}`);
  console.log(`🔐 Next Signing Key: ${QSTASH_NEXT_SIGNING_KEY}\n`);

  // ניסיון 1: עם Token בלבד
  console.log('📝 ניסיון 1: Client עם Token בלבד...');
  try {
    const client1 = new Client({
      token: QSTASH_TOKEN,
      baseUrl: QSTASH_URL,
    });
    
    const schedules1 = await client1.schedules.list();
    console.log('✅ הצליח! נמצאו', schedules1.length, 'CRON jobs');
    console.log('   Schedules:', JSON.stringify(schedules1, null, 2));
  } catch (error) {
    console.error('❌ נכשל:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data || error.response, null, 2));
    }
  }

  console.log('\n');

  // ניסיון 2: עם Token + Signing Keys
  console.log('📝 ניסיון 2: Client עם Token + Signing Keys...');
  try {
    const client2 = new Client({
      token: QSTASH_TOKEN,
      baseUrl: QSTASH_URL,
      currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: QSTASH_NEXT_SIGNING_KEY,
    });
    
    const schedules2 = await client2.schedules.list();
    console.log('✅ הצליח! נמצאו', schedules2.length, 'CRON jobs');
    console.log('   Schedules:', JSON.stringify(schedules2, null, 2));
  } catch (error) {
    console.error('❌ נכשל:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data || error.response, null, 2));
    }
  }

  console.log('\n');

  // ניסיון 3: REST API ישירות
  console.log('📝 ניסיון 3: REST API ישירות...');
  try {
    const response = await fetch(`${QSTASH_URL}/v2/schedules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ הצליח! נמצאו', Array.isArray(data) ? data.length : '?', 'CRON jobs');
      console.log('   Data:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ נכשל:', response.status, response.statusText);
      console.error('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ נכשל:', error.message);
  }

  console.log('\n');

  // ניסיון 4: בדיקת Token format
  console.log('📝 ניסיון 4: בדיקת Token format...');
  try {
    // ניסיון decode base64
    const decoded = Buffer.from(QSTASH_TOKEN, 'base64').toString('utf-8');
    console.log('   Decoded Token:', decoded);
    const parsed = JSON.parse(decoded);
    console.log('   Parsed:', JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error('   לא ניתן לפרסר את ה-Token:', error.message);
  }
}

testQStash().catch(console.error);

