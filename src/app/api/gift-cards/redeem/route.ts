import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { eventBus } from '@/lib/events/eventBus';

/**
 * POST /api/gift-cards/redeem
 * מימוש גיפט קארד - הפחתת סכום מהיתרה
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, storeId, amount, orderId, orderNumber } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'קוד גיפט קארד נדרש' },
        { status: 400 }
      );
    }

    if (!storeId || typeof storeId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'מזהה חנות נדרש' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'סכום לא תקין' },
        { status: 400 }
      );
    }

    // חיפוש גיפט קארד
    const giftCard = await queryOne<{
      id: number;
      code: string;
      current_value: string;
      is_active: boolean;
      expires_at: Date | null;
    }>(
      `SELECT id, code, current_value, is_active, expires_at
       FROM gift_cards
       WHERE store_id = $1 AND code = $2`,
      [storeId, code.toUpperCase()]
    );

    if (!giftCard) {
      return NextResponse.json({
        success: false,
        error: 'גיפט קארד לא נמצא',
      });
    }

    if (!giftCard.is_active) {
      return NextResponse.json({
        success: false,
        error: 'גיפט קארד אינו פעיל',
      });
    }

    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'גיפט קארד פג תוקף',
      });
    }

    const currentValue = parseFloat(giftCard.current_value);
    
    if (currentValue <= 0) {
      return NextResponse.json({
        success: false,
        error: 'אין יתרה בגיפט קארד',
      });
    }

    // חישוב הסכום שיופחת (לא יותר מהיתרה הנוכחית)
    const amountToRedeem = Math.min(amount, currentValue);
    const newBalance = currentValue - amountToRedeem;

    // עדכון היתרה
    await queryOne(
      `UPDATE gift_cards 
       SET current_value = $1, updated_at = now()
       WHERE id = $2`,
      [newBalance, giftCard.id]
    );

    // יצירת רשומת טרנזקציה
    await queryOne(
      `INSERT INTO gift_card_transactions (
        gift_card_id, transaction_type, amount, balance_before, balance_after,
        order_id, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
      [
        giftCard.id,
        'redeem',
        amountToRedeem,
        currentValue,
        newBalance,
        orderId || null,
        orderNumber ? `הזמנה #${orderNumber}` : null,
      ]
    );

    // Emit event
    await eventBus.emitEvent('gift_card.redeemed', {
      gift_card_id: giftCard.id,
      code: giftCard.code,
      amount: amountToRedeem,
      new_balance: newBalance,
      order_id: orderId,
      store_id: storeId,
    });

    return NextResponse.json({
      success: true,
      amountRedeemed: amountToRedeem,
      remainingBalance: newBalance,
      giftCardId: giftCard.id,
    });
  } catch (error: any) {
    console.error('Error redeeming gift card:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה במימוש גיפט קארד' },
      { status: 500 }
    );
  }
}

