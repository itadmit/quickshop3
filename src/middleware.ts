import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_COOKIE_NAME = 'quickshop3_session';

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

  // Handle login/register pages FIRST (before dashboard routes)
  if (pathname === '/login' || pathname === '/register') {
    if (tokenValid && user) {
      // User is logged in, redirect to dashboard (not home page)
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (token && !tokenValid) {
      // Token exists but is invalid, clear it and allow access to login page
      return clearCookieAndContinue();
    }
    // Allow access to login/register pages if no token or token cleared
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/quickshop-payments'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/quickshop-payments');
  
  // Protect dashboard routes (all routes except public routes)
  const isDashboardRoute = !isPublicRoute && 
                          !pathname.startsWith('/api') &&
                          !pathname.startsWith('/_next');

  if (isDashboardRoute) {
    if (!token || !tokenValid || !user) {
      // No token or invalid token, clear it and redirect to login
      const loginUrl = '/login';
      return clearCookieAndRedirect(loginUrl);
    }
    // Token is valid, allow access
  }

  return NextResponse.next();
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

