import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

// POST /api/influencers/[id]/reset-password - Reset influencer password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const influencerId = parseInt(id);
    const body = await request.json();

    if (!body.new_password) {
      return NextResponse.json(
        { error: 'סיסמה חדשה נדרשת' },
        { status: 400 }
      );
    }

    if (body.new_password.length < 8) {
      return NextResponse.json(
        { error: 'סיסמה חייבת להכיל לפחות 8 תווים' },
        { status: 400 }
      );
    }

    // Verify influencer belongs to this store
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM influencers WHERE id = $1 AND store_id = $2',
      [influencerId, user.store_id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'משפיען לא נמצא' }, { status: 404 });
    }

    // Hash new password
    const password_hash = await hashPassword(body.new_password);

    // Update password
    await query(
      'UPDATE influencers SET password_hash = $1, updated_at = now() WHERE id = $2',
      [password_hash, influencerId]
    );

    return NextResponse.json({
      success: true,
      message: 'סיסמה עודכנה בהצלחה',
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}



