import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { Influencer, CreateInfluencerRequest, UpdateInfluencerRequest, InfluencerWithStats } from '@/types/influencer';

// GET /api/influencers - List all influencers
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');

    // Build WHERE clause
    let whereClause = 'WHERE store_id = $1';
    const params: any[] = [user.store_id];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== null) {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM influencers ${whereClause}`;
    const totalResult = await queryOne<{ total: string }>(countSql, params);
    const total = parseInt(totalResult.total);

    // Get influencers with stats
    // Need to rebuild whereClause for the JOIN query (it references 'i' table)
    let joinWhereClause = 'WHERE i.store_id = $1';
    const joinParams: any[] = [user.store_id];
    let joinParamIndex = 2;

    if (search) {
      joinWhereClause += ` AND (i.name ILIKE $${joinParamIndex} OR i.email ILIKE $${joinParamIndex})`;
      joinParams.push(`%${search}%`);
      joinParamIndex++;
    }

    if (isActive !== null) {
      joinWhereClause += ` AND i.is_active = $${joinParamIndex}`;
      joinParams.push(isActive === 'true');
      joinParamIndex++;
    }

    const limitParamIndex = joinParamIndex;
    const offsetParamIndex = joinParamIndex + 1;
    
    const sql = `
      SELECT 
        i.*,
        COALESCE(SUM(o.total_price), 0) as total_sales,
        COUNT(DISTINCT o.id) as total_orders
      FROM influencers i
      LEFT JOIN discount_codes dc ON dc.influencer_id = i.id
      LEFT JOIN orders o ON o.discount_codes @> jsonb_build_array(dc.code)
        AND (o.fulfillment_status IS NULL OR o.fulfillment_status != 'canceled')
        AND (o.financial_status IS NULL OR o.financial_status != 'voided')
      ${joinWhereClause}
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;
    joinParams.push(limit, offset);

    const influencers = await query<Influencer & { total_sales: string; total_orders: string }>(sql, joinParams);

    // Get coupons for each influencer
    const influencersWithCoupons: InfluencerWithStats[] = await Promise.all(
      influencers.map(async (inf) => {
        const coupons = await query<{
          id: number;
          code: string;
          discount_type: string;
          value: string | null;
          usage_count: number;
          usage_limit: number | null;
        }>(
          'SELECT id, code, discount_type, value, usage_count, usage_limit FROM discount_codes WHERE influencer_id = $1',
          [inf.id]
        );

        return {
          ...inf,
          total_sales: parseFloat(inf.total_sales || '0'),
          total_orders: parseInt(inf.total_orders || '0'),
          coupons: coupons.map(c => ({
            ...c,
            value: c.value ? parseFloat(c.value) : null,
          })),
        };
      })
    );

    return NextResponse.json({
      influencers: influencersWithCoupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching influencers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch influencers' },
      { status: 500 }
    );
  }
}

// POST /api/influencers - Create influencer
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateInfluencerRequest = await request.json();

    // Validation
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'שם, אימייל וסיסמה נדרשים' },
        { status: 400 }
      );
    }

    // Check if email already exists for this store
    const existing = await queryOne<Influencer>(
      'SELECT * FROM influencers WHERE store_id = $1 AND email = $2',
      [user.store_id, body.email]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'אימייל זה כבר קיים במערכת' },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(body.password);

    // Create influencer
    const influencer = await queryOne<Influencer>(
      `INSERT INTO influencers (
        store_id, name, email, password_hash, phone, instagram_handle, tiktok_handle, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, now(), now())
      RETURNING id, store_id, name, email, phone, instagram_handle, tiktok_handle, is_active, last_login_at, created_at, updated_at`,
      [
        user.store_id,
        body.name,
        body.email,
        password_hash,
        body.phone || null,
        body.instagram_handle || null,
        body.tiktok_handle || null,
      ]
    );

    if (!influencer) {
      throw new Error('Failed to create influencer - no data returned');
    }

    // Assign coupons if provided
    if (body.coupon_ids && body.coupon_ids.length > 0) {
      // Verify coupons belong to this store and are not already assigned
      // Build placeholders: $2, $3, ... for coupon IDs, then $N+1 for store_id
      const couponPlaceholders = body.coupon_ids.map((_, i) => `$${i + 2}`).join(',');
      const storeIdParamIndex = body.coupon_ids.length + 2;
      await query(
        `UPDATE discount_codes 
         SET influencer_id = $1 
         WHERE id IN (${couponPlaceholders}) 
         AND store_id = $${storeIdParamIndex}
         AND influencer_id IS NULL`,
        [influencer.id, ...body.coupon_ids, user.store_id]
      );
    }

    // Send welcome email to influencer (async, don't block API response)
    const { sendInfluencerWelcomeEmail } = await import('@/lib/influencer-email');
    sendInfluencerWelcomeEmail(user.store_id, {
      email: influencer.email,
      name: influencer.name,
      password: body.password, // Send plain password in email
    }).catch((error) => {
      console.warn('Failed to send influencer welcome email:', error);
      // Don't fail the request if email fails
    });

    return NextResponse.json({ influencer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating influencer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create influencer' },
      { status: 500 }
    );
  }
}

