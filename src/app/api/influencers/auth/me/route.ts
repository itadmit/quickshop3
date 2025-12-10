import { NextRequest, NextResponse } from 'next/server';
import { getInfluencerFromRequest } from '@/lib/auth/influencerAuth';
import { queryOne } from '@/lib/db';

// GET /api/influencers/auth/me - Get current influencer
export async function GET(req: NextRequest) {
  try {
    const influencer = await getInfluencerFromRequest(req);

    if (!influencer) {
      return NextResponse.json(
        { error: 'לא מאומת' },
        { status: 401 }
      );
    }

    // Get influencer details
    const influencerDetails = await queryOne<{
      id: number;
      name: string;
      email: string;
      phone: string | null;
      instagram_handle: string | null;
      tiktok_handle: string | null;
      store_id: number;
    }>(
      'SELECT id, name, email, phone, instagram_handle, tiktok_handle, store_id FROM influencers WHERE id = $1',
      [influencer.id]
    );

    if (!influencerDetails) {
      return NextResponse.json(
        { error: 'משפיען לא נמצא' },
        { status: 404 }
      );
    }

    // Get store name
    const store = await queryOne<{ name: string }>(
      'SELECT name FROM stores WHERE id = $1',
      [influencer.store_id]
    );

    return NextResponse.json({
      influencer: {
        ...influencerDetails,
        store_name: store?.name || '',
      },
    });
  } catch (error: any) {
    console.error('Get influencer error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בקבלת פרטי משפיען' },
      { status: 500 }
    );
  }
}

