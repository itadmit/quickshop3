import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/popups/:id - Get popup details
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
    const popupId = parseInt(id);
    const storeId = user.store_id;

    const popup = await queryOne(
      `SELECT * FROM popups WHERE id = $1 AND store_id = $2`,
      [popupId, storeId]
    );

    if (!popup) {
      return NextResponse.json({ error: 'Popup not found' }, { status: 404 });
    }

    return NextResponse.json(quickshopItem('popup', popup));
  } catch (error: any) {
    console.error('Error fetching popup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch popup' },
      { status: 500 }
    );
  }
}

// PUT /api/popups/:id - Update popup
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
    const popupId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();

    const existingPopup = await queryOne(
      `SELECT * FROM popups WHERE id = $1 AND store_id = $2`,
      [popupId, storeId]
    );

    if (!existingPopup) {
      return NextResponse.json({ error: 'Popup not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(body.name);
      paramIndex++;
    }

    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(body.title);
      paramIndex++;
    }

    if (body.content_html !== undefined) {
      updates.push(`content_html = $${paramIndex}`);
      values.push(body.content_html);
      paramIndex++;
    }

    if (body.trigger_type !== undefined) {
      updates.push(`trigger_type = $${paramIndex}`);
      values.push(body.trigger_type);
      paramIndex++;
    }

    if (body.trigger_value !== undefined) {
      updates.push(`trigger_value = $${paramIndex}`);
      values.push(body.trigger_value);
      paramIndex++;
    }

    if (body.display_rules !== undefined) {
      updates.push(`display_rules = $${paramIndex}`);
      values.push(body.display_rules ? JSON.stringify(body.display_rules) : null);
      paramIndex++;
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
      paramIndex++;
    }

    if (body.starts_at !== undefined) {
      updates.push(`starts_at = $${paramIndex}`);
      values.push(body.starts_at || null);
      paramIndex++;
    }

    if (body.ends_at !== undefined) {
      updates.push(`ends_at = $${paramIndex}`);
      values.push(body.ends_at || null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(quickshopItem('popup', existingPopup));
    }

    updates.push(`updated_at = now()`);
    values.push(popupId, storeId);

    const popup = await queryOne(
      `UPDATE popups 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    await eventBus.emitEvent('popup.updated', {
      popup: popup,
      changes: body,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('popup', popup));
  } catch (error: any) {
    console.error('Error updating popup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update popup' },
      { status: 500 }
    );
  }
}

// DELETE /api/popups/:id - Delete popup
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
    const popupId = parseInt(id);
    const storeId = user.store_id;

    const popup = await queryOne(
      `SELECT * FROM popups WHERE id = $1 AND store_id = $2`,
      [popupId, storeId]
    );

    if (!popup) {
      return NextResponse.json({ error: 'Popup not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM popups WHERE id = $1 AND store_id = $2`,
      [popupId, storeId]
    );

    await eventBus.emitEvent('popup.deleted', {
      popup: popup,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting popup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete popup' },
      { status: 500 }
    );
  }
}

