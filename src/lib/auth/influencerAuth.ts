import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export interface InfluencerPayload {
  id: number;
  store_id: number;
  email: string;
  role: 'influencer';
}

const INFLUENCER_SESSION_COOKIE = 'influencer_session';

/**
 * Get influencer from request (for API routes)
 * Checks for influencer_session cookie or Authorization header
 */
export async function getInfluencerFromRequest(
  req: NextRequest
): Promise<InfluencerPayload | null> {
  const token = req.cookies.get(INFLUENCER_SESSION_COOKIE)?.value ||
                req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);
    // Verify this is an influencer token
    if ((payload as any).role !== 'influencer') {
      return null;
    }
    return payload as InfluencerPayload;
  } catch {
    return null;
  }
}

/**
 * Set influencer session cookie
 */
export function setInfluencerSessionCookie(response: NextResponse, token: string): NextResponse {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  };
  
  response.cookies.set(INFLUENCER_SESSION_COOKIE, token, cookieOptions);
  
  return response;
}

/**
 * Clear influencer session cookie
 */
export function clearInfluencerSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(INFLUENCER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

