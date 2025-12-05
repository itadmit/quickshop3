/**
 * GeoIP - קבלת מיקום גיאוגרפי לפי IP
 * משתמש ב-ip-api.com (חינמי, עד 45 requests/dak)
 * עם fallback ל-ipapi.co (חינמי, מדויק יותר בישראל)
 */

export interface GeoLocation {
  country: string;
  countryCode: string;
  city: string | null; // יכול להיות null אם אין עיר
  region: string;
  lat: number;
  lon: number;
  timezone: string;
  isp?: string;
}

const GEOIP_CACHE_TTL = 60 * 60 * 24; // 24 שעות (cache ב-Redis)

/**
 * קבלת מיקום גיאוגרפי לפי IP מ-ip-api.com
 */
async function getGeoLocationFromIpApi(ip: string): Promise<GeoLocation | null> {
  const isLocalIP = ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.');
  const ipToQuery = isLocalIP ? '' : ip;

  try {
    const url = ipToQuery 
      ? `http://ip-api.com/json/${ipToQuery}?fields=status,message,country,countryCode,city,regionName,lat,lon,timezone,isp`
      : `http://ip-api.com/json/?fields=status,message,country,countryCode,city,regionName,lat,lon,timezone,isp`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status === 'fail' || !data.city || data.city === '') {
      return null;
    }

    return {
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      city: data.city || null,
      region: data.regionName || 'Unknown',
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || 'UTC',
      isp: data.isp,
    };
  } catch (error) {
    return null;
  }
}

/**
 * קבלת מיקום גיאוגרפי לפי IP מ-ipapi.co (fallback - מדויק יותר בישראל)
 */
async function getGeoLocationFromIpApiCo(ip: string): Promise<GeoLocation | null> {
  const isLocalIP = ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.');
  
  try {
    // ipapi.co מחזיר את המיקום של ה-IP הציבורי אם נשלח IP מקומי
    const url = isLocalIP 
      ? 'https://ipapi.co/json/'
      : `https://ipapi.co/${ip}/json/`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    // ipapi.co מחזיר error אם יש בעיה
    if (data.error || !data.city || data.city === '') {
      return null;
    }

    return {
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || 'XX',
      city: data.city || null,
      region: data.region || 'Unknown',
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      timezone: data.timezone || 'UTC',
      isp: data.org,
    };
  } catch (error) {
    return null;
  }
}

/**
 * זיהוי עיר לפי קואורדינטות (בישראל)
 * משתמש במפה של ערים בישראל כדי לזהות את העיר הקרובה ביותר
 */
function getCityByCoordinates(lat: number, lon: number, countryCode: string): string | null {
  if (countryCode !== 'IL' || !lat || !lon) {
    return null;
  }

  // מפת ערים בישראל עם קואורדינטות (lat, lon)
  const israelCities: Array<{ name: string; lat: number; lon: number; radius: number }> = [
    { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, radius: 0.3 },
    { name: 'Jerusalem', lat: 31.7683, lon: 35.2137, radius: 0.3 },
    { name: 'Haifa', lat: 32.7940, lon: 34.9896, radius: 0.3 },
    { name: 'Rishon LeZion', lat: 31.9730, lon: 34.7925, radius: 0.2 },
    { name: 'Petah Tikva', lat: 32.0870, lon: 34.8878, radius: 0.2 },
    { name: 'Ashdod', lat: 31.8044, lon: 34.6553, radius: 0.2 },
    { name: 'Netanya', lat: 32.3320, lon: 34.8550, radius: 0.2 },
    { name: 'Beer Sheva', lat: 31.2529, lon: 34.7915, radius: 0.3 },
    { name: 'Holon', lat: 32.0103, lon: 34.7792, radius: 0.15 },
    { name: 'Bnei Brak', lat: 32.0807, lon: 34.8338, radius: 0.15 },
    { name: 'Rehovot', lat: 31.8947, lon: 34.8093, radius: 0.15 },
    { name: 'Bat Yam', lat: 32.0171, lon: 34.7459, radius: 0.15 },
    { name: 'Ashkelon', lat: 31.6688, lon: 34.5743, radius: 0.2 },
    { name: 'Herzliya', lat: 32.1624, lon: 34.8447, radius: 0.15 },
    { name: 'Kfar Saba', lat: 32.1719, lon: 34.9063, radius: 0.15 },
    { name: 'Hadera', lat: 32.4340, lon: 34.9195, radius: 0.15 },
    { name: 'Modiin', lat: 31.8969, lon: 35.0089, radius: 0.15 },
    { name: 'Ramat Gan', lat: 32.0822, lon: 34.8106, radius: 0.15 },
    { name: 'Givatayim', lat: 32.0722, lon: 34.8081, radius: 0.1 },
    { name: 'Nahariya', lat: 33.0081, lon: 35.0981, radius: 0.15 },
  ];

  // מציאת העיר הקרובה ביותר
  let closestCity: { name: string; distance: number } | null = null;
  
  for (const city of israelCities) {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
    );
    
    if (distance <= city.radius) {
      if (!closestCity || distance < closestCity.distance) {
        closestCity = { name: city.name, distance };
      }
    }
  }

  return closestCity ? closestCity.name : null;
}

/**
 * קבלת מיקום גיאוגרפי לפי IP
 * מנסה קודם ip-api.com, ואם לא מצליח או לא מדויק מספיק, מנסה ipapi.co
 * ואז משתמש בקואורדינטות כדי לזהות את העיר המדויקת יותר
 */
export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  // ניסיון ראשון: ip-api.com
  const result1 = await getGeoLocationFromIpApi(ip);
  
  // ניסיון שני: ipapi.co (אם הראשון נכשל או לא מדויק)
  const result2 = await getGeoLocationFromIpApiCo(ip);
  
  // בחירת התוצאה הטובה ביותר
  let bestResult: GeoLocation | null = null;
  
  if (result1 && result1.city) {
    bestResult = result1;
  } else if (result2 && result2.city) {
    bestResult = result2;
  } else if (result1) {
    bestResult = result1; // לפחות יש מדינה
  } else if (result2) {
    bestResult = result2;
  }

  if (!bestResult) {
    return null;
  }

  // אם זה ישראל ויש קואורדינטות, ננסה לזהות את העיר לפי הקואורדינטות
  if (bestResult.countryCode === 'IL' && bestResult.lat && bestResult.lon) {
    const cityByCoords = getCityByCoordinates(bestResult.lat, bestResult.lon, bestResult.countryCode);
    
    // אם זיהינו עיר לפי קואורדינטות והיא שונה מהעיר שחזרה מה-API, נשתמש בה
    if (cityByCoords && cityByCoords !== bestResult.city) {
      bestResult.city = cityByCoords;
    } else if (!bestResult.city && cityByCoords) {
      // אם לא הייתה עיר אבל זיהינו לפי קואורדינטות, נשתמש בה
      bestResult.city = cityByCoords;
    }
  }

  return bestResult;
}

