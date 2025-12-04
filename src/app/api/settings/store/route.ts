import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface Store {
  id: number;
  owner_id: number;
  name: string;
  domain: string | null;
  myshopify_domain: string | null;
  currency: string;
  locale: string;
  timezone: string;
  plan: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// GET /api/settings/store - Get store settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const store = await queryOne<Store>(
      'SELECT * FROM stores WHERE id = $1',
      [user.store_id]
    );

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error: any) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/store - Update store settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(body.name);
      paramIndex++;
    }

    if (body.domain !== undefined) {
      updates.push(`domain = $${paramIndex}`);
      values.push(body.domain);
      paramIndex++;
    }

    if (body.currency !== undefined) {
      updates.push(`currency = $${paramIndex}`);
      values.push(body.currency);
      paramIndex++;
    }

    if (body.locale !== undefined) {
      updates.push(`locale = $${paramIndex}`);
      values.push(body.locale);
      paramIndex++;
    }

    if (body.timezone !== undefined) {
      updates.push(`timezone = $${paramIndex}`);
      values.push(body.timezone);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(user.store_id);

    const sql = `
      UPDATE stores 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updatedStore = await queryOne<Store>(sql, values);

    if (!updatedStore) {
      return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 });
    }

    return NextResponse.json({ store: updatedStore });
  } catch (error: any) {
    console.error('Error updating store settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update store settings' },
      { status: 500 }
    );
  }
}

