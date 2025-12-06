import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/customers/segments - Get all segments for a store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('active_only') === 'true';

    let sql = 'SELECT * FROM customer_segments WHERE store_id = $1';
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (activeOnly) {
      sql += ` AND is_active = true`;
    }

    if (search) {
      sql += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY name ASC';

    const segments = await query(sql, params);

    // Parse criteria JSONB
    const parsedSegments = segments.map((segment: any) => ({
      ...segment,
      criteria: typeof segment.criteria === 'string' ? JSON.parse(segment.criteria) : segment.criteria,
    }));

    return NextResponse.json(quickshopList('segments', parsedSegments));
  } catch (error: any) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}

// POST /api/customers/segments - Create a new segment
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, criteria, is_active = true } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Segment name is required' }, { status: 400 });
    }

    if (!criteria || typeof criteria !== 'object') {
      return NextResponse.json({ error: 'criteria is required and must be an object' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Create segment
    const segment = await queryOne<{
      id: number;
      name: string;
      criteria: any;
      customer_count: number;
    }>(
      `INSERT INTO customer_segments (store_id, name, description, criteria, is_active, customer_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, now(), now())
       RETURNING id, name, criteria, customer_count`,
      [
        storeId,
        name.trim(),
        description || null,
        JSON.stringify(criteria),
        is_active,
      ]
    );

    if (!segment) {
      throw new Error('Failed to create segment');
    }

    // Calculate initial customer count (this could be done async in production)
    await calculateSegmentCustomers(segment.id, storeId, criteria);

    // Get updated segment with count
    const updatedSegment = await queryOne<{
      id: number;
      name: string;
      criteria: any;
      customer_count: number;
    }>(
      'SELECT * FROM customer_segments WHERE id = $1',
      [segment.id]
    );

    const parsedSegment = {
      ...updatedSegment,
      criteria: typeof updatedSegment?.criteria === 'string' 
        ? JSON.parse(updatedSegment.criteria) 
        : updatedSegment?.criteria,
    };

    // Emit event
    await eventBus.emitEvent('customer.segment.created', {
      segment: {
        id: parsedSegment.id,
        name: parsedSegment.name,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('segment', parsedSegment), { status: 201 });
  } catch (error: any) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create segment' },
      { status: 500 }
    );
  }
}

/**
 * Calculate which customers match segment criteria and update mapping
 */
async function calculateSegmentCustomers(segmentId: number, storeId: number, criteria: any) {
  try {
    // Build query based on criteria
    let sql = `
      SELECT DISTINCT c.id
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      LEFT JOIN customer_tag_map ctm ON ctm.customer_id = c.id
      WHERE c.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;
    const conditions: string[] = [];

    // Min orders
    if (criteria.min_orders !== undefined) {
      sql += ` AND (
        SELECT COUNT(*) FROM orders WHERE customer_id = c.id
      ) >= $${paramIndex}`;
      params.push(criteria.min_orders);
      paramIndex++;
    }

    // Max orders
    if (criteria.max_orders !== undefined) {
      sql += ` AND (
        SELECT COUNT(*) FROM orders WHERE customer_id = c.id
      ) <= $${paramIndex}`;
      params.push(criteria.max_orders);
      paramIndex++;
    }

    // Min total spent
    if (criteria.min_total_spent !== undefined) {
      sql += ` AND (
        SELECT COALESCE(SUM(total_price::numeric), 0) FROM orders WHERE customer_id = c.id
      ) >= $${paramIndex}`;
      params.push(criteria.min_total_spent);
      paramIndex++;
    }

    // Max total spent
    if (criteria.max_total_spent !== undefined) {
      sql += ` AND (
        SELECT COALESCE(SUM(total_price::numeric), 0) FROM orders WHERE customer_id = c.id
      ) <= $${paramIndex}`;
      params.push(criteria.max_total_spent);
      paramIndex++;
    }

    // Tags
    if (criteria.tags && Array.isArray(criteria.tags) && criteria.tags.length > 0) {
      sql += ` AND EXISTS (
        SELECT 1 FROM customer_tag_map 
        WHERE customer_id = c.id 
        AND tag_name = ANY($${paramIndex}::text[])
      )`;
      params.push(criteria.tags);
      paramIndex++;
    }

    // State
    if (criteria.state) {
      sql += ` AND c.state = $${paramIndex}`;
      params.push(criteria.state);
      paramIndex++;
    }

    // Accepts marketing
    if (criteria.accepts_marketing !== undefined) {
      sql += ` AND c.accepts_marketing = $${paramIndex}`;
      params.push(criteria.accepts_marketing);
      paramIndex++;
    }

    // Clear existing mappings
    await query('DELETE FROM customer_segment_map WHERE segment_id = $1', [segmentId]);

    // Get matching customers
    const matchingCustomers = await query<{ id: number }>(sql, params);

    // Insert new mappings
    if (matchingCustomers.length > 0) {
      const values = matchingCustomers.map((_, idx) => 
        `($${idx * 2 + 1}, $${idx * 2 + 2})`
      ).join(', ');
      const insertParams: any[] = [];
      matchingCustomers.forEach(customer => {
        insertParams.push(customer.id, segmentId);
      });

      await query(
        `INSERT INTO customer_segment_map (customer_id, segment_id) VALUES ${values}`,
        insertParams
      );
    }

    // Update customer count
    await query(
      'UPDATE customer_segments SET customer_count = $1, updated_at = now() WHERE id = $2',
      [matchingCustomers.length, segmentId]
    );
  } catch (error) {
    console.error('Error calculating segment customers:', error);
    throw error;
  }
}

