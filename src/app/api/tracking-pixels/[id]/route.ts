import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/tracking-pixels/[id] - Get single pixel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pixel = await queryOne<any>(
      `SELECT id, store_id, name, pixel_type, pixel_id, pixel_code, 
              CASE WHEN access_token IS NOT NULL THEN '***' ELSE NULL END as access_token,
              placement, is_active, events, created_at
       FROM tracking_pixels 
       WHERE id = $1`,
      [id]
    );

    if (!pixel) {
      return NextResponse.json(
        { error: 'Pixel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pixel);
  } catch (error: any) {
    console.error('Error fetching tracking pixel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking pixel' },
      { status: 500 }
    );
  }
}

// PUT /api/tracking-pixels/[id] - Update pixel
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
    const body = await request.json();

    // Check if pixel exists
    const existingPixel = await queryOne<any>(
      'SELECT * FROM tracking_pixels WHERE id = $1',
      [id]
    );

    if (!existingPixel) {
      return NextResponse.json(
        { error: 'Pixel not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(body.name);
      paramIndex++;
    }

    if (body.pixel_type !== undefined) {
      updates.push(`pixel_type = $${paramIndex}`);
      values.push(body.pixel_type);
      paramIndex++;
    }

    if (body.pixel_id !== undefined) {
      updates.push(`pixel_id = $${paramIndex}`);
      values.push(body.pixel_id || null);
      paramIndex++;
    }

    if (body.pixel_code !== undefined) {
      updates.push(`pixel_code = $${paramIndex}`);
      values.push(body.pixel_code || null);
      paramIndex++;
    }

    if (body.access_token !== undefined && body.access_token !== '***') {
      updates.push(`access_token = $${paramIndex}`);
      values.push(body.access_token || null);
      paramIndex++;
    }

    if (body.placement !== undefined) {
      updates.push(`placement = $${paramIndex}`);
      values.push(body.placement);
      paramIndex++;
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
      paramIndex++;
    }

    if (body.events !== undefined) {
      updates.push(`events = $${paramIndex}`);
      values.push(JSON.stringify(body.events));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add the id as the last parameter
    values.push(id);

    await query(
      `UPDATE tracking_pixels SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating tracking pixel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tracking pixel' },
      { status: 500 }
    );
  }
}

// DELETE /api/tracking-pixels/[id] - Delete pixel
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

    const result = await query(
      'DELETE FROM tracking_pixels WHERE id = $1',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tracking pixel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tracking pixel' },
      { status: 500 }
    );
  }
}

