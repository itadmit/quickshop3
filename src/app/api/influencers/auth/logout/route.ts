import { NextRequest, NextResponse } from 'next/server';
import { clearInfluencerSessionCookie } from '@/lib/auth/influencerAuth';

// POST /api/influencers/auth/logout - Influencer logout
export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
    });

    return clearInfluencerSessionCookie(response);
  } catch (error: any) {
    console.error('Influencer logout error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהתנתקות' },
      { status: 500 }
    );
  }
}



