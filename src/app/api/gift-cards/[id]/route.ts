import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/gift-cards/:id - Get gift card details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const giftCardId = parseInt(id);
    const storeId = user.store_id;

    const giftCard = await queryOne(
      `SELECT * FROM gift_cards WHERE id = $1 AND store_id = $2`,
      [giftCardId, storeId]
    );

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    // Get transactions
    const transactions = await query(
      `SELECT * FROM gift_card_transactions WHERE gift_card_id = $1 ORDER BY created_at DESC`,
      [giftCardId]
    );

    return NextResponse.json(quickshopItem('gift_card', {
      ...giftCard,
      transactions,
    }));
  } catch (error: any) {
    console.error('Error fetching gift card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gift card' },
      { status: 500 }
    );
  }
}

// PUT /api/gift-cards/:id - Update gift card
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const giftCardId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();

    const existingGiftCard = await queryOne(
      `SELECT * FROM gift_cards WHERE id = $1 AND store_id = $2`,
      [giftCardId, storeId]
    );

    if (!existingGiftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
      paramIndex++;
    }

    if (body.note !== undefined) {
      updates.push(`note = $${paramIndex}`);
      values.push(body.note);
      paramIndex++;
    }

    if (body.expires_at !== undefined) {
      updates.push(`expires_at = $${paramIndex}`);
      values.push(body.expires_at || null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(quickshopItem('gift_card', existingGiftCard));
    }

    updates.push(`updated_at = now()`);
    values.push(giftCardId, storeId);

    const giftCard = await queryOne(
      `UPDATE gift_cards 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    await eventBus.emitEvent('gift_card.updated', {
      gift_card: giftCard,
      changes: body,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('gift_card', giftCard));
  } catch (error: any) {
    console.error('Error updating gift card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update gift card' },
      { status: 500 }
    );
  }
}

// DELETE /api/gift-cards/:id - Disable gift card (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const giftCardId = parseInt(id);
    const storeId = user.store_id;

    const giftCard = await queryOne(
      `SELECT * FROM gift_cards WHERE id = $1 AND store_id = $2`,
      [giftCardId, storeId]
    );

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    // Soft delete - disable the gift card
    const updatedGiftCard = await queryOne(
      `UPDATE gift_cards 
       SET is_active = false, updated_at = now()
       WHERE id = $1 AND store_id = $2
       RETURNING *`,
      [giftCardId, storeId]
    );

    await eventBus.emitEvent('gift_card.deleted', {
      gift_card: updatedGiftCard,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting gift card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete gift card' },
      { status: 500 }
    );
  }
}

