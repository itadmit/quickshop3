/**
 * Session Tracker - מעקב אחר משתמשים מחוברים בזמן אמת
 * משתמש ב-Upstash Redis למעקב מהיר ויעיל
 */

import { Redis } from '@upstash/redis';

// אתחול Redis (Upstash)
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('Upstash Redis credentials not found. Session tracking will be disabled.');
      // יצירת instance דמה שלא עושה כלום
      return null as any;
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

const ACTIVE_USER_TTL = 600; // 10 דקות (בשניות)
const ACTIVE_USER_PREFIX = 'active_user:';
const ACTIVE_USERS_SET = 'active_users_set'; // Set של כל ה-user IDs הפעילים

// מעקב מבקרים בפרונט (visitors)
const ACTIVE_VISITOR_TTL = 600; // 10 דקות (בשניות)
const ACTIVE_VISITOR_PREFIX = 'active_visitor:';
const ACTIVE_VISITORS_SET = 'active_visitors_set'; // Set של כל ה-visitor IDs הפעילים

export interface ActiveUserData {
  user_id: number;
  store_id: number;
  last_activity: number; // timestamp
  email?: string;
  name?: string;
}

/**
 * עדכון פעילות משתמש (נקרא בכל פעולה של משתמש מחובר)
 */
export async function updateUserActivity(
  userId: number,
  storeId: number,
  userData?: { email?: string; name?: string }
): Promise<void> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return;

    const key = `${ACTIVE_USER_PREFIX}${userId}`;
    const data: ActiveUserData = {
      user_id: userId,
      store_id: storeId,
      last_activity: Date.now(),
      ...userData,
    };

    // שמירה עם TTL של 10 דקות
    await redisClient.setex(key, ACTIVE_USER_TTL, JSON.stringify(data));
    
    // הוספה ל-set של משתמשים פעילים (ללא TTL - ננקה ידנית)
    await redisClient.sadd(ACTIVE_USERS_SET, userId.toString());
  } catch (error) {
    // לא נכשל את הבקשה אם Redis לא עובד
    console.error('Error updating user activity:', error);
  }
}

/**
 * ספירת משתמשים מחוברים (10 דקות אחרונות)
 * @param storeId - אם מועבר, סופר רק משתמשים של store זה
 */
export async function getActiveUsersCount(storeId?: number): Promise<number> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return 0;

    // קבלת כל ה-user IDs הפעילים מה-set
    const userIds = await redisClient.smembers(ACTIVE_USERS_SET);
    
    if (!storeId) {
      // ספירת כל המשתמשים הפעילים (שעדיין קיימים ב-Redis)
      let count = 0;
      for (const userId of userIds) {
        const key = `${ACTIVE_USER_PREFIX}${userId}`;
        const exists = await redisClient.exists(key);
        if (exists === 1) {
          count++;
        } else {
          // ניקוי מה-set אם ה-session פג
          await redisClient.srem(ACTIVE_USERS_SET, userId);
        }
      }
      return count;
    }

    // לספור רק משתמשים של store מסוים
    let count = 0;
    for (const userId of userIds) {
      const key = `${ACTIVE_USER_PREFIX}${userId}`;
      try {
        const data = await redisClient.get<string>(key);
        if (data) {
          const userData: ActiveUserData = JSON.parse(data);
          if (userData.store_id === storeId) {
            count++;
          }
        } else {
          // ניקוי מה-set אם ה-session פג
          await redisClient.srem(ACTIVE_USERS_SET, userId);
        }
      } catch (error) {
        // התעלם משגיאות parsing
        continue;
      }
    }

    return count;
  } catch (error) {
    console.error('Error getting active users count:', error);
    return 0;
  }
}

/**
 * קבלת רשימת משתמשים מחוברים
 * @param storeId - אם מועבר, מחזיר רק משתמשים של store זה
 */
export async function getActiveUsers(storeId?: number): Promise<ActiveUserData[]> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return [];

    // קבלת כל ה-user IDs הפעילים מה-set
    const userIds = await redisClient.smembers(ACTIVE_USERS_SET);
    const users: ActiveUserData[] = [];

    for (const userId of userIds) {
      const key = `${ACTIVE_USER_PREFIX}${userId}`;
      try {
        const data = await redisClient.get<string>(key);
        if (data) {
          const userData: ActiveUserData = JSON.parse(data);
          if (!storeId || userData.store_id === storeId) {
            users.push(userData);
          }
        } else {
          // ניקוי מה-set אם ה-session פג
          await redisClient.srem(ACTIVE_USERS_SET, userId);
        }
      } catch (error) {
        // התעלם משגיאות parsing
        continue;
      }
    }

    // מיון לפי last_activity (הכי חדש ראשון)
    return users.sort((a, b) => b.last_activity - a.last_activity);
  } catch (error) {
    console.error('Error getting active users:', error);
    return [];
  }
}

/**
 * בדיקה אם משתמש מסוים מחובר
 */
export async function isUserActive(userId: number): Promise<boolean> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return false;

    const key = `${ACTIVE_USER_PREFIX}${userId}`;
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Error checking if user is active:', error);
    return false;
  }
}

/**
 * מחיקת session של משתמש (בהתנתקות)
 */
export async function removeUserSession(userId: number): Promise<void> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return;

    const key = `${ACTIVE_USER_PREFIX}${userId}`;
    await redisClient.del(key);
    // הסרה מה-set
    await redisClient.srem(ACTIVE_USERS_SET, userId.toString());
  } catch (error) {
    console.error('Error removing user session:', error);
  }
}

/**
 * ניקוי כל ה-sessions (לצורך תחזוקה)
 */
export async function clearAllSessions(): Promise<number> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return 0;

    // קבלת כל ה-user IDs מה-set
    const userIds = await redisClient.smembers(ACTIVE_USERS_SET);
    
    if (userIds.length === 0) return 0;

    // מחיקת כל ה-keys
    const keys = userIds.map(userId => `${ACTIVE_USER_PREFIX}${userId}`);
    await redisClient.del(...keys);
    
    // ניקוי ה-set
    await redisClient.del(ACTIVE_USERS_SET);
    
    return keys.length;
  } catch (error) {
    console.error('Error clearing all sessions:', error);
    return 0;
  }
}

// ============================================
// מעקב מבקרים בפרונט (Visitors)
// ============================================

export interface ActiveVisitorData {
  visitor_id: string; // session ID או IP
  store_id: number;
  store_slug?: string; // storeSlug למקרה שאין storeId
  last_activity: number; // timestamp
  first_seen?: number; // timestamp של ביקור ראשון
  ip_address?: string;
  user_agent?: string;
  // GeoIP data
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  // Device info
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  browser?: string;
  os?: string;
  // Referrer
  referrer?: string;
  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  // Page views
  page_views?: number;
  current_page?: string;
}

/**
 * עדכון פעילות מבקר בפרונט (נקרא בכל פעולה בפרונט)
 */
export async function updateVisitorActivity(
  visitorId: string,
  storeId: number,
  metadata?: { 
    ip_address?: string; 
    user_agent?: string; 
    store_slug?: string;
    current_page?: string;
    referrer?: string;
    country?: string;
    country_code?: string;
    city?: string;
    region?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    device_type?: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
    browser?: string;
    os?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }
): Promise<void> {
  try {
    const redisClient = getRedis();
    if (!redisClient) {
      return;
    }

    const key = `${ACTIVE_VISITOR_PREFIX}${visitorId}`;
    
    // קבלת נתונים קיימים (אם יש)
    const existingData = await redisClient.get<string>(key);
    let existingVisitor: ActiveVisitorData | null = null;
    
    if (existingData) {
      if (typeof existingData === 'string') {
        existingVisitor = JSON.parse(existingData);
      } else {
        existingVisitor = existingData as ActiveVisitorData;
      }
    }

    const now = Date.now();
    const pageViews = (existingVisitor?.page_views || 0) + 1;

    const data: ActiveVisitorData = {
      visitor_id: visitorId,
      store_id: storeId,
      store_slug: metadata?.store_slug,
      last_activity: now,
      first_seen: existingVisitor?.first_seen || now,
      ip_address: metadata?.ip_address || existingVisitor?.ip_address,
      user_agent: metadata?.user_agent || existingVisitor?.user_agent,
      // GeoIP
      country: metadata?.country || existingVisitor?.country,
      country_code: metadata?.country_code || existingVisitor?.country_code,
      city: metadata?.city || existingVisitor?.city,
      region: metadata?.region || existingVisitor?.region,
      lat: metadata?.lat || existingVisitor?.lat,
      lon: metadata?.lon || existingVisitor?.lon,
      timezone: metadata?.timezone || existingVisitor?.timezone,
      // Device
      device_type: metadata?.device_type || existingVisitor?.device_type,
      browser: metadata?.browser || existingVisitor?.browser,
      os: metadata?.os || existingVisitor?.os,
      // Referrer
      referrer: metadata?.referrer || existingVisitor?.referrer,
      // UTM Parameters (שמירה רק בביקור ראשון)
      utm_source: existingVisitor?.utm_source || metadata?.utm_source,
      utm_medium: existingVisitor?.utm_medium || metadata?.utm_medium,
      utm_campaign: existingVisitor?.utm_campaign || metadata?.utm_campaign,
      utm_term: existingVisitor?.utm_term || metadata?.utm_term,
      utm_content: existingVisitor?.utm_content || metadata?.utm_content,
      // Page tracking
      page_views: pageViews,
      current_page: metadata?.current_page,
    };

    // שמירה עם TTL של 10 דקות
    await redisClient.setex(key, ACTIVE_VISITOR_TTL, JSON.stringify(data));
    
    // הוספה ל-set של מבקרים פעילים
    await redisClient.sadd(ACTIVE_VISITORS_SET, visitorId);
    
    // מעקב עמודים פופולריים (Sorted Set)
    if (metadata?.current_page && metadata?.store_slug) {
      const pageKey = `store:${metadata.store_slug}:popular_pages`;
      await redisClient.zincrby(pageKey, 1, metadata.current_page);
      await redisClient.expire(pageKey, 60 * 60 * 24 * 7); // 7 days
    }
  } catch (error) {
    console.error('[updateVisitorActivity] ❌ Error:', error);
  }
}

/**
 * ספירת מבקרים פעילים בפרונט (10 דקות אחרונות)
 * @param storeId - אם מועבר, סופר רק מבקרים של store זה
 * @param storeSlug - אם מועבר, סופר גם לפי storeSlug (אם אין storeId)
 */
export async function getActiveVisitorsCount(storeId?: number, storeSlug?: string): Promise<number> {
  try {
    const redisClient = getRedis();
    if (!redisClient) {
      return 0;
    }

    const visitorIds = await redisClient.smembers(ACTIVE_VISITORS_SET);
    
    if (!storeId && !storeSlug) {
      let count = 0;
      for (const visitorId of visitorIds) {
        const key = `${ACTIVE_VISITOR_PREFIX}${visitorId}`;
        const exists = await redisClient.exists(key);
        if (exists === 1) {
          count++;
        } else {
          await redisClient.srem(ACTIVE_VISITORS_SET, visitorId);
        }
      }
      return count;
    }

    let count = 0;
    for (const visitorId of visitorIds) {
      const key = `${ACTIVE_VISITOR_PREFIX}${visitorId}`;
      try {
        const data = await redisClient.get<string>(key);
        if (data) {
          // Upstash Redis מחזיר כבר parsed object, לא JSON string
          let visitorData: ActiveVisitorData;
          if (typeof data === 'string') {
            visitorData = JSON.parse(data);
          } else {
            visitorData = data as ActiveVisitorData;
          }
          
          // אם יש storeSlug, נחפש רק לפי storeSlug (כי ב-middleware אנחנו שומרים storeId = 0)
          // אם אין storeSlug אבל יש storeId (וגם storeId != 0), נחפש לפי storeId
          let matches = false;
          if (storeSlug) {
            // אם יש storeSlug, נחפש רק לפי storeSlug (לא נבדוק storeId)
            matches = visitorData.store_slug === storeSlug;
          } else if (storeId !== undefined && storeId !== 0) {
            // אם אין storeSlug, נחפש לפי storeId
            matches = visitorData.store_id === storeId;
          }
          
          if (matches) {
            count++;
          }
        } else {
          await redisClient.srem(ACTIVE_VISITORS_SET, visitorId);
        }
      } catch (error) {
        console.error('[getActiveVisitorsCount] Error parsing visitor:', error);
        continue;
      }
    }

    return count;
  } catch (error) {
    console.error('Error getting active visitors count:', error);
    return 0;
  }
}

/**
 * קבלת רשימת מבקרים פעילים
 */
export async function getActiveVisitors(storeId?: number, storeSlug?: string): Promise<ActiveVisitorData[]> {
  try {
    const redisClient = getRedis();
    if (!redisClient) return [];

    const visitorIds = await redisClient.smembers(ACTIVE_VISITORS_SET);
    const visitors: ActiveVisitorData[] = [];

    for (const visitorId of visitorIds) {
      const key = `${ACTIVE_VISITOR_PREFIX}${visitorId}`;
      try {
        const data = await redisClient.get<string>(key);
        if (data) {
          // Upstash Redis מחזיר כבר parsed object, לא JSON string
          let visitorData: ActiveVisitorData;
          if (typeof data === 'string') {
            visitorData = JSON.parse(data);
          } else {
            visitorData = data as ActiveVisitorData;
          }
          
          let matches = false;
          if (!storeId && !storeSlug) {
            matches = true;
          } else if (storeSlug) {
            // אם יש storeSlug, נחפש רק לפי storeSlug
            matches = visitorData.store_slug === storeSlug;
          } else if (storeId !== undefined && storeId !== 0) {
            // אם אין storeSlug, נחפש לפי storeId
            matches = visitorData.store_id === storeId;
          }
          
          if (matches) {
            visitors.push(visitorData);
          }
        } else {
          await redisClient.srem(ACTIVE_VISITORS_SET, visitorId);
        }
      } catch (error) {
        continue;
      }
    }

    return visitors.sort((a, b) => b.last_activity - a.last_activity);
  } catch (error) {
    console.error('Error getting active visitors:', error);
    return [];
  }
}

