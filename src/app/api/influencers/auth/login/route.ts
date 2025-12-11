import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, generateInfluencerToken } from '@/lib/auth';
import { setInfluencerSessionCookie } from '@/lib/auth/influencerAuth';

// POST /api/influencers/auth/login - Influencer login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'אימייל וסיסמה נדרשים' },
        { status: 400 }
      );
    }

    // Find influencer
    const influencer = await queryOne<{
      id: number;
      email: string;
      name: string;
      password_hash: string;
      store_id: number;
      is_active: boolean;
    }>(
      `SELECT i.id, i.email, i.name, i.password_hash, i.store_id, i.is_active
       FROM influencers i
       WHERE i.email = $1`,
      [email]
    );

    if (!influencer) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    if (!influencer.is_active) {
      return NextResponse.json(
        { error: 'חשבון זה לא פעיל' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, influencer.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Update last_login_at
    await queryOne(
      'UPDATE influencers SET last_login_at = now() WHERE id = $1',
      [influencer.id]
    );

    // Generate token
    const token = await generateInfluencerToken({
      id: influencer.id,
      store_id: influencer.store_id,
      email: influencer.email,
      role: 'influencer',
    });

    const response = NextResponse.json({
      success: true,
      token,
      influencer: {
        id: influencer.id,
        name: influencer.name,
        email: influencer.email,
        store_id: influencer.store_id,
      },
    });

    // Set session cookie
    return setInfluencerSessionCookie(response, token);
  } catch (error: any) {
    console.error('Influencer login error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}



