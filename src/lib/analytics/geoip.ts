/**
 * GeoIP - קבלת מיקום גיאוגרפי לפי IP
 * משתמש ב-ip-api.com (חינמי, עד 45 requests/dak)
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
 * קבלת מיקום גיאוגרפי לפי IP
 * משתמש ב-ip-api.com (חינמי)
 */
export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  // אם זה IP מקומי או unknown, ננסה לקבל את המיקום האמיתי דרך ip-api.com
  // ip-api.com מחזיר את המיקום של ה-IP הציבורי גם אם נשלח IP מקומי
  const isLocalIP = ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.');
  
  // אם זה IP מקומי, ננסה לקבל את המיקום האמיתי (ip-api.com מחזיר את המיקום של ה-IP הציבורי)
  const ipToQuery = isLocalIP ? '' : ip; // ריק = המיקום של ה-IP הציבורי

  try {
    // שימוש ב-ip-api.com (חינמי, עד 45 requests/dak)
    // אם ipToQuery ריק, נקבל את המיקום של ה-IP הציבורי
    const url = ipToQuery 
      ? `http://ip-api.com/json/${ipToQuery}?fields=status,message,country,countryCode,city,regionName,lat,lon,timezone,isp`
      : `http://ip-api.com/json/?fields=status,message,country,countryCode,city,regionName,lat,lon,timezone,isp`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === 'fail') {
      return null;
    }

    // אם יש עיר, נחזיר אותה. אם לא, נחזיר null במקום "Local"
    if (!data.city || data.city === '') {
      return null;
    }

    return {
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      city: data.city || null, // null במקום 'Unknown' אם אין עיר
      region: data.regionName || 'Unknown',
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || 'UTC',
      isp: data.isp,
    };
  } catch (error) {
    console.error('[GeoIP] Error fetching location:', error);
    return null;
  }
}

