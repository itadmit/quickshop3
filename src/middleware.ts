import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { updateUserActivity, updateVisitorActivity } from '@/lib/session-tracker';
import { getGeoLocation } from '@/lib/analytics/geoip';
import { parseUserAgent } from '@/lib/analytics/device-parser';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_COOKIE_NAME = 'quickshop3_session';
const INFLUENCER_SESSION_COOKIE = 'influencer_session';
const VISITOR_SESSION_COOKIE_NAME = 'quickshop3_visitor_session';

// Verify JWT token in Edge Runtime (using jose instead of jsonwebtoken)
async function verifyTokenEdge(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: number; email: string; name: string; store_id: number };
  } catch {
    return null;
  }
}

// Verify influencer token in Edge Runtime
async function verifyInfluencerTokenEdge(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if ((payload as any).role === 'influencer') {
      return payload as { id: number; email: string; store_id: number; role: 'influencer' };
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Skip middleware for API routes, static files, and Next.js internals
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Helper function להוספת header לצ'ק אאוט
  const addCheckoutHeader = (response: NextResponse) => {
    if (pathname.includes('/checkout')) {
      response.headers.set('x-is-checkout', 'true');
    }
    return response;
  };

  // Helper function to verify token and return user or null
  let user: { id: number; email: string; name: string; store_id: number } | null = null;
  let tokenValid = false;
  
  if (token) {
    try {
      user = await verifyTokenEdge(token);
      tokenValid = !!user;
    } catch (error) {
      tokenValid = false;
      user = null;
    }
  }

  // Helper function to create response with cleared cookie
  const clearCookieAndRedirect = (url: string) => {
    const response = NextResponse.redirect(new URL(url, request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    // Also set expired cookie to ensure it's cleared
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  };

  const clearCookieAndContinue = () => {
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE_NAME);
    // Also set expired cookie to ensure it's cleared
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  };

  // Handle influencer login page
  if (pathname === '/influencer/login') {
    const influencerToken = request.cookies.get(INFLUENCER_SESSION_COOKIE)?.value ||
                           request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (influencerToken) {
      const influencer = await verifyInfluencerTokenEdge(influencerToken);
      if (influencer) {
        // Influencer is logged in, redirect to dashboard
        return addCheckoutHeader(NextResponse.redirect(new URL('/influencer/dashboard', request.url)));
      }
    }
    // Allow access to influencer login page
    return addCheckoutHeader(NextResponse.next());
  }

  // Handle login/register pages FIRST (before dashboard routes)
  if (pathname === '/login' || pathname === '/register') {
    if (tokenValid && user) {
      // User is logged in, redirect to dashboard (not home page)
      return addCheckoutHeader(NextResponse.redirect(new URL('/dashboard', request.url)));
    } else if (token && !tokenValid) {
      // Token exists but is invalid, clear it and allow access to login page
      return addCheckoutHeader(clearCookieAndContinue());
    }
    // Allow access to login/register pages if no token or token cleared
    return addCheckoutHeader(NextResponse.next());
  }

  // Public routes that don't require authentication
  // Storefront routes: /shops/[storeSlug] - פתוח לכולם
  const publicRoutes = ['/', '/quickshop-payments'];
  const isStorefrontRoute = pathname.startsWith('/shops/');
  const isPublicRoute = publicRoutes.includes(pathname) || 
                       pathname.startsWith('/quickshop-payments') ||
                       isStorefrontRoute;
  
  // מעקב מבקרים בפרונט (לא חוסם את הבקשה)
  if (isStorefrontRoute) {
    try {
      // חילוץ storeSlug מה-URL
      const storeSlugMatch = pathname.match(/^\/shops\/([^\/]+)/);
      
      if (storeSlugMatch) {
        const storeSlug = storeSlugMatch[1];
        
        // קבלת או יצירת visitor session ID (ייחודי לכל טאב/דפדפן)
        let visitorSessionId = request.cookies.get(VISITOR_SESSION_COOKIE_NAME)?.value;
        let response = NextResponse.next();
        
        if (!visitorSessionId) {
          // יצירת session ID חדש (UUID)
          visitorSessionId = crypto.randomUUID();
          response.cookies.set(VISITOR_SESSION_COOKIE_NAME, visitorSessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
          });
        }
        
        // יצירת visitor ID ייחודי (storeSlug + session ID)
        // כל טאב/דפדפן יקבל session ID שונה, כך שכל אחד יספר כמבקר נפרד
        const visitorId = `${storeSlug}_${visitorSessionId}`;
        
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const referrer = request.headers.get('referer') || undefined;
        const currentPage = pathname;
        
        // חילוץ UTM parameters מה-URL
        const url = request.nextUrl;
        const utmSource = url.searchParams.get('utm_source') || undefined;
        const utmMedium = url.searchParams.get('utm_medium') || undefined;
        const utmCampaign = url.searchParams.get('utm_campaign') || undefined;
        const utmTerm = url.searchParams.get('utm_term') || undefined;
        const utmContent = url.searchParams.get('utm_content') || undefined;
        
        // Parse device info
        const deviceInfo = parseUserAgent(userAgent);
        
        // Get GeoIP (async, לא חוסם את הבקשה)
        getGeoLocation(ip).then((geo) => {
          // עדכון פעילות מבקר עם כל הנתונים
          updateVisitorActivity(visitorId, 0, {
            ip_address: ip,
            user_agent: userAgent,
            store_slug: storeSlug,
            current_page: currentPage,
            referrer: referrer,
            // GeoIP - שולח את כל הנתונים
            // אם geo?.city הוא null, נשלח undefined כדי לא לעדכן את הערך הקיים
            // אם geo?.city הוא string, נשלח אותו כדי לעדכן את המיקום
            country: geo?.country,
            country_code: geo?.countryCode,
            city: geo?.city ?? undefined, // null -> undefined (לא מעדכן), string -> string (מעדכן)
            region: geo?.region,
            lat: geo?.lat,
            lon: geo?.lon,
            timezone: geo?.timezone,
            // Device
            device_type: deviceInfo.device_type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            // UTM
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_term: utmTerm,
            utm_content: utmContent,
          }).catch((error) => {
            console.error('[Middleware] ❌ Failed to update visitor activity:', error);
          });
        }).catch(() => {
          // אם GeoIP נכשל, עדכן בלי GeoIP
          updateVisitorActivity(visitorId, 0, {
            ip_address: ip,
            user_agent: userAgent,
            store_slug: storeSlug,
            current_page: currentPage,
            referrer: referrer,
            device_type: deviceInfo.device_type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            // UTM
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_term: utmTerm,
            utm_content: utmContent,
          }).catch((error) => {
            console.error('[Middleware] ❌ Failed to update visitor activity:', error);
          });
        });
        
        // הוספת pathname ל-header כדי ש-CustomizerLayout יוכל לזהות את pageType
        response.headers.set('x-pathname', pathname);
        return addCheckoutHeader(response);
      }
    } catch (error) {
      // לא נכשל את הבקשה אם יש שגיאה במעקב
      console.error('[Middleware] ❌ Error tracking visitor:', error);
    }
  }
  
  // Protect influencer routes (except login)
  const isInfluencerRoute = pathname.startsWith('/influencer/') && pathname !== '/influencer/login';
  
  if (isInfluencerRoute) {
    const influencerToken = request.cookies.get(INFLUENCER_SESSION_COOKIE)?.value ||
                           request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!influencerToken) {
      // No token, redirect to influencer login
      return addCheckoutHeader(NextResponse.redirect(new URL('/influencer/login', request.url)));
    }
    
    const influencer = await verifyInfluencerTokenEdge(influencerToken);
    if (!influencer) {
      // Invalid token, clear it and redirect to influencer login
      const response = NextResponse.redirect(new URL('/influencer/login', request.url));
      response.cookies.delete(INFLUENCER_SESSION_COOKIE);
      response.cookies.set(INFLUENCER_SESSION_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return addCheckoutHeader(response);
    }
    // Influencer token is valid, allow access
    return addCheckoutHeader(NextResponse.next());
  }

  // Protect dashboard routes (all routes except public routes, storefront, and influencer routes)
  const isDashboardRoute = !isPublicRoute && 
                          !pathname.startsWith('/api') &&
                          !pathname.startsWith('/_next') &&
                          !pathname.startsWith('/influencer');

  if (isDashboardRoute) {
    if (!token || !tokenValid || !user) {
      // No token or invalid token, clear it and redirect to login
      const loginUrl = '/login';
      return addCheckoutHeader(clearCookieAndRedirect(loginUrl));
    }
    // Token is valid, allow access
    // עדכון פעילות משתמש ב-Redis (לא חוסם את הבקשה)
    if (user) {
      updateUserActivity(user.id, user.store_id, {
        email: user.email,
        name: user.name,
      }).catch((error) => {
        // לא נכשל את הבקשה אם Redis לא עובד
        console.error('Failed to update user activity:', error);
      });
    }
  }

  return addCheckoutHeader(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

