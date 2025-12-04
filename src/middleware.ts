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

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/quickshop-payments'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/quickshop-payments');
  
  // Protect dashboard routes (all routes except public routes)
  const isDashboardRoute = !isPublicRoute && 
                          !pathname.startsWith('/api') &&
                          !pathname.startsWith('/_next');

  if (isDashboardRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const user = await verifyTokenEdge(token);
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from login/register pages
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      const user = await verifyTokenEdge(token);
      if (user) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
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

