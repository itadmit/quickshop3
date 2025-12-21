import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

/**
 * POST /api/gift-cards/validate
 * אימות קוד גיפט קארד
 * בודק אם הקוד קיים, פעיל, ולא פג תוקף
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, storeId } = body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { valid: false, error: 'קוד גיפט קארד נדרש' },
        { status: 400 }
      );
    }

    if (!storeId || typeof storeId !== 'number') {
      return NextResponse.json(
        { valid: false, error: 'מזהה חנות נדרש' },
        { status: 400 }
      );
    }

    // חיפוש גיפט קארד לפי קוד
    const giftCard = await queryOne<{
      id: number;
      code: string;
      initial_value: string;
      current_value: string;
      currency: string;
      expires_at: Date | null;
      is_active: boolean;
    }>(
      `SELECT id, code, initial_value, current_value, currency, expires_at, is_active
       FROM gift_cards
       WHERE store_id = $1 AND code = $2`,
      [storeId, code.toUpperCase()]
    );

    if (!giftCard) {
      return NextResponse.json({
        valid: false,
        error: 'קוד גיפט קארד לא נמצא',
      });
    }

    // בדיקה אם פעיל
    if (!giftCard.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'גיפט קארד זה אינו פעיל',
      });
    }

    // בדיקת תוקף
    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'גיפט קארד זה פג תוקף',
      });
    }

    const currentValue = parseFloat(giftCard.current_value);
    
    // בדיקה אם יש יתרה
    if (currentValue <= 0) {
      return NextResponse.json({
        valid: false,
        error: 'אין יתרה בגיפט קארד זה',
      });
    }

    return NextResponse.json({
      valid: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        balance: currentValue,
        currency: giftCard.currency,
        expiresAt: giftCard.expires_at,
      },
    });
  } catch (error: any) {
    console.error('Error validating gift card:', error);
    return NextResponse.json(
      { valid: false, error: 'שגיאה באימות גיפט קארד' },
      { status: 500 }
    );
  }
}

