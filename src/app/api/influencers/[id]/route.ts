import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { Influencer, UpdateInfluencerRequest, InfluencerWithStats } from '@/types/influencer';

// GET /api/influencers/[id] - Get influencer details
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
    const influencerId = parseInt(id);

    // Get influencer
    const influencer = await queryOne<Influencer>(
      'SELECT * FROM influencers WHERE id = $1 AND store_id = $2',
      [influencerId, user.store_id]
    );

    if (!influencer) {
      return NextResponse.json({ error: 'משפיען לא נמצא' }, { status: 404 });
    }

    // Get coupons
    const coupons = await query<{
      id: number;
      code: string;
      discount_type: string;
      value: string | null;
      usage_count: number;
      usage_limit: number | null;
      is_active: boolean;
      starts_at: Date | null;
      ends_at: Date | null;
    }>(
      'SELECT id, code, discount_type, value, usage_count, usage_limit, is_active, starts_at, ends_at FROM discount_codes WHERE influencer_id = $1 ORDER BY created_at DESC',
      [influencerId]
    );

    // Get stats
    const statsResult = await queryOne<{
      total_sales: string;
      total_orders: string;
      average_order_value: string;
      last_order_date: Date | null;
    }>(
      `SELECT 
        COALESCE(SUM(o.total_price), 0) as total_sales,
        COUNT(DISTINCT o.id) as total_orders,
        CASE 
          WHEN COUNT(DISTINCT o.id) > 0 THEN COALESCE(SUM(o.total_price), 0) / COUNT(DISTINCT o.id)
          ELSE 0
        END as average_order_value,
        MAX(o.created_at) as last_order_date
      FROM discount_codes dc
      LEFT JOIN orders o ON o.discount_codes @> jsonb_build_array(dc.code)
        AND (o.fulfillment_status IS NULL OR o.fulfillment_status != 'canceled')
        AND (o.financial_status IS NULL OR o.financial_status != 'voided')
      WHERE dc.influencer_id = $1`,
      [influencerId]
    );

    return NextResponse.json({
      influencer: {
        ...influencer,
        coupons: coupons.map(c => ({
          ...c,
          value: c.value ? parseFloat(c.value) : null,
        })),
        stats: {
          total_sales: parseFloat(statsResult.total_sales || '0'),
          total_orders: parseInt(statsResult.total_orders || '0'),
          average_order_value: parseFloat(statsResult.average_order_value || '0'),
          last_order_date: statsResult.last_order_date,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching influencer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch influencer' },
      { status: 500 }
    );
  }
}

// PUT /api/influencers/[id] - Update influencer
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
    const influencerId = parseInt(id);
    const body: UpdateInfluencerRequest = await request.json();

    // Verify influencer belongs to this store
    const existing = await queryOne<Influencer>(
      'SELECT * FROM influencers WHERE id = $1 AND store_id = $2',
      [influencerId, user.store_id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'משפיען לא נמצא' }, { status: 404 });
    }

    // Check email uniqueness if email is being updated
    if (body.email && body.email !== existing.email) {
      const emailExists = await queryOne<Influencer>(
        'SELECT * FROM influencers WHERE store_id = $1 AND email = $2 AND id != $3',
        [user.store_id, body.email, influencerId]
      );

      if (emailExists) {
        return NextResponse.json(
          { error: 'אימייל זה כבר קיים במערכת' },
          { status: 400 }
        );
      }
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(body.name);
    }
    if (body.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(body.email);
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      params.push(body.phone);
    }
    if (body.instagram_handle !== undefined) {
      updates.push(`instagram_handle = $${paramIndex++}`);
      params.push(body.instagram_handle);
    }
    if (body.tiktok_handle !== undefined) {
      updates.push(`tiktok_handle = $${paramIndex++}`);
      params.push(body.tiktok_handle);
    }
    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(body.is_active);
    }

    updates.push(`updated_at = now()`);
    params.push(influencerId, user.store_id);

    if (updates.length > 1) {
      await query(
        `UPDATE influencers SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND store_id = $${paramIndex++}`,
        params
      );
    }

    // Update coupon assignments if provided
    if (body.coupon_ids !== undefined) {
      // ✅ הסרת כל השיוכים הנוכחיים של המשפיען הזה
      await query(
        'UPDATE discount_codes SET influencer_id = NULL WHERE influencer_id = $1 AND store_id = $2',
        [influencerId, user.store_id]
      );

      // ✅ שיוך קופונים חדשים (אם יש)
      if (body.coupon_ids && Array.isArray(body.coupon_ids) && body.coupon_ids.length > 0) {
        // ✅ הסרת שיוכים של קופונים אלה למשפיענים אחרים (אם יש)
        // כדי לאפשר שיוך מחדש למשפיען הנוכחי
        for (const couponId of body.coupon_ids) {
          await query(
            `UPDATE discount_codes 
             SET influencer_id = NULL 
             WHERE id = $1 
             AND store_id = $2
             AND influencer_id IS NOT NULL
             AND influencer_id != $3`,
            [couponId, user.store_id, influencerId]
          );
        }

        // ✅ שיוך הקופונים למשפיען הנוכחי
        for (const couponId of body.coupon_ids) {
          await query(
            `UPDATE discount_codes 
             SET influencer_id = $1 
             WHERE id = $2 
             AND store_id = $3`,
            [influencerId, couponId, user.store_id]
          );
        }
      }
    }

    // Get updated influencer
    const updated = await queryOne<Influencer>(
      'SELECT * FROM influencers WHERE id = $1 AND store_id = $2',
      [influencerId, user.store_id]
    );

    return NextResponse.json({ influencer: updated });
  } catch (error: any) {
    console.error('Error updating influencer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update influencer' },
      { status: 500 }
    );
  }
}

// DELETE /api/influencers/[id] - Delete influencer
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
    const influencerId = parseInt(id);

    // Verify influencer belongs to this store
    const existing = await queryOne<Influencer>(
      'SELECT * FROM influencers WHERE id = $1 AND store_id = $2',
      [influencerId, user.store_id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'משפיען לא נמצא' }, { status: 404 });
    }

    // Remove coupon assignments (set to NULL)
    await query(
      'UPDATE discount_codes SET influencer_id = NULL WHERE influencer_id = $1',
      [influencerId]
    );

    // Delete influencer
    await query('DELETE FROM influencers WHERE id = $1', [influencerId]);

    return NextResponse.json({
      success: true,
      message: 'משפיען נמחק בהצלחה',
    });
  } catch (error: any) {
    console.error('Error deleting influencer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete influencer' },
      { status: 500 }
    );
  }
}

