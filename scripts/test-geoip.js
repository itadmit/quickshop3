#!/usr/bin/env node
/**
 * בדיקת GeoIP - מה ip-api.com מחזיר
 */

async function testGeoIP() {
  console.log('🧪 בודק GeoIP...\n');
  
  // בדיקה 1: IP מקומי (מחזיר את המיקום של ה-IP הציבורי)
  console.log('1️⃣ בדיקה עם IP מקומי (ריק = IP ציבורי):');
  try {
    const response1 = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,city,regionName,lat,lon,timezone,isp');
    const data1 = await response1.json();
    console.log('   תוצאה:', JSON.stringify(data1, null, 2));
  } catch (error) {
    console.error('   שגיאה:', error.message);
  }
  
  console.log('\n');
  
  // בדיקה 2: IP ספציפי (לדוגמה IP מישראל)
  console.log('2️⃣ בדיקה עם IP ספציפי מישראל:');
  try {
    const response2 = await fetch('http://ip-api.com/json/8.8.8.8?fields=status,message,country,countryCode,city,regionName,lat,lon,timezone,isp');
    const data2 = await response2.json();
    console.log('   תוצאה:', JSON.stringify(data2, null, 2));
  } catch (error) {
    console.error('   שגיאה:', error.message);
  }
  
  console.log('\n');
  
  // בדיקה 3: IP מישראל אחר (לדוגמה)
  console.log('3️⃣ בדיקה עם IP אחר מישראל:');
  try {
    const response3 = await fetch('http://ip-api.com/json/1.1.1.1?fields=status,message,country,countryCode,city,regionName,lat,lon,timezone,isp');
    const data3 = await response3.json();
    console.log('   תוצאה:', JSON.stringify(data3, null, 2));
  } catch (error) {
    console.error('   שגיאה:', error.message);
  }
  
  console.log('\n💡 הערה:');
  console.log('   - ip-api.com מחזיר את המיקום של ה-IP הציבורי');
  console.log('   - אם אתה נכנס מאותו IP (אותו מכשיר/רשת), הוא יחזיר את אותו מיקום');
  console.log('   - כדי לראות מיקומים שונים, צריך להיכנס מרשת אחרת (IP שונה)');
}

testGeoIP().catch(console.error);

