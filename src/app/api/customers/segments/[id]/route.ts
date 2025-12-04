import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/customers/segments/:id - Get segment details
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
    const segmentId = parseInt(id);
    if (isNaN(segmentId)) {
      return NextResponse.json({ error: 'Invalid segment ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    const segment = await queryOne<{
      id: number;
      name: string;
      criteria: any;
      customer_count: number;
    }>(
      'SELECT * FROM customer_segments WHERE id = $1 AND store_id = $2',
      [segmentId, storeId]
    );

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    const parsedSegment = {
      ...segment,
      criteria: typeof segment.criteria === 'string' 
        ? JSON.parse(segment.criteria) 
        : segment.criteria,
    };

    return NextResponse.json({ segment: parsedSegment });
  } catch (error: any) {
    console.error('Error fetching segment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch segment' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/segments/:id - Update segment
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
    const segmentId = parseInt(id);
    if (isNaN(segmentId)) {
      return NextResponse.json({ error: 'Invalid segment ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, criteria, is_active } = body;

    const storeId = user.store_id;

    // Get old segment
    const oldSegment = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM customer_segments WHERE id = $1',
      [segmentId]
    );

    if (!oldSegment || oldSegment.store_id !== storeId) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Update segment
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(name.trim());
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
    if (criteria !== undefined) {
      updateFields.push(`criteria = $${paramIndex++}`);
      queryParams.push(JSON.stringify(criteria));
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      queryParams.push(is_active);
    }

    updateFields.push(`updated_at = now()`);
    queryParams.push(segmentId, storeId);

    const segment = await queryOne<{
      id: number;
      name: string;
      criteria: any;
      customer_count: number;
    }>(
      `UPDATE customer_segments 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND store_id = $${paramIndex++}
       RETURNING id, name, criteria, customer_count`,
      queryParams
    );

    if (!segment) {
      throw new Error('Failed to update segment');
    }

    // Recalculate customers if criteria changed
    if (criteria !== undefined) {
      const calculateSegmentCustomers = async (segId: number, stId: number, crit: any) => {
        // Similar logic as in POST route
        let sql = `
          SELECT DISTINCT c.id
          FROM customers c
          WHERE c.store_id = $1
        `;
        const calcParams: any[] = [stId];
        let calcParamIndex = 2;

        if (crit.min_orders !== undefined) {
          sql += ` AND (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) >= $${calcParamIndex}`;
          calcParams.push(crit.min_orders);
          calcParamIndex++;
        }
        if (crit.max_orders !== undefined) {
          sql += ` AND (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) <= $${calcParamIndex}`;
          calcParams.push(crit.max_orders);
          calcParamIndex++;
        }
        if (crit.min_total_spent !== undefined) {
          sql += ` AND (SELECT COALESCE(SUM(total_price::numeric), 0) FROM orders WHERE customer_id = c.id) >= $${calcParamIndex}`;
          calcParams.push(crit.min_total_spent);
          calcParamIndex++;
        }
        if (crit.max_total_spent !== undefined) {
          sql += ` AND (SELECT COALESCE(SUM(total_price::numeric), 0) FROM orders WHERE customer_id = c.id) <= $${calcParamIndex}`;
          calcParams.push(crit.max_total_spent);
          calcParamIndex++;
        }
        if (crit.tags && Array.isArray(crit.tags) && crit.tags.length > 0) {
          sql += ` AND EXISTS (SELECT 1 FROM customer_tag_map WHERE customer_id = c.id AND tag_name = ANY($${calcParamIndex}::text[]))`;
          calcParams.push(crit.tags);
          calcParamIndex++;
        }
        if (crit.state) {
          sql += ` AND c.state = $${calcParamIndex}`;
          calcParams.push(crit.state);
          calcParamIndex++;
        }
        if (crit.accepts_marketing !== undefined) {
          sql += ` AND c.accepts_marketing = $${calcParamIndex}`;
          calcParams.push(crit.accepts_marketing);
          calcParamIndex++;
        }

        await query('DELETE FROM customer_segment_map WHERE segment_id = $1', [segId]);
        const matchingCustomers = await query<{ id: number }>(sql, calcParams);
        
        if (matchingCustomers.length > 0) {
          const values = matchingCustomers.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(', ');
          const insertParams: any[] = [];
          matchingCustomers.forEach(customer => {
            insertParams.push(customer.id, segId);
          });
          await query(`INSERT INTO customer_segment_map (customer_id, segment_id) VALUES ${values}`, insertParams);
        }
        
        await query('UPDATE customer_segments SET customer_count = $1, updated_at = now() WHERE id = $2', [matchingCustomers.length, segId]);
      };

      await calculateSegmentCustomers(segmentId, storeId, criteria);
    }

    // Get updated segment
    const updatedSegment = await queryOne<{
      id: number;
      name: string;
      criteria: any;
      customer_count: number;
    }>(
      'SELECT * FROM customer_segments WHERE id = $1',
      [segmentId]
    );

    const parsedSegment = {
      ...updatedSegment,
      criteria: typeof updatedSegment?.criteria === 'string' 
        ? JSON.parse(updatedSegment.criteria) 
        : updatedSegment?.criteria,
    };

    // Emit event
    await eventBus.emitEvent('customer.segment.updated', {
      segment: {
        id: parsedSegment.id,
        name: parsedSegment.name,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ segment: parsedSegment });
  } catch (error: any) {
    console.error('Error updating segment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update segment' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/segments/:id - Delete segment
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
    const segmentId = parseInt(id);
    if (isNaN(segmentId)) {
      return NextResponse.json({ error: 'Invalid segment ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Get segment before deletion for event
    const segment = await queryOne<{ id: number; name: string }>(
      'SELECT id, name FROM customer_segments WHERE id = $1 AND store_id = $2',
      [segmentId, storeId]
    );

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Delete segment (CASCADE will delete mappings)
    await query(
      'DELETE FROM customer_segments WHERE id = $1',
      [segmentId]
    );

    // Emit event
    await eventBus.emitEvent('customer.segment.deleted', {
      segment_id: segmentId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Segment deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting segment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete segment' },
      { status: 500 }
    );
  }
}

