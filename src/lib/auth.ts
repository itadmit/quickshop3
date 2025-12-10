import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_COOKIE_NAME = 'quickshop3_session';

export interface UserPayload {
  id: number;
  email: string;
  name: string;
}

export interface StorePayload {
  id: number;
  name: string;
  owner_id: number;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export async function generateToken(payload: UserPayload & { store_id: number }): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<(UserPayload & { store_id: number }) | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserPayload & { store_id: number };
  } catch (error: any) {
    console.log('Token verification failed:', error.message);
    return null;
  }
}

// Get user from request (server-side)
export async function getUserFromRequest(req: NextRequest): Promise<(UserPayload & { store_id: number }) | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

// Set session cookie on response
export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };
  
  response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
  
  console.log('Cookie set:', {
    name: SESSION_COOKIE_NAME,
    hasValue: !!token,
    options: cookieOptions,
  });
  
  return response;
}

// Clear session cookie on response
export function clearSessionCookie(response: NextResponse): NextResponse {
  // Delete cookie by setting it with expired date
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });
  
  console.log('Cookie cleared:', SESSION_COOKIE_NAME);
  
  return response;
}

// Generate JWT token for influencer
export async function generateInfluencerToken(payload: {
  id: number;
  store_id: number;
  email: string;
  role: 'influencer';
}): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d') // 30 days
    .setIssuedAt()
    .sign(secret);
  return token;
}

